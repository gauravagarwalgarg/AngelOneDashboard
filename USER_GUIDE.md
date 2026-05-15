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

**This means**: "Show me instruments where the current price is at or below 50% of their all-time high AND they have a market cap over 5000 crores."

**Formula Syntax**:
- Fields must match the **Field Catalog** (see "Available Fields" section below)
- Operators: `AND`, `OR`, `>`, `<`, `>=`, `<=`, `==`, `!=`
- Literals: numbers (e.g., `5000`), percentages (e.g., `0.50`)

**Common Formulas**:
```
# Near all-time high
Current price > 0.90 * High price all time

# Volume surge
Volume > 2.0 * Volume 20 period average

# RSI extremes
RSI 14 > 70 OR RSI 14 < 30

# Above both moving averages
Current price > Simple Moving Average 50 AND Current price > Exponential Moving Average 20
```

**If formula has errors**, backend will reject it and show the error message.

---

### Step 6: Sorting & Limiting Results

**WHERE**: Right side of filter area

**Sort Field**: Which column to sort by (default: `analysis_score` = strongest signal first)

**Sort Direction**: `asc` (ascending) or `desc` (descending)

**Limit**: Max number of results (default: 20)

---

### Step 7: Running Analysis ("Universal Query")

**WHERE**: Green "Run Analysis" button (bottom-middle area)

**WHAT IT DOES**:
1. Takes your watchlist, filters, and formula
2. For each instrument in watchlist:
   - Fetches 1-2 years of historical candlestick data
   - Calculates technical indicators (RSI, moving averages, etc.)
   - Applies your filters and formula
   - Scores the match strength
3. Returns ranked list of matching instruments

**IF NO RESULTS SHOW**:
This usually means one of:

1. **Your watchlist has invalid tokens**
   - Error message: `"AG8001 Invalid Token"`
   - Solution: Use "Sync Instruments" to resolve `<token>` placeholders

2. **Your filters are too strict**
   - Example: `rsi_14 > 90` almost never matches
   - Solution: Loosen the constraints (e.g., `rsi_14 > 70`)

3. **No instruments in that universe match your criteria**
   - Example: Looking for stocks "up 50% monthly" might find zero matches in quiet markets
   - Solution: Try a broader filter or different universe

**PROPOSED UX IMPROVEMENT**:
When "Run Analysis" returns zero results, the dashboard should now show:
- ✅ Which filters were the bottleneck
- ✅ Recommended loosening (e.g., "try `rsi_14 > 65` instead of `> 90`")
- ✅ Alternative watchlist suggestions

---

### Step 8: Reading Analysis Results

**WHERE**: Right panel (after running analysis)

**WHAT YOU SEE**:

```
Generated at: 2026-05-15T14:32:00Z
Benchmark change: +0.8%
Total symbols: 50 (NIFTY 50 members)
Matched: 7 symbols matched your filter
```

**Result Table Columns**:

| Column | Meaning |
|--------|---------|
| `symbol` / `display_name` | Stock/index name |
| `current_price` | Last traded price |
| `previous_close` | Yesterday's close |
| `day_change_pct` | % change today |
| `range_pct` | % difference from today's high-low |
| `volume` | Shares traded today |
| `volume_20_avg` | 20-day average volume |
| `sma_20` / `sma_50` | 20-day / 50-day moving averages |
| `rsi_14` | Relative Strength Index (0-100) |
| `price_vs_sma_20` | How far price is from 20-day MA |
| `trend_score` | 0-10 trend strength |
| `analysis_score` | 0-10 overall match score |
| `recommendation` | BUY / HOLD / SELL / WATCH |
| `reason` | Plain English explanation |

**Example row**:
```
HDFC Bank | ₹1,850 | ₹1,820 | +1.6% | +3.2% | 8.5M | 6.2M | ₹1,855 | 68 | +0.3% | 7.2 | 8.5 | BUY | "Above SMA50, RSI moderate, volume strong"
```

---

