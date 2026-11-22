import { createBalance, hasEnoughUsd, hasEnoughBtc, totalEquity } from '../../../src/domain/models/Balance';
import Decimal from 'decimal.js';

describe('Balance domain model', () => {
  it('has default zero balances', () => {
    const bal = createBalance({});
    expect(Number(bal.usd)).toBe(0);
    expect(Number(bal.btc)).toBe(0);
    expect(Number(bal.lockedUsd)).toBe(0);
    expect(Number(bal.lockedBtc)).toBe(0);
  });

  it('checks usd sufficiency', () => {
    const bal = createBalance({ usd: new Decimal(100) });
    expect(hasEnoughUsd(bal, new Decimal(99))).toBe(true);
    expect(hasEnoughUsd(bal, new Decimal(101))).toBe(false);
  });

  it('checks btc sufficiency', () => {
    const bal = createBalance({ btc: new Decimal(2) });
    expect(hasEnoughBtc(bal, new Decimal(2))).toBe(true);
    expect(hasEnoughBtc(bal, new Decimal(3))).toBe(false);
  });

  it('computes total equity', () => {
    const bal = createBalance({ usd: new Decimal(1000), btc: new Decimal(1) });
    expect(totalEquity(bal, new Decimal(1500)).toString()).toBe('2500');
  });
});
