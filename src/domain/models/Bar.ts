/**
 * OHLCV bar model representing a single candlestick at a given time.
 * Bars are immutable after construction.
 */

import Decimal from 'decimal.js';
import { Timestamp, Volume, Price } from '../types';

/**
 * Interface for an OHLCV bar.
 */
export interface Bar {
  /** Symbol traded (e.g. "BTCUSD"). */
  readonly symbol: string;
  /** Unix milliseconds timestamp (UTC) - bar open time. */
  readonly timestamp: Timestamp;
  /** Opening price. */
  readonly open: Price;
  /** Highest price during the bar interval. */
  readonly high: Price;
  /** Lowest price during the bar interval. */
  readonly low: Price;
  /** Closing price. */
  readonly close: Price;
  /** Volume of BTC traded during the bar interval. */
  readonly volume: Volume;
}

/**
 * Plain object representation of a Bar (for serialization/deserialization).
 */
export interface BarJson {
  symbol: string;
  timestamp: number;
  open: number | string;
  high: number | string;
  low: number | string;
  close: number | string;
  volume: number | string;
}

/**
 * Create a Bar from a plain object with numeric or string fields.
 */
export function createBar(json: BarJson): Bar {
  return {
    symbol: json.symbol,
    timestamp: json.timestamp,
    open: new Decimal(json.open) as Price,
    high: new Decimal(json.high) as Price,
    low: new Decimal(json.low) as Price,
    close: new Decimal(json.close) as Price,
    volume: new Decimal(json.volume) as Volume,
  };
}

/**
 * Convert Bar to a plain JSON-serializable object.
 */
export function barToJson(bar: Bar): BarJson {
  return {
    symbol: bar.symbol,
    timestamp: bar.timestamp,
    open: bar.open.toNumber(),
    high: bar.high.toNumber(),
    low: bar.low.toNumber(),
    close: bar.close.toNumber(),
    volume: bar.volume.toNumber(),
  };
}