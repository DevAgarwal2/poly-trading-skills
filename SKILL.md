---
name: polymarket-trading
description: Complete Polymarket trading skill for prediction markets on Polygon. Use when user wants to onboard, trade (buy/sell, market/limit), check balance, view holdings/positions, manage orders (active/cancel), or check rewards. Handles credential setup, balance verification, and all trading operations on Polymarket CLOB. REQUIRES polymarket skill (poly-gamma-skills) for market discovery to get clobTokenIds. REQUIRES polymarket-data-api skill for user portfolio/P&L data.
---

# Polymarket Trading Skill

A comprehensive guide for trading on Polymarket prediction markets using the CLOB (Central Limit Order Book) API on Polygon.

## ⚠️ IMPORTANT: Skill Dependencies

This skill handles TRADING ONLY. You MUST use other skills for:

1. **Market Discovery** → Use `polymarket` skill (poly-gamma-skills)
   - Search markets by keyword/category
   - Get market prices and token IDs (`clobTokenIds`)
   - Find trending markets
   - Get event/market details
   - **Required to get `clobTokenIds` before trading!**

2. **User Portfolio Data** → Use `polymarket-data-api` skill
   - Get user positions and P&L
   - View trading history
   - Check leaderboards
   - Get portfolio analytics

### Typical Workflow:

```
USER: "I want to buy YES on government shutdown"

Step 1: Use polymarket skill (poly-gamma-skills)
  → Search: "government shutdown"
  → Get market details
  → Extract clobTokenIds: ["YES_TOKEN_ID", "NO_TOKEN_ID"]

Step 2: Use polymarket-trading skill (THIS SKILL)
  → Check balance
  → Generate credentials
  → Execute trade with YES_TOKEN_ID

Step 3 (Optional): Use polymarket-data-api skill
  → Check user's position
  → View P&L
```

---

## What is Polymarket?

Polymarket is the world's largest prediction market platform where users trade on real-world events. Built on Polygon, it offers:

- **$3B+ Total Trading Volume**
- **Decentralized CLOB** - On-chain Central Limit Order Book
- **Real-world Events** - Politics, sports, crypto, pop culture
- **Binary Outcomes** - YES/NO token trading
- **Liquidity Rewards** - Earn rewards for market making

### Why Use Polymarket?

| Feature | Benefit |
|---------|---------|
| **Real-time Markets** | Trade on events as they unfold |
| **Transparent Pricing** | On-chain orderbook with clear pricing |
| **Low Fees** | Minimal trading costs |
| **Rewards Program** | Earn rewards for providing liquidity |
| **USDC Settled** | All positions settle in USDC |
| **Instant Settlement** | Withdraw winnings immediately |

## Quick Start

### Prerequisites

**Install Bun Runtime (Required):**

```bash
# Install Bun on macOS, Linux, or WSL
curl -fsSL https://bun.sh/install | bash

# Restart terminal or reload shell
source ~/.bashrc  # or ~/.zshrc

# Verify installation
bun --version
```

### Installation

**Install Dependencies:**

```bash
# Navigate to skill directory
cd /path/to/polymarket-trading-skill

# Install required packages with Bun (IMPORTANT: ethers v5 only!)
bun add @polymarket/clob-client ethers@^5.7.2
```

**Required Packages:**
- `@polymarket/clob-client` (v5.2.1+) - Polymarket CLOB SDK
- `ethers` (v5.7.2-v5.8.0) - Ethereum wallet library

**⚠️ CRITICAL**: Must use ethers v5, NOT v6! Use `ethers@^5.7.2` in the install command.

For detailed setup instructions, see [Setup Guide](./reference/setup-guide.md)

### Program Addresses

| Contract | Polygon Mainnet Address |
|----------|------------------------|
| CTF Exchange | `0xFdb77a4fD16E1418856f45D53d0DB9C17c4ea5E9` |
| CLOB API | `https://clob.polymarket.com` |
| Polygon RPC | `https://polygon-rpc.com` |

---

## Initial Setup & Onboarding

### IMPORTANT: Onboarding Flow

When a user wants to start trading on Polymarket, follow this EXACT sequence:

1. **Get Private Key** - User provides their wallet private key
2. **Check Balance** - Verify user has sufficient USDC.e + MATIC
3. **Generate Credentials** - Auto-generate API credentials (key, secret, passphrase)
4. **⚠️ CRITICAL: Approve Contracts** - Approve 5 contracts for trading (Regular + NegRisk markets)
5. **Verify Setup** - Confirm credentials work and trading is enabled

**DO NOT proceed with trading if any step fails. Step 4 (Contract Approvals) is MANDATORY!**

### Step 1: User Provides Private Key

```typescript
// User provides their Polygon wallet private key
const PRIVATE_KEY = "0x..."; // User's private key
```

