# SmartAPI Features for Market Analysis

> All SmartAPI endpoints relevant to a personal finance tracking, trade ideas, and market performance dashboard. No algo trading.

---

## Currently Used

| Feature | Endpoint | Status |
|---------|----------|--------|
| Login | `POST /rest/auth/angelbroking/user/v1/loginByPassword` | Done |
| Token Refresh | `POST /rest/auth/angelbroking/jwt/v1/generateTokens` | Done |
| Profile | `GET /rest/secure/angelbroking/user/v1/getProfile` | Done |
| Historical Candles | `POST /rest/secure/angelbroking/historical/v1/getCandleData` | Done |
| Instrument Master | `OpenAPIScripMaster.json` download | Done |

---

## To Add: Portfolio & Holdings

### Holdings (Tab 5: My Portfolio)

**Endpoint**: `GET /rest/secure/angelbroking/portfolio/v1/getHolding`

**Returns**: All stocks in your demat account with:
- `tradingsymbol`, `exchange`, `symboltoken`
- `quantity`, `t1quantity`
- `averageprice` (buy average)
- `ltp` (last traded price)
- `profitandloss`, `pnlpercentage`
- `close` (previous close)

**Use case**: Show portfolio with daily/monthly/quarterly/yearly P&L tracking.

### Positions

**Endpoint**: `GET /rest/secure/angelbroking/order/v1/getPosition`

**Returns**: Intraday and carry-forward positions:
- `symboltoken`, `tradingsymbol`, `exchange`
- `buyqty`, `sellqty`, `netqty`
- `buyavgprice`, `sellavgprice`
- `ltp`, `pnl`, `realised`, `unrealised`

**Use case**: Track open positions and intraday P&L.

### Trade Book

**Endpoint**: `GET /rest/secure/angelbroking/order/v1/getTradeBook`

**Returns**: All executed trades for the day:
- `orderid`, `tradingsymbol`, `exchange`
- `transactiontype` (BUY/SELL)
- `quantity`, `price`, `fillprice`
- `filltime`

**Use case**: Daily trade journal, cost basis tracking.

### Order Book

**Endpoint**: `GET /rest/secure/angelbroking/order/v1/getOrderBook`

**Returns**: All orders (pending, executed, rejected):
- `orderid`, `status`, `tradingsymbol`
- `transactiontype`, `quantity`, `price`
- `ordertag`, `text` (rejection reason)

**Use case**: Track pending orders, understand rejections.

---

## To Add: Market Data (Real-Time)

### LTP Quote

**Endpoint**: `POST /rest/secure/angelbroking/market/v1/quote/`

**Modes**: `LTP`, `OHLC`, `FULL`

**Batch**: Up to 50 symbols per request, 1 request/second

**Returns (FULL mode)**:
- `ltp`, `open`, `high`, `low`, `close`
- `exchFeedTime`, `exchTradeTime`
- `netChange`, `percentChange`
- `avgPrice`, `tradeVolume`
- `opnInterest`, `totBuyQuan`, `totSellQuan`
- `52WeekHigh`, `52WeekLow`
- `upperCircuit`, `lowerCircuit`
- Best 5 bid/ask depth

**Use case**: Real-time dashboard cards (NIFTY, SENSEX, BANK NIFTY) without historical API calls.

### Market Movers (Gainers/Losers)

**Endpoint**: `POST /rest/secure/angelbroking/market/v1/gainersLosers`

**Parameters**: `datatype` (PercPriceGainers, PercPriceLosers, PercOIGainers, PercOILosers), `expirytype` (NEAR, NEXT, FAR)

**Use case**: Top gainers/losers cards on dashboard (like the INDmoney screenshot).

---

## To Add: Derivatives & Sentiment

### Put-Call Ratio (PCR)

**Endpoint**: `POST /rest/secure/angelbroking/market/v1/putCallRatio`

**Use case**: Market sentiment indicator. PCR > 1 = bearish sentiment, PCR < 1 = bullish.

### OI Buildup

**Endpoint**: `POST /rest/secure/angelbroking/market/v1/OIBuildup`

**Types**: Long Buildup, Short Buildup, Short Covering, Long Unwinding

**Use case**: Understand institutional positioning in NIFTY/BANKNIFTY options.

---

## To Add: WebSocket (Live Feed)

### Market Feed WebSocket 2.0

**Connection**: `wss://smartapisocket.angelone.in/smart-stream`

**Auth**: JWT token + API key + client code + feed token

**Modes**:
- Mode 1: LTP only
- Mode 2: Quote (OHLC + volume)
- Mode 3: Snap Quote (full depth)

