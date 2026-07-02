# User Guide

Complete walkthrough of every tab and feature.

## Login

1. Open `http://localhost:5173`
2. Enter your Angel One SmartAPI credentials:
   - **API Key**: From SmartAPI portal (create a "Historical Data API" app)
   - **Client Code**: Your Angel One client code
   - **PIN/Password**: Your trading PIN
   - **TOTP**: Time-based OTP from your authenticator app
3. Click **Enter Dashboard**

!!! note "Session Duration"
    SmartAPI sessions expire at midnight IST. You'll need to login fresh each day.

!!! warning "Static IP"
    Your SmartAPI app must have your public IP whitelisted in the portal settings.

---

## Tab 1: Summary (📊)

**Purpose**: Quick market snapshot  what happened today?

### What it shows
- Market tracker table with all your watchlist indices/stocks
- Period performance: daily, weekly, fortnightly, monthly, quarterly, 6M, 1Y deltas
- Snapshot comparison: today vs previous run

### How to use
1. Click **Refresh Tracker** button
2. Wait 10-30 seconds (fetches candles from SmartAPI with rate limiting)
3. Table populates with percentage changes across all time windows
4. Green = up, Red = down

### Snapshot Comparison
Each time you refresh, a snapshot is saved to `backend/data/market_snapshots/YYYY-MM-DD.json`. When you refresh again (same day or next day), the "Snapshot Delta" column shows how much the price moved since your last run.

**Use case**: Run the tracker at market open and market close. The snapshot delta shows intraday change.

---

## Tab 2: Mutual Funds (💰)

**Purpose**: Track NAV performance of your mutual fund portfolio.

### What it shows
- Fund name, latest NAV, NAV date
- 1-month, 3-month, 6-month, 1-year returns
- AI-style recommendation (based on return momentum)

### How to use
1. Click **Load Funds**
2. Data loads from mfapi.in (no SmartAPI auth needed)
3. Pre-configured tracked funds:
   - HDFC Index Fund Nifty 50 Direct Growth
   - HDFC Flexi Cap Fund Direct Growth
   - Parag Parikh Flexi Cap Fund Direct Growth
   - HDFC Small Cap Fund Direct Growth
   - HDFC Mid-Cap Opportunities Fund Direct Growth

### Customizing tracked funds
Edit `backend/app/mutual_funds.py` to add/remove fund scheme codes.

---

## Tab 3: News (📰)

**Purpose**: Indian stock market headlines.

### What it shows
- Headlines from Google News RSS
- Source, publication date, and link

### How to use
1. Click **Load News**
2. Fetches latest headlines for "Indian stock market OR Nifty OR Sensex"
3. Click any headline to open the source article

No auth required.

---

## Tab 4: Instruments (🔍)

**Purpose**: Find stock/index tokens for your watchlist.

### What it shows
- Scrip master status (total instruments cached)
- Search by symbol, name, or token
- Pre-built index presets

### How to use
1. **Sync Master**  Downloads Angel One's full instrument list (~90k instruments)
2. **Search**  Type "RELIANCE" or "NIFTY" to find the exact token
3. **Add to Watchlist**  Click to add an instrument to your screener watchlist
4. **Set as Benchmark**  Set an index as your comparison benchmark

### Index Presets
Pre-configured buttons for common indices (NIFTY 50, BANK NIFTY, etc.). Click to add to watchlist instantly.

---

## Tab 5: Stock Screener (⚙️)

**Purpose**: Formula-based stock discovery  the core analysis tool.

### Watchlist
Symbols in pipe-delimited format:
```
EXCHANGE|TRADING_SYMBOL|SYMBOL_TOKEN|DISPLAY_NAME|SECTOR|MARKET_CAP
```

Use the Instruments tab to find valid tokens.

### Structured Filters
Click **Add Filter** to create conditions:
- Field: `rsi_14`, `change_pct`, `volume_vs_avg_20`, `analysis_score`, etc.
- Operator: `gt`, `gte`, `lt`, `lte`, `eq`, `between`
- Value: numeric threshold

**Example**: `rsi_14 between 30 - 70` (stocks not overbought/oversold)

