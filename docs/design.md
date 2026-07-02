# Angel One SmartAPI Analysis Design

Last reviewed: 2026-07-02

This app is an analysis-only market research tool. It must not place, modify, cancel, or automate orders. SmartAPI is used for authenticated market data, historical candles, live feed capability, and derivative analytics where useful.

## UI Structure (Implemented)

The dashboard uses a 7-tab layout:

1. **Summary**  Index cards + top gainers/losers + scan stats
2. **Mutual Funds**  NAV returns for tracked funds (external API)
3. **News**  Google News RSS market headlines
4. **Instruments**  Scrip master search + saved screeners
5. **Stock Screener**  Formula-based analysis with structured filters
6. **Snapshots**  Historical comparison across daily to yearly windows
7. **AI Predictions**  Momentum scoring + trade signal generation

## SmartAPI Documentation Map

The SmartAPI docs at https://smartapi.angelbroking.com/docs are JavaScript-rendered. The feature map below is derived from the docs URLs, Angel One SmartAPI forum posts, and the official SDK repository.

| SmartAPI area | Documentation URL | Purpose | App usage |
| --- | --- | --- | --- |
| Login and profile | https://smartapi.angelbroking.com/docs/User | `loginByPassword`, `generateTokens`, `getProfile`; returns JWT, refresh token, feed token. | Used by `/api/auth/login`, `/api/auth/refresh`, and `/api/auth/profile`. Daily login remains required because SmartAPI sessions expire around midnight. |
| Historical candles | https://smartapi.angelbroking.com/docs/Historical | `getCandleData` for OHLCV by exchange, symbol token, interval, from date, to date. | Primary source for index tracker, stock screeners, indicator calculations, and 1-year delta comparisons. Cached locally under `backend/data/candles`. |
| Instruments / scrip master | https://smartapi.angelbroking.com/docs/Instruments | Master instrument list and symbol tokens. References `https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json`. | Required for complete sector/index universe and stock token lookup. Cached locally under `backend/data/instruments`. |
| Rate limits | https://smartapi.angelbroking.com/docs/RateLimit | Defines per-second, per-minute, and per-hour limits. | Backend throttles historical calls and writes candle cache to avoid `Access denied because of exceeding access rate`. |

## Current Application Architecture

```
React UI ↔ FastAPI Backend ↔ SmartAPI (Auth, Candles, Instruments)
                            ↔ Local Cache (Screeners, Candles, Snapshots)
                            ↔ Formula Engine (Indicators, Filters)
```

## Implemented Features

1. **Authentication**: Login, token refresh, profile fetch (no trading endpoints)
2. **Historical Analysis**: Screeners with filters and formulas using cached candles
3. **Market Tracker**: Daily to yearly performance deltas
4. **Instrument Master**: Sync, search, and list all instruments
5. **Saved Screeners**: JSON-based storage and reuse
6. **Local Persistence**: Candles, snapshots, and screener definitions

## Key Metrics

The market tracker computes percentage change from the latest close against historical closes:

| Metric | Trading-session offset |
| --- | ---: |
| Daily | 1 |
| Weekly | 5 |
| Monthly | 21 |
| Quarterly | 63 |
| 6 months | 126 |
| 1 year | 252 |

## Screener Capabilities

- Present-day movement: current price, previous close, day change %, range %, gap %
- Trend filters: SMA/EMA 20/50, price vs moving average, RSI 14, volume vs 20-day average
- History filters: distance from high/low, breakout/breakdown, 1-year delta
- Fundamental metadata: market cap, sector, industry
- Saved filters: reusable screen definitions with formula text and structured rules

Example formula:

```text
Current price <= 0.50 * High price all time AND Market Capitalization > 5000
```
