# Angel One Market Dashboard

Personal finance tracking, trade ideas, and market performance dashboard built on Angel One SmartAPI. Analysis-only  does not place orders.

## Features

| Feature | Status |
|---------|--------|
| SmartAPI Login + Token Refresh | ✅ |
| Historical Candle Analysis (250+ days) | ✅ |
| Formula-Driven Screeners (25+ indicators) | ✅ |
| Saved Screener Library | ✅ |
| Market Tracker (Daily → Yearly deltas) | ✅ |
| Local Snapshots + Day-over-Day Comparison | ✅ |
| Instrument Master Search (90k+ instruments) | ✅ |
| Mutual Fund NAV Tracking | ✅ |
| News Feed (Google News RSS) | ✅ |
| Dark / Light Mode | ✅ |
| MCP Backend for AI Agents | ✅ |
| Docker Compose (one command setup) | ✅ |
| AI Explanation + Sentiment | 🔜 Planned |
| Portfolio Holdings + P&L | 🔜 Planned |
| Top Gainers/Losers | 🔜 Planned |

## Quick Start

```bash
docker-compose up --build
# Frontend: http://localhost:5173
# Backend:  http://localhost:8000
```

Login with your Angel One SmartAPI credentials (API key + client code + PIN + TOTP).

## Dashboard Tabs

| Tab | What it does |
|-----|--------------|
| 📊 Summary | Market snapshot, index deltas (daily to yearly), snapshot comparison |
| 💰 Mutual Funds | NAV tracking, 1M/3M/6M/1Y returns, recommendations |
| 📰 News | Indian market headlines from Google News |
| 🔍 Instruments | Search Angel One scrip master, find tokens, manage presets |
| ⚙️ Stock Screener | Filters + formula → indicators → recommendations |
| 📈 Snapshots | Historical comparison with timestamps |
| 🤖 AI Predictions | MCP integration, AI explanations (planned) |

## Architecture

```
frontend/          React + TypeScript + Vite (port 5173)
backend/           Python FastAPI (port 8000)
backend/data/      Local JSON storage (candles, snapshots, screeners)
docs/              Documentation (mkdocs-material)
```

## Documentation

| Doc | Content |
|-----|---------|
| [User Guide](docs/USER_GUIDE.md) | Tab-by-tab walkthrough, daily workflow |
| [Architecture](docs/architecture.md) | System design, data flow, modules |
| [Requirements](docs/requirements.md) | Evolution timeline, design principles, roadmap |
| [AI Approach](docs/AIAPPROACH.md) | How AI fits in, LLM integration plan |
| [SmartAPI Features](docs/SMARTAPI_FEATURES.md) | All usable API endpoints |
| [Docker Setup](docs/DOCKER_SETUP.md) | Container commands and troubleshooting |
| [MCP Integration](docs/MCP_INTEGRATION.md) | AI agent server design |
| [Indices Guide](docs/SENSEX_AND_INDICES.md) | Finding index tokens |

## Why Local Only?

- SmartAPI requires daily TOTP (can't automate)
- IP whitelisting locks the app to your machine
- Sessions expire at midnight (no background service)
- Credentials should never leave your machine
- Zero hosting cost, full data ownership

## What This App Does NOT Do

- Place, modify, or cancel orders
- Execute trades or GTT orders
- Automate any trading strategy
- Access margin or fund transfer APIs

Strictly read-only analysis.