**Security Note**: The private key is stored locally in `.env` file and never shared.

### Step 2: Check Balance (REQUIRED)

Run `scripts/check-balance.ts` to verify the user has funds:

```bash
cd /path/to/polymarket-trading-skill
bun run scripts/check-balance.ts
```

**Requirements**:
- MATIC balance > 1 (for gas fees)
- USDC.e balance ≥ $5 (for trading)

If balance check fails, user must deposit funds before proceeding.

**Need to add funds?** Deposit USDC.e and MATIC to your Polygon wallet via:
- **CEX (Recommended)**: Coinbase, Binance, Kraken → Send to Polygon network
- **On-ramps**: Transak, MoonPay, Ramp Network
- **Manual bridge**: Use Polygon Bridge or third-party bridges

### Step 3: Generate API Credentials

Run `scripts/check-creds.ts` to auto-generate trading credentials:

```bash
bun run scripts/check-creds.ts
```

This script will:
1. Connect to Polymarket CLOB API
2. Call `createOrDeriveApiKey()` to generate:
   - `POLY_API_KEY`
   - `POLY_SECRET`
   - `POLY_PASSPHRASE`
3. Display credentials to add to `.env` file
4. Test credentials by checking balance
5. Verify API keys work

**Output Example**:
```
✓ API Credentials successfully created/derived:
  API Key: 9c114853-7efe-ca47-8d1c-f86bf8e012b6
  Secret: rbH93Js4iZAVdLwx48FgrBjFbO5DV46hi2ckBi9KUHw=
  Passphrase: fe39acc69c1e8246e906cd32ea1064b3e62f9feaed019cd84a11da90f7761d00

⚠️  IMPORTANT: Add these to your .env file!
```

### Step 4: ⚠️ CRITICAL - Approve Trading Contracts

**THIS STEP IS MANDATORY BEFORE TRADING!** You must approve 5 contracts to enable trading.

Run `scripts/setup-allowances.ts` to approve contracts:

```bash
bun run scripts/setup-allowances.ts
```

This script will:
1. Check current contract approvals
2. Approve USDC for Regular Exchange
3. Approve CTF (Conditional Tokens) for Regular Exchange
4. Approve USDC for NegRisk Adapter
5. Approve USDC for NegRisk Exchange
6. Approve CTF for NegRisk Exchange

**Requirements**:
- Minimum 0.5 MATIC in wallet (for gas fees)
- Cost: ~$1-2 in MATIC total for all 5 approvals

**Output Example**:
```
🔍 CHECKING CURRENT ALLOWANCES
==================================================
Wallet: 0x...

📊 USDC Allowances:
  Regular Exchange: ❌ Not approved
  NegRisk Adapter: ❌ Not approved
  NegRisk Exchange: ❌ Not approved

📊 CTF (Conditional Token) Approvals:
  Regular Exchange: ❌ Not approved
  NegRisk Exchange: ❌ Not approved

==================================================
⚠️  SOME ALLOWANCES MISSING - Setting them now...
==================================================

1️⃣  Approving USDC for Regular Exchange...
   ✅ Transaction broadcasted: 0x...
   ⏳ Waiting for confirmation...
   ✅ Regular Exchange USDC approval confirmed!

2️⃣  Approving CTF tokens for Regular Exchange...
   ✅ Regular Exchange CTF approval confirmed!

3️⃣  Approving USDC for NegRisk Adapter...
   ✅ NegRisk Adapter USDC approval confirmed!

4️⃣  Approving USDC for NegRisk Exchange...
   ✅ NegRisk Exchange USDC approval confirmed!

5️⃣  Approving CTF tokens for NegRisk Exchange...
   ✅ NegRisk Exchange CTF approval confirmed!

==================================================
🎉 ALL 5 APPROVALS CONFIRMED!
==================================================
✅ Regular Markets: READY
✅ NegRisk Markets: READY
✅ Rewards: Auto-distributed to your wallet
==================================================
```

**What gets approved:**

| # | Token | Contract | Purpose |
|---|-------|----------|---------|
| 1 | USDC | Regular Exchange | Trade on regular markets |
| 2 | CTF | Regular Exchange | Settle positions on regular markets |
| 3 | USDC | NegRisk Adapter | Trade on NegRisk markets |
| 4 | USDC | NegRisk Exchange | Execute NegRisk trades |
| 5 | CTF | NegRisk Exchange | Settle NegRisk positions |

**Contract Addresses:**
- Regular Exchange: `0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E` (from SDK)
- NegRisk Exchange: `0xC5d563A36AE78145C45a50134d48A1215220f80a`
- NegRisk Adapter: `0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296`
- USDC.e: `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`
- CTF: `0x4D97DCd97eC945f40cF65F87097ACe5EA0476045` (from SDK)

