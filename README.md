# Angel One Market Dashboard

Personal finance tracking, trade ideas, and market performance dashboard built on Angel One SmartAPI. Analysis-only -- does not place orders.

---

## Features

| Feature | Source | Status |
|---------|--------|--------|
| SmartAPI Login + Token Refresh | SmartAPI Auth | Done |
| Historical Candle Analysis | SmartAPI Historical | Done |
| Formula-Driven Screeners | Local Engine | Done |
| Saved Screener Library | Local JSON | Done |
| Market Tracker (Daily to Yearly) | SmartAPI Historical | Done |
| Instrument Master Search | SmartAPI Scrip Master | Done |
| Mutual Fund NAV Tracking | External (mfapi.in) | Done |
| News Feed | Google News RSS | Done |
| Dark / Light Mode | Frontend CSS | Done |
| MCP Backend for AI Agents | FastAPI | Done |
| Portfolio Holdings + P&L | SmartAPI Holdings | Planned |
| Market Quote (Real-Time) | SmartAPI Quote | Planned |
| Top Gainers / Losers | SmartAPI Market Data | Planned |
| Put-Call Ratio (Sentiment) | SmartAPI Market Data | Planned |
| WebSocket Live Feed | SmartAPI WebSocket 2.0 | Planned |

---

## UI Tabs

| Tab | Purpose |
|-----|---------|
| **Dashboard** | Today's market snapshot -- index cards, top movers, sentiment |
| **Tracker** | Weekly/monthly/yearly performance, news, mutual funds |
| **Screener** | Formula-based stock discovery, saved filters |
| **Portfolio** | Holdings, positions, trade book, period P&L |
| **AI Agent** | MCP integration, natural language queries |

---

## Quick Start

### Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # Add your SmartAPI credentials
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

---

## Documentation

All docs live in `docs/`:

| Document | Content |
|----------|---------|
| [SmartAPI Features](docs/SMARTAPI_FEATURES.md) | All usable SmartAPI endpoints + portfolio design |
| [UI Redesign](docs/UI_REDESIGN.md) | Tab architecture, component structure, dark mode |
| [Design](docs/Design.md) | Technical architecture, API map, rate limits |
| [Working](docs/Working.md) | Current implementation status and flows |
| [User Guide](docs/USER_GUIDE.md) | Step-by-step dashboard walkthrough |
| [AI Approach](docs/AIAPPROACH.md) | AI recommendation engine design |
| [MCP Integration](docs/MCP_INTEGRATION.md) | AI agent server setup |
| [Indices Guide](docs/SENSEX_AND_INDICES.md) | Finding missing index tokens |
| [Docker Setup](docs/DOCKER_SETUP.md) | Container deployment |

---

## Architecture

```
frontend/          React + TypeScript + Vite
  src/App.tsx      Single-page dashboard (being split into tabs)
  src/styles.css   CSS variables with dark/light mode

backend/           Python FastAPI
  app/main.py      API routes
  app/screener.py  Formula engine + indicator calculations
  app/tracker.py   Market snapshot + period deltas
  app/smartapi_client.py  SmartAPI wrapper with rate limiting
  data/            Local JSON storage (screeners, snapshots, cache)

docs/              All documentation
```

---

## Watchlist Format

```
EXCHANGE|TRADING_SYMBOL|SYMBOL_TOKEN|DISPLAY_NAME|SECTOR|MARKET_CAP
```

Example:
```
NSE|RELIANCE-EQ|2885|Reliance Industries|Energy|1945000
NSE|NIFTY50|99926000|NIFTY 50|Index|0
```

---

## What This App Does NOT Do

- Place, modify, or cancel orders
- Execute trades or GTT orders
- Automate any trading strategy
- Access margin or fund transfer APIs
- Expose order/trade execution to AI agents

It is strictly a read-only analysis and tracking tool.
