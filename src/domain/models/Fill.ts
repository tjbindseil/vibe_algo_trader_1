/**
 * Fill model representing an execution (partial or full) of an order.
 * Fills are immutable after construction.
 */

import { Timestamp, Price, Volume, TradeSide, Symbol } from '../types';

/**
 * Interface for a Fill.
 */
export interface Fill {
  /** Unique fill id. */
  readonly id: string;
  /** Order id this fill belongs to. */
  readonly orderId: string;
  /** Symbol traded. */
  readonly symbol: Symbol;
  /** Side of the fill (same as order side). */
  readonly side: TradeSide;
  /** Quantity filled in this execution. */
  readonly quantity: Volume;
  /** Execution price per BTC. */
  readonly price: Price;
  /** Fee paid for this fill (already in quote currency, USD). */
  readonly fee: Price;
  /** Fee tier applied (MAKER or TAKER). */
  readonly feeTier: 'MAKER' | 'TAKER';
  /** Unix milliseconds timestamp of the fill. */
  readonly timestamp: Timestamp;
}

/**
 * Plain object representation of a Fill.
 */
export interface FillJson {
  id: string;
  orderId: string;
  symbol: string;
  side: TradeSide;
  quantity: number;
  price: number;
  fee: number;
  feeTier: 'MAKER' | 'TAKER';
  timestamp: number;
}

/**
 * Create a new Fill.
 */
export function createFill(params: {
  id: string;
  orderId: string;
  symbol: Symbol;
  side: TradeSide;
  quantity: Volume;
  price: Price;
  fee: Price;
  feeTier: 'MAKER' | 'TAKER';
  timestamp: Timestamp;
}): Fill {
  return {
    id: params.id,
    orderId: params.orderId,
    symbol: params.symbol,
    side: params.side,
    quantity: params.quantity,
    price: params.price,
    fee: params.fee,
    feeTier: params.feeTier,
    timestamp: params.timestamp,
  };
}

/**
 * Convert Fill to JSON-serializable object.
 */
export function fillToJson(fill: Fill): FillJson {
  return {
    id: fill.id,
    orderId: fill.orderId,
    symbol: fill.symbol,
    side: fill.side,
    quantity: Number(fill.quantity),
    price: Number(fill.price),
    fee: Number(fill.fee),
    feeTier: fill.feeTier,
    timestamp: fill.timestamp,
  };
}

/**
 * Compute the notional value of a fill (quantity * price) in USD.
 */
export function fillNotional(fill: Fill): Price {
  return fill.quantity.mul(fill.price);
}
