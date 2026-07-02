# AI Approach

How AI fits into this dashboard  and how it doesn't.

## Core Philosophy

```
Raw Data → Deterministic Computation → AI Explanation
   ↑                ↑                        ↑
SmartAPI        indicators.py          OpenAI/Claude
(observed)      (calculated)           (interpreted)
```

**AI does NOT**:
- Predict stock prices
- Generate trading signals
- Replace the indicator math
- Call SmartAPI directly

**AI DOES**:
- Explain why a screener matched certain stocks
- Summarize market tracker data in plain English
- Classify news as bullish/bearish
- Convert natural language into screener formulas
- Detect anomalies from computed signals

## Implementation Status

| Feature | Status | Approach |
|---------|--------|----------|
| Composite scoring | ✅ Done | Rule-based formula in `screener.py` |
| Recommendation labels | ✅ Done | If/else on score + RSI + distance from ATH |
| Diagnostics (no-match) | ✅ Done | Per-filter elimination analysis |
| LLM explanation | 🔜 Planned | Send scan results → get prose summary |
| Natural language screener | 🔜 Planned | "Large caps down 30%" → formula |
| News sentiment | 🔜 Planned | Headlines → bullish/bearish/neutral |
| MCP server | 🔜 Planned | AI agents call backend tools |

## Current "AI" (Rule-Based)

The `analysis_score` is a weighted composite:

```python
trend_score = (
    change_pct * 0.35
    + price_vs_sma_20_pct * 0.2
    + price_vs_sma_50_pct * 0.2
    + (rsi_14 - 50) * 0.15
    + (volume_vs_avg_20 - 1) * 10 * 0.1
)

analysis_score = (
    trend_score
    + max(0, 100 + distance_from_ath) * 0.03
    + (5 if large_cap else 0)
)
```

Recommendation classification:
- **High-conviction candidate**: score ≥ 18, RSI 45-72
- **Accumulation watchlist**: score ≥ 10
- **Deep value review**: 50%+ below fetched high
- **Monitor**: everything else

This is transparent, auditable, and deterministic. No black box.

## Planned LLM Integration

### 1. Scan Explanation

After a screener runs, send results to an LLM:

```
Input: Top 5 matched stocks with their indicators
Prompt: "Explain why each stock matched. Highlight strengths and risks."
Output: Plain English summary with actionable context
```

### 2. Natural Language → Formula

```
User: "Large caps below their SMA50 with high volume"
AI: { "formula": "market_cap > 5000 AND current_price < sma_50 AND volume_vs_avg_20 > 2" }
Backend validates and executes.
```

### 3. News Sentiment

```
Input: 10 headlines from Google News RSS
Prompt: "Classify each as bullish/bearish/neutral for Indian markets"
Output: [{"headline": "...", "sentiment": "bullish", "impact": "medium"}]
```

### 4. Morning Briefing

```
Input: Market tracker output (all indices + deltas)
Prompt: "Summarize today's market in 3 paragraphs for an Indian equity investor"
Output: Prose summary highlighting sector rotation, momentum shifts, anomalies
```

### 5. Anomaly Detection

```
Input: All stock metrics from a scan
Prompt: "Flag stocks with unusual patterns: volume spike + small price move, divergence from sector, RSI extreme + volume dry-up"
Output: Watchlist with explanations
```

## AI Architecture (Target)

```
┌─────────────────────────────────────────────┐
│           Deterministic Layer                │
│  SmartAPI → Candles → Indicators → Filters  │
│        (math, no uncertainty)               │
└──────────────────┬──────────────────────────┘
                   │ structured results
                   ▼
┌─────────────────────────────────────────────┐
│           AI Interpretation Layer            │
│  • Explain results (why did X match?)       │
│  • Summarize market day                     │
│  • Classify news sentiment                  │
│  • Generate formulas from natural language   │
│  • Detect anomalies                         │
│         (LLM, adds uncertainty)             │
└──────────────────┬──────────────────────────┘
                   │ prose + classifications
                   ▼
┌─────────────────────────────────────────────┐
│              User Interface                  │
│  Signals = deterministic (verifiable)       │
│  Explanations = AI (advisory only)          │
└─────────────────────────────────────────────┘
```

## Guardrails

- AI output is always labeled as interpretation, never as fact
- Every AI explanation references the input signals it used
- No "buy now" language  only "candidate", "watchlist", "review"
- If news source is missing, AI says "unable to attribute" (not guessing)
- Formula generation is validated by the backend before execution
- AI never calls SmartAPI directly  only reads computed results

## MCP Server Design

Expose the backend as an MCP server so AI clients (Claude, Kiro, custom agents) can:

| Tool | What it does |
|------|--------------|
| `login_smartapi` | Authenticate (requires human TOTP) |
| `run_scan` | Execute screener with filters |
| `get_market_tracker` | Fetch index performance |
| `search_instruments` | Find stock/index tokens |
| `explain_formula` | Parse and explain a formula |
| `get_field_catalog` | List all available screener fields |

AI agents get structured data, not raw HTML or ambiguous prompts.

## Why NOT Use ML Models?

| Approach | Problem |
|----------|---------|
| LSTM/RNN price prediction | Overfits, doesn't generalize, gives false confidence |
| Random Forest classification | Needs labeled training data (what is a "good" stock?) |
| Sentiment model (FinBERT) | Overkill for 10 headlines; GPT-4o-mini is cheaper and better |
| Reinforcement learning | Requires backtesting infra + trading sim  out of scope |

The better approach: **Use deterministic indicators for signals, LLM for interpretation.** This is how professional quant desks work  math for detection, humans (or AI) for judgment.
