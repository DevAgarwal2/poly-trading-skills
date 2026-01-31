#!/usr/bin/env bun

/**
 * Sell Script - Place sell orders on Polymarket
 * 
 * Usage:
 *   bun run sell.ts --token <TOKEN_ID> --price <PRICE> --size <SIZE> [--type market|limit]
 * 
 * ⚠️ ⚠️ ⚠️  CRITICAL WARNING - SIZE PARAMETER IS DIFFERENT FOR MARKET VS LIMIT! ⚠️ ⚠️ ⚠️ 
 * 
 * --size MEANS DIFFERENT THINGS:
 * 
 *   MARKET ORDERS (--type market):
 *     --size = DOLLAR VALUE OF SHARES TO SELL
 *     Example: --size 100 means "sell $100 worth" (you sell whatever shares that equals)
 * 
 *   LIMIT ORDERS (--type limit):
 *     --size = NUMBER OF SHARES TO SELL
 *     Example: --size 100 means "sell exactly 100 shares" (receives 100 × price)
 * 
 * ⚠️  RECOMMENDATION:
 *   - Want EXACT share count? → Use --type limit
 *   - Want to receive EXACT dollar amount? → Use --type market
 * 
 * Examples:
 *   # Market: Sell $100 worth at market price
 *   bun run sell.ts --token "71321..." --price 0.50 --size 100 --type market
 *   # Result: Sells $100 worth, ~200 shares ($100 ÷ 0.50)
 * 
 *   # Limit: Sell exactly 100 shares at 60¢
 *   bun run sell.ts --token "71321..." --price 0.60 --size 100 --type limit
 *   # Result: Sells 100 shares, total received = $60.00
 */

import { ClobClient, Side, OrderType, AssetType } from "@polymarket/clob-client";
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
  
  // Validate required arguments
  if (!args.token || !args.price || !args.size) {
    console.error("❌ Missing required arguments");
    console.log("Usage: bun run sell.ts --token <TOKEN_ID> --price <PRICE> --size <SIZE> [--type market|limit]");
    process.exit(1);
  }
  
  const tokenID = args.token;
  const price = parseFloat(args.price);
  const size = parseFloat(args.size);
  const orderType = args.type || "limit"; // default to limit
  
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
  console.log("Polymarket Sell Order");
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
  
  console.log("\n📊 Order Details:");
  console.log("  Wallet:", signer.address);
  console.log("  🔗 Profile: https://polymarket.com/profile/" + signer.address);
  console.log("  Token ID:", tokenID);
  console.log("  Side: SELL");
  console.log("  Type:", orderType.toUpperCase());
  console.log("  Price:", `${(price * 100).toFixed(1)}¢ ($${price.toFixed(2)})`);
  console.log("  Size:", size, "shares");
  
  // Get market prices (ASK/BID) for reference
  console.log("\n📈 Fetching current market prices...");
  try {
    // Fetch BID price (buyers willing to buy - for instant SELL)
    const bidRes = await fetch(`${CLOB_HOST}/price?side=BUY&token_id=${tokenID}`);
    const { price: bidPrice } = await bidRes.json();
    const bid = parseFloat(bidPrice);
    
    // Fetch ASK price (sellers willing to sell - for setting limit above)
    const askRes = await fetch(`${CLOB_HOST}/price?side=SELL&token_id=${tokenID}`);
    const { price: askPrice } = await askRes.json();
    const ask = parseFloat(askPrice);
    
    // Fetch midpoint for reference
    const midpointRes = await fetch(`${CLOB_HOST}/midpoint?token_id=${tokenID}`);
    const { mid } = await midpointRes.json();
    const midpoint = parseFloat(mid);
    
    console.log(`  📊 Market Orderbook:`);
    console.log(`     BID (instant sell): ${(bid * 100).toFixed(1)}¢ ($${bid.toFixed(2)})`);
    console.log(`     ASK (limit order): ${(ask * 100).toFixed(1)}¢ ($${ask.toFixed(2)})`);
    console.log(`     Midpoint: ${(midpoint * 100).toFixed(1)}¢ ($${midpoint.toFixed(2)})`);
    console.log(`     Spread: ${((ask - bid) * 100).toFixed(1)}¢`);
    
    console.log(`\n  💡 Trading Tips:`);
    console.log(`     • For INSTANT execution: Use MARKET order at ${(bid * 100).toFixed(1)}¢`);
    console.log(`     • For BETTER price: Use LIMIT order at ${(ask * 100).toFixed(1)}¢ or higher`);
    
    if (orderType === "limit") {
      if (price <= bid) {
        console.log(`\n  ⚠️  Your limit price (${(price * 100).toFixed(1)}¢) is at/below BID (${(bid * 100).toFixed(1)}¢)`);
        console.log(`     This will likely execute immediately as a market order.`);
      } else if (price <= ask) {
        console.log(`\n  ✅ Your limit price (${(price * 100).toFixed(1)}¢) is between BID-ASK`);
        console.log(`     Order may execute partially or wait for buyers.`);
      } else {
        console.log(`\n  📋 Your limit price (${(price * 100).toFixed(1)}¢) is above ASK (${(ask * 100).toFixed(1)}¢)`);
        console.log(`     Order will rest on the book waiting for buyers at your price.`);
      }
    } else {
      console.log(`\n  ⚡ Market order will execute at ~${(bid * 100).toFixed(1)}¢ (current BID)`);
    }
  } catch (e: any) {
    console.log("  ⚠️ Could not fetch market prices:", e.message);
  }
  
  // Place order
  console.log("\n📤 Placing order...");
  try {
    let order;
    let response;
    
    if (orderType === "market") {
      // Market order (FOK - Fill or Kill)
      console.log("  Creating market sell order for " + size + " shares");
      order = await client.createMarketOrder({
        side: Side.SELL,
        tokenID: tokenID,
        amount: size, // Number of shares for market sells
        price: price, // Price hint
      });
      response = await client.postOrder(order, OrderType.FOK);
    } else {
      // Limit order (GTC - Good Till Cancelled)
      console.log("  Creating limit sell order for " + size + " shares at $" + price);
      response = await client.createAndPostOrder({
        tokenID: tokenID,
        price: price,
        size: size,
        side: Side.SELL,
      });
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("✅ ORDER PLACED SUCCESSFULLY!");
    console.log("=".repeat(60));
    console.log("  Order ID:", response.orderID);
    console.log("  Success:", response.success);
    
    if (response.status) {
      console.log("  Status:", response.status);
    }
    
    if (response.errorMsg) {
      console.log("  Message:", response.errorMsg);
    }
    
    // Check if order is scoring for rewards
    if (orderType === "limit") {
      console.log("\n⏳ Checking if order is scoring for rewards...");
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      try {
        const scoring = await client.isOrderScoring({ order_id: response.orderID });
        console.log("  Scoring:", scoring.scoring ? "✅ YES" : "❌ NO");
      } catch (e: any) {
        console.log("  ⚠️ Could not check scoring:", e.message);
      }
    }
    
    console.log("\n" + "=".repeat(60));
    
  } catch (e: any) {
    console.error("\n❌ Order failed:", e.message);
    if (e.response?.data) {
      console.error("  Details:", JSON.stringify(e.response.data, null, 2));
    }
    process.exit(1);
  }
}

main().catch(console.error);
