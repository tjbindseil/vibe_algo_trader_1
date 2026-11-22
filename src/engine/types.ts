import { Price } from '../domain/types';
import { Volume } from '../domain/types';

/**
 * Equity snapshot at a point in time.
 */
export interface EquitySnapshot {
  timestamp: number;
  equity: Price;
  btcBalance: Volume;
  usdBalance: Volume;
  totalFees: Volume;
}

/**
 * Backtest result.
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
