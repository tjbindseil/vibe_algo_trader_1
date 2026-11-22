/**
 * SimulatedBroker: a mock execution engine that enforces balance checks,
 * applies configurable maker/taker fees, simulates slippage, and maintains
 * an append-only fill/ledger log.
 *
 * Implements IBroker interface so it can be swapped with a live broker later.
 */

import Decimal from 'decimal.js';
import { IBroker } from '../domain/interfaces/IBroker';
import { Order, OrderJson, createOrder, orderToJson, updateOrder } from '../domain/models/Order';
import { Fill, FillJson, createFill, fillToJson, fillNotional } from '../domain/models/Fill';
import { Balance, BalanceJson, createBalance, balanceToJson } from '../domain/models/Balance';
import { Position, PositionJson, createPosition, positionToJson, applyFill } from '../domain/models/Position';
import { Ledger } from './Ledger';
import { FeeModel } from './FeeModel';
import { SlippageModel } from './SlippageModel';
import {
  Timestamp, Price, Volume, UsdAmount, BtcAmount, Side,
  DECIMAL_PRECISION,
} from '../domain/types';

/**
 * Configuration for SimulatedBroker.
 */
export interface BrokerConfig {
  /** Initial USD balance. */
  initialUsd?: number;
  /** Initial BTC balance. */
  initialBtc?: number;
  /** Symbol to trade (default "BTCUSD"). */
  symbol?: string;
  /** Fee model instance. */
  feeModel?: FeeModel;
  /** Slippage model instance. */
  slippageModel?: SlippageModel;
}

/**
 * SimulatedBroker: in-memory broker for backtesting.
 */
export class SimulatedBroker implements IBroker {
  private orders: Map<string, Order> = new Map();
  private fills: Fill[] = [];
  private ledger: Ledger;
  private balances: Balance;
  private positions: Map<string, Position> = new Map();
  private currentTime: Timestamp = Date.now();
  private symbol: string;
  private feeModel: FeeModel;
  private slippageModel: SlippageModel;

  constructor(config: BrokerConfig = {}) {
    this.symbol = config.symbol ?? 'BTCUSD';
    this.feeModel = config.feeModel ?? new FeeModel(0.001, 0.002);
    this.slippageModel = config.slippageModel ?? new SlippageModel();

    this.balances = createBalance({
      usd: new Decimal(config.initialUsd ?? 10000) as UsdAmount,
      btc: new Decimal(config.initialBtc ?? 0) as BtcAmount,
    });

    this.ledger = new Ledger();
    this.positions.set(this.symbol, createPosition(this.symbol));

    // Initial deposit entry
    this.ledger.record({
      id: `initial-${this.symbol}`,
      timestamp: this.currentTime,
      type: 'DEPOSIT',
      usdDelta: this.balances.usd,
      btcDelta: this.balances.btc,
      usdBalanceAfter: this.balances.usd,
      btcBalanceAfter: this.balances.btc,
      note: 'Initial balance',
    });
  }

  /**
   * Submit a new order. Applies slippage if the broker's current price
   * is known. Enforces balance checks.
   */
  async placeOrder(order: Order): Promise<Order> {
    let resultOrder = { ...order, updatedAt: Date.now() };

    // Validate order
    if (resultOrder.type === 'LIMIT' && !resultOrder.price) {
      throw new Error(`LIMIT order ${resultOrder.id} requires a price`);
    }
    if (resultOrder.type === 'LIMIT' && resultOrder.price && (resultOrder.price as unknown as number) <= 0) {
      throw new Error(`LIMIT order ${resultOrder.id} price must be positive`);
    }
    if ((resultOrder.quantity as unknown as number) <= 0) {
      throw new Error(`Order ${resultOrder.id} quantity must be positive`);
    }

    // Enforce available balance
    const effectivePrice = (resultOrder.price as unknown as Decimal) ?? new Decimal(0);
    if (effectivePrice.eq(0)) {
      throw new Error(`Order ${resultOrder.id} has zero or missing price`);
    }

    if (resultOrder.side === 'BUY') {
      const notional = (resultOrder.quantity as Decimal).mul(effectivePrice) as UsdAmount;
      // Add a small buffer for fees (1%)
      const notionalWithFee = notional.mul(1.01) as UsdAmount;
      if (!this.balances.usd.gte(notionalWithFee)) {
        throw new Error(
          `Insufficient USD for order ${resultOrder.id}: need ${notionalWithFee.toString()} USD, available ${this.balances.usd.toString()} USD`
        );
      }
    } else if (resultOrder.side === 'SELL') {
      const position = this.positions.get(this.symbol) ?? createPosition(this.symbol);
      const availBtc = (position.btcAmount as Decimal);
      if (availBtc.lt(resultOrder.quantity)) {
        throw new Error(
          `Insufficient BTC for order ${resultOrder.id}: need ${resultOrder.quantity.toString()} BTC, available ${availBtc.toString()} BTC`
        );
      }
    }

    resultOrder = updateOrder(resultOrder, { status: 'OPEN' } as Partial<Pick<Order, 'status' | 'updatedAt' | 'filledQuantity' | 'averageFillPrice'>>);
    this.orders.set(resultOrder.id, resultOrder);
    return resultOrder;
  }

