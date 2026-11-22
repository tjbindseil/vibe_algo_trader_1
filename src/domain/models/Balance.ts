/**
 * Cash (USD) and BTC balance model.
 * Balances are immutable; operations return new Balance instances.
 */

import Decimal from 'decimal.js';
import { UsdAmount, BtcAmount, Price } from '../types';

/**
 * Interface for account balances.
 */
export interface Balance {
  /** Available USD cash (not locked in open orders). */
  readonly usd: UsdAmount;
  /** Available BTC (not locked in open orders). */
  readonly btc: BtcAmount;
  /** USD locked in open buy orders (quote reserved). */
  readonly lockedUsd: UsdAmount;
  /** BTC locked in open sell orders. */
  readonly lockedBtc: BtcAmount;
}

/**
 * Plain JSON representation.
 */
export interface BalanceJson {
  usd: number;
  btc: number;
  lockedUsd: number;
  lockedBtc: number;
}

/**
 * Create a new Balance.
 */
export function createBalance(params: {
  usd?: UsdAmount;
  btc?: BtcAmount;
  lockedUsd?: UsdAmount;
  lockedBtc?: BtcAmount;
}): Balance {
  return {
    usd: params.usd ?? (new Decimal(0) as UsdAmount),
    btc: params.btc ?? (new Decimal(0) as BtcAmount),
    lockedUsd: params.lockedUsd ?? (new Decimal(0) as UsdAmount),
    lockedBtc: params.lockedBtc ?? (new Decimal(0) as BtcAmount),
  };
}

/**
 * Total equity = available USD + (BTC * markPrice).
 */
export function totalEquity(balance: Balance, markPrice: Price): UsdAmount {
  return balance.usd.add(balance.btc.mul(markPrice)) as UsdAmount;
}

/**
 * Check if there is enough available USD for a notional amount.
 */
export function hasEnoughUsd(balance: Balance, amount: UsdAmount): boolean {
  return balance.usd.gte(amount);
}

/**
 * Check if there is enough available BTC for a quantity.
 */
export function hasEnoughBtc(balance: Balance, amount: BtcAmount): boolean {
  return balance.btc.gte(amount);
}

/**
 * Convert Balance to JSON.
 */
export function balanceToJson(balance: Balance): BalanceJson {
  return {
    usd: balance.usd.toNumber(),
    btc: balance.btc.toNumber(),
    lockedUsd: balance.lockedUsd.toNumber(),
    lockedBtc: balance.lockedBtc.toNumber(),
  };
}