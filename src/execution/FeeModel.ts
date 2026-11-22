/**
 * Fee model for maker/taker fee calculation.
 * Fees are expressed as a percentage of the notional value (in USD).
 */

import Decimal from 'decimal.js';
import { Price, UsdAmount, Volume, FeeTier } from '../domain/types';

/**
 * FeeModel calculates fees based on order tier and notional value.
 */
export class FeeModel {
  private readonly makerRate: Decimal;
  private readonly takerRate: Decimal;

  /**
   * @param makerRate  Maker fee rate as a decimal fraction (e.g. 0.001 = 0.1%).
   * @param takerRate  Taker fee rate as a decimal fraction (e.g. 0.002 = 0.2%).
   */
  constructor(makerRate: number = 0.001, takerRate: number = 0.002) {
    this.makerRate = new Decimal(makerRate);
    this.takerRate = new Decimal(takerRate);
  }

  /**
   * Calculate the fee for a given tier and notional.
   * @param tier        MAKER or TAKER.
   * @param notional    Notional value in USD (quantity * price).
   * @returns           Fee in USD.
   */
  calculateFee(tier: FeeTier, notional: UsdAmount): UsdAmount {
    const rate = tier === 'MAKER' ? this.makerRate : this.takerRate;
    return notional.mul(rate) as UsdAmount;
  }

  /**
   * Convenience: calculate fee from quantity and price.
   */
  calculateFeeFromNotional(
    tier: FeeTier,
    quantity: Volume,
    price: Price,
  ): UsdAmount {
    const notional = quantity.mul(price) as UsdAmount;
    return this.calculateFee(tier, notional);
  }

  /**
   * Get maker rate.
   */
  getMakerRate(): Decimal {
    return this.makerRate;
  }

  /**
   * Get taker rate.
   */
  getTakerRate(): Decimal {
    return this.takerRate;
  }
}