### Step 9: Understanding Market Tracker

**WHERE**: "Market Tracker" button (below analysis results)

**WHAT IT DOES**: Shows how your current watchlist performed across multiple timeframes.

**Example Output**:

| Symbol | Daily | Weekly | Monthly | Quarterly | 6-Month | 1-Year |
|--------|-------|--------|---------|-----------|---------|--------|
| NIFTY 50 | +0.8% | +2.1% | +5.3% | +12.4% | +18.2% | +45.6% |
| HDFC | +1.2% | +3.4% | +6.8% | +15.2% | +22.1% | +38.9% |
| TCS | -0.5% | -1.2% | +2.1% | +8.3% | +14.2% | +32.1% |

**Why this matters**:
- See if a stock is leading or lagging over different periods
- Spot divergences (e.g., weekly up but monthly down = weakness)
- Understand the trend direction from multiple timeframes

**Trading session offset** (how "old" each metric is):
- Daily = 1 trading session ago
- Weekly = 5 trading sessions ago (~1 week)
- Monthly = 21 trading sessions ago (~1 month)
- Quarterly = 63 trading sessions ago (~3 months)
- 6-Month = 126 trading sessions ago
- 1-Year = 252 trading sessions ago (~1 year)

---

## Available Fields for Filters & Formulas

### Price & Volume Fields
- `current_price` - Last traded price
- `previous_close` - Yesterday's close
- `day_change_pct` - % change since yesterday
- `range_pct` - % from today's low to high
- `gap_pct` - Gap from previous close to today's open
- `volume` - Shares traded today
- `volume_20_period_average` - Average volume (last 20 days)

### Moving Averages & Momentum
- `Simple Moving Average 20` (SMA20)
- `Simple Moving Average 50` (SMA50)
- `Exponential Moving Average 20` (EMA20)
- `Exponential Moving Average 50` (EMA50)
- `RSI 14` - Relative Strength Index (0-100)

### Distance Metrics
- `price_vs_sma_20` - How far from 20-day MA
- `price_vs_sma_50` - How far from 50-day MA
- `High price all time` - Highest price in available history
- `Low price all time` - Lowest price in available history
- `distance_from_high` - How far from all-time high
- `distance_from_low` - How far from all-time low

### Scores & Derived Data
- `trend_score` (0-10) - Technical trend strength
- `analysis_score` (0-10) - Overall match score
- `market_cap` - Market capitalization (requires manual entry)
- `Weekly Delta %` - Week-over-week change
- `Monthly Delta %` - Month-over-month change
- `Yearly Delta %` - Year-over-year change

---

## Saved Screeners

**WHERE**: "Saved Screeners" section (left panel)

**WHAT IT DOES**: Save your filter + formula + watchlist combinations for later reuse.

**How to save**:
1. Configure your watchlist, filters, formula as desired
2. Enter a name: e.g., "50% Off High Cap Scan"
3. Enter a description: e.g., "Stocks trading below half their all-time high"
4. Click "Save Screener" button
5. Backend stores it in `backend/data/screeners.json`

**How to load**:
1. Click the screener name in the "Saved Screeners" list
2. Watchlist, filters, formula auto-populate
3. Click "Run Analysis" to run it immediately

**How to delete**:
1. Select the screener from the list
2. Click "Delete Screener" button
3. Removed from saved list

---

## Index Presets Explained

### Core Indices (Broad Market)
- **NIFTY 50**: 50 largest stocks, represents ~80% of market cap
- **SENSEX**: BSE's top 30 stocks (⚠️ token needs to be synced)
- **NIFTY NEXT 50**: Stocks ranked 51-100 by market cap

### Sector Indices (Ready to use)
- **NIFTY BANK**: 12 largest banks (HDFC, ICICI, Axis, etc.)
- **NIFTY FINANCIAL**: Insurance, fintech, NBFC
- **NIFTY IT**: TCS, Infosys, Wipro, HCL, etc.
- **NIFTY PHARMA**: Pharma companies (Cipla, Lupin, Aurobindo, etc.)
- **NIFTY FMCG**: Staples, consumer goods (ITC, Nestle, Britannia, etc.)
- **NIFTY AUTO**: Auto companies (Maruti, Hero MotoCorp, Bajaj, etc.)

