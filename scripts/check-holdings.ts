#!/usr/bin/env bun

/**
 * Check Holdings Script - View your current positions/holdings on Polymarket
 * 
 * Usage:
 *   bun run check-holdings.ts
 */

import { ClobClient, AssetType } from "@polymarket/clob-client";
import { Wallet, providers } from "ethers";

async function main() {
  // Load environment variables
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  const POLYGON_RPC = process.env.POLYGON_RPC || "https://polygon-rpc.com";
  const CLOB_HOST = process.env.CLOB_HOST || "https://clob.polymarket.com";
  const CTF_EXCHANGE_ADDRESS = process.env.CTF_EXCHANGE_ADDRESS || "0xFdb77a4fD16E1418856f45D53d0DB9C17c4ea5E9";
  const SIGNATURE_TYPE = parseInt(process.env.SIGNATURE_TYPE || "0");
  
  const POLY_API_KEY = process.env.POLY_API_KEY;
  const POLY_SECRET = process.env.POLY_SECRET;
  const POLY_PASSPHRASE = process.env.POLY_PASSPHRASE;
  
  if (!PRIVATE_KEY) {
    console.error("❌ PRIVATE_KEY is required in .env file");
    process.exit(1);
  }
  
  if (!POLY_API_KEY || !POLY_SECRET || !POLY_PASSPHRASE) {
    console.error("❌ API credentials required. Run check-creds.ts first to generate them.");
    process.exit(1);
  }
  
  console.log("=".repeat(60));
  console.log("Polymarket Holdings / Positions");
  console.log("=".repeat(60));
  
  // Setup client
  const provider = new providers.JsonRpcProvider(POLYGON_RPC);
  const signer = new Wallet(PRIVATE_KEY, provider);
  
  const client = new ClobClient(
    CLOB_HOST,
    137,
    signer,
    {
      key: POLY_API_KEY,
      secret: POLY_SECRET,
      passphrase: POLY_PASSPHRASE
    },
    SIGNATURE_TYPE,
    signer.address
  );
  
  console.log("\n💼 Wallet Address:", signer.address);
  console.log("🔗 Polymarket Profile: https://polymarket.com/profile/" + signer.address);
  
  // Get all positions
  console.log("\n📊 Fetching your positions...\n");
  try {
    const balance = await client.getBalanceAllowance({ asset_type: AssetType.COLLATERAL });
    
    // USDC has 6 decimals, so divide by 1000000
    const balanceNum = parseFloat(balance.balance) / 1000000;
    
    // Handle allowance - it may be undefined
    let allowanceNum = 0;
    if (balance.allowance && balance.allowance !== 'undefined') {
      allowanceNum = parseFloat(balance.allowance) / 1000000;
    }
    
    console.log("  💰 USDC Balance: $" + balanceNum.toFixed(2));
    if (allowanceNum > 0) {
      console.log("  💰 USDC Allowance: $" + allowanceNum.toFixed(2));
    }
    console.log("\n" + "=".repeat(60));
    
  } catch (e: any) {
    console.error("  ❌ Error fetching balance:", e.message);
  }
  
  console.log("=".repeat(60));
}

main().catch(console.error);
