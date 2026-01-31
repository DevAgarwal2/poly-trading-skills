# Polymarket Trading Skill

A comprehensive TypeScript-based trading skill for Polymarket prediction markets using the CLOB (Central Limit Order Book) API on Polygon.

## Features

- 🎯 **Buy/Sell Orders** - Market and limit orders with ASK/BID price intelligence
- 📊 **Price Intelligence** - Real-time orderbook data (ASK, BID, spread analysis)
- 💰 **Account Management** - Balance checks, position tracking, order management
- 🔐 **Secure Setup** - Automated credential generation and contract approvals
- 📈 **Rewards Tracking** - Check if orders are scoring for liquidity rewards
- 🤖 **AI Agent Ready** - Clear documentation for autonomous trading agents

## Quick Start

### Prerequisites

- [Bun runtime](https://bun.sh) installed
- Polygon wallet with USDC.e and MATIC
- Basic understanding of prediction markets

### Installation

```bash
# Clone the repository
git clone https://github.com/DevAgarwal2/poly-trading-skills.git
cd poly-trading-skills

# Install dependencies
bun install @polymarket/clob-client ethers@^5.7.2

# Setup environment
cp .env.example .env
# Edit .env and add your PRIVATE_KEY and WALLET_ADDRESS
```

### Initial Setup

```bash
# 1. Generate API credentials
bun run scripts/check-creds.ts

# 2. Add credentials to .env file

# 3. Check balance
bun run scripts/check-balance.ts

# 4. Approve trading contracts (REQUIRED before first trade!)
bun run scripts/setup-allowances.ts
```

## Usage Examples

### Buy Orders

```bash
# Limit order - Buy exactly 100 shares at 50¢
bun run scripts/buy.ts \
  --token "TOKEN_ID" \
  --price 0.50 \
  --size 100 \
  --type limit

# Market order - Spend $100 at current price
bun run scripts/buy.ts \
  --token "TOKEN_ID" \
  --price 0.50 \
  --size 100 \
  --type market
```

### Sell Orders

```bash
# Limit order - Sell exactly 100 shares at 60¢
bun run scripts/sell.ts \
  --token "TOKEN_ID" \
  --price 0.60 \
  --size 100 \
  --type limit

# Market order - Sell $100 worth at current price
bun run scripts/sell.ts \
  --token "TOKEN_ID" \
  --price 0.50 \
  --size 100 \
  --type market
```

### Order Management

```bash
# Check active orders
bun run scripts/check-orders.ts

# Cancel specific order
bun run scripts/cancel-orders.ts --order "ORDER_ID"

# Cancel all orders
bun run scripts/cancel-orders.ts --all
```

## ⚠️ Critical: Market vs Limit Orders

**The `--size` parameter means DIFFERENT things:**

| Order Type | --size Means | Example | Minimum |
|------------|--------------|---------|---------|
| **MARKET** (`--type market`) | Dollar amount | `--size 100` = spend/receive $100 | $1.00 |
| **LIMIT** (`--type limit`) | Share count | `--size 100` = buy/sell 100 shares | 1 share + $0.10 total value |

**Always specify:**
- For exact share count → Use `--type limit`
- For exact dollar amount → Use `--type market`

**Polymarket Minimums:**
- Market orders: Minimum $1.00
- Limit orders: Minimum 1 share AND order value ≥ $0.10

## Available Scripts

### Trading
- `buy.ts` - Place buy orders (market/limit)
- `sell.ts` - Place sell orders (market/limit)
- `cancel-orders.ts` - Cancel orders
- `check-orders.ts` - View active orders

### Account Management
- `check-balance.ts` - Check USDC.e and MATIC balance
- `check-holdings.ts` - View current positions
- `check-creds.ts` - Generate API credentials
- `setup-allowances.ts` - Approve trading contracts (REQUIRED!)

### Utilities
- `check-usdce-balance.ts` - Quick USDC.e balance check
- `send-solana-usdc.ts` - Solana helper

## Documentation

- [SKILL.md](./SKILL.md) - Complete skill documentation
- [VERIFICATION.md](./VERIFICATION.md) - Setup verification guide
- [API Reference](./reference/api-reference.md) - Full CLOB API docs
- [Setup Guide](./reference/setup-guide.md) - Detailed setup instructions
- [Trading Strategies](./reference/trading-strategies.md) - Advanced trading patterns

## Price Intelligence

Both `buy.ts` and `sell.ts` automatically fetch and display:

- **ASK Price** - Current price to buy instantly
- **BID Price** - Current price to sell instantly
- **Midpoint** - Average of ASK/BID (reference only)
- **Spread** - Difference between ASK and BID
- **Trading Tips** - Recommendations based on order type

Example output:
```
📈 Market Orderbook:
   ASK (instant buy): 17¢ ($0.17)
   BID (limit order): 16¢ ($0.16)
   Midpoint: 16.5¢ ($0.165)
   Spread: 1¢

💡 Trading Tips:
   • For INSTANT execution: Use MARKET order at 17¢
   • For BETTER price: Use LIMIT order at 16¢ or lower
```

## Security

**⚠️ NEVER commit your `.env` file to version control!**

The `.env` file contains:
- Your private key (controls your funds)
- Your wallet address
- API credentials (access to trading)

Always:
- Keep `.env` in `.gitignore` (already configured)
- Never share your private key
- Use different keys for testing vs production

## Requirements

- **Bun Runtime**: v1.0+ ([install](https://bun.sh))
- **Dependencies**:
  - `@polymarket/clob-client` v6.9.0+
  - `ethers` v5.7.2-5.8.0 (NOT v6!)
- **Funds**:
  - USDC.e on Polygon (minimum $5 for trading)
  - MATIC on Polygon (minimum 1 MATIC for gas)

## Smart Contract Addresses

| Contract | Polygon Address |
|----------|----------------|
| USDC.e | `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174` |
| CTF Exchange | `0xFdb77a4fD16E1418856f45D53d0DB9C17c4ea5E9` |
| Regular Exchange | `0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E` |
| NegRisk Exchange | `0xC5d563A36AE78145C45a50134d48A1215220f80a` |
| NegRisk Adapter | `0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296` |

## For AI Agents

This skill is designed to be used by autonomous AI agents. Key points:

**Decision Rules:**
- User says "X shares" → Use `--type limit --size X`
- User says "$X" → Use `--type market --size X`
- When unclear → **ASK USER** (never guess!)
- Always confirm before executing

See [SKILL.md](./SKILL.md) for complete AI agent guidelines.

## Troubleshooting

### "bun: command not found"
```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc  # or ~/.zshrc
```

### "API credentials required"
```bash
bun run scripts/check-creds.ts
# Copy credentials to .env file
```

### "Insufficient balance" or "Contract not approved"
```bash
# REQUIRED: Approve trading contracts first!
bun run scripts/setup-allowances.ts
```

### "Price breaks minimum tick size"
Use prices in 0.001 increments (e.g., 0.500, 0.501, not 0.5001)

## Getting Funds

**Need USDC.e and MATIC on Polygon?**

1. **CEX (Recommended)**: Withdraw from Coinbase/Binance to Polygon network
2. **On-ramps**: Use Transak, MoonPay, or Ramp Network
3. **Bridge**: Use Polygon Bridge or third-party bridges

See [Setup Guide](./reference/setup-guide.md) for detailed instructions.

## Resources

- [Polymarket Documentation](https://docs.polymarket.com/)
- [CLOB API Reference](https://docs.polymarket.com/developers/CLOB)
- [Gamma Markets API](https://docs.polymarket.com/developers/gamma-markets-api)
- [Polymarket App](https://polymarket.com)

## Skill Dependencies

This skill handles **TRADING ONLY**. For other operations:

- **Market Discovery** → Use `polymarket` skill (poly-gamma-skills)
  - Search markets, get token IDs, find trending markets
- **Portfolio Data** → Use `polymarket-data-api` skill
  - Get P&L, trading history, portfolio analytics

## License

MIT License - See LICENSE file for details

## Disclaimer

**USE AT YOUR OWN RISK!** This software is provided "as is" without warranty of any kind. Trading prediction markets involves financial risk. Always:
- Start with small amounts
- Understand the markets you're trading
- Never invest more than you can afford to lose
- Review all orders before confirming

The authors are not responsible for any financial losses incurred through use of this software.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues or questions:
- Open an issue on GitHub
- Review the [documentation](./SKILL.md)
- Check [troubleshooting](#troubleshooting) section

---

**Built with ❤️ for the Polymarket community**
