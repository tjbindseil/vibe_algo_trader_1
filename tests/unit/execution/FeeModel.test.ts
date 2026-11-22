import { FeeModel } from '../../../src/execution/FeeModel';
import Decimal from 'decimal.js';

describe('FeeModel', () => {
  const model = new FeeModel(0.001, 0.002); // 0.1% maker, 0.2% taker

  it('calculates maker fee', () => {
    const fee = model.calculateFee('MAKER', new Decimal(10000) as any);
    expect(fee.toString()).toBe('10');
  });

  it('calculates taker fee', () => {
    const fee = model.calculateFee('TAKER', new Decimal(10000) as any);
    expect(fee.toString()).toBe('20');
  });

  it('calculates fee from qty and price', () => {
    const fee = model.calculateFeeFromNotional('MAKER', new Decimal(2) as any, new Decimal(5000) as any);
    expect(fee.toString()).toBe('10');
  });
});