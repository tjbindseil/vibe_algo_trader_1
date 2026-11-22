/**
 * Broker port interface.
 * The SimulatedBroker implements this for backtesting; a live broker
 * implementation can be added later without changing the engine or strategy.
 */

import { Order, OrderJson } from '../models/Order';
import { Fill } from '../models/Fill';
import { Balance } from '../models/Balance';
import { Position } from '../models/Position';
import { LedgerEntry } from '../models/Ledger';
import { Timestamp } from '../types';

/**
 * Broker interface for placing orders and querying account state.
 */
export interface IBroker {
  /**
   * Submit a new order. Returns the order (possibly with updated status).
   * May throw if the order is invalid or insufficient balance.
   */
  placeOrder(order: Order): Promise<Order>;

  /**
   * Cancel an open order by id.
   */
  cancelOrder(orderId: string): Promise<void>;

  /**
   * Get an order by id.
   */
  getOrder(orderId: string): Promise<Order | null>;

  /**
   * List all orders (optionally filtered by status).
   */
  listOrders(statusFilter?: 'PENDING' | 'OPEN' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED' | 'REJECTED'): Promise<Order[]>;

  /**
   * List all fills.
   */
  listFills(): Promise<Fill[]>;

  /**
   * Get current balances.
   */
  getBalances(): Promise<Balance>;

  /**
   * Get current position for a symbol.
   */
  getPosition(symbol: string): Promise<Position | null>;

  /**
   * Get the full append-only ledger.
   */
  getLedger(): Promise<LedgerEntry[]>;

  /**
   * Current server/clock time.
   */
  getTime(): Promise<Timestamp>;
}
