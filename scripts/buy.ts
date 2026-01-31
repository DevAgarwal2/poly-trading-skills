#!/usr/bin/env bun

/**
 * Buy Script - Place buy orders on Polymarket
 * 
 * Usage:
 *   bun run buy.ts --token <TOKEN_ID> --price <PRICE> --size <SIZE> [--type market|limit]
 * 
 * ⚠️ ⚠️ ⚠️  CRITICAL WARNING - SIZE PARAMETER IS DIFFERENT FOR MARKET VS LIMIT! ⚠️ ⚠️ ⚠️ 
 * 
 * --size MEANS DIFFERENT THINGS:
 * 
 *   MARKET ORDERS (--type market):
 *     --size = DOLLAR AMOUNT TO SPEND
 *     Example: --size 100 means "spend $100 USD" (you get whatever shares that buys)
 * 
 *   LIMIT ORDERS (--type limit):
 *     --size = NUMBER OF SHARES TO BUY
 *     Example: --size 100 means "buy exactly 100 shares" (costs 100 × price)
 * 
 * ⚠️  RECOMMENDATION:
 *   - Want EXACT share count? → Use --type limit
 *   - Want to spend EXACT dollar amount? → Use --type market
 * 
 * Examples:
 *   # Market: Spend $100 at market price
 *   bun run buy.ts --token "71321..." --price 0.50 --size 100 --type market
 *   # Result: Spends $100, buys ~200 shares (100 ÷ 0.50)
 * 
 *   # Limit: Buy exactly 100 shares at 50¢
 *   bun run buy.ts --token "71321..." --price 0.50 --size 100 --type limit
 *   # Result: Buys 100 shares, total cost = $50.00
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
    console.log("Usage: bun run buy.ts --token <TOKEN_ID> --price <PRICE> --size <SIZE> [--type market|limit]");
    process.exit(1);
  }
  
  const tokenID = args.token;
  const price = parseFloat(args.price);
  const size = parseFloat(args.size);
  const orderType = args.type || "limit"; // default to limit
  
  // Validate minimum order sizes
  if (orderType === "market") {
    // Market orders: minimum $1.00
    if (size < 1.0) {
      console.error("❌ Minimum order size for MARKET orders: $1.00");
      console.error(`   Your size: $${size.toFixed(2)}`);
      process.exit(1);
    }
  } else {
    // Limit orders: minimum 5 shares
    if (size < 5) {
      console.error("❌ Minimum order size for LIMIT orders: 5 shares");
      console.error(`   Your size: ${size} shares`);
      console.error(`   Please increase to at least 5 shares`);
      process.exit(1);
    }
    const totalValue = size * price;
    if (totalValue < 0.10) {
      console.error("❌ Minimum order value: $0.10");
      console.error(`   Your order value: $${totalValue.toFixed(2)} (${size} shares × $${price.toFixed(2)})`);
      console.error(`   Increase size or price to meet minimum`);
      process.exit(1);
    }
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
  console.log("Polymarket Buy Order");
  console.log("=".repeat(60));
  
  // ⚠️  CRITICAL SIZE WARNING
  if (orderType === "market") {
    console.log("\n⚠️ ⚠️ ⚠️  MARKET ORDER WARNING ⚠️ ⚠️ ⚠️");
    console.log("  --size for MARKET orders = DOLLAR AMOUNT");
    console.log(`  You will SPEND: $${size} USD`);
    console.log(`  You will GET: ~${(size / price).toFixed(0)} shares (at $${price.toFixed(2)}/share)`);
    console.log("  If you want EXACT share count, use --type limit instead!");
    console.log("=".repeat(60));
  } else {
    console.log("\n✅ LIMIT ORDER - Size = Share Count");
    console.log(`  You will BUY: ${size} shares`);
    console.log(`  You will SPEND: $${(size * price).toFixed(2)} USD (at $${price.toFixed(2)}/share)`);
    console.log("=".repeat(60));
  }
  
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
  console.log("  Side: BUY");
  console.log("  Type:", orderType.toUpperCase());
  console.log("  Price:", `${(price * 100).toFixed(1)}¢ ($${price.toFixed(2)})`);
  console.log("  Size:", size);
  
  // Check balance first
  console.log("\n💰 Checking balance...");
  try {
    const balance = await client.getBalanceAllowance({ asset_type: AssetType.COLLATERAL });
    
    // USDC has 6 decimals, so divide by 1000000
    const balanceNum = parseFloat(balance.balance) / 1000000;
    const requiredAmount = orderType === "market" ? size : (price * size);
    
    console.log("  Balance: $" + balanceNum.toFixed(2));
    console.log("  Required: $" + requiredAmount.toFixed(2));
    
    if (balanceNum < requiredAmount) {
      console.error("\n❌ Insufficient balance!");
      console.error(`  You need at least $${requiredAmount.toFixed(2)} but only have $${balanceNum.toFixed(2)}`);
      process.exit(1);
    }
    
    console.log("  ✅ Sufficient balance");
  } catch (e: any) {
    console.error("❌ Balance check failed:", e.message);
    process.exit(1);
  }
  
  // Get market prices (ASK/BID) for reference
  console.log("\n📈 Fetching current market prices...");
  try {
    // Fetch ASK price (sellers willing to sell - for instant BUY)
    const askRes = await fetch(`${CLOB_HOST}/price?side=SELL&token_id=${tokenID}`);
    const { price: askPrice } = await askRes.json();
    const ask = parseFloat(askPrice);
    
    // Fetch BID price (buyers willing to buy - for limit orders)
    const bidRes = await fetch(`${CLOB_HOST}/price?side=BUY&token_id=${tokenID}`);
    const { price: bidPrice } = await bidRes.json();
    const bid = parseFloat(bidPrice);
    
    // Fetch midpoint for reference
    const midpointRes = await fetch(`${CLOB_HOST}/midpoint?token_id=${tokenID}`);
    const { mid } = await midpointRes.json();
    const midpoint = parseFloat(mid);
    
    console.log(`  📊 Market Orderbook:`);
    console.log(`     ASK (instant buy): ${(ask * 100).toFixed(1)}¢ ($${ask.toFixed(2)})`);
    console.log(`     BID (limit order): ${(bid * 100).toFixed(1)}¢ ($${bid.toFixed(2)})`);
    console.log(`     Midpoint: ${(midpoint * 100).toFixed(1)}¢ ($${midpoint.toFixed(2)})`);
    console.log(`     Spread: ${((ask - bid) * 100).toFixed(1)}¢`);
    
    console.log(`\n  💡 Trading Tips:`);
    console.log(`     • For INSTANT execution: Use MARKET order at ${(ask * 100).toFixed(1)}¢`);
    console.log(`     • For BETTER price: Use LIMIT order at ${(bid * 100).toFixed(1)}¢ or lower`);
    
    if (orderType === "limit") {
      if (price >= ask) {
        console.log(`\n  ⚠️  Your limit price (${(price * 100).toFixed(1)}¢) is above ASK (${(ask * 100).toFixed(1)}¢)`);
        console.log(`     This will likely execute immediately as a market order.`);
      } else if (price >= bid) {
        console.log(`\n  ✅ Your limit price (${(price * 100).toFixed(1)}¢) is between BID-ASK`);
        console.log(`     Order may execute partially or wait for sellers.`);
      } else {
        console.log(`\n  📋 Your limit price (${(price * 100).toFixed(1)}¢) is below BID (${(bid * 100).toFixed(1)}¢)`);
        console.log(`     Order will rest on the book waiting for sellers.`);
      }
    } else {
      console.log(`\n  ⚡ Market order will execute at ~${(ask * 100).toFixed(1)}¢ (current ASK)`);
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
      console.log("  Creating market buy order for $" + size);
      order = await client.createMarketOrder({
        side: Side.BUY,
        tokenID: tokenID,
        amount: size, // Dollar amount for market buys
        price: price, // Price hint
      });
      response = await client.postOrder(order, OrderType.FOK);
    } else {
      // Limit order (GTC - Good Till Cancelled)
      console.log("  Creating limit buy order for " + size + " shares at $" + price);
      response = await client.createAndPostOrder({
        tokenID: tokenID,
        price: price,
        size: size,
        side: Side.BUY,
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
