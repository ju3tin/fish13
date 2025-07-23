"use client";

import { useState, useMemo } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Program, AnchorProvider, BN, Idl } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import idl from "../../../idl/idl1.json"; // Replace with path to your IDL

const programId = new PublicKey("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"); // Replace with your program ID

export default function Home() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [mintAddress, setMintAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [lockupPeriod, setLockupPeriod] = useState("oneMonth");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const program = useMemo(() => {
    if (!wallet) return null;
    const provider = new AnchorProvider(connection, wallet, {});
    return new Program(idl as unknown as Idl, programId, provider);
  }, [wallet, connection]);

  const initializePool = async () => {
    if (!program || !wallet) {
      setMessage("Please connect your wallet");
      return;
    }
    setIsLoading(true);
    try {
      const [pool] = await PublicKey.findProgramAddress(
        [Buffer.from("pool"), wallet.publicKey.toBuffer()],
        programId
      );
      await program.methods
        .initializePool([new PublicKey(mintAddress)])
        .accounts({
          pool,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      setMessage("Pool initialized successfully!");
    } catch (error) {
      setMessage(`Error initializing pool: ${error instanceof Error ? error.message : String(error)}`);
    }
    setIsLoading(false);
  };

  const stake = async () => {
    if (!program || !wallet) {
      setMessage("Please connect your wallet");
      return;
    }
    if (!amount || isNaN(Number(amount))) {
      setMessage("Please enter a valid amount");
      return;
    }
    setIsLoading(true);
    try {
      const [pool] = await PublicKey.findProgramAddress(
        [Buffer.from("pool"), wallet.publicKey.toBuffer()],
        programId
      );
      const [stakeAccount] = await PublicKey.findProgramAddress(
        [Buffer.from("stake"), wallet.publicKey.toBuffer(), pool.toBuffer()],
        programId
      );
      const [stakeVault] = await PublicKey.findProgramAddress(
        [Buffer.from("vault"), pool.toBuffer()],
        programId
      );

      const tokenMint = new PublicKey(mintAddress);
      const userTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        wallet.publicKey
      );

      await program.methods
        .stake(new BN(amount), { [lockupPeriod]: {} })
        .accounts({
          pool,
          stakeAccount,
          stakeVault,
          userTokenAccount,
          tokenMint,
          user: wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      setMessage(`Staked ${amount} tokens successfully!`);
    } catch (error) {
      setMessage(`Error staking: ${error instanceof Error ? error.message : String(error)}`);
    }
    setIsLoading(false);
  };

  const unstake = async () => {
    if (!program || !wallet) {
      setMessage("Please connect your wallet");
      return;
    }
    setIsLoading(true);
    try {
      const [pool] = await PublicKey.findProgramAddress(
        [Buffer.from("pool"), wallet.publicKey.toBuffer()],
        programId
      );
      const [stakeAccount] = await PublicKey.findProgramAddress(
        [Buffer.from("stake"), wallet.publicKey.toBuffer(), pool.toBuffer()],
        programId
      );
      const [stakeVault] = await PublicKey.findProgramAddress(
        [Buffer.from("vault"), pool.toBuffer()],
        programId
      );

      const tokenMint = new PublicKey(mintAddress);
      const userTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        wallet.publicKey
      );

      await program.methods
        .unstake()
        .accounts({
          pool,
          stakeAccount,
          stakeVault,
          userTokenAccount,
          user: wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();
      setMessage("Unstaked successfully!");
    } catch (error) {
      setMessage(`Error unstaking: ${error instanceof Error ? error.message : String(error)}`);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">Solana Staking Program</h1>
      <WalletMultiButton className="mb-6" />
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Initialize Pool</h2>
        <input
          type="text"
          value={mintAddress}
          onChange={(e) => setMintAddress(e.target.value)}
          placeholder="Token Mint Address"
          className="w-full p-2 mb-4 border rounded"
        />
        <button
          onClick={initializePool}
          disabled={isLoading}
          className="w-full bg-blue-500 text-white p-2 rounded disabled:bg-gray-400"
        >
          {isLoading ? "Processing..." : "Initialize Pool"}
        </button>

        <h2 className="text-xl font-semibold mt-6 mb-4">Stake Tokens</h2>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount to stake"
          className="w-full p-2 mb-4 border rounded"
        />
        <select
          value={lockupPeriod}
          onChange={(e) => setLockupPeriod(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        >
          <option value="oneMonth">1 Month (5% APY)</option>
          <option value="threeMonths">3 Months (15% APY)</option>
          <option value="sixMonths">6 Months (20% APY)</option>
          <option value="oneYear">1 Year (30% APY)</option>
        </select>
        <button
          onClick={stake}
          disabled={isLoading}
          className="w-full bg-green-500 text-white p-2 rounded disabled:bg-gray-400"
        >
          {isLoading ? "Processing..." : "Stake"}
        </button>

        <h2 className="text-xl font-semibold mt-6 mb-4">Unstake Tokens</h2>
        <button
          onClick={unstake}
          disabled={isLoading}
          className="w-full bg-red-500 text-white p-2 rounded disabled:bg-gray-400"
        >
          {isLoading ? "Processing..." : "Unstake"}
        </button>

        {message && (
          <p className="mt-4 text-center text-sm text-gray-700">{message}</p>
        )}
      </div>
    </div>
  );
}