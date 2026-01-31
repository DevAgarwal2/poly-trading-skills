# Polymarket CLOB API Reference

Complete API reference for Polymarket's Central Limit Order Book.

## Base URL

```
https://clob.polymarket.com
```

## Authentication

All authenticated endpoints require L2 headers generated from API credentials.

### API Credentials

Credentials are generated via `createOrDeriveApiKey()`:
- `key`: UUID format API key (returned as 'key' in response)
- `secret`: Base64 encoded secret
- `passphrase`: Hex encoded passphrase

### Headers

```typescript
{
  "POLY-ADDRESS": "wallet_address",
  "POLY-SIGNATURE": "signature",
  "POLY-TIMESTAMP": "unix_timestamp",
  "POLY-NONCE": "nonce",
  "POLY-PASSPHRASE": "passphrase"
}
```

---

## Order Endpoints

### POST /order - Place Single Order

Create and place a single order.

**Request Parameters:**

| Name | Required | Type | Description |
|------|----------|------|-------------|
| order | yes | Order | Signed order object |
| owner | yes | string | API key of order owner |
| orderType | yes | string | "FOK", "GTC", "GTD", "FAK" |
| postOnly | no | boolean | Only rest on book, don't match (default: false) |

**Order Object:**

| Field | Type | Description |
|-------|------|-------------|
| salt | integer | Random salt for unique order |
| maker | string | Maker address (funder) |
| signer | string | Signing address |
| taker | string | Taker address (operator) |
| tokenId | string | ERC1155 token ID |
| makerAmount | string | Max amount maker willing to spend |
| takerAmount | string | Min amount taker will pay |
| expiration | string | Unix timestamp (0 = no expiration) |
| nonce | string | Maker's exchange nonce |
| feeRateBps | string | Fee rate in basis points |
| side | string | "BUY" or "SELL" |
| signatureType | integer | Signature type enum |
| signature | string | Hex encoded signature |

**Response:**

```json
{
  "success": true,
  "errorMsg": "",
  "orderID": "0x38a73eed...",
  "status": "live",
  "orderHashes": []
}
```

**Order Statuses:**

| Status | Description |
|--------|-------------|
| matched | Order matched with existing resting order |
| live | Order resting on the book |
| delayed | Order marketable but subject to delay |
| unmatched | Order marketable but delay failed |

---

### POST /orders - Place Batch Orders

Place up to 15 orders in a single request.

**Request Parameters:**

Array of `PostOrder` objects:

```typescript
{
  order: Order,
  orderType: "FOK" | "GTC" | "GTD" | "FAK",
  owner: string,
  postOnly?: boolean
}
```

**Response:**

Array of order responses (same format as single order).

---

### GET /data/orders - Get Active Orders

Retrieve active orders for a market or user.

**Query Parameters:**

| Name | Required | Type | Description |
|------|----------|------|-------------|
| id | no | string | Order ID to get |
| market | no | string | Condition ID of market |
| asset_id | no | string | Token ID |

**Response:**

```json
[
  {
    "id": "0x...",
    "market": "0x...",
    "asset_id": "token_id",
    "maker_address": "0x...",
    "price": "0.50",
    "original_size": "100",
    "size_matched": "0",
    "side": "BUY",
    "status": "live",
    "type": "GTC",
    "created_at": "1234567890",
    "expiration": "0",
    "outcome": "YES"
  }
]
```

---

### GET /data/order/{order_id} - Get Single Order

Get detailed information about a specific order.

**Response:**

```json
{
  "id": "0x...",
  "status": "live",
  "market": "0x...",
  "original_size": "100",
  "outcome": "YES",
  "maker_address": "0x...",
  "owner": "api_key",
  "price": "0.50",
  "side": "BUY",
  "size_matched": "0",
  "asset_id": "token_id",
  "expiration": "0",
  "type": "GTC",
  "created_at": "1234567890",
  "associate_trades": []
}
```

---

### DELETE /order - Cancel Single Order

Cancel a specific order.

**Request:**

```json
{
  "orderID": "0x..."
}
```

**Response:**

```json
{
  "canceled": ["0x..."],
  "not_canceled": {}
}
```

---

### DELETE /orders - Cancel Multiple Orders

Cancel multiple orders.

**Request:**

```json
["0x...", "0x..."]
```

**Response:**

