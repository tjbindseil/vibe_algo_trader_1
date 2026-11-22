/**
 * Public API exports for the BTC/USD algorithmic trading application.
 */

// Domain models
export { Bar, BarJson, createBar, barToJson } from './domain/models/Bar';
export { Order, OrderJson, createOrder, orderToJson, updateOrder } from './domain/models/Order';
export { Fill, FillJson, createFill, fillToJson, fillNotional } from './domain/models/Fill';
export { Position, PositionJson, createPosition, positionToJson, applyFill } from './domain/models/Position';
export { Balance, BalanceJson, createBalance, balanceToJson } from './domain/models/Balance';
export { Ledger, LedgerEntry, LedgerEntryType, ledgerEntryToJson } from './domain/models/Ledger';

// Execution / Broker
export { FeeModel } from './execution/FeeModel';
export { SlippageModel } from './execution/SlippageModel';
export { SimulatedBroker } from './execution/SimulatedBroker';

// Data feed
export { CsvBarLoader } from './data/BarLoader';
export { ReplayFeed } from './data/ReplayFeed';

// Strategy
export { MovingAverageCrossover } from './strategy/MovingAverageCrossover';

// Engine
export { BacktestEngine } from './engine/BacktestEngine';
export { BacktestResult, EquitySnapshot } from './engine/types';
export { MetricsCalculator } from './engine/MetricsCalculator';

// CLI
export { main as runBacktestMain } from './cli/runBacktest';
