import { createOrder, updateOrder, Order } from '../../../src/domain/models/Order';
import { Volume } from '../../../src/domain/types';
import Decimal from 'decimal.js';

describe('Order domain model', () => {
  it('creates a market BUY order with zero fill quantity', () => {
    const order = createOrder({
      id: 'o1',
      symbol: 'BTCUSD',
      side: 'BUY',
      type: 'MARKET',
      quantity: new Decimal(1) as Volume,
    });

    expect(order.status).toBe('PENDING');
    expect(order.side).toBe('BUY');
    expect(order.type).toBe('MARKET');
    expect(Number(order.filledQuantity)).toBe(0);
  });

  it('creates a LIMIT order preserving price', () => {
    const order = createOrder({
      id: 'o2',
      symbol: 'BTCUSD',
      side: 'SELL',
      type: 'LIMIT',
      quantity: new Decimal(0.5) as Volume,
      price: new Decimal(50000) as any,
      createdAt: 12345,
    });

    expect(order.status).toBe('PENDING');
    expect(order.price!.toString()).toBe('50000');
    expect(order.createdAt).toBe(12345);
  });

  it('updates status and filled quantity', () => {
    const order = createOrder({
      id: 'o3',
      symbol: 'BTCUSD',
      side: 'BUY',
      type: 'MARKET',
      quantity: new Decimal(2) as Volume,
    });

    const updated = updateOrder(order, {
      status: 'PARTIALLY_FILLED',
      filledQuantity: new Decimal(1) as Volume,
    });

    expect(updated.status).toBe('PARTIALLY_FILLED');
    expect(Number(updated.filledQuantity)).toBe(1);
  });
});
