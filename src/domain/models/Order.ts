/**
 * Order model representing a trade request.
 * Orders are immutable after construction.
 */

import Decimal from 'decimal.js';
import { Timestamp, Price, Volume, Side, OrderType, OrderStatus, Symbol } from '../types';

/**
 * Interface for an Order.
 */
export interface Order {
  /** Unique client-assigned order id. */
  readonly id: string;
  /** Symbol being traded. */
  readonly symbol: Symbol;
  /** Side: BUY or SELL. */
  readonly side: Side;
  /** Order type: MARKET or LIMIT. */
  readonly type: OrderType;
  /** Quantity of BTC to buy/sell. */
  readonly quantity: Volume;
  /** Limit price (required for LIMIT orders). */
  readonly price?: Price;
  /** Current status. */
  readonly status: OrderStatus;
  /** Timestamp when the order was created. */
  readonly createdAt: Timestamp;
  /** Timestamp when the order was last updated. */
  readonly updatedAt: Timestamp;
  /** Cumulative quantity filled so far. */
  readonly filledQuantity: Volume;
  /** Average fill price across all fills. */
  readonly averageFillPrice?: Price;
  /** Client-supplied optional reference. */
  readonly clientRef?: string;
}

/**
 * Plain object representation of an Order (for serialization).
 */
export interface OrderJson {
  id: string;
  symbol: string;
  side: Side;
  type: OrderType;
  quantity: number;
  price?: number;
  status: OrderStatus;
  createdAt: number;
  updatedAt: number;
  filledQuantity: number;
  averageFillPrice?: number;
  clientRef?: string;
}

/**
 * Create a new Order with PENDING status.
 */
export function createOrder(params: {
  id: string;
  symbol: Symbol;
  side: Side;
  type: OrderType;
  quantity: Volume;
  price?: Price;
  createdAt?: Timestamp;
  clientRef?: string;
}): Order {
  const now = params.createdAt ?? Date.now();
  return {
    id: params.id,
    symbol: params.symbol,
    side: params.side,
    type: params.type,
    quantity: params.quantity,
    price: params.price,
    status: 'PENDING',
    createdAt: now,
    updatedAt: now,
    filledQuantity: new Decimal(0) as Volume,
    averageFillPrice: undefined,
    clientRef: params.clientRef,
  };
}

/**
 * Convert Order to a plain JSON-serializable object.
 */
export function orderToJson(order: Order): OrderJson {
  return {
    id: order.id,
    symbol: order.symbol,
    side: order.side,
    type: order.type,
    quantity: order.quantity.toNumber(),
    price: order.price ? order.price.toNumber() : undefined,
    status: order.status,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    filledQuantity: order.filledQuantity.toNumber(),
    averageFillPrice: order.averageFillPrice ? order.averageFillPrice.toNumber() : undefined,
    clientRef: order.clientRef,
  };
}

/**
 * Return a copy of the order with updated fields.
 */
export function updateOrder(
  order: Order,
  patch: Partial<Pick<Order, 'status' | 'updatedAt' | 'filledQuantity' | 'averageFillPrice'>>,
): Order {
  return {
    ...order,
    ...patch,
    updatedAt: patch.updatedAt ?? Date.now(),
  };
}