```json
{
  "canceled": ["0x...", "0x..."],
  "not_canceled": {
    "0x...": "Order already filled"
  }
}
```

---

### DELETE /cancel-all - Cancel All Orders

Cancel all active orders for the user.

**Response:**

```json
{
  "canceled": ["0x...", "0x..."],
  "not_canceled": {}
}
```

---

### DELETE /cancel-market-orders - Cancel Market Orders

Cancel all orders in a specific market.

**Request:**

```json
{
  "market": "0x...",
  "asset_id": "token_id"  // optional
}
```

**Response:**

```json
{
  "canceled": ["0x...", "0x..."],
  "not_canceled": {}
}
```

---

## Market Data Endpoints

### GET /midpoint - Get Midpoint Price

Get the current midpoint price for a token.

**Query Parameters:**

| Name | Required | Type | Description |
|------|----------|------|-------------|
| token_id | yes | string | Token ID |

**Response:**

```json
{
  "mid": "0.5234"
}
```

---

### GET /price - Get Market Price

Get the current market price for buying or selling.

**Query Parameters:**

| Name | Required | Type | Description |
|------|----------|------|-------------|
| token_id | yes | string | Token ID |
| side | yes | string | "BUY" or "SELL" |

**Response:**

```json
{
  "price": "0.5250"
}
```

---

## Account Endpoints

### GET /balance - Get Balance and Allowance

Get USDC balance and allowance.

**Query Parameters:**

| Name | Required | Type | Description |
|------|----------|------|-------------|
| asset_type | yes | AssetType | AssetType.COLLATERAL or AssetType.CONDITIONAL |

**Response:**

```json
{
  "balance": "1000.00",
  "allowance": "1000.00"
}
```

---

### GET /positions - Get Positions

Get all positions/holdings.

**Response:**

```json
[
  {
    "asset_id": "token_id",
    "market": "0x...",
    "outcome": "YES",
    "size": "100",
    "value": "50.00",
    "realized_pnl": "5.00",
    "unrealized_pnl": "2.50"
  }
]
```

---

## Rewards Endpoints

### GET /order-scoring - Check Single Order Scoring

Check if an order is eligible for rewards.

**Query Parameters:**

| Name | Required | Type | Description |
|------|----------|------|-------------|
| order_id | yes | string | Order ID |

**Response:**

```json
{
  "scoring": true
}
```

---

### POST /orders-scoring - Check Multiple Orders Scoring

Check multiple orders for scoring eligibility.

**Request:**

```json
{
  "orderIds": ["0x...", "0x..."]
}
```

**Response:**

```json
{
  "0x...": true,
  "0x...": false
}
```

---

### GET /rewards/current - Get Current Rewards

Get current reward balances.

**Response:**

```json
{
  "total_rewards": "100.00",
  "claimable_rewards": "50.00",
  "pending_rewards": "50.00"
}
```

---

### GET /rewards/percentages - Get Reward Percentages

Get reward distribution percentages.

**Response:**

```json
{
  "maker_percentage": "70",
  "taker_percentage": "30"
}
```

---

## Error Codes

### Order Placement Errors

| Error | Success | Description | Solution |
|-------|---------|-------------|----------|
| INVALID_ORDER_MIN_TICK_SIZE | yes | Price breaks tick size rules | Use 0.001 increments |
| INVALID_ORDER_MIN_SIZE | yes | Size below minimum | Increase order size |
| INVALID_ORDER_DUPLICATED | yes | Same order already placed | Cancel existing first |
| INVALID_ORDER_NOT_ENOUGH_BALANCE | yes | Insufficient balance | Add more USDC |
| INVALID_ORDER_EXPIRATION | yes | Invalid expiration time | Check timestamp |
| INVALID_POST_ONLY_ORDER_TYPE | yes | Post-only with wrong type | Use GTC or GTD |
| INVALID_POST_ONLY_ORDER | yes | Post-only would match | Adjust price |
| FOK_ORDER_NOT_FILLED_ERROR | yes | FOK not fully filled | Use FAK or reduce size |
| ORDER_DELAYED | no | Order delayed | Wait for execution |
| MARKET_NOT_READY | no | Market not accepting orders | Wait or try different market |

---

## Rate Limits

- **Public endpoints**: 100 requests/minute
- **Authenticated endpoints**: 200 requests/minute
- **Batch orders**: 15 orders per request max

---