**Note**: This script is idempotent - if approvals are already set, it will skip them and save you gas!

### Step 6: Verify Complete Setup

To verify everything is ready, run this command:

```bash
bun run scripts/setup-allowances.ts
```

**Expected output if already set up:**
```
🔍 CHECKING CURRENT ALLOWANCES
==================================================
Wallet: 0x... 

📊 USDC Allowances:
  Regular Exchange: ✅ Approved
  NegRisk Adapter: ✅ Approved
  NegRisk Exchange: ✅ Approved

📊 CTF (Conditional Token) Approvals:
  Regular Exchange: ✅ Approved
  NegRisk Exchange: ✅ Approved

==================================================
✅ ALL ALLOWANCES ARE SET! Ready to trade.
==================================================
```

**If you see all ✅ checkmarks, you're fully verified and ready to trade!**

**To check your profile:**
```bash
bun run scripts/check-balance.ts
```

This will show your Polymarket profile link at: `https://polymarket.com/profile/YOUR_ADDRESS`

---

## Getting Token IDs for Trading

The `.env` file structure:

```env
# Private Key (provided by user)
PRIVATE_KEY=0x...

# RPC and API endpoints
POLYGON_RPC=https://polygon-rpc.com
CLOB_HOST=https://clob.polymarket.com

# API Credentials (auto-generated in step 3)
POLY_API_KEY=9c114853-7efe-ca47-8d1c-f86bf8e012b6
POLY_SECRET=rbH93Js4iZAVdLwx48FgrBjFbO5DV46hi2ckBi9KUHw=
POLY_PASSPHRASE=fe39acc69c1e8246e906cd32ea1064b3e62f9feaed019cd84a11da90f7761d00

# Configuration
CHAIN_ID=137
SIGNATURE_TYPE=0
```

### Step 6: Verify Setup

Run `scripts/check-balance.ts` again to confirm everything works:

```bash
bun run scripts/check-balance.ts
```

Expected output:
```
✅ Trading Balance (USDC):
  Balance: $100.00
  Allowance: $100.00
  
  ✅ Ready to trade!
```

---

## Getting Token IDs for Trading

**CRITICAL**: Before you can trade, you need `clobTokenIds` from the market!

### Use the `polymarket` skill (poly-gamma-skills)

The `polymarket` skill handles all market discovery. Here's how to get token IDs:

#### Example: User wants to trade on "government shutdown"

```python
# Use polymarket skill to search
import requests

# Search for the market
response = requests.get(
    "https://gamma-api.polymarket.com/public-search",
    params={"q": "government shutdown", "limit_per_type": 5}
)
results = response.json()

# Or get by event slug
response = requests.get(
    "https://gamma-api.polymarket.com/events/slug/will-there-be-another-us-government-shutdown-by-january-31"
)
event_data = response.json()

# Extract market data
market = event_data['markets'][0]
```

#### Parse Token IDs

```python
import json

# clobTokenIds is a JSON string like:
# "[\"YES_TOKEN_ID\", \"NO_TOKEN_ID\"]"

token_ids = json.loads(market['clobTokenIds'])

YES_TOKEN_ID = token_ids[0]  # First token is YES
NO_TOKEN_ID = token_ids[1]   # Second token is NO

print(f"Question: {market['question']}")
print(f"YES Token: {YES_TOKEN_ID}")
print(f"NO Token: {NO_TOKEN_ID}")
print(f"Current YES price: {market['outcomePrices'][0]}")
print(f"Current NO price: {market['outcomePrices'][1]}")
```

#### Real Example Output

```
Question: US government shutdown Saturday?
YES Token: 52607315900507156846622820770453728082833251091510131025984187712529448877245
NO Token: 108988271800978168213949343685406694292284061166193819357568013088568150075789
Current YES price: 0.625 (62.5%)
Current NO price: 0.375 (37.5%)
```

### Now Trade with These Token IDs

Once you have the token IDs from the `polymarket` skill, use them in trading commands:

```bash
# Buy YES tokens
bun run scripts/buy.ts \
  --token "52607315900507156846622820770453728082833251091510131025984187712529448877245" \
  --price 0.625 \
  --size 100 \
  --type limit

# Buy NO tokens  
bun run scripts/buy.ts \
  --token "108988271800978168213949343685406694292284061166193819357568013088568150075789" \
  --price 0.375 \
  --size 100 \
  --type limit
```

---

## ⚠️ CRITICAL: Understanding the `--size` Parameter

**THIS IS WHERE MISTAKES HAPPEN - READ CAREFULLY!**

The `--size` parameter behaves **DIFFERENTLY** depending on order type:

