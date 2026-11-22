import { createBar, barToJson, Bar, BarJson } from '../../../src/domain/models/Bar';

describe('Bar domain model', () => {
  it('creates a bar with Decimal OHLCV values', () => {
    const bar = createBar({
      symbol: 'BTCUSD',
      timestamp: 1700000000000,
      open: '100',
      high: '105',
      low: '98',
      close: '103',
      volume: '0.5',
    });

    expect(bar.symbol).toBe('BTCUSD');
    expect(bar.timestamp).toBe(1700000000000);
    expect(Number(bar.open)).toBe(100);
    expect(Number(bar.high)).toBe(105);
    expect(Number(bar.low)).toBe(98);
    expect(Number(bar.close)).toBe(103);
    expect(Number(bar.volume)).toBe(0.5);
  });

  it('converts bar to JSON', () => {
    const bar = createBar({
      symbol: 'BTCUSD',
      timestamp: 123,
      open: 10,
      high: 12,
      low: 9,
      close: 11,
      volume: 0.25,
    });
    const json = barToJson(bar);
    expect(json.timestamp).toBe(123);
    expect(json.open).toBe(10);
  });
});
