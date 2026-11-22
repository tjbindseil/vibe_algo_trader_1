import { createFill, fillNotional } from '../../../src/domain/models/Fill';
import Decimal from 'decimal.js';

describe('Fill domain model', () => {
  it('computes notional as quantity * price', () => {
    const fill = createFill({
      id: 'f1',
      orderId: 'o1',
      symbol: 'BTCUSD',
      side: 'BUY',
      quantity: new Decimal(0.5) as any,
      price: new Decimal(100) as any,
      fee: new Decimal(0.1) as any,
      feeTier: 'TAKER',
      timestamp: 1700000000000,
    });

    const notional = fillNotional(fill);
    expect(notional.toString()).toBe('50');
  });
});
