#!/usr/bin/env bun

/**
 * Send USDC from Solana to Bridge Address
 * 
 * Usage:
 *   bun run scripts/send-solana-usdc.ts
 * 
 * Sends 2 USDC from your Solana wallet to the bridge deposit address.
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  createTransferInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import bs58 from "bs58";

const SOLANA_RPC = "https://api.mainnet-beta.solana.com";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"; // USDC on Solana
const BRIDGE_ADDRESS = "FKxyytNAYZRAZt86hgGQLmdShrgwtsLDxgSLdH9KRoT7"; // Generated deposit address
const AMOUNT_USDC = 2; // Amount to send

async function main() {
  console.log("=".repeat(60));
  console.log("Sending USDC from Solana to Bridge");
  console.log("=".repeat(60));

  // Get Solana private key from env
  const SOLANA_PRIVATE_KEY = process.env.SOLANA_PRIVATE_KEY;
  if (!SOLANA_PRIVATE_KEY) {
    console.error("\n❌ SOLANA_PRIVATE_KEY is required in .env file");
    console.log("Add it to your .env file:");
    console.log("SOLANA_PRIVATE_KEY=your_solana_private_key");
    process.exit(1);
  }

  try {
    // Decode base58 private key
    const privateKeyBytes = bs58.decode(SOLANA_PRIVATE_KEY);
    const keypair = Keypair.fromSecretKey(privateKeyBytes);
    const senderPublicKey = keypair.publicKey;

    console.log("\n💼 Sender Wallet:", senderPublicKey.toString());
    console.log("📍 Bridge Address:", BRIDGE_ADDRESS);
    console.log("💰 Amount:", AMOUNT_USDC, "USDC");

    // Connect to Solana
    const connection = new Connection(SOLANA_RPC, "confirmed");
    console.log("\n🔗 Connecting to Solana mainnet...");

    // Check SOL balance for fees
    const solBalance = await connection.getBalance(senderPublicKey);
    console.log("⛽ SOL Balance:", (solBalance / LAMPORTS_PER_SOL).toFixed(4), "SOL");

    if (solBalance < 0.001 * LAMPORTS_PER_SOL) {
      console.error("\n❌ Insufficient SOL for transaction fees");
      console.log("You need at least 0.001 SOL to pay for transaction fees");
      process.exit(1);
    }

    // Get USDC token accounts
    const usdcMint = new PublicKey(USDC_MINT);
    const recipientPublicKey = new PublicKey(BRIDGE_ADDRESS);

    console.log("\n📊 Checking USDC token accounts...");

    // Get sender's USDC token account
    const senderTokenAccount = await getAssociatedTokenAddress(
      usdcMint,
      senderPublicKey
    );

    console.log("  Sender ATA:", senderTokenAccount.toString());

    // Check if recipient token account exists, create if needed
    console.log("  Checking recipient token account...");
    const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair, // payer
      usdcMint,
      recipientPublicKey
    );

    console.log("  Recipient ATA:", recipientTokenAccount.address.toString());
    if (recipientTokenAccount.created) {
      console.log("  ✅ Created new token account for recipient");
    } else {
      console.log("  ✅ Recipient token account already exists");
    }

    // Check sender's USDC balance
    try {
      const tokenAccountInfo = await connection.getTokenAccountBalance(senderTokenAccount);
      const balance = parseFloat(tokenAccountInfo.value.amount) / 1e6;
      console.log("\n💰 USDC Balance:", balance.toFixed(6), "USDC");

      if (balance < AMOUNT_USDC) {
        console.error("\n❌ Insufficient USDC balance");
        console.log("Required:", AMOUNT_USDC, "USDC");
        console.log("Available:", balance.toFixed(6), "USDC");
        process.exit(1);
      }
    } catch (error) {
      console.error("\n❌ Could not find USDC token account");
      console.log("Make sure you have USDC in your wallet");
      process.exit(1);
    }

    // Create transfer instruction
    const amountBaseUnits = AMOUNT_USDC * 1e6;
    
    console.log("\n📝 Creating transaction...");
    const transferInstruction = createTransferInstruction(
      senderTokenAccount,
      recipientTokenAccount.address,
      senderPublicKey,
      amountBaseUnits,
      [],
      TOKEN_PROGRAM_ID
    );

    // Create and send transaction
    const transaction = new Transaction().add(transferInstruction);
    
    console.log("📤 Sending transaction...");
    console.log("  Amount:", AMOUNT_USDC, "USDC (", amountBaseUnits, "base units)");
    
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [keypair],
      {
        commitment: "confirmed",
      }
    );

    console.log("\n" + "=".repeat(60));
    console.log("✅ Transaction Sent Successfully!");
    console.log("=".repeat(60));
    console.log("\n🔑 Transaction Signature:");
    console.log("  ", signature);
    console.log("\n🔗 View on Solana Explorer:");
    console.log("  https://solscan.io/tx/", signature);
    console.log("\n⏱️  Next Steps:");
    console.log("  1. Wait for Solana confirmation (usually instant)");
    console.log("  2. Bridge will detect the deposit automatically");
    console.log("  3. Monitor transaction on Solana Explorer");
    console.log("\n📍 Expected Timeline:");
    console.log("  • Solana confirmation: ~5-15 seconds");
    console.log("  • Bridge processing: ~30 seconds - 2 minutes");
    console.log("  • USDC.e on Polygon: ~2-3 minutes total");
    console.log("\n💰 You will receive: ~1.98 USDC.e on Polygon");
    console.log("=".repeat(60));

  } catch (error: any) {
    console.error("\n❌ Error sending transaction:", error.message);
    if (error.message.includes("insufficient funds")) {
      console.log("\n💡 You need SOL for transaction fees. Get some SOL first.");
    } else if (error.message.includes("TokenAccountNotFoundError")) {
      console.log("\n💡 Your USDC token account was not found. Make sure you have USDC.");
    }
    process.exit(1);
  }
}

main().catch(console.error);
