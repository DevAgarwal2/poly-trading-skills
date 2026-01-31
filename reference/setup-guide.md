# Polymarket Trading Setup Guide

Complete setup instructions for the Polymarket Trading Skill using Bun runtime.

## Prerequisites

### 1. Install Bun Runtime

Bun is a fast all-in-one JavaScript runtime. Install it:

```bash
# macOS, Linux, and WSL
curl -fsSL https://bun.sh/install | bash

# After installation, restart your terminal or run:
source ~/.bashrc  # or ~/.zshrc
```

Verify installation:

```bash
bun --version
# Should show: 1.x.x or higher
```

### 2. System Requirements

- **OS**: macOS, Linux, or WSL2 on Windows
- **Node.js**: NOT required (Bun is standalone)
- **Memory**: 2GB RAM minimum
- **Disk**: 500MB free space

---

## Installation

### Step 1: Navigate to Skill Directory

```bash
cd /path/to/polymarket-trading-skill
```

### Step 2: Install Dependencies

```bash
# Install all required packages with Bun (IMPORTANT: use ethers v5)
bun add @polymarket/clob-client ethers@^5.7.2
```

**Core Dependencies:**
- `@polymarket/clob-client` (v5.2.1+) - Polymarket CLOB SDK
- `ethers` (v5.7.2 - v5.8.0) - Ethereum wallet and provider library

**⚠️ IMPORTANT**: Must use ethers v5, NOT v6! The CLOB client is incompatible with ethers v6.

**Installed Automatically:**
- `@coral-xyz/anchor` (peer dependency)
- `@solana/web3.js` (peer dependency)
- Type definitions

### Step 3: Verify Installation

```bash
# Check installed packages
bun pm ls

# Should show:
# @polymarket/clob-client
# ethers
```

---

## Configuration

### Step 1: Create .env File

Copy the example environment file:

```bash
cp .env.example .env
```

### Step 2: Set Private Key

Edit `.env` and add your wallet private key:

```env
PRIVATE_KEY=0x...  # Your Polygon wallet private key
```

**How to get your private key:**

**From MetaMask:**
1. Click on account name → Account Details
2. Click "Show private key"
3. Enter password and copy key

**From any wallet:**
- Export private key from wallet settings
- Format: Must start with `0x`

### Step 3: Run Credential Setup

```bash
# Generate API credentials
bun run scripts/check-creds.ts
```

This will:
1. Connect to your wallet
2. Generate API credentials (`key`, `secret`, `passphrase`)
3. Display credentials to add to `.env`
4. Test the connection

### Step 4: Update .env with Credentials

Add the generated credentials to your `.env` file:

```env
PRIVATE_KEY=0x...

# Auto-generated credentials
POLY_API_KEY=your_generated_api_key
POLY_SECRET=your_generated_secret
POLY_PASSPHRASE=your_generated_passphrase

# Keep these as default
POLYGON_RPC=https://polygon-rpc.com
CLOB_HOST=https://clob.polymarket.com
CHAIN_ID=137
SIGNATURE_TYPE=0
```

---

## Verify Setup

### Check Balance

```bash
bun run scripts/check-balance.ts
```

**Expected Output:**
```
============================================================
Polymarket Balance Check
============================================================

💼 Wallet Address: 0x...

⛽ Gas Balance (MATIC):
  Balance: 0.05 MATIC
  ✅ Sufficient MATIC for gas

💰 Trading Balance (USDC):
  Balance: $100.00
  Allowance: $100.00
  
  ✅ Ready to trade!

============================================================
```

**If balance is 0:**

