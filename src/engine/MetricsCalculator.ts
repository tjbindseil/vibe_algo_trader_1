import Decimal from 'decimal.js';
import { LedgerEntry } from '../domain/models/Ledger';
import { EquitySnapshot } from './types';
import { Price } from '../domain/types';

/**
 * Performance metrics computed from the equity curve and ledger.
 */
export interface BacktestResult {
  initialEquity: Price;
  finalEquity: Price;
  totalReturnPct: Price;
  totalFeesPaid: Price;
  maxDrawdownPct: Price;
  trades: number;
  equityCurve: EquitySnapshot[];
  totalTimeBars: number;
  totalBarsProcessed: number;
}

/**
 * MetricsCalculator: aggregates equity curve + ledger data
 * into performance metrics.
 */
export class MetricsCalculator {
  /**
   * Compute performance results.
   */
  calculateResults(params: {
    initialUsd: Price;
    finalEquity: Price;
    equityCurve: EquitySnapshot[];
    totalFeesPaid: Price;
    tradeCount?: number;
  }): BacktestResult {
    const { initialUsd, finalEquity, equityCurve, totalFeesPaid, tradeCount = 0 } = params;

    const totalReturn = finalEquity.sub(initialUsd);
    const totalReturnPct =
      initialUsd.gt(0) ? totalReturn.div(initialUsd).mul(100) : new Decimal(0);

    let peak = initialUsd;
    let maxDrawdown = new Decimal(0);
    for (const eq of equityCurve) {
      if (eq.equity.gt(peak)) {
        peak = eq.equity;
      }
      const drawdown = peak.sub(eq.equity);
      if (drawdown.gt(maxDrawdown)) {
        maxDrawdown = drawdown;
      }
    }
    const maxDrawdownPct = peak.gt(0) ? maxDrawdown.div(peak).mul(100) : new Decimal(0);

    return {
      initialEquity: initialUsd,
      finalEquity,
      totalReturnPct,
      totalFeesPaid,
      maxDrawdownPct,
      trades: tradeCount,
      equityCurve,
      totalTimeBars: equityCurve.length,
      totalBarsProcessed: equityCurve.length,
    };
  }

  computeTotalFees(ledger: LedgerEntry[]): Price {
    return ledger
      .filter((entry) => entry.type === 'FEE')
      .reduce((acc, entry) => acc.add(entry.fee), new Decimal(0));
  }
}
