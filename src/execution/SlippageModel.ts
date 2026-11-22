/**
 * Slippage model that adjusts execution prices based on order size
 * relative to available liquidity (simulated as bar volume).
 *
 * A simple linear model:
 *   slippageFraction = slippageCoeff * (orderNotional / availableLiquidity)
 *   adjustedPrice    = referencePrice * (1 +/- slippageFraction)
 *
 * Buy orders execute slightly higher; sell orders slightly lower.
 */

import Decimal from 'decimal.js';
import { Price, Volume, Side } from '../domain/types';

/**
 * Configuration for the slippage model.
 */
export interface SlippageConfig {
  /** Coefficient controlling the slippage magnitude (default 0.001). */
  slippageCoeff?: number;
  /** Maximum allowed slippage fraction (default 0.01 = 1%). */
  maxSlippage?: number;
}

/**
 * SlippageModel adjusts execution prices.
 */
export class SlippageModel {
  private readonly coeff: Decimal;
  private readonly maxSlippage: Decimal;

  constructor(config: SlippageConfig = {}) {
    this.coeff = new Decimal(config.slippageCoeff ?? 0.001);
    this.maxSlippage = new Decimal(config.maxSlippage ?? 0.01);
  }

  /**
   * Compute the adjusted execution price.
   * @param side           BUY or SELL.
   * @param referencePrice The mid price (e.g. current bar close).
   * @param orderQty       Order quantity in BTC.
   * @param availableLiq   Available liquidity (e.g. bar volume) in BTC.
   * @returns              Adjusted price.
   */
  applySlippage(
    side: Side,
    referencePrice: Price,
    orderQty: Volume,
    availableLiq: Volume,
  ): Price {
    if (availableLiq.lte(0)) {
      return referencePrice;
    }
    const ratio = orderQty.div(availableLiq);
    let slip = this.coeff.mul(ratio);
    if (slip.gt(this.maxSlippage)) {
      slip = this.maxSlippage;
    }

    const sign = side === 'BUY' ? 1 : -1;
    const adjusted = referencePrice.mul(new Decimal(1).add(slip.mul(sign)));
    return adjusted as Price;
  }

  /**
   * Compute only the slippage fraction (useful for testing).
   */
  slippageFraction(
    orderQty: Volume,
    availableLiq: Volume,
  ): Decimal {
    if (availableLiq.lte(0)) {
      return new Decimal(0);
    }
    let slip = this.coeff.mul(orderQty.div(availableLiq));
    if (slip.gt(this.maxSlippage)) {
      slip = this.maxSlippage;
    }
    return slip;
  }
}