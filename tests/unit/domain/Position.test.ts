import { createPosition, applyFill } from '../../../src/domain/models/Position';
import Decimal from 'decimal.js';

describe('Position domain model', () => {
  it('starts flat with zero realized pnl', () => {
    const pos = createPosition('BTCUSD');
    expect(Number(pos.btcAmount)).toBe(0);
    expect(Number(pos.realizedPnl)).toBe(0);
  });

  it('updates position after a buy fill', () => {
    const pos = createPosition('BTCUSD');
    const newPos = applyFill(pos, { side: 'BUY', quantity: new Decimal(1), price: new Decimal(100) });
    expect(Number(newPos.btcAmount)).toBe(1);
    expect(Number(newPos.averageEntryPrice)).toBe(100);
  });

  it('computes realized pnl on partial sell', () => {
    const bought = createPosition('BTCUSD');
    const boughtAfter = applyFill(bought, { side: 'BUY', quantity: new Decimal(1), price: new Decimal(100) });
    const sold = applyFill(boughtAfter, { side: 'SELL', quantity: new Decimal(0.5), price: new Decimal(110) });
    expect(Number(sold.btcAmount)).toBe(0.5);
    expect(Number(sold.realizedPnl)).toBe(5);
  });
});
