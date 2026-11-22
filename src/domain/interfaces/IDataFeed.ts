/**
 * Data feed port interface.
 * The ReplayFeed implements this for deterministic historical replay;
 * a live WebSocket feed can be added later without changing the engine.
 */

import { Bar } from '../models/Bar';
import { Timestamp } from '../types';

/**
 * Data feed interface providing historical or real-time bars.
 */
export interface IDataFeed {
  /**
   * Subscribe to bar updates. The callback is invoked for each new bar
   * in chronological order. Implementations must guarantee no lookahead
   * bias: only bars up to the current time are delivered.
   */
  subscribeBars(symbol: string, onBar: (bar: Bar) => void): Promise<void>;

  /**
   * Unsubscribe from bar updates.
   */
  unsubscribeBars(symbol: string): Promise<void>;

  /**
   * Advance to the next bar in history and return it.
   * Returns null when history is exhausted.
   */
  next(): Promise<Bar | null>;

  /**
   * Get the latest known bar for a symbol, or null if none.
   */
  getLatestBar(symbol: string): Promise<Bar | null>;

  /**
   * Get the current feed time.
   */
  getTime(): Promise<Timestamp>;

  /**
   * Whether the feed has finished streaming all data.
   */
  isDone(): Promise<boolean>;
}
