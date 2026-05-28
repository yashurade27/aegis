import { OrderType, Side } from '@/lib/types';

export function decodeSide(value: unknown): Side {
  if (value === Side.Long || value === 'Long' || value === 'long') {
    return Side.Long;
  }
  if (value === Side.Short || value === 'Short' || value === 'short') {
    return Side.Short;
  }
  if (value && typeof value === 'object') {
    if ('long' in value) return Side.Long;
    if ('short' in value) return Side.Short;
  }
  return Side.Long;
}

export function decodeOrderType(value: unknown): OrderType {
  if (value === OrderType.Limit || value === 'Limit' || value === 'limit') {
    return OrderType.Limit;
  }
  if (value === OrderType.Market || value === 'Market' || value === 'market') {
    return OrderType.Market;
  }
  if (value && typeof value === 'object') {
    if ('limit' in value) return OrderType.Limit;
    if ('market' in value) return OrderType.Market;
  }
  return OrderType.Limit;
}

export function encodeSide(side: Side) {
  return side === Side.Long ? { long: {} } : { short: {} };
}

export function encodeOrderType(orderType: OrderType) {
  return orderType === OrderType.Limit ? { limit: {} } : { market: {} };
}
