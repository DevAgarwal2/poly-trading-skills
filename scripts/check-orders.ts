#!/usr/bin/env bun

/**
 * Check Orders Script - View your active orders on Polymarket
 * 
 * Usage:
 *   bun run check-orders.ts [--market <MARKET_ID>] [--token <TOKEN_ID>]
 * 
 * Examples:
 *   # Get all active orders
 *   bun run check-orders.ts
 * 
 *   # Get orders for specific market
 *   bun run check-orders.ts --market "0xbd31dc8a..."
 * 
 *   # Get orders for specific token
 *   bun run check-orders.ts --token "71321..."
 */

import { ClobClient } from "@polymarket/clob-client";
import { Wallet, providers } from "ethers";

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed: any = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    parsed[key] = value;
  }
  
  return parsed;
}

async function main() {
  const args = parseArgs();
  
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
  console.log("Polymarket Active Orders");
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
  
  // Build query parameters
  const queryParams: any = {};
  if (args.market) {
    queryParams.market = args.market;
    console.log("🔍 Filtering by market:", args.market);
  }
  if (args.token) {
    queryParams.asset_id = args.token;
    console.log("🔍 Filtering by token:", args.token.substring(0, 20) + "...");
  }
  
  // Get active orders
  console.log("\n📋 Fetching active orders...\n");
  try {
    const orders = await client.getOpenOrders();
    
    if (!orders || orders.length === 0) {
      console.log("  📭 No active orders found.");
      console.log("  💡 Place an order to get started!");
      console.log("\n" + "=".repeat(60));
      return;
    }
    
    console.log(`  Found ${orders.length} active order(s)\n`);
    
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      console.log(`  ${i + 1}. Order`);
      console.log("  " + "-".repeat(56));
      
      // Order ID
      console.log("     Order ID:", order.id);
      
      // Market/Token info
      if (order.market) {
        console.log("     Market:", order.market.substring(0, 20) + "...");
      }
      if (order.asset_id) {
        console.log("     Token ID:", order.asset_id.substring(0, 20) + "...");
      }
      
      // Order details
      console.log("     Side:", order.side);
      console.log("     Type:", order.order_type || "GTC");
      console.log("     Price:", `${(parseFloat(order.price) * 100).toFixed(1)}¢ ($${parseFloat(order.price).toFixed(2)})`);
      console.log("     Size:", order.original_size, "shares");
      
      // Matched size
      if (order.size_matched && parseFloat(order.size_matched) > 0) {
        const matched = parseFloat(order.size_matched);
        const total = parseFloat(order.original_size);
        const percentMatched = ((matched / total) * 100).toFixed(1);
        console.log("     Matched:", `${matched} / ${total} (${percentMatched}%)`);
      } else {
        console.log("     Matched: 0 shares");
      }
      
      // Status
      console.log("     Status:", order.status);
      
      // Outcome
      if (order.outcome) {
        console.log("     Outcome:", order.outcome);
      }
      
      // Created time
      if (order.created_at) {
        const createdDate = new Date(parseInt(order.created_at.toString()) * 1000);
        console.log("     Created:", createdDate.toLocaleString());
      }
      
      // Expiration
      if (order.expiration && order.expiration !== "0") {
        const expirationDate = new Date(parseInt(order.expiration) * 1000);
        console.log("     Expires:", expirationDate.toLocaleString());
      }
      
      // Check if scoring
      console.log("     Checking rewards...");
      try {
        const scoring = await client.isOrderScoring({ order_id: order.id });
        console.log("     Scoring:", scoring.scoring ? "✅ YES" : "❌ NO");
      } catch (e: any) {
        console.log("     Scoring: ⚠️ Could not check");
      }
      
      console.log("");
    }
    
    console.log("  " + "=".repeat(56));
    console.log(`  📊 Total Active Orders: ${orders.length}`);
    
    // Count by side
    const buyOrders = orders.filter(o => o.side === "BUY").length;
    const sellOrders = orders.filter(o => o.side === "SELL").length;
    console.log(`  📈 Buy Orders: ${buyOrders}`);
    console.log(`  📉 Sell Orders: ${sellOrders}`);
    console.log("");
    
  } catch (e: any) {
    console.error("  ❌ Error fetching orders:", e.message);
    process.exit(1);
  }
  
  console.log("=".repeat(60));
}

main().catch(console.error);
