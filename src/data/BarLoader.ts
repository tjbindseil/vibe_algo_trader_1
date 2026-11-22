/**
 * BarLoader: loads historical OHLCV bars from CSV or JSON files.
 *
 * CSV format (with header): timestamp,open,high,low,close,volume
 *   - timestamp is Unix milliseconds (UTC)
 *   - numbers may be integers or decimals
 *
 * This module is intentionally dependency-free and deterministic so it can
 * be used both locally and inside Docker without native builds.
 */

import { readFileSync } from 'node:fs';
import Decimal from 'decimal.js';
import { Bar, BarJson } from '../domain/models/Bar';
import { Price, Volume, Timestamp } from '../domain/types';

/**
 * Configuration for loading bars.
 */
export interface BarLoaderConfig {
  /** Symbol to assign to every loaded bar (default "BTCUSD"). */
  symbol?: string;
}

const CSV_HEADER = ['timestamp', 'open', 'high', 'low', 'close', 'volume'];

/**
 * Parse a single CSV row into a Bar.
 */
function parseCsvRow(row: Record<string, string>, symbol: string): Bar {
  const timestamp = Number(row.timestamp);
  if (!Number.isFinite(timestamp)) {
    throw new Error(`Invalid CSV timestamp value: ${row.timestamp}`);
  }
  const open = new Decimal(row.open) as Price;
  const high = new Decimal(row.high) as Price;
  const low = new Decimal(row.low) as Price;
  const close = new Decimal(row.close) as Price;
  const volume = new Decimal(row.volume) as Volume;

  return {
    symbol,
    timestamp: timestamp as Timestamp,
    open,
    high,
    low,
    close,
    volume,
  };
}

/**
 * Split a CSV line into fields, handling optional surrounding quotes.
 */
function splitCsvLine(line: string): string[] {
  return line.split(',').map((field) => {
    let f = field.trim();
    if (f.startsWith('"') && f.endsWith('"')) {
      f = f.slice(1, -1);
    }
    return f;
  });
}

/**
 * CsvBarLoader parses a CSV string or file into an ordered array of bars.
 * Bars are returned sorted by ascending timestamp.
 */
export class CsvBarLoader {
  private readonly config: BarLoaderConfig;

  constructor(config: BarLoaderConfig = {}) {
    this.config = config;
  }

  /**
   * Load bars from a CSV file path.
   */
  loadFile(filePath: string): Bar[] {
    const content = readFileSync(filePath, 'utf-8');
    return this.parse(content);
  }

  /**
   * Parse bars from a raw CSV string.
   */
  parse(content: string): Bar[] {
    const symbol = this.config.symbol ?? 'BTCUSD';
    const lines = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      return [];
    }

    // Detect and skip a header row if present.
    let startIndex = 0;
    const firstFields = splitCsvLine(lines[0]).map((f) => f.toLowerCase());
    if (firstFields[0] === 'timestamp') {
      const missing = CSV_HEADER.filter((h) => !firstFields.includes(h));
      if (missing.length > 0) {
        throw new Error(`CSV header missing required columns: ${missing.join(', ')}`);
      }
      startIndex = 1;
    }

    const bars: Bar[] = [];
    for (let i = startIndex; i < lines.length; i++) {
      const fields = splitCsvLine(lines[i]);
      if (fields.length < 6) {
        throw new Error(`Malformed CSV row at line ${i + 1}: expected 6 fields, got ${fields.length}`);
      }
      const row: Record<string, string> = {
        timestamp: fields[0],
        open: fields[1],
        high: fields[2],
        low: fields[3],
        close: fields[4],
        volume: fields[5],
      };
      bars.push(parseCsvRow(row, symbol));
    }

    bars.sort((a, b) => a.timestamp - b.timestamp);
    return bars;
  }

  /**
   * Load bars from an array of JSON objects.
   */
  static fromJson(jsonBars: BarJson[], config: BarLoaderConfig = {}): Bar[] {
    const symbol = config.symbol ?? 'BTCUSD';
    const bars = jsonBars.map((b) => ({
      symbol: b.symbol ?? symbol,
      timestamp: b.timestamp as Timestamp,
      open: new Decimal(b.open) as Price,
      high: new Decimal(b.high) as Price,
      low: new Decimal(b.low) as Price,
      close: new Decimal(b.close) as Price,
      volume: new Decimal(b.volume) as Volume,
    }));
    bars.sort((a, b) => a.timestamp - b.timestamp);
    return bars;
  }
}
