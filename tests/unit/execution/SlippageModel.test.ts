import { SlippageModel } from '../../../src/execution/SlippageModel';
import Decimal from 'decimal.js';

describe('SlippageModel', () => {
  const model = new SlippageModel({ slippageCoeff: 0.001, maxSlippage: 0.01 });

  it('applies positive slippage for BUY orders', () => {
    const price = model.applySlippage('BUY', new Decimal(100), new Decimal(1), new Decimal(100));
    // 1% slippage (1/100 * 0.001) = 0.00001; buy goes higher
    expect(price.gt(100)).toBe(true);
  });

  it('applies negative slippage for SELL orders', () => {
    const price = model.applySlippage('SELL', new Decimal(100), new Decimal(1), new Decimal(100));
    expect(price.lt(100)).toBe(true);
  });

  it('caps slippage at maxSlippage', () => {
    const price = model.applySlippage('BUY', new Decimal(100), new Decimal(100), new Decimal(1));
    // ratio = 100, coeff=0.001 => slippage=0.1, capped at 0.01
    expect(price.toString()).toBe('101');
  });

  it('returns reference price when liquidity is zero', () => {
    const price = model.applySlippage('BUY', new Decimal(100), new Decimal(1), new Decimal(0));
    expect(price.toString()).toBe('100');
  });
});