### Formula (Optional)
Free-text expression combining fields with AND/OR logic:
```
current_price > sma_50 AND rsi_14 < 70 AND volume_vs_avg_20 > 1.5
```

Leave empty to use only structured filters.

### Available Fields

| Field | What it measures |
|-------|-----------------|
| `current_price` | Latest closing price |
| `change_pct` | Day change % |
| `rsi_14` | 14-period RSI (30=oversold, 70=overbought) |
| `sma_20` / `sma_50` | Simple moving averages |
| `ema_20` / `ema_50` | Exponential moving averages |
| `volume_vs_avg_20` | Today's volume vs 20-day average (>2 = unusual) |
| `price_vs_sma_20_pct` | Distance from SMA20 (positive = above) |
| `all_time_high` | Highest price in history |
| `distance_from_all_time_high_pct` | How far below the high (-50 = half off) |
| `analysis_score` | Composite recommendation score |
| `trend_score` | Technical momentum composite |
| `market_cap` | Market cap (from watchlist metadata) |

### Saving Screeners
- Name your screener and click **Save**
- Load saved screeners from the Instruments tab
- Screeners persist in `backend/data/screeners.json`

### Troubleshooting: No Results

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Formula eliminated ALL symbols" | Formula too restrictive | Clear formula field, use only structured filters |
| "Skipped N rows with missing tokens" | `<token>` placeholders | Use Instruments tab to find real tokens |
| "Not enough candles" | New listing or wrong token | Verify token in scrip master |
| "Invalid Token" (AG8001) | Session expired or wrong API key | Re-login with fresh TOTP |

---

## Tab 6: Snapshots (📈)

**Purpose**: Compare market performance over time.

### What it shows
- All saved daily snapshots with timestamps
- Period deltas showing how each index moved
- Run-to-run comparison

### How snapshots work
1. Every "Refresh Tracker" run saves a snapshot to disk
2. Next time you run, the previous snapshot's closing prices are loaded
3. The "Snapshot Delta" shows the difference between runs

**Best practice**: Run the tracker once daily after market close. Over weeks, you build a local database of market movements.

---

## Tab 7: AI Predictions (🤖)

**Purpose**: AI-powered market analysis *(planned feature)*.

### Current State
- Shows MCP capability hints (what tools an AI agent could call)
- Lists available resources and tools

### Planned Features
- Natural language → screener formula conversion
- Scan result explanation ("why did these stocks match?")
- News sentiment classification (bullish/bearish/neutral)
- Sector rotation detection
- Anomaly alerts (unusual volume + price divergence)

---

## Why Run Locally? Why Not Deploy?

| Reason | Explanation |
|--------|-------------|
| **SmartAPI requires daily TOTP** | Can't automate login  needs human interaction |
| **IP whitelisting** | SmartAPI apps are locked to your IP |
| **Session expires at midnight** | No persistent background service possible |
| **Sensitive credentials** | API keys + TOTP should never leave your machine |
| **No trading risk** | Running locally = zero attack surface |
| **Free** | No hosting costs, no subscription |
| **Data ownership** | All snapshots are yours, on your disk |

### How AI Can Help (Even Locally)

1. **Post-scan explanation**  After running a screener, send results to an LLM to get "Here's why NIFTY PHARMA is showing strength: RSI recovering from oversold, above SMA50, volume expanding"
2. **Morning briefing**  Run tracker → pipe output to AI → get a 3-paragraph market summary
3. **Natural language screener**  Type "large caps that fell 30% from their high" → AI generates the formula
4. **News attribution**  News headlines + price data → AI says "HDFC BANK up 2% likely due to RBI policy news"

All of this works locally with an OpenAI API key  no deployment needed.

---

## Daily Workflow (Recommended)

```
9:30 AM   Login with fresh TOTP
9:31 AM   Refresh Tracker (captures market open snapshot)
3:30 PM   Refresh Tracker again (captures market close)
3:31 PM   Run Stock Screener with your filters
3:32 PM   Check Mutual Funds performance
3:33 PM   Load News for context
Evening   Compare snapshots, review AI suggestions
```
