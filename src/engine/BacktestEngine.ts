import { IDataFeed } from '../domain/interfaces/IDataFeed';
import { Bar } from '../domain/models/Bar';
import { IStrategy, Signal } from '../domain/interfaces/IStrategy';
import { SimulatedBroker, BrokerConfig } from '../execution/SimulatedBroker';
import { MetricsCalculator } from './MetricsCalculator';
import { EquitySnapshot, BacktestResult } from './types';
import { Price, Volume } from '../domain/types';
import Decimal from 'decimal.js';

/**
 * BacktestEngine: orchestrates the backtest loop.
 *
 * Flow:
 *   for each bar in ReplayFeed (chronological order):
 *     - strategy.onBar(bar) -> signals
 *     - for each signal: place order + execute through SimulatedBroker
 *     - record equity snapshot after each bar
 */
export class BacktestEngine {
  private readonly replayFeed: IDataFeed;
  private readonly broker: SimulatedBroker;
  private readonly strategy: IStrategy;
  private readonly metricsCalculator: MetricsCalculator;
  private readonly equityCurve: EquitySnapshot[] = [];
  private readonly processedBars: Bar[] = [];
  private totalBarsProcessed: number = 0;
  private initialUsd: Decimal = new Decimal(0);
  private initialBtc: Decimal = new Decimal(0);

  constructor(
    replayFeed: IDataFeed,
    brokerConfig: BrokerConfig,
    strategy: IStrategy,
    metricsCalculator: MetricsCalculator,
  ) {
    this.replayFeed = replayFeed;
    this.broker = new SimulatedBroker(brokerConfig);
    this.strategy = strategy;
    this.metricsCalculator = metricsCalculator;
  }

  async run(): Promise<BacktestResult> {
    this.strategy.init?.();

    // Capture starting balances before the loop
    const initial = await this.broker.getBalances();
    this.initialUsd = initial.usd as Decimal;
    this.initialBtc = initial.btc as Decimal;

    // Initial equity at the very first bar close (we'll set after first bar)
    let firstBarClose: Decimal | null = null;

    while (true) {
      const bar = await this.replayFeed.next();
      if (!bar) break;

      if (firstBarClose === null) {
        firstBarClose = bar.close;
      }

      this.processedBars.push(bar);
      this.totalBarsProcessed++;

      const signals: Signal[] = this.strategy.onBar(bar);

      for (const signal of signals) {
        await this.executeSignal(signal, bar);
      }

      const balance = await this.broker.getBalances();
      this.equityCurve.push({
        timestamp: bar.timestamp,
        equity: balance.usd.add(balance.btc.mul(bar.close)),
        btcBalance: balance.btc,
        usdBalance: balance.usd,
        totalFees: new Decimal(0),
      });
    }

    this.strategy.onFinish?.();

    const markPrice = firstBarClose ?? new Decimal(0);
    const initialEquity = this.initialUsd.add(this.initialBtc.mul(markPrice));

    const finalEquity = this.equityCurve.length > 0
      ? this.equityCurve[this.equityCurve.length - 1].equity
      : initialEquity;

    const ledger = await this.broker.getLedger();
    const totalFeesPaid = this.metricsCalculator.computeTotalFees(ledger);
    const fills = await this.broker.listFills();

    return this.metricsCalculator.calculateResults({
      initialUsd: initialEquity,
      finalEquity,
      equityCurve: this.equityCurve,
      totalFeesPaid,
      tradeCount: fills.length,
    });
  }

  private async executeSignal(signal: Signal, bar: Bar): Promise<void> {
    const { symbol, side, type, quantity, price, timestamp } = signal;

    const order = {
      id: `order-${Date.now()}-${Math.random()}`,
      symbol,
      side: side as 'BUY' | 'SELL',
      type: type as 'MARKET' | 'LIMIT',
      quantity: new Decimal(quantity) as Volume,
      price: type === 'LIMIT' && price !== undefined ? new Decimal(price) : undefined,
      status: 'PENDING' as const,
      createdAt: timestamp,
      updatedAt: timestamp,
      filledQuantity: new Decimal(0) as Volume,
      averageFillPrice: undefined,
    };

    await this.broker.placeOrder(order);
    await this.broker.executeOrder(order, bar.close, bar.volume);
  }

  getProcessedBars(): Bar[] {
    return [...this.processedBars];
  }

  getEquityCurve(): EquitySnapshot[] {
    return [...this.equityCurve];
  }
}