### For LIMIT Orders (`--type limit`):
- **Size = SHARE COUNT**
- Example: `--size 100` means buy 100 shares
- Total cost = shares × price
- `--size 100 --price 0.16` = 100 shares × $0.16 = **$16.00 total**

### For MARKET Orders (`--type market`):
- **Size = DOLLAR AMOUNT**
- Example: `--size 100` means spend $100
- Shares received = dollar amount ÷ price
- `--size 100 --price 0.16` = $100 ÷ $0.16 = **625 shares**

### Real Example - What Went Wrong:

**User wanted:** Buy $1.50 worth of shares at 17¢

**WRONG command (what happened):**
```bash
# This spends $8.00, not $1.50!
bun run scripts/buy.ts --token "..." --price 0.17 --size 8 --type market
# Result: Spent $8.00 (size was treated as dollars)
```

**CORRECT command:**
```bash
# For market orders: size is DOLLARS
bun run scripts/buy.ts --token "..." --price 0.17 --size 1.5 --type market
# Result: Spends exactly $1.50

# Or use limit order: size is SHARES
bun run scripts/buy.ts --token "..." --price 0.17 --size 8 --type limit  
# Result: Buys 8 shares at 17¢ = $1.36 total
```

### Quick Reference Table:

| Order Type | `--size` Means | Example | Result |
|------------|---------------|---------|--------|
| **LIMIT** | Share count | `--size 10 --price 0.17` | 10 shares = $1.70 |
| **MARKET** | Dollar amount | `--size 10 --price 0.17` | $10 spent = ~58 shares |

### Before Trading - Calculate Your Order:

**To buy $X worth:**
- **Market order:** Use `--size X` (where X is dollar amount)
- **Limit order:** Calculate shares = X ÷ price, then use `--size [shares]`

**To buy Y shares:**
- **Limit order:** Use `--size Y` directly
- **Market order:** Calculate dollars = Y × price, then use `--size [dollars]`

**⚠️ Always double-check your math before executing!**

---

## Understanding Market Prices & Orderbook

Before trading, it's crucial to understand how the orderbook works and what prices mean.

### ASK, BID, and Midpoint Explained

The orderbook has three key prices:

| Price | Who | Meaning | When to Use |
|-------|-----|---------|-------------|
| **ASK** | Sellers offering | Price to BUY instantly | Market buy orders execute here |
| **BID** | Buyers willing to pay | Price to SELL instantly | Market sell orders execute here |
| **Midpoint** | Average | Reference price only | Not an executable price |
| **Spread** | Difference | ASK - BID | Measure of liquidity |

### Example: US Strikes Iran by Feb 2

```
YES Token Orderbook:
  ASK (sellers): 17¢  ← Buy here for INSTANT execution
  BID (buyers):  16¢  ← Sell here for INSTANT execution
  Midpoint:      16.5¢ ← Reference only
  Spread:        1¢   ← Difference between ASK and BID
```

### When Buying (YES or NO tokens)

**For INSTANT execution:**
- Use MARKET order at ASK price (17¢)
- Pays more but executes immediately

**For BETTER price:**
- Use LIMIT order at BID price (16¢) or lower
- May wait for sellers, might not execute

**Your limit price options:**
- **Below BID (15¢)**: Order rests on book, waits for sellers
- **At/near BID (16¢)**: May execute partially or wait
- **At/above ASK (17¢+)**: Executes immediately like market order

### When Selling (your positions)

**For INSTANT execution:**
- Use MARKET order at BID price (16¢)
- Gets less but executes immediately

**For BETTER price:**
- Use LIMIT order at ASK price (17¢) or higher
- May wait for buyers, might not execute

**Your limit price options:**
- **Above ASK (18¢)**: Order rests on book, waits for buyers
- **At/near ASK (17¢)**: May execute partially or wait
- **At/below BID (16¢)**: Executes immediately like market order

### Real Trading Example

**Scenario**: You want to buy 100 YES tokens at 16¢

```bash
bun run scripts/buy.ts --token "TOKEN_ID" --price 0.16 --size 100 --type limit
```

**Output shows:**
```
📈 Market Orderbook:
   ASK (instant buy): 17¢ ($0.17)
   BID (limit order): 16¢ ($0.16)
   Midpoint: 16.5¢ ($0.165)
   Spread: 1¢

💡 Trading Tips:
   • For INSTANT execution: Use MARKET order at 17¢
   • For BETTER price: Use LIMIT order at 16¢ or lower

✅ Your limit price (16¢) is at BID (16¢)
   Order may execute partially or wait for sellers.
```

### API Endpoints for Prices