### Sector Indices (Token needed)
- **NIFTY METAL**: Steel, aluminum, mining
- **NIFTY ENERGY**: Oil, gas, power
- **NIFTY REALTY**: Real estate and construction

**To use one with `<token>`**:
1. Click the preset button (adds row with `<token>`)
2. Click "Sync Instruments" if not done yet
3. Search for the index name
4. Copy the token from results
5. Paste back into watchlist (replace `<token>`)

---

## MCP (Model Context Protocol) - Future Integration

**WHAT IS MCP?**
A protocol for AI agents to safely access analysis data without trading permissions.

**WHAT YOU CAN DO SOON**:
With MCP, you could:
- Chat with an AI agent about your screeners
- Ask: "Find stocks that match: large-cap, near 52-week high, volume surge"
- AI runs the analysis and explains results

**AVAILABLE MCP TOOLS** (backend ready):
```
login_smartapi          - Authenticate
refresh_smartapi_session - Keep session active
run_scan                - Execute screener
save_screener           - Store filter definition
delete_screener         - Remove saved filter
sync_instruments        - Download master list
search_instruments      - Find tokens by name
explain_formula         - Validate and explain formula
```

**AVAILABLE MCP RESOURCES**:
```
screeners://saved       - Your saved screeners
analysis://fields       - Available filter fields
analysis://latest-scan  - Last run results
auth://session          - Current session info
instruments://scrip-master - Full instrument list
```

---

## Troubleshooting

### "AG8001 Invalid Token" Error
**Cause**: Watchlist has `<token>` or wrong token number.

**Fix**:
1. Click "Sync Instruments"
2. Search for the index/stock name
3. Copy the token
4. Update watchlist row

### "Run Analysis returns zero results"
**Cause**: Filters too strict or watchlist not populated.

**Fix**:
1. Check watchlist is not empty
2. Check all rows have valid tokens (no `<token>`)
3. Loosen filters (e.g., change `rsi_14 > 90` to `rsi_14 > 70`)
4. Check error message for which field caused rejection

### Login fails with "Invalid credentials"
**Cause**: Wrong API key, PIN, TOTP, or IP mismatch.

**Fix**:
1. Confirm API key in Angel One portal (should say "Historical Data API" enabled)
2. Generate fresh TOTP (don't reuse old codes)
3. Confirm SmartAPI app has correct portal static IP
4. Re-check PIN/password

### "Access denied because of exceeding access rate"
**Cause**: Too many API calls too fast.

**Fix**:
1. Wait a few minutes
2. Avoid running multiple analyses in quick succession
3. The app throttles calls automatically; this is rare

---

## Quick Tips

1. **Start simple**: Load NIFTY 50, run with default filters, see what matches.

2. **Use presets**: Don't manually type watchlists; click preset buttons.

3. **Save often**: Save your best screener definitions so you don't recreate them.

4. **Check market tracker**: See how your universe performed across timeframes before analyzing it.

5. **Read explanations**: Every result includes a "reason" field explaining why it matched.

6. **Use formula OR filters**: You don't need both. Formula is more flexible; filters are simpler.

7. **Market cap needs help**: If you filter by market cap, you must add it manually to watchlist rows (last column).

8. **Benchmark matters**: Change benchmark to compare against different indices (e.g., compare stocks vs NIFTY PHARMA, not NIFTY 50).

---

## Next: AI-Assisted Workflows

Once MCP integration is live, you'll be able to:
- Chat: "Show me high-conviction pharma plays"
- AI: Builds screener, runs analysis, explains results
- You: Decide to save, modify, or explore further

---

**Still confused?** Check the backend endpoints (`Design.md` and `Working.md`) or post a question. This guide will be updated as new features ship.
