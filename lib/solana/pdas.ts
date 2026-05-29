import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { SOLPERPS_PROGRAM_ID } from './constants';
import { Side } from '../types';

const seed = (value: string) => Buffer.from(value);

export function exchangePda() {
  return PublicKey.findProgramAddressSync([seed('exchange')], SOLPERPS_PROGRAM_ID);
}

export function insuranceVaultPda() {
  return PublicKey.findProgramAddressSync([seed('insurance_vault')], SOLPERPS_PROGRAM_ID);
}

export function marketPda(symbol: string) {
  return PublicKey.findProgramAddressSync([seed('market'), Buffer.from(symbol)], SOLPERPS_PROGRAM_ID);
}

export function traderPda(owner: PublicKey) {
  return PublicKey.findProgramAddressSync([seed('trader'), owner.toBuffer()], SOLPERPS_PROGRAM_ID);
}

export function traderVaultPda(owner: PublicKey) {
  return PublicKey.findProgramAddressSync([seed('trader_vault'), owner.toBuffer()], SOLPERPS_PROGRAM_ID);
}

export function positionPda(owner: PublicKey, market: PublicKey, side: Side) {
  const sideByte = side === Side.Long ? 0 : 1;
  return PublicKey.findProgramAddressSync(
    [seed('position'), owner.toBuffer(), market.toBuffer(), Buffer.from([sideByte])],
    SOLPERPS_PROGRAM_ID
  );
}

export function orderPda(market: PublicKey, orderId: BN) {
  return PublicKey.findProgramAddressSync(
    [seed('order'), market.toBuffer(), orderId.toArrayLike(Buffer, 'le', 8)],
    SOLPERPS_PROGRAM_ID
  );
}

export function oraclePda(market: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [seed('oracle'), market.toBuffer()],
    SOLPERPS_PROGRAM_ID
  );
}
