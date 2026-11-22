/**
 * Append-only ledger that records every state change in the account.
 * Entries are stored in insertion order and never modified or deleted.
 */

import Decimal from 'decimal.js';
import { LedgerEntry, LedgerEntryJson } from '../domain/models/Ledger';
import { Timestamp, UsdAmount, BtcAmount } from '../domain/types';

/**
 * Ledger maintains an append-only log of all account events.
 */
export class Ledger {
  private entries: LedgerEntry[] = [];

  /**
   * Append a new entry.
   */
  append(entry: LedgerEntry): void {
    this.entries.push(entry);
  }

  /**
   * Convenience method to create and append an entry.
   */
  record(params: {
    id: string;
    timestamp: Timestamp;
    type: LedgerEntry['type'];
    usdDelta: UsdAmount;
    btcDelta: BtcAmount;
    fee?: UsdAmount;
    usdBalanceAfter: UsdAmount;
    btcBalanceAfter: BtcAmount;
    orderId?: string;
    fillId?: string;
    note?: string;
  }): LedgerEntry {
    const entry = {
      id: params.id,
      timestamp: params.timestamp,
      type: params.type,
      usdDelta: params.usdDelta,
      btcDelta: params.btcDelta,
      fee: params.fee ?? new Decimal(0) as UsdAmount,
      usdBalanceAfter: params.usdBalanceAfter,
      btcBalanceAfter: params.btcBalanceAfter,
      orderId: params.orderId,
      fillId: params.fillId,
      note: params.note,
    };
    this.entries.push(entry);
    return entry;
  }

  /**
   * Get all entries (read-only copy).
   */
  getEntries(): LedgerEntry[] {
    return [...this.entries];
  }

  /**
   * Get the last entry, or null if empty.
   */
  getLastEntry(): LedgerEntry | null {
    return this.entries.length > 0 ? this.entries[this.entries.length - 1] : null;
  }

  /**
   * Total number of entries.
   */
  size(): number {
    return this.entries.length;
  }

  /**
   * Get entries filtered by type.
   */
  getByType(type: LedgerEntry['type']): LedgerEntry[] {
    return this.entries.filter((e) => e.type === type);
  }

  /**
   * Sum all fee entries.
   */
  totalFees(): UsdAmount {
    const total = this.entries
      .filter((e) => e.type === 'FEE')
      .reduce((acc, e) => acc.add(e.fee), new Decimal(0) as UsdAmount);
    return total;
  }

  /**
   * Get all entries as JSON.
   */
  toJson(): LedgerEntryJson[] {
    return this.entries.map(ledgerEntryToJson);
  }

  /**
   * Clear the ledger (for testing/reset).
   */
  clear(): void {
    this.entries = [];
  }
}

/**
 * Convert LedgerEntry to JSON (assumes entry conforms to model).
 */
function ledgerEntryToJson(entry: LedgerEntry): LedgerEntryJson {
  return {
    id: entry.id,
    timestamp: entry.timestamp,
    type: entry.type,
    orderId: entry.orderId,
    fillId: entry.fillId,
    usdDelta: Number(entry.usdDelta),
    btcDelta: Number(entry.btcDelta),
    fee: Number(entry.fee),
    usdBalanceAfter: Number(entry.usdBalanceAfter),
    btcBalanceAfter: Number(entry.btcBalanceAfter),
    note: entry.note,
  };
}