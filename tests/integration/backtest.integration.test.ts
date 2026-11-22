import { BacktestEngine } from '../../src/engine/BacktestEngine';
import { MetricsCalculator } from '../../src/engine/MetricsCalculator';
import { CsvBarLoader } from '../../src/data/BarLoader';
import { ReplayFeed } from '../../src/data/ReplayFeed';
import { MovingAverageCrossover } from '../../src/strategy/MovingAverageCrossover';
import { BrokerConfig } from '../../src/execution/SimulatedBroker';

describe('Backtest Integration', () => {
  it('processes sample CSV and produces metrics', async () => {
    const loader = new CsvBarLoader({ symbol: 'BTCUSD' });
    const bars = loader.loadFile('tests/fixtures/sample_bars.csv');

    const brokerConfig: BrokerConfig = {
      initialUsd: 10000,
      initialBtc: 1,
      symbol: 'BTCUSD',
    };

    const strategy = new MovingAverageCrossover(10, 30, 1.0);
    const metricsCalculator = new MetricsCalculator();
    const backtestEngine = new BacktestEngine(
      new ReplayFeed(bars, 'BTCUSD'),
      brokerConfig,
      strategy,
      metricsCalculator,
    );

    const result = await backtestEngine.run();

    expect(result.initialEquity.toString()).toBe('10103');
    expect(result.totalReturnPct.greaterThanOrEqualTo(-100)).toBe(true);
    expect(result.maxDrawdownPct.greaterThanOrEqualTo(0)).toBe(true);
    expect(result.trades).toBeGreaterThanOrEqual(0);
  });
});
