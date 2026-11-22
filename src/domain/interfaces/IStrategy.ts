/**
 * Strategy port interface.
 * Strategies receive bars from the data feed and emit orders to the broker.
 * Strategies are stateless or manage their own internal indicators.
 */

import { Bar } from '../models/Bar';
import { Order } from '../models/Order';
import { Timestamp } from '../types';

/**
 * Signal emitted by a strategy.
 */
export interface Signal {
  /** Symbol to trade. */
  readonly symbol: string;
  /** Side: BUY or SELL. */
  readonly side: 'BUY' | 'SELL';
  /** Order type. */
  readonly type: 'MARKET' | 'LIMIT';
  /** Quantity of BTC. */
  readonly quantity: number;
  /** Limit price (required for LIMIT orders). */
  readonly price?: number;
  /** Timestamp when the signal was generated. */
  readonly timestamp: Timestamp;
  /** Optional reason/description. */
  readonly reason?: string;
}

/**
 * Strategy interface.
 */
export interface IStrategy {
  /** Strategy name (for logging/metrics). */
  readonly name: string;

  /**
   * Called on each new bar from the data feed.
   * Must return zero or more signals based on information available
   * up to and including the current bar (no lookahead).
   */
  onBar(bar: Bar): Signal[];

  /**
   * Optional initialization called before the backtest starts.
   */
  init?(): void;

  /**
   * Optional cleanup called after the backtest ends.
   */
  onFinish?(): void;
}
