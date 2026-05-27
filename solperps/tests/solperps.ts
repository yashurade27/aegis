import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  createMint,
  createAccount,
  mintTo,
  getAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { expect } from "chai";
import { Solperps } from "../target/types/solperps";

describe("solperps", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Solperps as Program<Solperps>;
  const admin = (provider.wallet as anchor.Wallet).payer;

  let usdcMint: PublicKey;
  let adminTokenAccount: PublicKey;
  let exchangePda: PublicKey;
  let insuranceVault: PublicKey;
  let solMarket: PublicKey;
  let ethMarket: PublicKey;
  let oraclePda: PublicKey;

  const PRICE = new anchor.BN(142_500_000); // $142.50 with 6 decimals
  const ONE_USDC = 1_000_000;

  before(async () => {
    usdcMint = await createMint(provider.connection, admin, admin.publicKey, null, 6);
    adminTokenAccount = await createAccount(provider.connection, admin, usdcMint, admin.publicKey);

    [exchangePda] = PublicKey.findProgramAddressSync([Buffer.from("exchange")], program.programId);
    [insuranceVault] = PublicKey.findProgramAddressSync(
      [Buffer.from("insurance_vault")],
      program.programId
    );

    await program.methods
      .initializeExchange()
      .accounts({
        admin: admin.publicKey,
        usdcMint,
        exchange: exchangePda,
        insuranceVault,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    [solMarket] = PublicKey.findProgramAddressSync(
      [Buffer.from("market"), Buffer.from("SOL-PERP")],
      program.programId
    );

    await program.methods
      .createMarket("SOL-PERP", "SOL", "USD", 10, 8000)
      .accounts({
        admin: admin.publicKey,
        exchange: exchangePda,
        market: solMarket,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    [ethMarket] = PublicKey.findProgramAddressSync(
      [Buffer.from("market"), Buffer.from("ETH-PERP")],
      program.programId
    );

    await program.methods
      .createMarket("ETH-PERP", "ETH", "USD", 10, 8000)
      .accounts({
        admin: admin.publicKey,
        exchange: exchangePda,
        market: ethMarket,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    [oraclePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("oracle"), solMarket.toBuffer()],
      program.programId
    );

    await program.methods
      .initializeOracle("SOL-PERP", PRICE)
      .accounts({
        admin: admin.publicKey,
        exchange: exchangePda,
        market: solMarket,
        oracle: oraclePda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  });

  it("initializes exchange and markets", async () => {
    const exchange = await program.account.exchange.fetch(exchangePda);
    expect(exchange.admin.toBase58()).to.equal(admin.publicKey.toBase58());
    expect(exchange.usdcMint.toBase58()).to.equal(usdcMint.toBase58());

    const market = await program.account.market.fetch(solMarket);
    expect(market.symbol).to.equal("SOL-PERP");
    expect(market.markPrice.toString()).to.equal(PRICE.toString());
  });

  it("deposits collateral and places/cancels a limit order", async () => {
    const trader = Keypair.generate();
    await provider.connection.requestAirdrop(trader.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    await new Promise((r) => setTimeout(r, 1000));

    const [traderAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("trader"), trader.publicKey.toBuffer()],
      program.programId
    );
    const [traderVault] = PublicKey.findProgramAddressSync(
      [Buffer.from("trader_vault"), trader.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .initializeTrader()
      .accounts({
        owner: trader.publicKey,
        exchange: exchangePda,
        traderAccount,
        traderVault,
        usdcMint,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([trader])
      .rpc();

    const traderTokenAccount = await createAccount(
      provider.connection,
      admin,
      usdcMint,
      trader.publicKey
    );
    await mintTo(provider.connection, admin, usdcMint, traderTokenAccount, admin, 10_000 * ONE_USDC);

    const depositAmount = new anchor.BN(5_000 * ONE_USDC);
    await program.methods
      .depositCollateral(depositAmount)
      .accounts({
        owner: trader.publicKey,
        exchange: exchangePda,
        traderAccount,
        traderVault,
        ownerTokenAccount: traderTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([trader])
      .rpc();

    const account = await program.account.traderAccount.fetch(traderAccount);
    expect(account.collateral.toString()).to.equal(depositAmount.toString());

    const market = await program.account.market.fetch(solMarket);
    const orderId = market.nextOrderId;

    const [restingOrder] = PublicKey.findProgramAddressSync(
      [Buffer.from("order"), solMarket.toBuffer(), orderId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const [takerPosition] = PublicKey.findProgramAddressSync(
      [Buffer.from("position"), trader.publicKey.toBuffer(), solMarket.toBuffer(), Buffer.from([0])],
      program.programId
    );

    const size = new anchor.BN(1_000_000); // 1 unit
    const limitPrice = new anchor.BN(140_000_000);

    await program.methods
      .placeOrder({ long: {} }, { limit: {} }, limitPrice, size, 5, orderId)
      .accounts({
        taker: trader.publicKey,
        market: solMarket,
        exchange: exchangePda,
        traderAccount,
        takerPosition,
        restingOrder,
        systemProgram: SystemProgram.programId,
      })
      .remainingAccounts([])
      .signers([trader])
      .rpc();

    const order = await program.account.order.fetch(restingOrder);
    expect(order.size.toString()).to.equal(size.toString());
    expect(order.price.toString()).to.equal(limitPrice.toString());

    await program.methods
      .cancelOrder(orderId)
      .accounts({
        trader: trader.publicKey,
        market: solMarket,
        traderAccount,
        order: restingOrder,
      })
      .signers([trader])
      .rpc();
  });

  it("matches a full fill between maker and taker", async () => {
    const maker = Keypair.generate();
    const taker = Keypair.generate();

    for (const kp of [maker, taker]) {
      await provider.connection.requestAirdrop(kp.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    }
    await new Promise((r) => setTimeout(r, 1500));

    async function setupTrader(kp: Keypair) {
      const [traderAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("trader"), kp.publicKey.toBuffer()],
        program.programId
      );
      const [traderVault] = PublicKey.findProgramAddressSync(
        [Buffer.from("trader_vault"), kp.publicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .initializeTrader()
        .accounts({
          owner: kp.publicKey,
          exchange: exchangePda,
          traderAccount,
          traderVault,
          usdcMint,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([kp])
        .rpc();

      const tokenAccount = await createAccount(provider.connection, admin, usdcMint, kp.publicKey);
      await mintTo(provider.connection, admin, usdcMint, tokenAccount, admin, 10_000 * ONE_USDC);

      await program.methods
        .depositCollateral(new anchor.BN(5_000 * ONE_USDC))
        .accounts({
          owner: kp.publicKey,
          exchange: exchangePda,
          traderAccount,
          traderVault,
          ownerTokenAccount: tokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([kp])
        .rpc();

      return { traderAccount, traderVault };
    }

    const makerAccounts = await setupTrader(maker);
    const takerAccounts = await setupTrader(taker);

    let market = await program.account.market.fetch(solMarket);
    const makerOrderId = market.nextOrderId;

    const [makerOrder] = PublicKey.findProgramAddressSync(
      [Buffer.from("order"), solMarket.toBuffer(), makerOrderId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const [makerPosition] = PublicKey.findProgramAddressSync(
      [Buffer.from("position"), maker.publicKey.toBuffer(), solMarket.toBuffer(), Buffer.from([1])],
      program.programId
    );

    const askPrice = new anchor.BN(142_000_000);
    const orderSize = new anchor.BN(500_000);

    await program.methods
      .placeOrder({ short: {} }, { limit: {} }, askPrice, orderSize, 5, makerOrderId)
      .accounts({
        taker: maker.publicKey,
        market: solMarket,
        exchange: exchangePda,
        traderAccount: makerAccounts.traderAccount,
        takerPosition: makerPosition,
        restingOrder: makerOrder,
        systemProgram: SystemProgram.programId,
      })
      .remainingAccounts([])
      .signers([maker])
      .rpc();

    market = await program.account.market.fetch(solMarket);
    const takerOrderId = market.nextOrderId;

    const [takerRestingOrder] = PublicKey.findProgramAddressSync(
      [Buffer.from("order"), solMarket.toBuffer(), takerOrderId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const [takerLongPosition] = PublicKey.findProgramAddressSync(
      [Buffer.from("position"), taker.publicKey.toBuffer(), solMarket.toBuffer(), Buffer.from([0])],
      program.programId
    );

    await program.methods
      .placeOrder({ long: {} }, { market: {} }, new anchor.BN(0), orderSize, 5, takerOrderId)
      .accounts({
        taker: taker.publicKey,
        market: solMarket,
        exchange: exchangePda,
        traderAccount: takerAccounts.traderAccount,
        takerPosition: takerLongPosition,
        restingOrder: takerRestingOrder,
        systemProgram: SystemProgram.programId,
      })
      .remainingAccounts([
        { pubkey: makerOrder, isWritable: true, isSigner: false },
        { pubkey: makerAccounts.traderAccount, isWritable: true, isSigner: false },
        { pubkey: makerPosition, isWritable: true, isSigner: false },
      ])
      .signers([taker])
      .rpc();

    const position = await program.account.position.fetch(takerLongPosition);
    expect(position.size.toString()).to.equal(orderSize.toString());
  });

  it("settles funding rate on the market", async () => {
    await program.methods
      .updateOracle(new anchor.BN(145_000_000))
      .accounts({
        authority: admin.publicKey,
        oracle: oraclePda,
        market: solMarket,
      })
      .rpc();

    const before = await program.account.market.fetch(solMarket);

    await program.methods
      .settleFunding()
      .accounts({ keeper: admin.publicKey, market: solMarket })
      .remainingAccounts([])
      .rpc();

    const after = await program.account.market.fetch(solMarket);
    expect(after.lastFundingTs.toNumber()).to.be.greaterThan(before.lastFundingTs.toNumber());
  });
});
