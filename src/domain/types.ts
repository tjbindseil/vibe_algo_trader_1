/**
 * Core type definitions for the BTC/USD algorithmic trading application.
 * All financial amounts use Decimal.js for exact precision.
 * Time is represented as Unix milliseconds (UTC).
 */

import Decimal from 'decimal.js';

/**
 * Symbol traded (e.g. BTCUSD).
 */
export type Symbol = string;

/**
 * Side of an order or trade.
 */
export type Side = 'BUY' | 'SELL';

/**
 * Order type.
 */
export type OrderType = 'MARKET' | 'LIMIT';

/**
 * Order status lifecycle.
 */
export type OrderStatus = 'PENDING' | 'OPEN' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED' | 'REJECTED';

/**
 * Trade side used in fills.
 */
export type TradeSide = 'BUY' | 'SELL';

/**
 * Timestamp type: Unix milliseconds since epoch (UTC).
 */
export type Timestamp = number;

/**
 * Quantity of BTC.
 */
export type BtcAmount = Decimal;

/**
 * Quantity of USD (cash).
 */
export type UsdAmount = Decimal;

/**
 * Price in USD per BTC.
 */
export type Price = Decimal;

/**
 * Volume of BTC traded.
 */
export type Volume = Decimal;

/**
 * Configurable fee tier identifiers.
 */
export type FeeTier = 'MAKER' | 'TAKER';

/**
 * Precision settings for Decimal.js operations.
 */
export const DECIMAL_PRECISION = 28;

/**
 * Rounding mode for Decimal.js.
 */
export const DECIMAL_ROUNDING = Decimal.ROUND_HALF_UP;

/**
 * Create a Decimal from a number or string safely.
 */
export function toDecimal(value: number | string): Decimal {
  return new Decimal(value).toDecimalPlaces(DECIMAL_PRECISION, DECIMAL_ROUNDING);
}