## SDK Methods

### ClobClient Methods

#### Order Management

```typescript
// Create and post order (recommended)
createAndPostOrder(params: CreateOrderParams): Promise<OrderResponse>

// Create order
createOrder(params: CreateOrderParams): Promise<Order>

// Post order
postOrder(order: Order, orderType: OrderType): Promise<OrderResponse>

// Create market order
createMarketOrder(params: MarketOrderParams): Promise<Order>

// Post batch orders
postOrders(orders: PostOrdersArgs[]): Promise<OrderResponse[]>
```

#### Query Orders

```typescript
// Get open orders
getOpenOrders(params?: OpenOrderParams): Promise<OpenOrder[]>

// Get specific order
getOrder(orderID: string): Promise<OpenOrder>
```

#### Cancel Orders

```typescript
// Cancel single order
cancelOrder(params: CancelOrderParams): Promise<CancelResponse>

// Cancel multiple orders
cancelOrders(orderIDs: string[]): Promise<CancelResponse>

// Cancel all orders
cancelAll(): Promise<CancelResponse>

// Cancel market orders
cancelMarketOrders(params: CancelMarketOrdersParams): Promise<CancelResponse>
```

#### Account Info

```typescript
// Get balance and allowance
getBalanceAllowance(params: BalanceAllowanceParams): Promise<BalanceAllowance>

// Get positions
getPositions(): Promise<Position[]>

// Get API keys
getApiKeys(): Promise<ApiKey[]>
```

#### Rewards

```typescript
// Check if order is scoring
isOrderScoring(params: OrderScoringParams): Promise<OrderScoring>

// Check multiple orders scoring
areOrdersScoring(params: OrdersScoringParams): Promise<OrdersScoring>

// Get current rewards
getCurrentRewards(): Promise<Rewards>

// Get reward percentages
getRewardPercentages(): Promise<RewardPercentages>

// Get raw rewards for market
getRawRewardsForMarket(marketId: string): Promise<MarketRewards>
```

#### API Credentials

```typescript
// Create or derive API key
createOrDeriveApiKey(): Promise<ApiCreds>

// Set API credentials
setApiCreds(creds: ApiCreds): void
```

---

## TypeScript Types

### CreateOrderParams

```typescript
interface CreateOrderParams {
  tokenID: string;
  price: number;
  size: number;
  side: Side;
  feeRateBps?: number;
  nonce?: number;
  expiration?: number;
}
```

### MarketOrderParams

```typescript
interface MarketOrderParams {
  tokenID: string;
  amount: number;  // USD for buys, shares for sells
  side: Side;
  price: number;   // Price hint
  feeRateBps?: number;
  nonce?: number;
}
```

### Side Enum

```typescript
enum Side {
  BUY = "BUY",
  SELL = "SELL"
}
```

### OrderType Enum

```typescript
enum OrderType {
  GTC = "GTC",  // Good Till Cancelled
  GTD = "GTD",  // Good Till Date
  FOK = "FOK",  // Fill or Kill
  FAK = "FAK"   // Fill and Kill
}
```

### OrderResponse

```typescript
interface OrderResponse {
  success: boolean;
  errorMsg: string;
  orderID: string;
  status?: string;
  orderHashes?: string[];
}
```

### OpenOrder

```typescript
interface OpenOrder {
  id: string;
  market: string;
  asset_id: string;
  maker_address: string;
  owner: string;
  price: string;
  original_size: string;
  size_matched: string;
  side: string;
  status: string;
  type: string;
  created_at: string;
  expiration: string;
  outcome: string;
  associate_trades: string[];
}
```

---

## Best Practices

### Trading
1. **Always use createAndPostOrder()** - Simplest method for placing orders
2. **Check balance before trading** - Prevent INVALID_ORDER_NOT_ENOUGH_BALANCE
3. **Use correct tick size** - Always use 0.001 increments (0.500, 0.501, etc.)
4. **Handle errors gracefully** - Check errorMsg in response
5. **Monitor order scoring** - Maximize rewards with scoring orders
6. **Use appropriate order types** - FOK for market, GTC for limit
7. **Batch operations when possible** - Use postOrders() for multiple orders
8. **Rate limit awareness** - Don't exceed 200 req/min
9. **Set reasonable slippage** - 1-2% for most markets
10. **Clean up stale orders** - Cancel orders that won't fill

