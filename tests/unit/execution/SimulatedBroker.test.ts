import { SimulatedBroker } from '../../../src/execution/SimulatedBroker';
import { FeeModel } from '../../../src/execution/FeeModel';
import Decimal from 'decimal.js';

describe('SimulatedBroker', () => {
  let broker: SimulatedBroker;

  beforeEach(async () => {
    broker = new SimulatedBroker({ initialUsd: 10000, initialBtc: 1 });
  });

  it('rejects BUY order with insufficient USD', async () => {
    const order: any = {
      id: 'o1',
      symbol: 'BTCUSD',
      side: 'BUY',
      type: 'MARKET',
      quantity: new Decimal(5),
      price: new Decimal(2000),
    };
    await expect(broker.placeOrder(order)).rejects.toThrow('Insufficient USD');
  });

  it('places BUY order with sufficient USD', async () => {
    const order: any = {
      id: 'o2',
      symbol: 'BTCUSD',
      side: 'BUY',
      type: 'MARKET',
      quantity: new Decimal(0.1),
      price: new Decimal(100),
    };
    const placed = await broker.placeOrder(order);
    expect(placed.status).toBe('OPEN');
  });

  it('executes order updating balances and ledger', async () => {
    const order: any = {
      id: 'o3',
      symbol: 'BTCUSD',
      side: 'BUY',
      type: 'MARKET',
      quantity: new Decimal(0.5),
      price: new Decimal(100),
      status: 'OPEN',
      filledQuantity: new Decimal(0),
    };
    const fill = await broker.executeOrder(order, new Decimal(100), new Decimal(10));
    expect(fill).not.toBeNull();
    expect(fill!.quantity.toString()).toBe('0.5');

    const bal = await broker.getBalances();
    expect(bal.btc.toString()).toBe('1.5');
    expect(bal.usd.lt(10000)).toBe(true); // fees deducted

    const ledger = await broker.getLedger();
    expect(ledger.length).toBeGreaterThan(0);
  });

  it('executes SELL order updating balances', async () => {
    const order: any = {
      id: 'o4',
      symbol: 'BTCUSD',
      side: 'SELL',
      type: 'MARKET',
      quantity: new Decimal(0.2),
      price: new Decimal(150),
      status: 'OPEN',
      filledQuantity: new Decimal(0),
    };
    await broker.executeOrder(order, new Decimal(150), new Decimal(5));
    const bal = await broker.getBalances();
    expect(bal.btc.toString()).toBe('0.8');
    expect(bal.usd.gt(10000)).toBe(true);
  });
});