**Use case**: Live price updates on dashboard without polling. Alert when NIFTY drops 1%.

---

## Tab Architecture (Updated)

### Tab 1: Dashboard
- Index cards (NIFTY 50, SENSEX, BANK NIFTY, NIFTY 500) via Quote API
- Top 3 Gainers / Losers via Gainers/Losers API
- Market sentiment (PCR + advance/decline)
- Quick portfolio summary (total value, day P&L)

### Tab 2: Tracker
- Index performance table (daily to yearly deltas) via Historical API
- News feed (Google News RSS)
- Mutual fund tracker (external NAV)
- Sector heatmap

### Tab 3: Screener
- Formula-based stock discovery
- Saved screeners
- Filter builder + results table
- Trade idea generation

### Tab 4: Portfolio (NEW)
- **Holdings**: All demat stocks with buy avg, LTP, P&L
- **Period performance**: Daily, Weekly, Monthly, Quarterly, Half-Yearly, Yearly change
- **Positions**: Open intraday/carry-forward positions
- **Trade book**: Today's executed trades
- **Historical P&L**: Snapshot comparison over time (locally cached)

### Tab 5: AI Agent
- MCP server integration
- Natural language market queries
- AI-powered screener suggestions
- Anomaly detection

---

## Portfolio Tab: Detailed Design

### Data Flow

```
1. Fetch holdings via /getHolding
2. For each holding, get historical candles (cached)
3. Calculate period deltas:
   - Daily: LTP vs previous close
   - Weekly: LTP vs close 5 sessions ago
   - Monthly: LTP vs close 21 sessions ago
   - Quarterly: LTP vs close 63 sessions ago
   - Half-Yearly: LTP vs close 126 sessions ago
   - Yearly: LTP vs close 252 sessions ago
4. Store daily portfolio snapshot locally
5. Compare with previous snapshots for run-to-run delta
```

### Backend Endpoints Needed

```
GET  /api/portfolio/holdings     - Fetch current holdings
GET  /api/portfolio/positions    - Fetch open positions
GET  /api/portfolio/trades       - Today's trade book
POST /api/portfolio/performance  - Holdings + period deltas (computed)
```

### Portfolio Performance Response

```json
{
  "generated_at": "2026-05-26T15:30:00Z",
  "total_invested": 450000.00,
  "current_value": 512000.00,
  "total_pnl": 62000.00,
  "total_pnl_pct": 13.78,
  "day_pnl": 2340.00,
  "day_pnl_pct": 0.46,
  "holdings": [
    {
      "symbol": "RELIANCE",
      "exchange": "NSE",
      "quantity": 10,
      "avg_price": 2450.00,
      "ltp": 2680.50,
      "invested": 24500.00,
      "current_value": 26805.00,
      "pnl": 2305.00,
      "pnl_pct": 9.41,
      "period_deltas": {
        "daily": 0.82,
        "weekly": 2.15,
        "monthly": -1.30,
        "quarterly": 8.45,
        "half_yearly": 12.30,
        "yearly": 18.50
      }
    }
  ]
}
```

---

## SmartAPI Rate Limits

| Endpoint Category | Limit |
|-------------------|-------|
| Historical Candles | 3 req/sec, 200/min |
| Market Quote | 1 req/sec (50 symbols/batch) |
| Holdings/Positions | 10 req/min |
| Order Book | 20 req/min |
| WebSocket | 1 connection, 100 tokens |

**Strategy**: Cache aggressively. Holdings change only on trade execution. Historical data is immutable. Quote API for real-time, historical for deltas.

---

## External Data Sources (Non-SmartAPI)

| Data | Source | Status |
|------|--------|--------|
| News | Google News RSS | Done |
| Mutual Fund NAV | mfapi.in | Done |
| Fundamentals (P/E, EPS) | Not available | Planned (screener.in scrape or Trendlyne) |
| Corporate Actions | Not available | Planned |
| Sector Classification | Manual mapping | Partial |

---

## Implementation Priority

1. **Portfolio Holdings** - `/getHolding` + period delta calculation
2. **Market Quote Batch** - Replace individual historical calls for today's data
3. **Gainers/Losers** - Dashboard top movers cards
4. **PCR** - Market sentiment indicator
5. **WebSocket** - Live price updates (optional, adds complexity)
6. **OI Buildup** - Derivatives sentiment (optional)

---

*Cross-references: [Design](./Design.md) | [UI Redesign](./UI_REDESIGN.md) | [Working](./Working.md) | [MCP Integration](./MCP_INTEGRATION.md)*
