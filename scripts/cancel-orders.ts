#!/usr/bin/env bun

/**
 * Cancel Orders Script - Cancel orders on Polymarket
 * 
 * Usage:
 *   bun run cancel-orders.ts [--order <ORDER_ID>] [--all] [--market <MARKET_ID>]
 * 
 * Examples:
 *   # Cancel specific order
 *   bun run cancel-orders.ts --order "0x38a73eed1e6d177545e9ab027abddfb7e08dbe975fa777123b1752d203d6ac88"
 * 
 *   # Cancel all orders
 *   bun run cancel-orders.ts --all
 * 
 *   # Cancel all orders in a specific market
 *   bun run cancel-orders.ts --market "0xbd31dc8a20211944f6b70f31557f1001557b59905b7738480ca09bd4532f84af"
 */

import { ClobClient } from "@polymarket/clob-client";
import { Wallet, providers } from "ethers";

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed: any = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.replace('--', '');
      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        parsed[key] = args[i + 1];
        i++;
      } else {
        parsed[key] = true;
      }
    }
  }
  
  return parsed;
}

async function main() {
  const args = parseArgs();
  
  // Validate arguments
  if (!args.order && !args.all && !args.market) {
    console.error("❌ Missing required arguments");
    console.log("Usage:");
    console.log("  Cancel specific order:  bun run cancel-orders.ts --order <ORDER_ID>");
    console.log("  Cancel all orders:      bun run cancel-orders.ts --all");
    console.log("  Cancel market orders:   bun run cancel-orders.ts --market <MARKET_ID>");
    process.exit(1);
  }
  
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
  console.log("Polymarket Cancel Orders");
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
  
  try {
    let response;
    
    if (args.order) {
      // Cancel specific order
      console.log("\n🚫 Canceling order:", args.order);
      response = await client.cancelOrder({ orderID: args.order });
      
    } else if (args.all) {
      // Cancel all orders
      console.log("\n🚫 Canceling ALL orders...");
      console.log("⚠️  This will cancel every active order!");
      
      // Get count first
      const orders = await client.getOpenOrders();
      console.log(`   Found ${orders.length} active order(s)`);
      
      response = await client.cancelAll();
      
    } else if (args.market) {
      // Cancel orders in specific market
      console.log("\n🚫 Canceling orders in market:", args.market);
      
      // Get count first
      const orders = await client.getOpenOrders();
      console.log(`   Found ${orders.length} active order(s) in this market`);
      
      response = await client.cancelMarketOrders({
        market: args.market
      });
    }
    
    // Display results
    console.log("\n" + "=".repeat(60));
    console.log("✅ CANCEL REQUEST COMPLETED");
    console.log("=".repeat(60));
    
    if (response.canceled && response.canceled.length > 0) {
      console.log(`\n✅ Successfully Canceled (${response.canceled.length}):`);
      response.canceled.forEach((orderId: string, i: number) => {
        console.log(`   ${i + 1}. ${orderId}`);
      });
    } else {
      console.log("\n❌ No orders were canceled");
    }
    
    if (response.not_canceled && Object.keys(response.not_canceled).length > 0) {
      console.log(`\n⚠️  Failed to Cancel (${Object.keys(response.not_canceled).length}):`);
      Object.entries(response.not_canceled).forEach(([orderId, reason], i) => {
        console.log(`   ${i + 1}. ${orderId}`);
        console.log(`      Reason: ${reason}`);
      });
    }
    
    console.log("\n" + "=".repeat(60));
    
  } catch (e: any) {
    console.error("\n❌ Cancel failed:", e.message);
    if (e.response?.data) {
      console.error("  Details:", JSON.stringify(e.response.data, null, 2));
    }
    process.exit(1);
  }
}

main().catch(console.error);
