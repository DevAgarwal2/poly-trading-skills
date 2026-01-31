# Polymarket Trading Strategies Guide

Common trading patterns and strategies for Polymarket prediction markets.

## Table of Contents

1. [Orderbook Strategies](#orderbook-strategies)
2. [Market Making](#market-making)
3. [Directional Trading](#directional-trading)
4. [Arbitrage](#arbitrage)
5. [Rewards Optimization](#rewards-optimization)
6. [Risk Management](#risk-management)

---

## Orderbook Strategies

Understanding ASK/BID prices is essential for successful trading on Polymarket.

### Understanding ASK, BID, and Midpoint

| Price | Meaning | For Buying | For Selling |
|-------|---------|-----------|-------------|
| **ASK** | Sellers' offer price | Execute here for instant buy | Reference only |
| **BID** | Buyers' bid price | Reference only | Execute here for instant sell |
| **Midpoint** | Average of ASK/BID | Not executable | Not executable |
| **Spread** | ASK - BID | Measure of liquidity | Measure of liquidity |

### Example Orderbook

```
Market: "Will Bitcoin hit $100k by end of year?"

YES Token:
  ASK: 45¢ (sellers offering) ← Buy at market
  BID: 43¢ (buyers bidding)  ← Sell at market
  Midpoint: 44¢
  Spread: 2¢

NO Token:
  ASK: 57¢ (sellers offering)
  BID: 55¢ (buyers bidding)
  Midpoint: 56¢
  Spread: 2¢
```

### Fetching Orderbook Prices

```typescript
async function getOrderbookPrices(tokenID: string) {
  // Get ASK (sellers willing to sell - for buying)
  const askRes = await fetch(
    `https://clob.polymarket.com/price?side=SELL&token_id=${tokenID}`
  );
  const { price: askPrice } = await askRes.json();
  
  // Get BID (buyers willing to buy - for selling)
  const bidRes = await fetch(
    `https://clob.polymarket.com/price?side=BUY&token_id=${tokenID}`
  );
  const { price: bidPrice } = await bidRes.json();
  
  // Get midpoint (reference)
  const midRes = await fetch(
    `https://clob.polymarket.com/midpoint?token_id=${tokenID}`
  );
  const { mid } = await midRes.json();
  
  const ask = parseFloat(askPrice);
  const bid = parseFloat(bidPrice);
  const midpoint = parseFloat(mid);
  const spread = ask - bid;
  
  console.log(`ASK: ${(ask * 100).toFixed(1)}¢`);
  console.log(`BID: ${(bid * 100).toFixed(1)}¢`);
  console.log(`Midpoint: ${(midpoint * 100).toFixed(1)}¢`);
  console.log(`Spread: ${(spread * 100).toFixed(1)}¢`);
  
  return { ask, bid, midpoint, spread };
}
```

### Strategy: Buy at BID, Sell at ASK

Place limit orders at current BID/ASK prices for better execution:

```typescript
async function placeOptimalOrders(
  client: ClobClient,
  tokenID: string,
  size: number
) {
  const { ask, bid } = await getOrderbookPrices(tokenID);
  
  // Buy limit order at BID (wait for sellers)
  const buyOrder = await client.createAndPostOrder({
    tokenID,
    price: bid,  // Same as current BID
    size,
    side: Side.BUY,
  });
  
  // Sell limit order at ASK (wait for buyers)
  const sellOrder = await client.createAndPostOrder({
    tokenID,
    price: ask,  // Same as current ASK
    size,
    side: Side.SELL,
  });
  
  console.log("Buy order at BID:", buyOrder.orderID);
  console.log("Sell order at ASK:", sellOrder.orderID);
  
  return { buyOrder, sellOrder };
}
```

### Strategy: Capture the Spread

When spread is wide, capture it by buying at BID and selling at ASK:

```typescript
async function captureSpread(
  client: ClobClient,
  tokenID: string,
  size: number,
  minSpreadCents: number
) {
  const { ask, bid, spread } = await getOrderbookPrices(tokenID);
  const spreadCents = spread * 100;
  
  console.log(`Current spread: ${spreadCents.toFixed(1)}¢`);
  
  // Only trade if spread is wide enough
  if (spreadCents < minSpreadCents) {
    console.log("Spread too narrow, skipping");
    return;
  }
  
  // Buy at BID + 1¢ (more aggressive)
  const buyPrice = bid + 0.01;
  const buyOrder = await client.createAndPostOrder({
    tokenID,
    price: buyPrice,
    size,
    side: Side.BUY,
  });
  
  // Sell at ASK - 1¢ (more aggressive)
  const sellPrice = ask - 0.01;
  const sellOrder = await client.createAndPostOrder({
    tokenID,
    price: sellPrice,
    size,
    side: Side.SELL,
  });
  
  const potentialProfit = (sellPrice - buyPrice) * size;
  console.log(`Potential profit: $${potentialProfit.toFixed(2)}`);
  
  return { buyOrder, sellOrder, potentialProfit };
}

// Example: Capture when spread is at least 5¢
await captureSpread(client, tokenID, 100, 5);
```

### Strategy: Breakout Above ASK

Buy when price breaks above ASK with momentum:

```typescript
async function breakoutBuy(
  client: ClobClient,
  tokenID: string,
  size: number,
  breakoutThresholdCents: number
) {
  const { ask, midpoint } = await getOrderbookPrices(tokenID);
  
  // Calculate breakout level
  const breakoutPrice = midpoint + (breakoutThresholdCents / 100);
  
  if (ask > breakoutPrice) {
    console.log(`🚨 BREAKOUT! ASK (${(ask * 100).toFixed(1)}¢) above threshold`);
    
    // Buy at current ASK for instant execution
    const order = await client.createMarketOrder({
      side: Side.BUY,
      tokenID,
      amount: size,
      price: ask,
    });
    
    await client.postOrder(order, OrderType.FOK);
    
    console.log("Market order executed at ASK:", ask);
    return order;
  }
  
  console.log("No breakout detected");
  return null;
}

// Example: Buy when ASK breaks 5¢ above midpoint
await breakoutBuy(client, tokenID, 100, 5);
```

---

## Market Making

### Basic Spread Strategy

Place buy and sell orders around the midpoint to earn the spread.

```typescript
async function placeSpreadOrders(
  client: ClobClient,
  tokenID: string,
  spreadCents: number,
  size: number
) {
  // Get current midpoint
  const res = await fetch(
    `https://clob.polymarket.com/midpoint?token_id=${tokenID}`
  );
  const { mid } = await res.json();
  const midpoint = parseFloat(mid);
  
  const spreadDecimal = spreadCents / 100;
  
  // Place buy order below midpoint
  const buyPrice = Math.max(0.01, midpoint - spreadDecimal);
  const buyOrder = await client.createAndPostOrder({
    tokenID,
    price: buyPrice,
    size,
    side: Side.BUY,
  });
  
  // Place sell order above midpoint
  const sellPrice = Math.min(0.99, midpoint + spreadDecimal);
  const sellOrder = await client.createAndPostOrder({
    tokenID,
    price: sellPrice,
    size,
    side: Side.SELL,
  });
  
  console.log("Buy order:", buyOrder.orderID);
  console.log("Sell order:", sellOrder.orderID);
  
  return { buyOrder, sellOrder };
}

// Example: 3¢ spread with 100 share size
await placeSpreadOrders(client, tokenID, 3, 100);
```

### Adaptive Spread (Volatility-Based)

Adjust spread based on market volatility.

```typescript
async function getVolatility(tokenID: string): Promise<number> {
  // Simplified: measure price changes over time
  const prices: number[] = [];
  
  for (let i = 0; i < 10; i++) {
    const res = await fetch(
      `https://clob.polymarket.com/midpoint?token_id=${tokenID}`
    );
    const { mid } = await res.json();
    prices.push(parseFloat(mid));
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Calculate standard deviation
  const mean = prices.reduce((a, b) => a + b) / prices.length;
  const variance = prices.reduce((sum, price) => 
    sum + Math.pow(price - mean, 2), 0
  ) / prices.length;
  
  return Math.sqrt(variance);
}

async function adaptiveSpread(
  client: ClobClient,
  tokenID: string,
  size: number
) {
  const volatility = await getVolatility(tokenID);
  
  // Higher volatility = wider spread
  const baseSpread = 2; // 2¢ base
  const spreadCents = baseSpread + (volatility * 100);
  
  console.log(`Volatility: ${(volatility * 100).toFixed(2)}¢`);
  console.log(`Adjusted spread: ${spreadCents.toFixed(1)}¢`);
  
  return placeSpreadOrders(client, tokenID, spreadCents, size);
}
```

### Inventory Management

Rebalance position when inventory gets skewed.

```typescript
async function rebalanceInventory(
  client: ClobClient,
  tokenID: string,
  targetPosition: number,
  tolerance: number
) {
  // Get current position
  const positions = await client.getPositions();
  const position = positions.find(p => p.asset_id === tokenID);
  
  if (!position) {
    console.log("No position in this market");
    return;
  }
  
  const currentSize = parseFloat(position.size);
  const delta = currentSize - targetPosition;
  
  // If position is within tolerance, do nothing
  if (Math.abs(delta) <= tolerance) {
    console.log("Position balanced");
    return;
  }
  
  // Get midpoint
  const res = await fetch(
    `https://clob.polymarket.com/midpoint?token_id=${tokenID}`
  );
  const { mid } = await res.json();
  const midpoint = parseFloat(mid);
  
  // If too long, place sell order
  if (delta > 0) {
    const sellOrder = await client.createAndPostOrder({
      tokenID,
      price: midpoint + 0.01, // 1¢ above mid
      size: Math.abs(delta),
      side: Side.SELL,
    });
    console.log("Rebalancing: SELL", Math.abs(delta), "shares");
    return sellOrder;
  }
  
  // If too short, place buy order
  const buyOrder = await client.createAndPostOrder({
    tokenID,
    price: midpoint - 0.01, // 1¢ below mid
    size: Math.abs(delta),
    side: Side.BUY,
  });
  console.log("Rebalancing: BUY", Math.abs(delta), "shares");
  return buyOrder;
}

// Example: target 0 position, rebalance if outside ±50 shares
await rebalanceInventory(client, tokenID, 0, 50);
```

---

## Directional Trading

### Momentum Trading

Buy when price is trending up, sell when trending down.

```typescript
async function detectMomentum(tokenID: string): Promise<"up" | "down" | "flat"> {
  const prices: number[] = [];
  
  // Sample prices over 30 seconds
  for (let i = 0; i < 6; i++) {
    const res = await fetch(
      `https://clob.polymarket.com/midpoint?token_id=${tokenID}`
    );
    const { mid } = await res.json();
    prices.push(parseFloat(mid));
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  // Simple trend detection
  const recentAvg = prices.slice(-3).reduce((a, b) => a + b) / 3;
  const olderAvg = prices.slice(0, 3).reduce((a, b) => a + b) / 3;
  
  const change = (recentAvg - olderAvg) / olderAvg;
  
  if (change > 0.02) return "up";    // 2% increase
  if (change < -0.02) return "down"; // 2% decrease
  return "flat";
}

async function momentumTrade(
  client: ClobClient,
  tokenID: string,
  size: number
) {
  const momentum = await detectMomentum(tokenID);
  
  if (momentum === "flat") {
    console.log("No clear trend, skipping");
    return;
  }
  
  const res = await fetch(
    `https://clob.polymarket.com/midpoint?token_id=${tokenID}`
  );
  const { mid } = await res.json();
  const midpoint = parseFloat(mid);
  
  if (momentum === "up") {
    // Buy on uptrend
    const order = await client.createAndPostOrder({
      tokenID,
      price: midpoint + 0.005, // Buy slightly above mid
      size,
      side: Side.BUY,
    });
    console.log("Momentum BUY:", order.orderID);
    return order;
  }
  
  // Sell on downtrend
  const order = await client.createAndPostOrder({
    tokenID,
    price: midpoint - 0.005, // Sell slightly below mid
    size,
    side: Side.SELL,
  });
  console.log("Momentum SELL:", order.orderID);
  return order;
}
```

### Mean Reversion

Buy when price drops below average, sell when above.

```typescript
async function meanReversionTrade(
  client: ClobClient,
  tokenID: string,
  size: number,
  thresholdCents: number
) {
  // Get historical average (simplified)
  const prices: number[] = [];
  
  for (let i = 0; i < 10; i++) {
    const res = await fetch(
      `https://clob.polymarket.com/midpoint?token_id=${tokenID}`
    );
    const { mid } = await res.json();
    prices.push(parseFloat(mid));
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  const average = prices.reduce((a, b) => a + b) / prices.length;
  const currentPrice = prices[prices.length - 1];
  const threshold = thresholdCents / 100;
  
  console.log(`Average: ${(average * 100).toFixed(1)}¢`);
  console.log(`Current: ${(currentPrice * 100).toFixed(1)}¢`);
  
  // If price significantly below average, buy
  if (currentPrice < average - threshold) {
    console.log("Price below average, BUYING");
    return client.createAndPostOrder({
      tokenID,
      price: currentPrice + 0.01,
      size,
      side: Side.BUY,
    });
  }
  
  // If price significantly above average, sell
  if (currentPrice > average + threshold) {
    console.log("Price above average, SELLING");
    return client.createAndPostOrder({
      tokenID,
      price: currentPrice - 0.01,
      size,
      side: Side.SELL,
    });
  }
  
  console.log("Price near average, no trade");
}

// Example: trade when price is 3¢ from average
await meanReversionTrade(client, tokenID, 100, 3);
```

---

## Arbitrage

### Cross-Market Arbitrage

Find price differences between YES and NO tokens.

```typescript
async function crossMarketArbitrage(
  client: ClobClient,
  yesTokenID: string,
  noTokenID: string,
  size: number
) {
  // Get YES price
  const yesRes = await fetch(
    `https://clob.polymarket.com/midpoint?token_id=${yesTokenID}`
  );
  const yesData = await yesRes.json();
  const yesPrice = parseFloat(yesData.mid);
  
  // Get NO price
  const noRes = await fetch(
    `https://clob.polymarket.com/midpoint?token_id=${noTokenID}`
  );
  const noData = await noRes.json();
  const noPrice = parseFloat(noData.mid);
  
  const totalCost = yesPrice + noPrice;
  
  console.log(`YES: ${(yesPrice * 100).toFixed(1)}¢`);
  console.log(`NO: ${(noPrice * 100).toFixed(1)}¢`);
  console.log(`Total: ${(totalCost * 100).toFixed(1)}¢`);
  
  // If total is less than 100¢, arbitrage opportunity
  if (totalCost < 0.99) {
    const profit = 1.0 - totalCost;
    console.log(`🚨 ARBITRAGE! Profit: ${(profit * 100).toFixed(1)}¢ per pair`);
    
    // Buy both YES and NO
    const yesOrder = await client.createAndPostOrder({
      tokenID: yesTokenID,
      price: yesPrice + 0.001,
      size,
      side: Side.BUY,
    });
    
    const noOrder = await client.createAndPostOrder({
      tokenID: noTokenID,
      price: noPrice + 0.001,
      size,
      side: Side.BUY,
    });
    
    return { yesOrder, noOrder, profit };
  }
  
  console.log("No arbitrage opportunity");
}
```

---

## Rewards Optimization

### Maximize Scoring Orders

Place orders within the scoring range to earn rewards.

```typescript
async function placeRewardOptimizedOrder(
  client: ClobClient,
  tokenID: string,
  size: number,
  side: Side
) {
  // Get midpoint
  const res = await fetch(
    `https://clob.polymarket.com/midpoint?token_id=${tokenID}`
  );
  const { mid } = await res.json();
  const midpoint = parseFloat(mid);
  
  // Orders typically score within 4.5¢ of midpoint
  const maxSpread = 0.045;
  
  let price: number;
  if (side === Side.BUY) {
    // Place buy order 3¢ below mid (within scoring range)
    price = Math.max(0.01, midpoint - 0.03);
  } else {
    // Place sell order 3¢ above mid (within scoring range)
    price = Math.min(0.99, midpoint + 0.03);
  }
  
  const order = await client.createAndPostOrder({
    tokenID,
    price,
    size,
    side,
  });
  
  // Wait 3 seconds then check if scoring
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const scoring = await client.isOrderScoring({
    order_id: order.orderID  // Use 'order_id' not 'orderId'
  });
  
  console.log("Order placed:", order.orderID);
  console.log("Scoring:", scoring.scoring ? "✅ YES" : "❌ NO");
  
  if (!scoring.scoring) {
    console.log("⚠️ Order not scoring, consider adjusting price");
  }
  
  return { order, scoring: scoring.scoring };
}

// Example: place scoring buy order
await placeRewardOptimizedOrder(client, tokenID, 100, Side.BUY);
```

### Monitor and Rebalance for Rewards

Continuously monitor and adjust orders to stay in scoring range.

```typescript
async function maintainScoringOrders(
  client: ClobClient,
  tokenID: string,
  targetSpreadCents: number,
  checkIntervalMs: number
) {
  let buyOrderID: string | null = null;
  let sellOrderID: string | null = null;
  
  setInterval(async () => {
    const res = await fetch(
      `https://clob.polymarket.com/midpoint?token_id=${tokenID}`
    );
    const { mid } = await res.json();
    const midpoint = parseFloat(mid);
    
    const spreadDecimal = targetSpreadCents / 100;
    
    // Check existing orders
    const orders = await client.getOpenOrders({ asset_id: tokenID });
    
    // Check if buy order still scoring
    if (buyOrderID) {
      const buyOrder = orders.find(o => o.id === buyOrderID);
      if (!buyOrder) {
        // Order filled or cancelled, place new one
        buyOrderID = null;
      } else {
        const currentPrice = parseFloat(buyOrder.price);
        const distance = Math.abs(midpoint - currentPrice);
        
        // If too far from mid, cancel and replace
        if (distance > 0.045) {
          await client.cancelOrder({ orderID: buyOrderID });
          buyOrderID = null;
          console.log("Buy order too far from mid, canceling");
        }
      }
    }
    
    // Place new buy order if needed
    if (!buyOrderID) {
      const buyPrice = Math.max(0.01, midpoint - spreadDecimal);
      const buyOrder = await client.createAndPostOrder({
        tokenID,
        price: buyPrice,
        size: 100,
        side: Side.BUY,
      });
      buyOrderID = buyOrder.orderID;
      console.log("New buy order placed:", buyOrderID);
    }
    
    // Same for sell order...
    
  }, checkIntervalMs);
}

// Check every 10 seconds, maintain 3¢ spread
maintainScoringOrders(client, tokenID, 3, 10000);
```

---

## Risk Management

### Position Sizing

Calculate safe position sizes based on account balance.

```typescript
import { AssetType } from "@polymarket/clob-client";

async function calculatePositionSize(
  client: ClobClient,
  riskPercentage: number
): Promise<number> {
  const balance = await client.getBalanceAllowance({
    asset_type: AssetType.COLLATERAL  // Use AssetType enum
  });
  
  // USDC has 6 decimals, divide by 1000000 for dollars
  
  const totalBalance = parseFloat(balance.balance);
  const riskAmount = totalBalance * (riskPercentage / 100);
  
  console.log(`Total Balance: $${totalBalance.toFixed(2)}`);
  console.log(`Risk ${riskPercentage}%: $${riskAmount.toFixed(2)}`);
  
  return riskAmount;
}

// Example: risk 5% of account per trade
const positionSize = await calculatePositionSize(client, 5);
```

### Stop Loss

Automatically exit positions at a loss threshold.

```typescript
async function monitorStopLoss(
  client: ClobClient,
  tokenID: string,
  entryPrice: number,
  stopLossPercent: number
) {
  const stopLossPrice = entryPrice * (1 - stopLossPercent / 100);
  
  console.log(`Entry: ${(entryPrice * 100).toFixed(1)}¢`);
  console.log(`Stop Loss: ${(stopLossPrice * 100).toFixed(1)}¢`);
  
  setInterval(async () => {
    const res = await fetch(
      `https://clob.polymarket.com/midpoint?token_id=${tokenID}`
    );
    const { mid } = await res.json();
    const currentPrice = parseFloat(mid);
    
    if (currentPrice <= stopLossPrice) {
      console.log(`🚨 STOP LOSS TRIGGERED at ${(currentPrice * 100).toFixed(1)}¢`);
      
      // Get position size
      const positions = await client.getPositions();
      const position = positions.find(p => p.asset_id === tokenID);
      
      if (position) {
        // Sell entire position at market
        const sellOrder = await client.createMarketOrder({
          tokenID,
          amount: parseFloat(position.size),
          side: Side.SELL,
          price: currentPrice,
        });
        
        await client.postOrder(sellOrder, OrderType.FOK);
        console.log("Position closed at stop loss");
        
        // Exit monitoring
        process.exit(0);
      }
    }
  }, 5000); // Check every 5 seconds
}

// Example: 5% stop loss
await monitorStopLoss(client, tokenID, 0.50, 5);
```

### Diversification

Spread risk across multiple markets.

```typescript
async function diversifyAcrossMarkets(
  client: ClobClient,
  markets: Array<{ tokenID: string; allocation: number }>,
  totalAmount: number
) {
  console.log(`Diversifying $${totalAmount} across ${markets.length} markets`);
  
  for (const market of markets) {
    const amount = totalAmount * (market.allocation / 100);
    
    const res = await fetch(
      `https://clob.polymarket.com/midpoint?token_id=${market.tokenID}`
    );
    const { mid } = await res.json();
    const midpoint = parseFloat(mid);
    
    const size = amount / midpoint;
    
    const order = await client.createAndPostOrder({
      tokenID: market.tokenID,
      price: midpoint - 0.01,
      size,
      side: Side.BUY,
    });
    
    console.log(`Allocated ${market.allocation}% ($${amount.toFixed(2)}) to market`);
    console.log(`  Order ID: ${order.orderID}`);
  }
}

// Example: 40% / 30% / 30% split across 3 markets
await diversifyAcrossMarkets(client, [
  { tokenID: "market1", allocation: 40 },
  { tokenID: "market2", allocation: 30 },
  { tokenID: "market3", allocation: 30 },
], 1000);
```

---

## Best Practices

1. **Start Small**: Test strategies with small position sizes
2. **Monitor Scoring**: Always check if orders are earning rewards
3. **Manage Inventory**: Don't let positions get too large
4. **Use Stop Losses**: Protect against large losses
5. **Diversify**: Don't put all capital in one market
6. **Check Liquidity**: Ensure sufficient liquidity before trading
7. **Rebalance Regularly**: Adjust positions to maintain strategy
8. **Track Performance**: Log trades and analyze results
9. **Respect Limits**: Stay within Polymarket's rate limits
10. **Stay Informed**: Monitor events and news that affect markets
