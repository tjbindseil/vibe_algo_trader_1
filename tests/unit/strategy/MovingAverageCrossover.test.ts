import Decimal from 'decimal.js';
import { MovingAverageCrossover } from '../../../src/strategy/MovingAverageCrossover';

function bar(timestamp: number, close: number) {
  const d = new Decimal(close);
  return {
    symbol: 'BTCUSD' as const,
    timestamp,
    open: d,
    high: d.add(1),
    low: d.sub(1),
    close: d,
    volume: new Decimal(1),
  };
}

describe('MovingAverageCrossover', () => {
  it('produces no signals during warm-up', async () => {
    const strategy = new MovingAverageCrossover(10, 30);
    for (let i = 0; i < 10; i++) {
      await strategy.onBar(bar(i, 100 + i));
    }
    const signals = strategy.onBar(bar(10, 110));
    expect(signals.length).toBe(0);
  });

  it('emits BUY on upward crossover', async () => {
    const strategy = new MovingAverageCrossover(3, 5);
    const prices = [100, 100, 100, 100, 100, 200, 200, 200];
    let buyCount = 0;
    let sellCount = 0;
    for (let i = 0; i < prices.length; i++) {
      const sigs = strategy.onBar(bar(i, prices[i]));
      sigs.forEach((s) => {
        if (s.side === 'BUY') buyCount++;
        if (s.side === 'SELL') sellCount++;
      });
    }
    expect(buyCount).toBeGreaterThanOrEqual(1);
    expect(sellCount).toBe(0);
  });

  it('emits SELL on downward crossover', async () => {
    const strategy = new MovingAverageCrossover(3, 5);
    const prices = [200, 200, 200, 200, 200, 50, 50, 50, 50];
    let buyCount = 0;
    let sellCount = 0;
    for (let i = 0; i < prices.length; i++) {
      const sigs = strategy.onBar(bar(i, prices[i]));
      sigs.forEach((s) => {
        if (s.side === 'BUY') buyCount++;
        if (s.side === 'SELL') sellCount++;
      });
    }
    expect(sellCount).toBeGreaterThanOrEqual(1);
    expect(buyCount).toBe(0);
  });
});
