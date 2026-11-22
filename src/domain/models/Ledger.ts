/**
 * Append-only ledger entry recording every state change in the account.
 * Entries are stored in insertion order and never modified or deleted.
 */

import Decimal from 'decimal.js';
import { Timestamp, UsdAmount, BtcAmount } from '../types';

export type LedgerEntryType =
  | 'FILL'
  | 'FEE'
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'BALANCE_SNAPSHOT';

export interface LedgerEntry {
  readonly id: string;
  readonly timestamp: Timestamp;
  readonly type: LedgerEntryType;
  readonly orderId?: string;
  readonly fillId?: string;
  readonly usdDelta: UsdAmount;
  readonly btcDelta: BtcAmount;
  readonly fee: UsdAmount;
  readonly usdBalanceAfter: UsdAmount;
  readonly btcBalanceAfter: BtcAmount;
  readonly note?: string;
}

export interface LedgerEntryJson {
  id: string;
  timestamp: number;
  type: LedgerEntryType;
  orderId?: string;
  fillId?: string;
  usdDelta: number;
  btcDelta: number;
  fee: number;
  usdBalanceAfter: number;
  btcBalanceAfter: number;
  note?: string;
}

export class Ledger {
  private entries: LedgerEntry[] = [];

  append(entry: LedgerEntry): void {
    this.entries.push(entry);
  }

  getEntries(): LedgerEntry[] {
    return [...this.entries];
  }

  getLastEntry(): LedgerEntry | null {
    return this.entries.length > 0 ? this.entries[this.entries.length - 1] : null;
  }

  size(): number {
    return this.entries.length;
  }

  getByType(type: LedgerEntry['type']): LedgerEntry[] {
    return this.entries.filter((e) => e.type === type);
  }

  totalFees(): UsdAmount {
    const total = this.entries
      .filter((e) => e.type === 'FEE')
      .reduce((acc, e) => acc.add(e.fee), new Decimal(0));
    return total;
  }

  toJson(): LedgerEntryJson[] {
    return this.entries.map((entry) => ledgerEntryToJson(entry));
  }

  clear(): void {
    this.entries = [];
  }
}

export function ledgerEntryToJson(entry: LedgerEntry): LedgerEntryJson {
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