  /**
   * Cancel an open order.
   */
  async cancelOrder(orderId: string): Promise<void> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    if (order.status !== 'OPEN' && order.status !== 'PARTIALLY_FILLED') {
      throw new Error(`Cannot cancel order ${orderId} with status ${order.status}`);
    }
    const updated = updateOrder(order, { status: 'CANCELLED' } as Partial<Pick<Order, 'status' | 'updatedAt' | 'filledQuantity' | 'averageFillPrice'>>);
    this.orders.set(orderId, updated);
  }

  /**
   * Get an order by id.
   */
  async getOrder(orderId: string): Promise<Order | null> {
    return this.orders.get(orderId) ?? null;
  }

  /**
   * List all orders.
   */
  async listOrders(statusFilter?: 'PENDING' | 'OPEN' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED' | 'REJECTED'): Promise<Order[]> {
    const all = Array.from(this.orders.values());
    if (statusFilter) {
      return all.filter((o) => o.status === statusFilter);
    }
    return all;
  }

  /**
   * List all fills.
   */
  async listFills(): Promise<Fill[]> {
    return [...this.fills];
  }

  /**
   * Get current balances.
   */
  async getBalances(): Promise<Balance> {
    return this.balances;
  }

  /**
   * Get position for a symbol.
   */
  async getPosition(symbol: string): Promise<Position | null> {
    return this.positions.get(symbol) ?? null;
  }

  /**
   * Get the full append-only ledger.
   */
  async getLedger() {
    return this.ledger.getEntries();
  }

  /**
   * Current server/clock time.
   */
  async getTime(): Promise<Timestamp> {
    return this.currentTime;
  }

  /**
   * Simulate execution of an order at the current market price.
   * This method is called by the backtest engine.
   * @param order  The order to execute.
   * @param marketPrice  The current market reference price (e.g. bar close).
   * @param barVolume    The current bar volume (for slippage calculation).
   */
  async executeOrder(order: Order, marketPrice: Price, barVolume: Volume): Promise<Fill | null> {
    if (order.status !== 'OPEN' && order.status !== 'PARTIALLY_FILLED') {
      throw new Error(`Order ${order.id} cannot be executed with status ${order.status}`);
    }

    const side: Side = order.side;
    const qty: Volume = order.quantity;
    const refPrice: Price = order.price ?? marketPrice;

    // Apply slippage
    const adjustedPrice = this.slippageModel.applySlippage(
      side,
      refPrice,
      qty,
      barVolume,
    );

    // Determine fee tier
    const feeTier = side === 'BUY' ? 'TAKER' : 'MAKER';
    const notional = fillNotional({
      id: 'tmp',
      orderId: order.id,
      symbol: this.symbol,
      side: order.side,
      quantity: qty,
      price: adjustedPrice,
      fee: new Decimal(0) as UsdAmount,
      feeTier: 'TAKER',
      timestamp: this.currentTime,
    });

    const fee = this.feeModel.calculateFee(feeTier, notional);

    // Update balances
    if (side === 'BUY') {
      this.balances = {
        ...this.balances,
        usd: this.balances.usd.sub(notional).sub(fee) as UsdAmount,
        btc: this.balances.btc.add(qty) as BtcAmount,
      };
    } else {
      this.balances = {
        ...this.balances,
        usd: this.balances.usd.add(notional).sub(fee) as UsdAmount,
        btc: this.balances.btc.sub(qty) as BtcAmount,
      };
    }

    // Update position
    const currentPos = this.positions.get(this.symbol) ?? createPosition(this.symbol);
    const newPos = applyFill(currentPos, { side, quantity: qty, price: adjustedPrice });
    this.positions.set(this.symbol, newPos);

    // Create fill
    const fill: Fill = createFill({
      id: `fill-${Date.now()}-${this.fills.length}`,
      orderId: order.id,
      symbol: this.symbol,
      side,
      quantity: qty,
      price: adjustedPrice,
      fee,
      feeTier,
      timestamp: this.currentTime,
    });
    this.fills.push(fill);

    // Update order
    const avg = order.averageFillPrice
      ? order.averageFillPrice.add(adjustedPrice).div(2)
      : adjustedPrice;
    const filledQty = order.filledQuantity.add(qty);
    let newStatus: Order['status'] = 'FILLED';
    if (filledQty.lt(order.quantity)) {
      newStatus = 'PARTIALLY_FILLED';
    }
    const updatedOrder = updateOrder(order, {
      status: newStatus,
      filledQuantity: filledQty,
      averageFillPrice: avg,
    } as Partial<Pick<Order, 'status' | 'updatedAt' | 'filledQuantity' | 'averageFillPrice'>>);
    this.orders.set(order.id, updatedOrder);

    // Ledger entry
    this.ledger.record({
      id: `fill-ledger-${fill.id}`,
      timestamp: this.currentTime,
      type: 'FILL',
      orderId: order.id,
      fillId: fill.id,
      usdDelta: side === 'BUY' ? notional.neg() : notional,
      btcDelta: side === 'BUY' ? qty : qty.neg(),
      fee,
      usdBalanceAfter: this.balances.usd,
      btcBalanceAfter: this.balances.btc,
      note: `Fill for ${order.id}`,
    });

    return fill;
  }

  /**
   * Update the broker's current time (used by replay engine).
   */
  async setTime(timestamp: Timestamp): Promise<void> {
    this.currentTime = timestamp;
  }

  /**
   * Get a serializable snapshot of the broker state (for debugging/metrics).
   */
  async getSnapshot(): Promise<{
    balances: BalanceJson;
    position: PositionJson | null;
    fills: FillJson[];
    orders: OrderJson[];
    ledger: import('../domain/models/Ledger').LedgerEntryJson[];
  }> {
    return {
      balances: balanceToJson(this.balances),
      position: (await this.getPosition(this.symbol))
        ? positionToJson((await this.getPosition(this.symbol))!)
        : null,
      fills: this.fills.map(fillToJson),
      orders: Array.from(this.orders.values()).map(orderToJson),
      ledger: this.ledger.toJson(),
    };
  }
}