```bash
# Get ASK price (sellers willing to sell - for buying)
curl "https://clob.polymarket.com/price?side=SELL&token_id=TOKEN_ID"

# Get BID price (buyers willing to buy - for selling)
curl "https://clob.polymarket.com/price?side=BUY&token_id=TOKEN_ID"

# Get midpoint (reference only)
curl "https://clob.polymarket.com/midpoint?token_id=TOKEN_ID"
```

**Note**: The `side` parameter refers to what market makers are doing:
- `side=SELL` = market makers selling = ASK price (you BUY here)
- `side=BUY` = market makers buying = BID price (you SELL here)

### Price Intelligence in Scripts

Both `buy.ts` and `sell.ts` automatically fetch and display:
- Current ASK/BID prices
- Spread size
- Recommendations based on your order type
- Warnings if your limit price will execute immediately

This helps you make informed decisions about market vs limit orders!

---

## Trading Operations

All trading scripts are located in `scripts/` directory.

---

# ⚠️ CRITICAL: --size Parameter is DIFFERENT for Market vs Limit!

## Quick Reference:

**MARKET orders (`--type market`):**
- `--size` = **Dollar amount** to spend/receive
- Example: `--size 100` = spend/receive $100

**LIMIT orders (`--type limit`):**
- `--size` = **Number of shares** to buy/sell
- Example: `--size 100` = buy/sell 100 shares

## Decision Guide:

| I want to... | Use This |
|--------------|----------|
| Buy/sell EXACT number of shares | `--type limit --size [SHARES]` |
| Spend/receive EXACT dollar amount | `--type market --size [DOLLARS]` |

---

## 🤖 FOR AI AGENTS

**When user says "X shares" or "X tokens":**
→ Use `--type limit --size X`

**When user says "$X" or "spend X":**
→ Use `--type market --size X`

