/**
 * Position model tracking BTC holdings and unrealized/realized P&L.
 * Positions are immutable; updates return a new Position instance.
 */

import Decimal from 'decimal.js';
import { Price, Volume, Symbol, BtcAmount, UsdAmount } from '../types';

/**
 * Interface for a Position.
 */
export interface Position {
  /** Symbol traded. */
  readonly symbol: Symbol;
  /** Current BTC quantity (positive = long, negative = short, zero = flat). */
  readonly btcAmount: BtcAmount;
  /** Average entry price of the current position (USD per BTC). */
  readonly averageEntryPrice?: Price;
  /** Realized P&L in USD from closed portions. */
  readonly realizedPnl: UsdAmount;
  /** Total quantity ever bought (for cost-basis tracking). */
  readonly totalBought: Volume;
  /** Total quantity ever sold. */
  readonly totalSold: Volume;
}

/**
 * Plain JSON representation.
 */
export interface PositionJson {
  symbol: string;
  btcAmount: number;
  averageEntryPrice?: number;
  realizedPnl: number;
  totalBought: number;
  totalSold: number;
}

/**
 * Create a flat (zero) position.
 */
export function createPosition(symbol: Symbol): Position {
  return {
    symbol,
    btcAmount: new Decimal(0) as BtcAmount,
    averageEntryPrice: undefined,
    realizedPnl: new Decimal(0) as UsdAmount,
    totalBought: new Decimal(0) as Volume,
    totalSold: new Decimal(0) as Volume,
  };
}

/**
 * Update position after a fill. Returns a new Position instance.
 *
 * For BUY fills:
 *   - newBtc = oldBtc + qty
 *   - newAvg = (oldBtc * oldAvg + qty * price) / newBtc   (if newBtc > 0)
 *   - totalBought += qty
 *
 * For SELL fills:
 *   - newBtc = oldBtc - qty
 *   - realizedPnl += qty * (price - oldAvg)   (if oldAvg defined)
 *   - totalSold += qty
 *   - If newBtc === 0, reset averageEntryPrice
 */
export function applyFill(
  position: Position,
  fill: { side: 'BUY' | 'SELL'; quantity: Volume; price: Price },
): Position {
  const qty = fill.quantity;
  const price = fill.price;

  if (fill.side === 'BUY') {
    const newBtc = position.btcAmount.add(qty);
    let newAvg: Price | undefined;
    if (newBtc.gt(0)) {
      const oldCost = position.btcAmount.mul(position.averageEntryPrice ?? price);
      newAvg = oldCost.add(qty.mul(price)).div(newBtc) as Price;
    }
    return {
      symbol: position.symbol,
      btcAmount: newBtc as BtcAmount,
      averageEntryPrice: newAvg,
      realizedPnl: position.realizedPnl,
      totalBought: position.totalBought.add(qty) as Volume,
      totalSold: position.totalSold,
    };
  }

  // SELL
  const newBtc = position.btcAmount.sub(qty);
  let newRealized = position.realizedPnl;
  if (position.averageEntryPrice) {
    newRealized = position.realizedPnl.add(
      qty.mul(price.sub(position.averageEntryPrice)),
    ) as UsdAmount;
  }
  let newAvg: Price | undefined = position.averageEntryPrice;
  if (newBtc.eq(0)) {
    newAvg = undefined;
  }

  return {
    symbol: position.symbol,
    btcAmount: newBtc as BtcAmount,
    averageEntryPrice: newAvg,
    realizedPnl: newRealized,
    totalBought: position.totalBought,
    totalSold: position.totalSold.add(qty) as Volume,
  };
}

/**
 * Compute unrealized P&L at a given mark price.
 */
export function unrealizedPnl(position: Position, markPrice: Price): Price {
  if (position.btcAmount.eq(0) || !position.averageEntryPrice) {
    return new Decimal(0) as Price;
  }
  return position.btcAmount.mul(markPrice.sub(position.averageEntryPrice)) as Price;
}

/**
 * Convert Position to JSON.
 */
export function positionToJson(position: Position): PositionJson {
  return {
    symbol: position.symbol,
    btcAmount: position.btcAmount.toNumber(),
    averageEntryPrice: position.averageEntryPrice ? position.averageEntryPrice.toNumber() : undefined,
    realizedPnl: position.realizedPnl.toNumber(),
    totalBought: position.totalBought.toNumber(),
    totalSold: position.totalSold.toNumber(),
  };
}