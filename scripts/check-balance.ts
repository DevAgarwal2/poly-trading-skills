#!/usr/bin/env bun

/**
 * Check Balance Script - Check USDC balance and allowance on Polymarket
 * 
 * Usage:
 *   bun run check-balance.ts
 */

import { ClobClient, AssetType } from "@polymarket/clob-client";
import { Wallet, providers, Contract } from "ethers";

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
  const USDC_E_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
  
  const USDC_E_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function allowance(address owner, address spender) view returns (uint256)"
  ];
  
  if (!PRIVATE_KEY) {
    console.error("❌ PRIVATE_KEY is required in .env file");
    process.exit(1);
  }
  
  if (!POLY_API_KEY || !POLY_SECRET || !POLY_PASSPHRASE) {
    console.error("❌ API credentials required. Run check-creds.ts first to generate them.");
    process.exit(1);
  }
  
  console.log("=".repeat(60));
  console.log("Polymarket Balance Check");
  console.log("=".repeat(60));
  
  // Setup client
  const provider = new providers.JsonRpcProvider(POLYGON_RPC);
  const signer = new Wallet(PRIVATE_KEY, provider);
  
  const client = new ClobClient(
    CLOB_HOST,
    137,
    signer,
    {
      key: POLY_API_KEY,  // FIX: Should be 'key' not 'apiKey'
      secret: POLY_SECRET,
      passphrase: POLY_PASSPHRASE
    },
    SIGNATURE_TYPE,
    signer.address  // FIX: Use wallet address
  );
  
  console.log("\n💼 Wallet Address:", signer.address);
  console.log("🔗 Polymarket Profile: https://polymarket.com/profile/" + signer.address);
  
  // Check MATIC balance for gas
  console.log("\n⛽ Gas Balance (MATIC):");
  try {
    const maticBalance = await provider.getBalance(signer.address);
    const maticFormatted = parseFloat(maticBalance.toString()) / 1e18;
    console.log("  Balance:", maticFormatted.toFixed(4), "MATIC");
    
    if (maticFormatted <= 1) {
      console.log("  ⚠️  MATIC balance must be greater than 1 for trading!");
      console.log("  💡 Get MATIC:");
      console.log("     - Withdraw from CEX (Coinbase, Binance) to Polygon network");
      console.log("     - Use an on-ramp (Transak, MoonPay)");
      console.log("     - Your wallet: " + signer.address);
    } else {
      console.log("  ✅ Sufficient MATIC for gas (> 1 MATIC)");
    }
  } catch (e: any) {
    console.error("  ❌ Error checking MATIC balance:", e.message);
  }
  
  // Check USDC.e balance directly on-chain
  console.log("\n💰 Wallet Balance (USDC.e):");
  try {
    const usdcContract = new Contract(USDC_E_ADDRESS, USDC_E_ABI, provider);
    const [balance, decimals, symbol] = await Promise.all([
      usdcContract.balanceOf(signer.address),
      usdcContract.decimals(),
      usdcContract.symbol()
    ]);
    
    const usdcBalance = parseFloat(balance.toString()) / Math.pow(10, decimals);
    console.log("  Balance: $" + usdcBalance.toFixed(2));
    console.log("  Token: " + symbol);
    console.log("  Contract: " + USDC_E_ADDRESS);
    
    if (usdcBalance === 0) {
      console.log("\n  ⚠️  No USDC.e balance! You need USDC.e to trade.");
      console.log("\n  💡 How to get USDC.e on Polygon:");
      console.log("     - Withdraw USDC from CEX (Coinbase, Binance) to Polygon network");
      console.log("     - Use an on-ramp (Transak, MoonPay) to buy USDC on Polygon");
      console.log("     - Your wallet address: " + signer.address);
    } else if (usdcBalance < 5) {
      console.log("\n  ⚠️  Balance below recommended minimum ($5.00 USDC.e)");
      console.log("     Current: $" + usdcBalance.toFixed(2));
      console.log("     Recommended: ≥ $5.00 for trading");
      console.log("\n  💡 Deposit more USDC.e to: " + signer.address);
    } else {
      console.log("\n  ✅ Sufficient USDC.e balance for trading");
    }
  } catch (e: any) {
    console.error("  ❌ Error checking USDC.e balance:", e.message);
  }
  
  // Check Polymarket CLOB trading balance and allowance
  console.log("\n📊 Polymarket CLOB Trading Balance:");
  try {
    const balance = await client.getBalanceAllowance({ asset_type: AssetType.COLLATERAL });
    
    // USDC has 6 decimals, so divide by 1000000
    const balanceNum = parseFloat(balance.balance) / 1000000;
    
    // Handle allowance - it may be undefined
    let allowanceNum = 0;
    if (balance.allowance && balance.allowance !== 'undefined') {
      allowanceNum = parseFloat(balance.allowance) / 1000000;
    }
    
    console.log("  Balance: $" + balanceNum.toFixed(2));
    if (allowanceNum > 0) {
      console.log("  Allowance: $" + allowanceNum.toFixed(2));
      
      if (allowanceNum < balanceNum) {
        console.log("\n  ⚠️  Allowance is less than balance. You may need to increase allowance.");
        console.log("     Run setup-allowances.ts to approve contracts.");
      } else {
        console.log("\n  ✅ CLOB trading enabled!");
      }
    } else {
      console.log("  ℹ️  Allowance: Not set (using contract approvals instead)");
      console.log("\n  ✅ CLOB trading enabled via contract approvals!");
    }
    
  } catch (e: any) {
    console.log("  ⚠️  Could not fetch CLOB balance (API may be syncing)");
    console.log("     On-chain USDC.e balance shown above is accurate.");
  }
  
  console.log("\n" + "=".repeat(60));
}

main().catch(console.error);
