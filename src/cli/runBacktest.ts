import { ReplayFeed } from '../data/ReplayFeed';
import { CsvBarLoader } from '../data/BarLoader';
import { MovingAverageCrossover } from '../strategy/MovingAverageCrossover';
import { BacktestEngine } from '../engine/BacktestEngine';
import { MetricsCalculator } from '../engine/MetricsCalculator';
import { SimulatedBroker, BrokerConfig } from '../execution/SimulatedBroker';

/**
 * CLI Runner: executes backtest from CSV file and outputs metrics.
 */
export async function main(args: string[]): Promise<void> {
  if (args.length < 1) {
    console.error('Usage: node dist/cli/runBacktest.js <path-to-csv-bars> [initialBTC=1.0] [initialUSD=10000.0]');
    process.exit(1);
  }

  const [csvPath, initialBTCStr, initialUSDStr] = args;
  const initialBTC = initialBTCStr ? parseFloat(initialBTCStr) : 1.0;
  const initialUSD = initialUSDStr ? parseFloat(initialUSDStr) : 10000.0;

  // Load sample data from CSV
  const loader = new CsvBarLoader({ symbol: 'BTCUSD' });
  const bars = loader.loadFile(csvPath);

  if (bars.length === 0) {
    console.error('No bars loaded from CSV file.');
    process.exit(1);
  }

  // Initialize broker with starting balances
  const brokerConfig: BrokerConfig = {
    initialUsd: initialUSD,
    initialBtc: initialBTC,
    symbol: 'BTCUSD',
  };

  // Initialize SMA crossover strategy (fast=10, slow=30)
  const strategy = new MovingAverageCrossover(10, 30, 1.0);

  // Initialize metrics calculator
  const metricsCalculator = new MetricsCalculator();

  // Initialize backtest engine
  const backtestEngine = new BacktestEngine(
    new ReplayFeed(bars, 'BTCUSD'),
    brokerConfig,
    strategy,
    metricsCalculator,
  );

  // Run backtest
  const result = await backtestEngine.run();

  // Output metrics
  const { initialEquity, finalEquity, totalReturnPct, totalFeesPaid,
    maxDrawdownPct, trades, equityCurve, totalTimeBars } = result;

  console.log('BTC/USD Backtest Report');
  console.log('=======================');
  console.log(`Initial BTC: ${initialBTC} | Initial USD: $${initialUSD.toFixed(2)}`);
  console.log(`Final Equity: $${finalEquity.toFixed(2)}`);
  console.log(`Total Return: ${totalReturnPct.toFixed(2)}%`);
  console.log(`Total Fees Paid: $${totalFeesPaid.toFixed(2)}`);
  console.log(`Max Drawdown: ${maxDrawdownPct.toFixed(2)}%`);
  console.log(`Trades Executed: ${trades}`);
  console.log(`Total Bars Processed: ${totalTimeBars}`);

  const lastSnapshot = equityCurve[equityCurve.length - 1];
  console.log(`\nEnding Equity Breakdown:`);
  console.log(`  BTC Balance: ${lastSnapshot.btcBalance.toString()} BTC`);
  console.log(`  USD Balance: $${lastSnapshot.usdBalance.toFixed(2)} USD`);
  console.log(`  Total Equity: $${lastSnapshot.equity.toFixed(2)} USD`);
  console.log('\nEquity Curve Summary (last 5 bars):');
  for (let i = Math.max(0, equityCurve.length - 5); i < equityCurve.length; i++) {
    const s = equityCurve[i];
    console.log(`  Bar ${i + 1}: $${s.equity.toFixed(2)}`);
  }
}

main(process.argv.slice(2)).catch((err) => {
  console.error('Backtest failed:', err);
  process.exit(1);
});