**When unclear (user didn't specify shares OR dollars):**
→ **ASK USER:** "Do you want to buy/sell exact number of shares, or spend/receive exact dollar amount?"

**Always confirm before executing:**
```
I'll [buy/sell] [X shares / $X worth] at [price]. Proceed?
```

**Minimum Order Sizes:**
- **Market orders:** Minimum $1.00
- **Limit orders:** Minimum 5 shares AND minimum $0.10 total value
- If user wants less than minimum, reject and explain limits

---

### Quick Command Reference

**The key difference is the `--type` flag:**

| Command | Flag | Behavior |
|---------|------|----------|
| **Market Order** | `--type market` | Executes INSTANTLY at current price |
| **Limit Order** | `--type limit` | Rests on book, waits for your price |

**If you omit `--type`, it defaults to `limit`**

---

### Market Orders (Immediate Execution)

**Use `--type market` for instant execution**

**⚠️ REMEMBER: --size = DOLLAR AMOUNT (not share count!)**

#### Buy Market Order

```bash
# Spend $100 at market price (INSTANT execution)
bun run scripts/buy.ts \
  --token "71321045679252212594626385532706912750332728571942532289631379312455583992563" \
  --price 0.50 \
  --size 100 \          # ← This is $100 USD, NOT 100 shares!
  --type market

# If you want to buy exactly 100 shares, use LIMIT order instead!
```

**What happens:**
- Executes immediately at current ASK price (~$0.50)
- Spends: **$100 USD** (the --size value)
- Receives: **~200 shares** (calculated: $100 ÷ $0.50)
- **NOT** 100 shares!

#### Sell Market Order

```bash
# Sell $100 worth at market price (INSTANT execution)
bun run scripts/sell.ts \
  --token "71321045679252212594626385532706912750332728571942532289631379312455583992563" \
  --price 0.50 \
  --size 100 \          # ← This is $100 USD worth, NOT 100 shares!
  --type market

# If you want to sell exactly 100 shares, use LIMIT order instead!
```

**What happens:**
- Executes immediately at current BID price (~$0.50)
- Sells: **~200 shares** (calculated: $100 ÷ $0.50)
- Receives: **$100 USD** (the --size value)
- **NOT** selling 100 shares!

---

### Limit Orders (Resting on Order Book)

**Use `--type limit` to wait for your price**

**✅ RECOMMENDED: --size = EXACT SHARE COUNT (what you expect!)**

#### Limit Buy Order

```bash
# Buy EXACTLY 100 shares at 50¢ each (waits for sellers)
bun run scripts/buy.ts \
  --token "71321045679252212594626385532706912750332728571942532289631379312455583992563" \
  --price 0.50 \
  --size 100 \          # ← This is 100 SHARES (what most users expect!)
  --type limit
```

**What happens:**
- Order rests on book until filled
- Buys: **exactly 100 shares** (the --size value)
- Costs: **$50.00** (calculated: 100 × $0.50)
- May not execute if price moves away

#### Limit Sell Order

```bash
# Sell EXACTLY 100 shares at 60¢ each (waits for buyers)
bun run scripts/sell.ts \
  --token "71321045679252212594626385532706912750332728571942532289631379312455583992563" \
  --price 0.60 \
  --size 100 \          # ← This is 100 SHARES (what most users expect!)
  --type limit
```

**What happens:**
- Order rests on book until filled
- Sells: **exactly 100 shares** (the --size value)
- Receives: **$60.00** (calculated: 100 × $0.60)
- May not execute if price moves away

---

### Understanding Order Types

| Type | Command Flag | Execution | Size Parameter | Use Case |
|------|-------------|-----------|----------------|----------|
| **Market** | `--type market` | INSTANT | Dollar amount | Enter/exit quickly |
| **Limit** | `--type limit` | Waits for price | Share count | Get specific price |

**Order Type Details:**

| Type | Full Name | Behavior |
|------|-----------|----------|
| **FOK** | Fill or Kill | Market order - fill entire amount or cancel |
| **FAK** | Fill and Kill | Market order - fill whatever available |
| **GTC** | Good Till Cancelled | Limit order - stays until filled or cancelled |
| **GTD** | Good Till Date | Limit order - expires at specific time |

---

## Order Management

### Check Active Orders

```bash
# View all active orders
bun run scripts/check-orders.ts

# Filter by market
bun run scripts/check-orders.ts --market "0xbd31dc8a..."

# Filter by token
bun run scripts/check-orders.ts --token "71321..."
```

### Cancel Orders

```bash
# Cancel specific order
bun run scripts/cancel-orders.ts --order "0x38a73eed..."

# Cancel all orders
bun run scripts/cancel-orders.ts --all

# Cancel all orders in a market
bun run scripts/cancel-orders.ts --market "0xbd31dc8a..."
```

---

## Account Information

### Check Balance

```bash
# Check USDC and MATIC balance
bun run scripts/check-balance.ts
```

Output:
```
💰 Trading Balance (USDC):
  Balance: $100.00
  Allowance: $100.00

⛽ Gas Balance (MATIC):
  Balance: 0.05 MATIC
  ✅ Sufficient MATIC for gas
```

### Check Holdings/Positions

**⚠️ LIMITED**: This script shows basic CLOB positions only.

```bash
# View current positions (basic)
bun run scripts/check-holdings.ts
```

**For Complete Portfolio Analytics**: Use `polymarket-data-api` skill instead!

The `polymarket-data-api` skill provides:
- Full portfolio value and P&L
- Win/loss breakdown
- Trading history
- Position details with entry prices
- Unrealized vs realized P&L
- Historical performance

#### Example: Get Complete User Data with polymarket-data-api

```python
import requests

# Get user's wallet address
wallet_address = "0x..." # User's wallet

# Get all positions with P&L
response = requests.get(
    "https://data-api.polymarket.com/positions",
    params={"user": wallet_address}
)
positions = response.json()

# Get trading history
response = requests.get(
    "https://data-api.polymarket.com/history",
    params={"user": wallet_address, "limit": 50}
)
history = response.json()

# Get portfolio summary
response = requests.get(
    "https://data-api.polymarket.com/portfolio",
    params={"user": wallet_address}
)
portfolio = response.json()

print(f"Total Portfolio Value: ${portfolio['total_value']}")
print(f"Total P&L: ${portfolio['total_pnl']}")
print(f"Win Rate: {portfolio['win_rate']}%")
```

**Use polymarket-data-api for:**
- User portfolio analysis
- P&L tracking
- Trading history
- Leaderboards
- Position analytics

**Use polymarket-trading (this skill) for:**
- Checking USDC/MATIC balance
- Placing trades
- Managing active orders

---

## Trading SDK Reference

### Basic Setup

```typescript
import { ClobClient, Side, OrderType } from "@polymarket/clob-client";
import { Wallet, providers } from "ethers";

const provider = new providers.JsonRpcProvider(process.env.POLYGON_RPC);
const signer = new Wallet(process.env.PRIVATE_KEY, provider);

const client = new ClobClient(
  process.env.CLOB_HOST,  // "https://clob.polymarket.com"
  137,                     // Polygon Mainnet
  signer,
  {
    key: process.env.POLY_API_KEY,        // Use 'key' not 'apiKey'
    secret: process.env.POLY_SECRET,
    passphrase: process.env.POLY_PASSPHRASE
  },
  parseInt(process.env.SIGNATURE_TYPE),  // 0 for EOA
  signer.address  // Use wallet address
);
```

### Core Operations

#### Place Orders

```typescript
import { Side, OrderType } from "@polymarket/clob-client";
import { BN } from "@coral-xyz/anchor";

// Limit Buy Order
const order = await client.createAndPostOrder({
  tokenID: "71321...",
  price: 0.50,     // 50¢ per share
  size: 100,       // 100 shares
  side: Side.BUY,
});

// Market Buy Order
const marketOrder = await client.createMarketOrder({
  side: Side.BUY,
  tokenID: "71321...",
  amount: 100,     // $100 USD
  price: 0.50,     // Price hint
});

const response = await client.postOrder(marketOrder, OrderType.FOK);
```

#### Get Orders

```typescript
// Get all active orders
const orders = await client.getOpenOrders();

// Get orders for specific market
const marketOrders = await client.getOpenOrders({
  market: "0xbd31dc8a20211944f6b70f31557f1001557b59905b7738480ca09bd4532f84af"
});

// Get specific order
const order = await client.getOrder("order_id_here");
```

#### Cancel Orders

```typescript
// Cancel single order
await client.cancelOrder({ orderID: "order_id" });

// Cancel multiple orders
await client.cancelOrders(["order_id_1", "order_id_2"]);

// Cancel all orders
await client.cancelAll();

// Cancel orders in specific market
await client.cancelMarketOrders({ market: "market_id" });
```

#### Check Balance and Positions

```typescript
import { AssetType } from "@polymarket/clob-client";

// Get balance
const balance = await client.getBalanceAllowance({ 
  asset_type: AssetType.COLLATERAL  // Use AssetType enum
});

// USDC has 6 decimals - convert to dollars
const balanceUsd = parseFloat(balance.balance) / 1000000;
console.log("Balance:", balanceUsd.toFixed(2));

// Get positions
const positions = await client.getPositions();

// Get rewards
const rewards = await client.getCurrentRewards();
const rewardPercentages = await client.getRewardPercentages();
```

#### Check Order Scoring (Rewards)

```typescript
// Check if single order is scoring
const scoring = await client.isOrderScoring({ 
  order_id: "order_id"  // Use 'order_id' not 'orderId'
});

// Check multiple orders
const multiScoring = await client.areOrdersScoring({ 
  orderIds: ["order_id_1", "order_id_2"] 
});
});
```

---

## Common Patterns

### Pattern 1: Safe Trading with Balance Check

```typescript
import { AssetType } from "@polymarket/clob-client";

async function safeTrade(amount: number) {
  // 1. Check balance first
  const balance = await client.getBalanceAllowance({ 
    asset_type: AssetType.COLLATERAL  // Use AssetType enum
  });
  
  // USDC has 6 decimals, divide by 1000000 for dollars
  
  if (parseFloat(balance.balance) < amount) {
    throw new Error("Insufficient balance");
  }
  
  // 2. Get current price
  const midpointRes = await fetch(
    `https://clob.polymarket.com/midpoint?token_id=${tokenID}`
  );
  const { mid } = await midpointRes.json();
  
  // 3. Place order with slippage protection
  const order = await client.createAndPostOrder({
    tokenID,
    price: parseFloat(mid) - 0.01, // 1¢ below mid
    size: amount / (parseFloat(mid) - 0.01),
    side: Side.BUY,
  });
  
  return order;
}
```

### Pattern 2: Market Making Strategy

```typescript
async function placeSpreadOrders(
  tokenID: string,
  spreadCents: number,
  size: number
) {
  // Get current mid price
  const res = await fetch(`https://clob.polymarket.com/midpoint?token_id=${tokenID}`);
  const { mid } = await res.json();
  const midpoint = parseFloat(mid);
  
  const spread = spreadCents / 100;
  
  // Place buy order below mid
  const buyOrder = await client.createAndPostOrder({
    tokenID,
    price: Math.max(0.01, midpoint - spread),
    size,
    side: Side.BUY,
  });
  
  // Place sell order above mid
  const sellOrder = await client.createAndPostOrder({
    tokenID,
    price: Math.min(0.99, midpoint + spread),
    size,
    side: Side.SELL,
  });
  
  return { buyOrder, sellOrder };
}
```

### Pattern 3: Error Handling

```typescript
try {
  const order = await client.createAndPostOrder(params);
  console.log("Order placed:", order.orderID);
} catch (error) {
  if (error.message.includes('INVALID_ORDER_NOT_ENOUGH_BALANCE')) {
    console.error("Insufficient balance");
  } else if (error.message.includes('INVALID_ORDER_MIN_SIZE')) {
    console.error("Order size too small");
  } else if (error.message.includes('INVALID_ORDER_MIN_TICK_SIZE')) {
    console.error("Price doesn't match tick size (use 0.001 increments)");
  } else {
    throw error;
  }
}
```

---

## Error Messages Reference

| Error | Description | Solution |
|-------|-------------|----------|
| `INVALID_ORDER_MIN_TICK_SIZE` | Price doesn't meet tick requirements | Use 0.001 increments (0.500, 0.501, etc.) |
| `INVALID_ORDER_MIN_SIZE` | Order size too small | Increase order size |
| `INVALID_ORDER_NOT_ENOUGH_BALANCE` | Insufficient balance | Add more USDC or reduce order size |
| `INVALID_ORDER_DUPLICATED` | Same order already placed | Cancel existing order first |
| `FOK_ORDER_NOT_FILLED_ERROR` | FOK order couldn't be filled | Use FAK or reduce size |
| `INVALID_POST_ONLY_ORDER` | Post-only order would match | Adjust price to not cross spread |

---

## Best Practices

1. **⚠️ APPROVE CONTRACTS FIRST** - Run `setup-allowances.ts` before trading!
2. **Always check balance before trading** - Use `check-balance.ts`
3. **Verify credentials on setup** - Run `check-creds.ts` first
4. **Use appropriate order types** - Market for speed, Limit for price
5. **Monitor order scoring** - Maximize rewards with scoring orders
6. **Handle errors gracefully** - Check error messages and retry
7. **Use tick size 0.001** - All prices must be in 0.001 increments
8. **Check midpoint before placing** - Get current market price
9. **Set reasonable slippage** - 1-2% for most markets
10. **Cancel stale orders** - Remove old orders that won't fill
11. **Track positions** - Use `check-holdings.ts` regularly

---

## Resources

### Internal Documentation

- [Setup Guide](./reference/setup-guide.md) - Complete installation and configuration
- [API Reference](./reference/api-reference.md) - Full CLOB API documentation
- [Trading Strategies](./reference/trading-strategies.md) - Market making, arbitrage, risk management

### External Resources

- [Polymarket Documentation](https://docs.polymarket.com/)
- [CLOB API Reference](https://docs.polymarket.com/developers/CLOB)
- [TypeScript SDK](https://github.com/Polymarket/clob-client)
- [Gamma Markets API](https://docs.polymarket.com/developers/gamma-markets-api)
- [Polymarket App](https://polymarket.com)

---

## Security

**CRITICAL**: Never commit your `.env` file to version control!

The `.env` file contains:
- Private key (controls your funds)
- API credentials (access to trading)

Always add `.env` to `.gitignore`:

```bash
echo ".env" >> .gitignore
```

---

## Troubleshooting

### "bun: command not found"
Install Bun runtime: `curl -fsSL https://bun.sh/install | bash`

