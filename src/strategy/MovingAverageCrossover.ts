/**
 * Simple Moving Average Crossover Strategy (SMA).
 *
 * Two SMAs are computed over the close price:
 *   fastSMA = SMA(close, windowFast)
 *   slowSMA = SMA(close, windowSlow)
 *
 * Signals (only when both SMAs are populated):
 *   BUY  when fastSMA crosses from <= slowSMA to > slowSMA
 *   SELL when fastSMA crosses from >= slowSMA to < slowSMA
 *
 * A fixed quantity is emitted per signal (default 1.0 BTC) so the
 * SimulatedBroker enforces balance limits.
 *
 * No lookahead: only bars up to and including the current bar are used.
 */

import Decimal from 'decimal.js';
import { Bar } from '../domain/models/Bar';
import { Price, Timestamp, Volume } from '../domain/types';
import { Signal, IStrategy } from '../domain/interfaces/IStrategy';
import { BaseStrategy } from './BaseStrategy';

function simpleMovingAverage(prices: Price[], window: number): Decimal {
  if (window <= 0 || prices.length < window) {
    return new Decimal(0);
  }
  const windowSlice = prices.slice(prices.length - window);
  const sum = windowSlice.reduce((acc, p) => acc.add(p), new Decimal(0));
  return sum.div(window);
}

export class MovingAverageCrossover extends BaseStrategy {
  private readonly fastWindow: number;
  private readonly slowWindow: number;
  private readonly signalQuantity: number;
  private readonly prices: Price[] = [];
  private prevFast: Decimal | null = null;
  private prevSlow: Decimal | null = null;
  private barCount: number = 0;

  constructor(fastWindow: number = 10, slowWindow: number = 30, signalQuantity: number = 1.0) {
    super('SMA Crossover');
    this.fastWindow = fastWindow;
    this.slowWindow = slowWindow;
    this.signalQuantity = signalQuantity;
  }

  init(): void {
    this.prices.length = 0;
    this.prevFast = null;
    this.prevSlow = null;
    this.barCount = 0;
  }

  onBar(bar: Bar): Signal[] {
    this.barCount += 1;
    this.prices.push(bar.close);

    // Not enough data for both SMAs yet.
    if (this.prices.length < this.slowWindow) {
      return [];
    }

    const fast = simpleMovingAverage(this.prices, this.fastWindow);
    const slow = simpleMovingAverage(this.prices, this.slowWindow);

    let signals: Signal[] = [];

    if (this.prevFast && this.prevSlow) {
      const crossedUp = this.prevFast.lte(this.prevSlow) && fast.gt(slow);
      const crossedDown = this.prevFast.gte(this.prevSlow) && fast.lt(slow);

      if (crossedUp) {
        signals.push({
          symbol: bar.symbol,
          side: 'BUY',
          type: 'MARKET',
          quantity: this.signalQuantity,
          timestamp: bar.timestamp,
          reason: `SMA ${this.fastWindow} crossed above SMA ${this.slowWindow} (${fast.toString()} > ${slow.toString()})`,
        });
      } else if (crossedDown) {
        signals.push({
          symbol: bar.symbol,
          side: 'SELL',
          type: 'MARKET',
          quantity: this.signalQuantity,
          timestamp: bar.timestamp,
          reason: `SMA ${this.fastWindow} crossed below SMA ${this.slowWindow} (${fast.toString()} < ${slow.toString()})`,
        });
      }
    }

    this.prevFast = fast;
    this.prevSlow = slow;
    return signals;
  }

  onFinish(): void {
    // Nothing to flush; last state is already processed.
  }
}