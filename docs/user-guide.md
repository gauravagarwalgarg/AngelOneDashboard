# Angel One Market Analysis - Complete User Guide

Last updated: May 16, 2026

## Quick Overview

This is an **analysis-only dashboard** for Indian equities and indices. It:
- ✅ Retrieves market data, analyzes trends, builds screeners
- ✅ Saves your filters and watchlists for reuse
- ✅ Compares performance across daily, weekly, monthly, quarterly, and yearly timeframes
- ❌ Does **not** place trades or execute orders

**What you can do:**
1. Load different indices/stocks (NIFTY, SENSEX, sector indices, individual stocks)
2. Create custom filters and formulas to find matching instruments
3. Track daily/weekly/monthly/yearly performance changes
4. Compare instruments against benchmarks
5. Save screener templates for later use

---

## Getting Started: Step-by-Step

### Step 1: Login with SmartAPI Credentials

**WHERE**: Top-left panel (Auth section)

**WHAT YOU NEED**:
- API Key (from Angel One portal)
- Client Code (your account identifier)
- Password or PIN
- TOTP (6-digit code from your authenticator app)
- State (defaults to `analysis-lab` - leave as-is)

**HOW IT WORKS**:
1. Fill in all required fields
2. Click "Login" button
3. Backend validates with SmartAPI
4. You receive JWT token, refresh token, and feed token
5. Dashboard unlocks and shows your profile

**WHY THIS MATTERS**:
- SmartAPI sessions expire around midnight
- You need to log in fresh daily
- All data fetches use your credentials
- No trading permissions are requested or used

**If login fails**:
- Re-check your TOTP (must be fresh)
- Confirm API key is for "Historical Data API" enabled in your portal
- Ensure your SmartAPI app has the correct portal static IP registered

---

### Step 2: Understand the Left Panel (Universe Setup)

**WHERE**: Left side of dashboard after login

**WHAT'S THERE**:

#### A. Watchlist/Universe Text Area
```
exchange|trading_symbol|symbol_token|display_name|sector|market_cap
```

**Example rows:**
```
NSE|NIFTY50|99926000|NIFTY 50|Index|0
NSE|NIFTYBANK|99926009|NIFTY BANK|Sector Index|0
NSE|RELIANCE-EQ|2885|Reliance|Energy|1945000
```

**What each column means:**
- `exchange`: NSE (National Stock Exchange) or BSE (Bombay Stock Exchange)
- `trading_symbol`: Official trading code (e.g., RELIANCE-EQ, INFY)
- `symbol_token`: SmartAPI numeric token (used for API calls)
- `display_name`: Human-readable label
- `sector`: Category (Energy, IT, Pharma, etc.)
- `market_cap`: Market capitalization in crores (optional, needed for "Market Cap" filters)

**How to populate it:**
1. **Quick way**: Click one of the index presets (see below)
2. **Custom way**: Manually paste or type rows
3. **Smart way**: Use "Sync Instruments" → "Search" to find tokens

#### B. Index Presets (Quick-Add Buttons)
Click these to instantly add entire indices:

| Preset | Contains | Token Status |
|--------|----------|--------------|
| **NIFTY 50** | 50 large-cap stocks | ✅ Token ready |
| **SENSEX** | BSE top 30 stocks | ⚠️ **Token needed** |
| **NIFTY NEXT 50** | Stocks 51-100 by cap | ⚠️ Token needed |
| **NIFTY BANK** | 12 bank stocks | ✅ Token ready |
| **NIFTY FINANCIAL** | Insurance, fintech, etc. | ✅ Token ready |
| **NIFTY IT** | TCS, Infosys, Wipro, etc. | ✅ Token ready |
| **NIFTY PHARMA** | Pharma companies | ✅ Token ready |
| **NIFTY FMCG** | Staples & consumer | ✅ Token ready |
| **NIFTY AUTO** | Auto companies | ✅ Token ready |
| **NIFTY METAL** | Metal sector | ⚠️ Token needed |
| **NIFTY ENERGY** | Oil, gas, power | ⚠️ Token needed |
| **NIFTY REALTY** | Real estate | ⚠️ Token needed |