### \"API credentials required\"
Run `bun run scripts/check-creds.ts` to generate credentials.

### \"Contract not approved\" or \"Insufficient allowance\"
**⚠️ CRITICAL**: Run `bun run scripts/setup-allowances.ts` to approve trading contracts!

This is REQUIRED before placing any trades. You must approve 5 contracts:
- USDC for Regular Exchange
- CTF for Regular Exchange  
- USDC for NegRisk Adapter
- USDC for NegRisk Exchange
- CTF for NegRisk Exchange

Cost: ~$1-2 in MATIC for gas. Only needs to be done ONCE.

### "Insufficient balance"
Run `bun run scripts/check-balance.ts` to verify USDC.e balance. 

**Need funds?** Deposit USDC.e and MATIC to your Polygon wallet:
- **CEX (Recommended)**: Send from Coinbase/Binance to Polygon network
- **On-ramps**: Use Transak, MoonPay, or Ramp Network
- **Manual bridge**: Use Polygon Bridge or third-party bridges

Deposit at least $5 USDC.e and > 1 MATIC to your wallet.

### "Price breaks minimum tick size"
Use prices in 0.001 increments: 0.500, 0.501, not 0.5001.

### "Not enough MATIC for gas"
Deposit at least 0.01 MATIC to your wallet.

### "Order not scoring"
Check order is within 4.5¢ of midpoint and meets minimum size requirements.

For more help, see the [Setup Guide](./reference/setup-guide.md).

---

## Skill Structure

```
polymarket-trading-skill/
├── SKILL.md                     # Main skill documentation
├── .env.example                 # Environment template
├── reference/
│   ├── setup-guide.md          # Installation & configuration guide
│   ├── api-reference.md        # Complete CLOB API reference
│   └── trading-strategies.md   # Trading patterns & strategies
├── scripts/
│   ├── check-creds.ts          # Generate API credentials
│   ├── setup-allowances.ts     # ⚠️ APPROVE CONTRACTS (REQUIRED!)
│   ├── check-balance.ts        # Check USDC/MATIC balance
│   ├── check-holdings.ts       # View current positions
│   ├── check-orders.ts         # View active orders
│   ├── buy.ts                  # Place buy orders
│   ├── sell.ts                 # Place sell orders
│   ├── cancel-orders.ts        # Cancel orders
│   └── check-usdce-balance.ts  # Check USDC.e only
└── .gitignore                  # Ignore .env file
```
