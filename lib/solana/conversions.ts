import { BN } from '@coral-xyz/anchor';
import { BASE_SCALE, PRICE_SCALE } from './constants';

function toBn(value: BN | number | bigint): BN {
  return BN.isBN(value) ? value : new BN(value);
}

export function toPriceUnits(value: number): BN {
  return new BN(Math.round(value * PRICE_SCALE));
}

export function fromPriceUnits(value: BN | number | bigint): number {
  return Number(toBn(value).toString()) / PRICE_SCALE;
}

export function toBaseUnits(value: number): BN {
  return new BN(Math.round(value * BASE_SCALE));
}

export function fromBaseUnits(value: BN | number | bigint): number {
  return Number(toBn(value).toString()) / BASE_SCALE;
}

export const toUsdcUnits = toBaseUnits;
export const fromUsdcUnits = fromBaseUnits;
