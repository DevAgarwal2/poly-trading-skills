#!/usr/bin/env bun

import { ClobClient } from "@polymarket/clob-client";
import { Wallet, providers, Contract } from "ethers";

// Load environment variables from .env file
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const POLYGON_RPC = process.env.POLYGON_RPC || "https://polygon-rpc.com";
const CLOB_HOST = process.env.CLOB_HOST || "https://clob.polymarket.com";
const CTF_EXCHANGE_ADDRESS = process.env.CTF_EXCHANGE_ADDRESS;
const SIGNATURE_TYPE = parseInt(process.env.SIGNATURE_TYPE || "0");

const POLY_ADDRESS = process.env.POLY_ADDRESS;
const POLY_API_KEY = process.env.POLY_API_KEY;
const POLY_SECRET = process.env.POLY_SECRET;
const POLY_PASSPHRASE = process.env.POLY_PASSPHRASE;

const USDC_E_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";

const USDC_E_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

if (!PRIVATE_KEY) {
  console.error("ERROR: PRIVATE_KEY is required in .env file");
  process.exit(1);
}

async function main() {
  console.log("=".repeat(60));
  console.log("Polymarket Credential Checker & Setup");
  console.log("=".repeat(60));
  
  const provider = new providers.JsonRpcProvider(POLYGON_RPC);
  const signer = new Wallet(PRIVATE_KEY!, provider);
  console.log("\n✓ Wallet Address:", signer.address);
  console.log("✓ Signature Type:", SIGNATURE_TYPE);

  // Step 1: Check balance first
  console.log("\n" + "-".repeat(60));
  console.log("STEP 1: Checking wallet balance...");
  console.log("-".repeat(60));
  
  try {
    const balance = await provider.getBalance(signer.address);
    const maticBalance = parseFloat(balance.toString()) / 1e18;
    console.log("✓ MATIC Balance:", maticBalance.toFixed(4), "MATIC");
    
    if (maticBalance <= 1) {
      console.log("⚠️  WARNING: MATIC balance must be greater than 1 to trade!");
      console.log("   Current:", maticBalance.toFixed(4), "MATIC");
      console.log("   Required: > 1 MATIC for gas fees");
      console.log("\n   💡 How to get MATIC:");
      console.log("      - Withdraw from CEX (Coinbase, Binance, etc.) to Polygon network");
      console.log("      - Use an on-ramp (Transak, MoonPay, etc.)");
      console.log("      - Your wallet address:", signer.address);
    } else {
      console.log("✓ MATIC balance sufficient for trading (> 1 MATIC)");
    }
  } catch (e: any) {
    console.log("✗ Balance check failed:", e.message);
  }

  // Step 2: Try to create or derive API credentials
  console.log("\n" + "-".repeat(60));
  console.log("STEP 2: Creating/Deriving API credentials...");
  console.log("-".repeat(60));
  
  const client1 = new ClobClient(CLOB_HOST, 137, signer);

  try {
    const derived = await client1.createOrDeriveApiKey();
    console.log("\n✓ API Credentials successfully created/derived:");
    console.log("  API Key:", derived.key);
    console.log("  Secret:", derived.secret);
    console.log("  Passphrase:", derived.passphrase);
    console.log("\n⚠️  IMPORTANT: Add these to your .env file!");
    console.log("  POLY_API_KEY=" + derived.key);
    console.log("  POLY_SECRET=" + derived.secret);
    console.log("  POLY_PASSPHRASE=" + derived.passphrase);
  } catch (e: any) {
    console.log("✗ API key creation/derivation failed:", e.message);
  }

  // Step 3: Test with existing credentials (if available)
  if (POLY_API_KEY && POLY_SECRET && POLY_PASSPHRASE) {
    console.log("\n" + "-".repeat(60));
    console.log("STEP 3: Testing existing credentials from .env...");
    console.log("-".repeat(60));
    
    const client2 = new ClobClient(
      CLOB_HOST,
      137,
      signer,
      { key: POLY_API_KEY, secret: POLY_SECRET, passphrase: POLY_PASSPHRASE },
      SIGNATURE_TYPE,
      CTF_EXCHANGE_ADDRESS
    );

    try {
      const usdcContract = new Contract(USDC_E_ADDRESS, USDC_E_ABI, provider);
      const [balance, decimals, symbol] = await Promise.all([
        usdcContract.balanceOf(signer.address),
        usdcContract.decimals(),
        usdcContract.symbol()
      ]);
      
      const usdcBalance = parseFloat(balance.toString()) / Math.pow(10, decimals);
      console.log("\n✓ USDC.e Balance (from contract):");
      console.log("  Balance: $" + usdcBalance.toFixed(2));
      console.log("  Token: " + symbol);
      console.log("  Contract: " + USDC_E_ADDRESS);
      
      if (usdcBalance < 5) {
        console.log("\n⚠️  WARNING: USDC.e balance must be at least $5 to trade!");
        console.log("   Current: $" + usdcBalance.toFixed(2));
        console.log("   Required: ≥ $5.00 USDC.e");
        console.log("\n   💡 How to get USDC.e on Polygon:");
        console.log("      - Withdraw USDC from CEX (Coinbase, Binance) to Polygon network");
        console.log("      - Use an on-ramp to buy USDC on Polygon");
        console.log("      - Use a bridge service (your responsibility)");
        console.log("      - Your wallet address:", signer.address);
      } else {
        console.log("\n✓ USDC.e balance sufficient for trading (≥ $5.00)");
      }
    } catch (e: any) {
      console.log("✗ Balance check failed:", e.message);
    }

    try {
      const keys = await client2.getApiKeys();
      console.log("\n✓ API Keys retrieved:");
      console.log(JSON.stringify(keys, null, 2));
    } catch (e: any) {
      console.log("✗ Get API keys failed:", e.message);
    }
  } else {
    console.log("\n⚠️  Skipping Step 3: No existing credentials in .env file");
  }

  console.log("\n" + "=".repeat(60));
  console.log("Setup Complete!");
  console.log("=".repeat(60));
}

main().catch(console.error);