See [Getting Funds](#getting-funds) section below to deposit USDC.e and MATIC.

### Test Trading (Optional)

```bash
# Place a small test limit order
bun run scripts/buy.ts \
  --token "71321045679252212594626385532706912750332728571942532289631379312455583992563" \
  --price 0.01 \
  --size 1 \
  --type limit

# Check your orders
bun run scripts/check-orders.ts

# Cancel the test order
bun run scripts/cancel-orders.ts --all
```

---

## Getting Funds

You must have USDC.e (Bridged USDC) and MATIC on Polygon before trading.

**Requirements:**
- **USDC.e**: Minimum $5 (for trading)
- **MATIC**: Minimum > 1 (for gas fees)

### Option 1: CEX Withdrawal (Recommended)

Most centralized exchanges support direct withdrawals to Polygon:

#### Coinbase
1. Navigate to Assets → USDC
2. Click "Send"
3. Select "Polygon" network
4. Paste your wallet address
5. Enter amount (minimum $5)
6. Confirm withdrawal

#### Binance
1. Wallet → Fiat and Spot → Withdraw
2. Select USDC
3. Select "Polygon" network
4. Paste your wallet address
5. Enter amount
6. Complete 2FA and confirm

#### Kraken
1. Funding → Withdraw
2. Select USDC
3. Choose "Polygon" network
4. Enter wallet address and amount
5. Confirm withdrawal

**For MATIC gas:**
- Withdraw at least 2 MATIC from any exchange supporting Polygon
- Or buy MATIC on Polygon DEX after getting USDC.e

### Option 2: On-Ramps

Buy crypto directly with fiat:

#### Transak
1. Visit https://global.transak.com/
2. Select "USDC" and "Polygon" network
3. Enter amount and wallet address
4. Complete KYC and payment
5. Receive USDC.e in 5-10 minutes

#### MoonPay
1. Visit https://www.moonpay.com/
2. Select "USDC" on "Polygon"
3. Enter wallet address
4. Complete verification
5. Pay with card/bank

#### Ramp Network
1. Visit https://ramp.network/
2. Choose "USDC" on "Polygon"
3. Enter wallet address
4. Complete KYC
5. Buy with card

### Option 3: Manual Bridge

Use Polygon's official bridge or third-party bridges:

**Polygon Bridge** (https://wallet.polygon.technology/):
- Bridge USDC from Ethereum to USDC.e on Polygon
- Takes 7-8 minutes
- Gas fees apply on Ethereum

**Third-party Bridges:**
- Hop Protocol (https://hop.exchange/)
- Celer cBridge (https://cbridge.celer.network/)
- Across Protocol (https://across.to/)

---

## Package.json (Optional)

Create a `package.json` for easier script management:

```json
{
  "name": "polymarket-trading-skill",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "setup": "bun run scripts/check-creds.ts",
    "balance": "bun run scripts/check-balance.ts",
    "orders": "bun run scripts/check-orders.ts",
    "holdings": "bun run scripts/check-holdings.ts",
    "buy": "bun run scripts/buy.ts",
    "sell": "bun run scripts/sell.ts",
    "cancel": "bun run scripts/cancel-orders.ts"
  },
  "dependencies": {
    "@polymarket/clob-client": "^6.9.0",
    "ethers": "^5.7.2"
  }
}
```

Then use shorter commands:

```bash
bun run setup
bun run balance
bun run buy -- --token "..." --price 0.50 --size 100 --type limit
```

---

## Troubleshooting

### "bun: command not found"

**Solution:**
```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Reload shell
source ~/.bashrc  # or ~/.zshrc

# Verify
bun --version
```

### "Cannot find module '@polymarket/clob-client'"

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules
bun install @polymarket/clob-client ethers
```

### "PRIVATE_KEY is required"

**Solution:**
```bash
# Make sure .env exists
cp .env.example .env

# Edit .env and add your private key
nano .env
```

### "API credentials required"

**Solution:**
```bash
# Generate credentials
bun run scripts/check-creds.ts

# Copy the output to .env file
```

### "Insufficient balance"

**Solution:**
- Deposit USDC to your wallet address
- Get MATIC for gas fees (minimum 0.01)

### Permission Denied

**Solution:**
```bash
# Make scripts executable
chmod +x scripts/*.ts

# Or run with bun explicitly
bun run scripts/check-balance.ts
```

---

## Dependency Details

### @polymarket/clob-client

**Version:** ^6.9.0  
**Purpose:** Official Polymarket CLOB SDK  
**Features:**
- Order creation and management
- Balance and position queries
- API credential generation
- Rewards tracking

**Installation:**
```bash
bun add @polymarket/clob-client
```

### ethers

**Version:** ^5.7.2  
**Purpose:** Ethereum wallet and provider library  
**Features:**
- Wallet management
- Transaction signing
- RPC provider connection
- Contract interaction

**Installation:**
```bash
bun add ethers@^5.7.2
```

**Note:** ethers v6 is NOT compatible with @polymarket/clob-client. Must use v5.

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PRIVATE_KEY | ✅ Yes | - | Your wallet private key (with 0x prefix) |
| POLY_API_KEY | ✅ Yes | - | Generated via check-creds.ts |
| POLY_SECRET | ✅ Yes | - | Generated via check-creds.ts |
| POLY_PASSPHRASE | ✅ Yes | - | Generated via check-creds.ts |
| POLYGON_RPC | ❌ No | https://polygon-rpc.com | Polygon RPC endpoint |
| CLOB_HOST | ❌ No | https://clob.polymarket.com | CLOB API endpoint |
| CHAIN_ID | ❌ No | 137 | Polygon Mainnet chain ID |
| SIGNATURE_TYPE | ❌ No | 0 | 0=EOA, 1=Magic, 2=Wallet |

---

## Security Best Practices

### 1. Never Commit .env

Add to `.gitignore`:

```bash
echo ".env" >> .gitignore
```

### 2. Use Environment Variables

Never hardcode credentials in scripts:

```typescript
// ✅ Good
const privateKey = process.env.PRIVATE_KEY;

// ❌ Bad
const privateKey = "0x123...";
```

### 3. Secure File Permissions

```bash
# Restrict .env file access
chmod 600 .env
```

### 4. Regular Key Rotation

- Rotate API credentials every 90 days
- Never share credentials
- Use different keys for testing

---

## Updating Dependencies

### Check for Updates

```bash
# Check outdated packages
bun outdated
```

### Update Packages

```bash
# Update all to latest compatible versions
bun update

# Update specific package
bun update @polymarket/clob-client
```

### Clean Install

```bash
# Remove and reinstall everything
rm -rf node_modules bun.lockb
bun install @polymarket/clob-client ethers
```

---

## Development Setup

### Enable TypeScript

Bun has built-in TypeScript support. No configuration needed!

```bash
# Run TypeScript directly
bun run script.ts
```

### Hot Reload (Optional)

```bash
# Watch mode for development
bun --watch scripts/check-balance.ts
```

### Debugging

```bash
# Run with debug output
DEBUG=* bun run scripts/buy.ts --token "..." --price 0.50 --size 100
```

---

## Complete Setup Checklist

- [ ] Install Bun runtime
- [ ] Clone/download skill directory
- [ ] Install dependencies (`bun install @polymarket/clob-client ethers`)
- [ ] Create `.env` file from `.env.example`
- [ ] Add private key to `.env`
- [ ] Run `check-creds.ts` to generate API credentials
- [ ] Add API credentials to `.env`
- [ ] Run `check-balance.ts` to verify setup
- [ ] Deposit USDC and MATIC if needed
- [ ] Test with small order
- [ ] Add `.env` to `.gitignore`

---

## Quick Start Commands

```bash
# 1. Install Bun
curl -fsSL https://bun.sh/install | bash

# 2. Install dependencies
bun install @polymarket/clob-client ethers

# 3. Setup environment
cp .env.example .env
# Edit .env and add PRIVATE_KEY

# 4. Generate credentials
bun run scripts/check-creds.ts
# Copy credentials to .env

# 5. Verify setup
bun run scripts/check-balance.ts

# 6. Start trading!
bun run scripts/buy.ts --token "..." --price 0.50 --size 100 --type limit
```

---

## Getting Help

If you encounter issues:

1. Check this setup guide
2. Verify all dependencies installed: `bun pm ls`
3. Verify `.env` file has all required variables
4. Check balance with `bun run scripts/check-balance.ts`
5. Review error messages carefully
6. Check Polymarket documentation: https://docs.polymarket.com
