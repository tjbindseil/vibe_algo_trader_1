import { Ledger } from '../../../src/execution/Ledger';
import Decimal from 'decimal.js';

describe('Ledger', () => {
  it('appends entries and tracks size', () => {
    const ledger = new Ledger();
    ledger.record({
      id: 'e1',
      timestamp: 1,
      type: 'DEPOSIT',
      usdDelta: new Decimal(1000),
      btcDelta: new Decimal(0),
      usdBalanceAfter: new Decimal(1000),
      btcBalanceAfter: new Decimal(0),
    });
    expect(ledger.size()).toBe(1);
    expect(ledger.getEntries().length).toBe(1);
  });

  it('sums total fees', () => {
    const ledger = new Ledger();
    ledger.record({
      id: 'e1',
      timestamp: 1,
      type: 'FEE',
      usdDelta: new Decimal(-10),
      btcDelta: new Decimal(0),
      fee: new Decimal(10),
      usdBalanceAfter: new Decimal(990),
      btcBalanceAfter: new Decimal(0),
    });
    expect(ledger.totalFees().toString()).toBe('10');
  });
});
