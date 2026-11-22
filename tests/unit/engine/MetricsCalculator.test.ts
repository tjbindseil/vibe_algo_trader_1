import Decimal from 'decimal.js';
import { MetricsCalculator } from '../../../src/engine/MetricsCalculator';
import { EquitySnapshot } from '../../../src/engine/types';

describe('MetricsCalculator', () => {
  it('computes total return and max drawdown', () => {
    const initial = new Decimal(100);
    const final = new Decimal(90);
    const equity: EquitySnapshot[] = [
      { timestamp: 1, equity: new Decimal(100), btcBalance: new Decimal(0), usdBalance: new Decimal(100), totalFees: new Decimal(0) },
      { timestamp: 2, equity: new Decimal(120), btcBalance: new Decimal(0), usdBalance: new Decimal(120), totalFees: new Decimal(0) },
      { timestamp: 3, equity: new Decimal(90), btcBalance: new Decimal(0), usdBalance: new Decimal(90), totalFees: new Decimal(0) },
    ];
    const calc = new MetricsCalculator();
    const result = calc.calculateResults({
      initialUsd: initial,
      finalEquity: final,
      equityCurve: equity,
      totalFeesPaid: new Decimal(0),
      tradeCount: 2,
    });
    expect(result.totalReturnPct.toString()).toBe('-10');
    expect(result.maxDrawdownPct.toString()).toBe('25');
  });
});
