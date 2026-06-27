# Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        User (Browser)                            │
│                  http://localhost:5173                            │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST API calls
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FastAPI Backend (:8000)                        │
├──────────────────┬──────────────────┬───────────────────────────┤
│  Auth Service    │  Screener Engine │  Market Tracker           │
│  • login         │  • indicators    │  • period deltas          │
│  • refresh       │  • formula eval  │  • snapshots              │
│  • profile       │  • filters       │  • comparison             │
├──────────────────┼──────────────────┼───────────────────────────┤
│  Instruments     │  News + MF       │  Storage                  │
│  • scrip master  │  • Google RSS    │  • candle cache           │
│  • search        │  • mfapi.in NAV  │  • screeners.json         │
│  • indices       │                  │  • market_snapshots/      │
└────────┬─────────┴────────┬─────────┴───────────────────────────┘
         │                  │
         ▼                  ▼
┌─────────────────┐  ┌──────────────────┐
│  Angel One      │  │  External APIs   │
│  SmartAPI       │  │  • mfapi.in      │
│  • Auth         │  │  • Google News   │
│  • Historical   │  │  • (future: AI)  │
│  • Instruments  │  │                  │
└─────────────────┘  └──────────────────┘
```

## Backend Modules

| Module | File | Responsibility |
|--------|------|----------------|
| Auth | `app/auth_service.py` | SmartAPI login, refresh, profile |
| Config | `app/config.py` | Pydantic settings, CORS, env vars |
| SmartAPI Client | `app/smartapi_client.py` | Authenticated API calls, throttling, cache |
| Screener | `app/screener.py` | Metric computation, filtering, sorting, diagnostics |
| Formula Engine | `app/formula_engine.py` | Safe AST-based expression evaluation |
| Indicators | `app/indicators.py` | SMA, EMA, RSI, pct_change |
| Tracker | `app/tracker.py` | Period delta computation, snapshot building |
| Instruments | `app/instruments.py` | Scrip master sync, search, index listing |
| News | `app/news.py` | Google News RSS parsing |
| Mutual Funds | `app/mutual_funds.py` | mfapi.in NAV fetching |
| Storage | `app/storage.py` | JSON file CRUD for screeners + snapshots |
| Models | `app/models.py` | All Pydantic request/response schemas |
| Main | `app/main.py` | FastAPI app, routes, CORS |

## Data Flow: Scan

```
User clicks "Run Analysis"
  → Frontend sends POST /api/scan with credentials + symbols + filters
  → Backend authenticates with stored JWT token
  → For each symbol:
      → Check candle cache (hit = skip API call)
      → Fetch historical candles from SmartAPI (throttled)
      → Compute indicators: SMA, EMA, RSI, volume ratios
      → Build StockMetric with 25+ fields
  → Apply structured filters (field + operator + value)
  → Apply formula (if provided) via safe AST eval
  → Sort by chosen field
  → Return top N results with recommendations
```

## Data Flow: Market Tracker

```
User clicks "Refresh Tracker"
  → Fetch candles for watchlist (cached)
  → Compute period deltas (daily, weekly, monthly, quarterly, 6M, 1Y)
  → Load previous snapshot for comparison
  → Save today's snapshot to disk
  → Return items with deltas + snapshot comparison
```

## Local Storage Layout

```
backend/data/
├── candles/                    # Cached SmartAPI candle responses
│   └── NSE_99926000_ONE_DAY_abc123.json
├── market_snapshots/           # Daily tracker snapshots
│   ├── 2026-06-15.json
│   ├── 2026-06-16.json
│   └── 2026-06-17.json
├── instruments/                # Scrip master cache
│   └── scrip_master.json
└── screeners.json              # Saved screener definitions
```

## Why Local-First?

| Concern | Solution |
|---------|----------|
| SmartAPI rate limits (3/sec) | Cache candles locally, fetch once per day |
| Session expires at midnight | Store computed data, compare across days |
| No database setup | JSON files, zero infrastructure |
| Works offline after first fetch | All analysis on cached data |
| Auditable | Every data point is a file you can inspect |

## Security Model

- **No secrets stored in code**  SmartAPI credentials are entered at login, held in React state (memory only)
- **Session tokens**  JWT passed per-request, never persisted to disk
- **Local-only**  App runs on localhost, no network exposure
- **No trading**  Even if tokens leak, the app only has read permissions
