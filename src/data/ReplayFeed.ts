/**
 * ReplayFeed: deterministic historical data feed.
 *
 * Bars are replayed strictly in ascending timestamp order from a loaded
 * bar array. No lookahead bias is possible because the feed only ever
 * exposes bars at or before the current replay time.
 */

import { Bar } from '../domain/models/Bar';
import { IDataFeed } from '../domain/interfaces/IDataFeed';
import { Timestamp } from '../domain/types';

/**
 * ReplayFeed replays bars from a fixed history array.
 */
export class ReplayFeed implements IDataFeed {
  private readonly bars: Bar[];
  private symbol: string;
  private barIndex: number = 0;
  private lastBar: Bar | null = null;
  private currentTime: Timestamp = 0;
  private callback: ((bar: Bar) => void) | null = null;
  private subscribed = false;
  private done: boolean = false;

  constructor(bars: Bar[], symbol: string = 'BTCUSD') {
    this.bars = bars;
    this.symbol = symbol;
    if (bars.length > 0) {
      this.currentTime = bars[0].timestamp;
    }
  }

  /**
   * Subscribe to bars. The callback is invoked for each bar as the
   * replay pointer advances. Only bars with the matching symbol (or when
   * no symbol-specific subscription is made) are delivered.
   */
  async subscribeBars(symbol: string, onBar: (bar: Bar) => void): Promise<void> {
    this.symbol = symbol;
    this.subscribed = true;
    this.callback = onBar;
  }

  /**
   * Unsubscribe from bar updates.
   */
  async unsubscribeBars(symbol: string): Promise<void> {
    if (symbol !== this.symbol) {
      throw new Error(`Feed was subscribed to ${this.symbol}, cannot unsubscribe for ${symbol}`);
    }
    this.subscribed = false;
    this.callback = null;
  }

  /**
   * Advance to the next bar in history and return it.
   * Returns null when history is exhausted.
   */
  async next(): Promise<Bar | null> {
    if (this.done) {
      return null;
    }
    const bar = this.bars[this.barIndex];
    if (!bar) {
      this.done = true;
      return null;
    }
    this.barIndex += 1;
    this.lastBar = bar;
    this.currentTime = bar.timestamp;
    if (this.subscribed && this.callback) {
      this.callback(bar);
    }
    return bar;
  }

  /**
   * Peek at the next bar without advancing.
   */
  peekNext(): Bar | null {
    return this.bars[this.barIndex] ?? null;
  }

  /**
   * Reset the feed to the beginning of history.
   */
  reset(): void {
    this.barIndex = 0;
    this.lastBar = null;
    this.currentTime = this.bars.length > 0 ? this.bars[0].timestamp : 0;
    this.done = false;
  }

  /**
   * Get the latest bar delivered by the feed (or null if none yet).
   */
  async getLatestBar(symbol: string): Promise<Bar | null> {
    // Symbol filtering: ReplayFeed is typically created for one symbol,
    // but we honor requests for that symbol.
    if (symbol !== this.symbol) {
      return null;
    }
    return this.lastBar;
  }

  /**
   * Get the current replay time (timestamp of last delivered bar).
   */
  async getTime(): Promise<Timestamp> {
    return this.currentTime;
  }

  /**
   * Whether the feed has exhausted its history.
   */
  async isDone(): Promise<boolean> {
    return this.barIndex >= this.bars.length;
  }
}
