# Requirements & Evolution

How this project evolved from a simple API test to a full market analysis dashboard.

## Evolution Timeline

| Phase | What was built | Key decision |
|-------|----------------|--------------|
| **v0.1**  API Test | Raw SmartAPI login + candle fetch | Prove the API works with Python |
| **v0.2**  Screener | Formula engine + indicator math | Build analysis locally, don't depend on broker's screener |
| **v0.3**  Dashboard | React frontend + dark mode + tabs | Make it visual, not just CLI output |
| **v0.4**  Instruments | Scrip master sync + search | Fix the `<token>` placeholder problem |
| **v0.5**  Tracker | Daily snapshots + period deltas | Track market over weeks/months without external tools |
| **v0.6**  External Data | News (Google RSS) + Mutual Funds (mfapi.in) | SmartAPI doesn't have news/MF data |
| **v0.7**  Docker | Docker Compose for local dev | One command to run both services |
| **v0.8**  AI Layer *(planned)* | LLM-powered explanations via MCP | Let AI explain signals, not generate them |

## Design Principles

1. **Analysis only**  Never place orders. Never automate trades. Read-only market data.
2. **Local-first**  All data cached as JSON files. Works offline after first fetch.
3. **Deterministic signals**  Indicators are math, not ML. AI only explains/summarizes.
4. **Daily cadence**  Login once per day. SmartAPI sessions expire at midnight.
5. **Developer-friendly**  JSON everywhere. REST API. No vendor lock-in.

## Why Build This?

Existing tools (Screener.in, Trendlyne, INDmoney) are:
- Subscription-walled for advanced features
- Not programmable (no API for your own formulas)
- Not local (can't snapshot and compare over time)
- Not AI-ready (can't pipe signals into an LLM)

This dashboard gives a developer full control over the analysis pipeline.

## Technology Stack

| Layer | Tool | Why |
|-------|------|-----|
| Backend | FastAPI (Python 3.11) | Async, type-safe, auto-docs |
| Frontend | React + TypeScript + Vite | Fast dev, type safety |
| Data | Angel One SmartAPI | Free broker API, historical candles |
| External | mfapi.in, Google News RSS | Free, no auth needed |
| Storage | Local JSON files | No database setup, git-friendly |
| AI *(planned)* | OpenAI / Claude via MCP | Explain signals in plain English |
| Infra | Docker Compose | One command local dev |

## Data Sources

| Data | Source | Auth Required | Rate Limit |
|------|--------|---------------|------------|
| OHLCV candles | SmartAPI Historical | Yes (JWT) | 3/sec, 200/min |
| Instrument master | SmartAPI OpenAPI JSON | No | One-time download |
| Mutual fund NAV | mfapi.in | No | None |
| Market news | Google News RSS | No | None |
| Fundamentals (P/E, EPS) | Not available yet |  |  |
| Real-time quotes | SmartAPI Quote | Yes | 1/sec (50 symbols) |
| Gainers/Losers | SmartAPI Market Data | Yes | TBD |

## What's NOT in Scope

- Order placement or modification
- GTT (Good Till Triggered) orders
- Margin trading or fund transfers
- Multi-user / hosted deployment
- Real-time WebSocket streaming (maybe later)
- Mobile app

## Future Roadmap

| Priority | Feature | Effort |
|----------|---------|--------|
| 🔴 High | Top gainers/losers via SmartAPI | 1 day |
| 🔴 High | AI explanation of scan results (OpenAI) | 2 days |
| 🟡 Medium | yfinance fundamentals (P/E, EPS, 52w) | 1 day |
| 🟡 Medium | Portfolio holdings via SmartAPI | 2 days |
| 🟡 Medium | Batch quote API for real-time cards | 1 day |
| 🟢 Low | PCR / OI buildup sentiment | 1 day |
| 🟢 Low | WebSocket live alerts | 3 days |
| 🟢 Low | MCP server for AI agents | 2 days |