**Why some show `<token>`**:
These placeholders need to be resolved using the Instrument Master. See "Getting Missing Tokens" below.

#### C. Benchmark Selection
```
Benchmark: NSE|NIFTY50|99926000|NIFTY 50|Index|0
```

**What it does**: When you run analysis, results are compared against this benchmark's performance. This helps you see which instruments are **outperforming** vs **underperforming**.

**How to change it**: Paste a different instrument row or use the presets.

---

### Step 3: Getting Missing Tokens (Resolve `<token>`)

**WHERE**: "Sync Instruments" section (middle-left area)

**PROBLEM YOU'RE SEEING**:
```
NSE|NIFTYENERGY|<token>|NIFTY ENERGY|Sector Index|0
```

The `<token>` is a placeholder because SmartAPI needs a numeric ID for API calls.

**HOW TO RESOLVE IT**:

1. **Click "Sync Instruments"** button
   - Backend downloads Angel One's master instrument list
   - Takes ~10-30 seconds
   - You'll see a status message

2. **Use the Search Form** (appears after sync):
   - **Search for**: Type `NIFTY ENERGY`, `SENSEX`, etc.
   - **Exchange**: Leave as "NSE" for indices (use "BSE" for SENSEX)
   - **Click Search**
   - Results show matching instruments with their tokens

3. **Copy the token** from results:
   ```
   NIFTY ENERGY | NSE | 99926019 | NIFTY ENERGY | Index
   ```

4. **Update your watchlist** row:
   ```
   NSE|NIFTYENERGY|99926019|NIFTY ENERGY|Sector Index|0
   ```

**Why this is needed**:
- SmartAPI uses numeric tokens to fetch data
- Index names alone aren't enough
- The master list has ~7000+ instruments
- App caches it locally to avoid repeated downloads

---

### Step 4: Understanding Filters (Middle Section)

**WHERE**: Below the watchlist text area

**WHAT FILTERS DO**: They act like an AND-logic gate. Instruments must match **all** filters to appear in results.

#### Common Filter Examples:

| Filter | Means | Use Case |
|--------|-------|----------|
| `analysis_score >= 8` | Strong technical signal | Find high-conviction ideas |
| `rsi_14 between 35 and 75` | Not oversold/overbought | Avoid extremes |
| `volume > 20_day_avg` | Trading actively | Better liquidity |
| `current_price <= 0.50 * High price all time` | Trading at deep discount | Value hunting |
| `market_cap > 5000` | Large cap only | Conservative |
| `market_cap between 500 and 5000` | Mid cap | Growth |

**How to add a filter**:
1. Click "Add Filter" button
2. Select a field (e.g., `rsi_14`)
3. Select an operator (e.g., `between`)
4. Enter the value(s)

**If no results show up**:
- Filters might be too strict (e.g., `rsi_14 > 90` returns nothing)
- Solution: Loosen the filters OR check if your watchlist has valid tokens
- Error message will tell you which symbols failed

---

### Step 5: Understanding Formulas (Optional Advanced)

**WHERE**: Text area labeled "Formula (optional)"

**WHAT IT DOES**: An optional alternative to filters. Lets you write math expressions.

**Example**:
```
Current price <= 0.50 * High price all time AND Market Capitalization > 5000
```

---

## Docs: Preview & Deploy

This project includes a GitHub Actions workflow that builds the MkDocs site and deploys it to GitHub Pages on pushes to `main`.

Local preview:

```bash
pip install mkdocs mkdocs-material pymdown-extensions
mkdocs serve
```

Push workflow triggers when `docs/` or `mkdocs.yml` change. See `.github/workflows/deploy-docs.yml` for details.
