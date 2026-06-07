# Angel One Market Analysis Workspace

Analysis-only market workspace built on Angel One SmartAPI historical data and market feeds. It does not place orders, submit trades, or expose trade execution workflows.

## 📚 Documentation

**New to the app?** Start here:

| Guide | Purpose |
|-------|---------|
| [**USER_GUIDE.md**](USER_GUIDE.md) | Complete step-by-step walkthrough of the dashboard |
| [**SENSEX_AND_INDICES.md**](SENSEX_AND_INDICES.md) | How to find missing index tokens (SENSEX, NIFTY METAL, etc.) |
| [**MCP_INTEGRATION.md**](MCP_INTEGRATION.md) | Using the backend as an AI agent server |
| [**Design.md**](Design.md) | Technical architecture and SmartAPI API usage |
| [**AIAPPROACH.md**](AIAPPROACH.md) | First-principles AI recommendation design |
| [**Working.md**](Working.md) | Current implementation status and flows |

---

## Authentication model

The app follows the official SmartAPI session flow:

1. `loginByPassword` with `clientcode`, `password` / PIN, `totp`, and optional `state`
2. Receive `jwtToken`, `refreshToken`, and `feedToken`
3. Optionally call `generateTokens` to refresh and `getProfile` to inspect the user
4. Use those tokens only for read-only analysis in this app

## Features

- ✅ Official SmartAPI login bootstrap
- ✅ Token refresh and profile fetch
- ✅ Historical candle analysis through Angel One SmartAPI
- ✅ Formula-driven screeners with smart diagnostics
- ✅ Saved screener library (JSON-based)
- ✅ Recommendation scoring with explanations
- ✅ Market tracker (daily to yearly performance deltas)
- ✅ Instrument master search and sync
- ✅ Mutual fund NAV tracking
- ✅ News market feed integration
- ✅ MCP-ready backend for AI agent integration

## Quick Start

### For Users

1. **Read** [USER_GUIDE.md](USER_GUIDE.md) (15 minutes)
2. **Login** with SmartAPI credentials
3. **Run analysis** on a preset (e.g., NIFTY 50)
4. **Save screeners** for reuse

### For Developers

#### Backend setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

**Features**:
- FastAPI server on port 8000
- SmartAPI client integration
- Formula engine for complex screeners
- Local JSON storage for screeners, candles, snapshots
- CORS-enabled for frontend

#### Frontend setup

```bash
cd frontend
npm install
npm run dev
```

**Features**:
- React + TypeScript dashboard
- Form-based screener builder
- Real-time analysis results
- Saved screener management
- Market tracker visualizations

### For AI Agents

See [MCP_INTEGRATION.md](MCP_INTEGRATION.md) for:
- MCP protocol setup
- AI agent system prompts (copy-paste ready)
- Example interactions
- Tool & resource definitions

## Documentation Deployment (GitHub Pages)

This repository includes an automated pipeline that builds the documentation with MkDocs and deploys it to GitHub Pages on pushes to `main`.

- Build: `mkdocs build` (runs in CI)
- CI workflow: [.github/workflows/deploy-docs.yml](.github/workflows/deploy-docs.yml)
- Configuration: `mkdocs.yml`

To trigger a docs deployment:

1. Commit your changes to the `docs/` folder or `mkdocs.yml`.
2. Push to the `main` branch.
3. The GitHub Action will build and publish the `site/` to Pages.

You can also run locally:

```bash
pip install mkdocs mkdocs-material pymdown-extensions
mkdocs serve
```

Then visit `http://127.0.0.1:8000` to preview.

---

## Watchlist Row Format

```
EXCHANGE|TRADING_SYMBOL|SYMBOL_TOKEN|DISPLAY_NAME|SECTOR|MARKET_CAP
```

**Example**:
```
NSE|RELIANCE-EQ|2885|Reliance Industries|Energy|1945000
NSE|NIFTY50|99926000|NIFTY 50|Index|0
NSE|NIFTYPHARMA|<token>|NIFTY PHARMA|Sector Index|0
```

**Notes**:
- `SYMBOL_TOKEN` is numeric (or `<token>` placeholder if not resolved)
- `MARKET_CAP` is optional but required for "Market Capitalization" filters
- Use [SENSEX_AND_INDICES.md](SENSEX_AND_INDICES.md) to resolve `<token>` placeholders

---

## Key Concepts

### Screeners
Pre-defined filters and formulas that you save and reuse. Example: "50% Off High Cap" finds large-cap stocks trading below half their all-time high.

### Filters
AND-logic conditions on technical metrics:
- `rsi_14 > 60` (momentum)
- `market_cap >= 5000` (size)
- `volume > 1.5 * 20_day_average` (activity)

### Formulas
Optional complex logic combining multiple conditions:
```
Current price <= 0.50 * High price all time AND Market Capitalization > 5000
```

### Market Tracker
Shows performance across multiple timeframes (daily, weekly, monthly, quarterly, 6-month, 1-year) for your current watchlist.

### Analysis Score
Composite 0-10 rating based on:
- Technical momentum (trend, RSI, moving averages)
- Valuation (distance from all-time high/low)
- Size (market cap preference)
- Volume (activity level)

---

## Troubleshooting

### No results from screener?
→ See [USER_GUIDE.md → Running Analysis section](USER_GUIDE.md#step-7-running-analysis-universal-query)

### Indices showing `<token>` placeholder?
→ See [SENSEX_AND_INDICES.md](SENSEX_AND_INDICES.md)

### Login fails?
→ See [USER_GUIDE.md → Step 1: Login](USER_GUIDE.md#step-1-login-with-smartapi-credentials)

### What data is available?
→ See [Design.md → SmartAPI Documentation Map](Design.md#smartapi-documentation-map)

---

## Technical Notes

- SmartAPI header metadata is exposed in the UI because Angel One expects local IP, public IP, and MAC address on auth requests.
- No buy/sell/order routes are used by this app.
- Sessions expire around midnight; daily login required.
- Historical candles are cached locally to avoid rate limits.
- The backend exposes `/api/mcp-capabilities` for AI agent integration.

---

## Next Steps

1. **Try a screener** → Run "50% Off High Cap" preset
2. **Save your own** → Create "My Watchlist" screener
3. **Use Market Tracker** → See yearly performance trends
4. **Explore AI integration** → Read [MCP_INTEGRATION.md](MCP_INTEGRATION.md)
5. **Build formulas** → See [AIAPPROACH.md → Natural-Language Screener Builder](AIAPPROACH.md#5-natural-language-screener-builder)

---

## Support

For issues or questions:
- Check the relevant guide (USER_GUIDE.md, SENSEX_AND_INDICES.md, etc.)
- Review backend logs: `backend/logs/`
- Inspect cached data: `backend/data/`
- Check SmartAPI status: https://smartapi.angelbroking.com/docs
