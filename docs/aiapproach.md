# AI Approach From First Principles

Last updated: 2026-05-12

## First Principles

The app should not ask AI to "predict stocks" directly. That is too unconstrained and too easy to overfit. The better design is to make AI operate on explicit market facts, transparent calculations, and auditable assumptions.

Core principles:

- Market data is observed, not invented.
- Indicators are deterministic transformations of data.
- Recommendations are hypotheses, not orders.
- Every AI output must reference the input signals it used.
- The app must separate signal generation from trade execution.
- AI should reduce cognitive load, not hide uncertainty.

## Data Layers

AI should work over layered data:

1. Raw data:
   - OHLCV candles.
   - LTP/OHLC quotes.
   - OI, PCR, OI buildup where available.
   - Instrument metadata.
   - Locally stored snapshots.
   - External fundamentals, news, and mutual-fund data if added.

2. Derived data:
   - Daily, weekly, fortnightly, monthly, quarterly, 6M, 1Y deltas.
   - Moving averages.
   - RSI.
   - Volume ratios.
   - Range and gap metrics.
   - Sector relative strength.
   - Distance from high/low.
   - Snapshot deltas.

3. Interpretive data:
   - "Sector leading market."
   - "Stock diverging from sector."
   - "Volume expansion without price confirmation."
   - "Index breadth weakening."
   - "Move possibly news-linked."

AI should only operate on layer 3 after layers 1 and 2 are computed by code.

## AI Use Cases

### 1. Screener Explanation

Input:

- Screener formula.
- Matched instruments.
- Indicator values.
- Period deltas.
- Benchmark/sector comparison.

Output:

- Plain-English explanation of why each instrument matched.
- Signal strengths and weaknesses.
- Missing data warnings.
- Suggested follow-up checks.

Example:

```text
NIFTY PHARMA matched because it is above SMA50, weekly momentum is positive, and RSI is not overextended. The weak point is low volume expansion, so this is a watchlist candidate rather than a high-conviction signal.
```

### 2. Sector Rotation Detection

Goal:

Find where money appears to be moving across sectors.

Method:

1. Compute sector/index deltas for daily, weekly, monthly, quarterly, 6M, and 1Y.
2. Rank each sector by each window.
3. Detect rank acceleration:
   - Daily rank much better than monthly rank.
   - Weekly rank improving versus quarterly rank.
   - Sector outperforming NIFTY 50 over multiple windows.
4. Ask AI to summarize the rotation narrative.

AI role:

- Explain the rank shifts.
- Highlight sectors with improving momentum.
- Flag possible false positives.

AI should not invent reasons unless news/fundamental data is available.

### 3. Anomaly Detection

Goal:

Identify unusual changes worth investigating.

Deterministic signals:

- Price move greater than rolling volatility threshold.
- Volume greater than 2x or 3x 20-day average.
- Gap above/below threshold.
- RSI jump.
- Sector divergence.
- Snapshot delta inconsistent with daily candle delta.

AI role:

- Group anomalies.
- Explain likely categories.
- Ask for missing context.
- Suggest which chart/timeframe to inspect.

### 4. News Attribution

SmartAPI does not appear to provide a news endpoint. If external news is added, AI can assist with attribution.

Pipeline:

1. Fetch news from external provider.
2. Normalize by symbol, sector, timestamp, source, headline, summary.
3. Compare timestamp with price/volume change.
4. Use AI to classify:
   - Earnings.
   - Regulation.
   - Management.
   - Macro.
   - Sector trend.
   - Corporate action.
   - Rumor/low confidence.

Output must include confidence:

```json
{
  "symbol": "NIFTY PHARMA",
  "move": "+1.8%",
  "possible_driver": "sector-wide pharma policy news",
  "confidence": "medium",
  "reason": "news occurred before the move and multiple pharma constituents moved together"
}
```

### 5. Natural-Language Screener Builder

Goal:

Convert user intent into deterministic filters.

User input:

```text
Find large-cap stocks trading below half their one-year high, with RSI under 60 and improving weekly strength.
```

AI output:

```json
{
  "formula": "current_price <= 0.50 * all_time_high AND market_cap > 5000 AND rsi_14 < 60 AND weekly_delta > 0",
  "filters": [
    {"field": "market_cap", "operator": "gt", "value": 5000},
    {"field": "rsi_14", "operator": "lt", "value": 60}
  ],
  "needs_fields": ["weekly_delta"]
}
```

AI must produce a structured plan that the backend validates before execution.

## Model Architecture

Recommended architecture:

The LLM should not call SmartAPI directly in the first version. It should call backend tools that enforce:

- Authentication boundaries.
- Rate limits.
- Cache use.
- No trading endpoints.
- Data schema validation.
