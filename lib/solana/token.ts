import { Transaction } from '@solana/web3.js';
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import type { Connection, PublicKey } from '@solana/web3.js';
import type { WalletContextState } from '@solana/wallet-adapter-react';

export async function getOrCreateAssociatedTokenAccount(params: {
  connection: Connection;
  wallet: WalletContextState;
  mint: PublicKey;
}): Promise<PublicKey> {
  const { connection, wallet, mint } = params;
  if (!wallet.publicKey) {
    throw new Error('Wallet not connected');
  }

  const ata = await getAssociatedTokenAddress(
    mint,
    wallet.publicKey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  const info = await connection.getAccountInfo(ata);
  if (!info) {
    const tx = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        ata,
        wallet.publicKey,
        mint,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
    const signature = await wallet.sendTransaction(tx, connection);
    await connection.confirmTransaction(signature, 'confirmed');
  }

  return ata;
}
