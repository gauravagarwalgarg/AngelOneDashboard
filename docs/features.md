# Stock Screener

The core analysis tool  formula-based stock discovery with 25+ technical indicators.

## How It Works

```
Watchlist (symbols) + Filters + Formula
    → SmartAPI Historical Candles (cached)
    → Indicator Computation (SMA, EMA, RSI, volume)
    → Filter Application (structured + formula)
    → Sorted Results with Recommendations
```

## Available Indicators

### Price
| Field | Description |
|-------|-------------|
| `current_price` | Latest closing price |
| `last_price` | Alias for current price |
| `previous_close` | Yesterday's close |
| `open_price` | Today's open |
| `day_high` / `day_low` | Today's range |

### Momentum
| Field | Description |
|-------|-------------|
| `change_pct` | Day change % |
| `gap_pct` | Opening gap vs previous close |
| `rsi_14` | 14-period RSI (30=oversold, 70=overbought) |

### Trend
| Field | Description |
|-------|-------------|
| `sma_20` / `sma_50` | Simple moving averages |
| `ema_20` / `ema_50` | Exponential moving averages |
| `price_vs_sma_20_pct` | Distance from SMA20 |
| `price_vs_sma_50_pct` | Distance from SMA50 |

### Volume
| Field | Description |
|-------|-------------|
| `volume` | Today's volume |
| `avg_volume_20` | 20-day average volume |
| `volume_vs_avg_20` | Volume ratio (>2 = unusual activity) |

### History
| Field | Description |
|-------|-------------|
| `all_time_high` / `all_time_low` | Extremes in fetched history |
| `distance_from_all_time_high_pct` | How far below ATH (-50 = half off) |
| `distance_from_all_time_low_pct` | How far above ATL |
| `breakout_20d` | Distance from 20-day high |
| `breakdown_20d` | Distance from 20-day low |

### Composite
| Field | Description |
|-------|-------------|
| `trend_score` | Weighted momentum composite |
| `analysis_score` | Full recommendation score |

### Volatility
| Field | Description |
|-------|-------------|
| `range_pct` | Intraday range as percentage |

## Filter Operators

| Operator | Example | Meaning |
|----------|---------|---------|
| `gt` | rsi_14 gt 50 | Greater than |
| `gte` | analysis_score gte 10 | Greater or equal |
| `lt` | distance_from_all_time_high_pct lt -30 | Less than |
| `lte` | volume_vs_avg_20 lte 0.5 | Less or equal |
| `eq` | change_pct eq 0 | Exactly equal |
| `between` | rsi_14 between 30-70 | In range (inclusive) |

## Formula Language

Free-text boolean expressions using field names:

```
current_price > sma_50 AND rsi_14 < 70
```

```
volume_vs_avg_20 > 2 AND change_pct > 1.5 OR change_pct < -1.5
```

### Aliases (natural language → field names)
| You can type | Maps to |
|--------------|---------|
| current price | `current_price` |
| high price all time | `all_time_high` |
| market capitalization | `market_cap` |
| change % | `change_pct` |
| price vs sma 20 % | `price_vs_sma_20_pct` |

## Scoring Algorithm

```python
trend_score = (
    change_pct * 0.35          # Recent momentum
    + price_vs_sma_20 * 0.2    # Short-term trend
    + price_vs_sma_50 * 0.2    # Medium-term trend
    + (rsi_14 - 50) * 0.15     # RSI positioning
    + (vol_ratio - 1) * 10 * 0.1  # Volume confirmation
)

analysis_score = trend_score
    + (nearness_to_high * 0.03)   # Not too far from ATH
    + (5 if large_cap else 0)      # Size bias
```

## Recommendations

| Label | Criteria |
|-------|----------|
| **High-conviction candidate** | score ≥ 18, RSI 45-72 |
| **Accumulation watchlist** | score ≥ 10 |
| **Deep value review** | 50%+ below fetched high |
| **Monitor** | Everything else |

## Screener Ideas

### Momentum Breakout
```
Filters: volume_vs_avg_20 gt 2, change_pct gt 1.5
Sort: change_pct desc
```

### Oversold Bounce Candidates
```
Filters: rsi_14 between 25-35, price_vs_sma_50_pct lt -5
Sort: rsi_14 asc
```

### Large Cap Strength
```
Formula: market_cap > 5000 AND current_price > sma_50 AND rsi_14 > 50
Sort: analysis_score desc
```

### Near All-Time High (Breakout Watch)
```
Filters: distance_from_all_time_high_pct between -5 to 0
Sort: distance_from_all_time_high_pct desc
```

---

## Mutual Fund Tracking

NAV data from [mfapi.in](https://www.mfapi.in/) (free, no auth).

### Tracked Funds
- HDFC Index Fund Nifty 50 Direct Growth
- HDFC Flexi Cap Fund Direct Growth
- Parag Parikh Flexi Cap Fund Direct Growth
- HDFC Small Cap Fund Direct Growth
- HDFC Mid-Cap Opportunities Fund Direct Growth

### Returns Computed
- 1-month, 3-month, 6-month, 1-year NAV returns
- Recommendation based on short-term vs long-term momentum

### Customizing
Edit `backend/app/mutual_funds.py` to add scheme codes. Find codes at mfapi.in.

---

## Watchlist Format

```
EXCHANGE|TRADING_SYMBOL|SYMBOL_TOKEN|DISPLAY_NAME|SECTOR|MARKET_CAP
```

Example:
```
NSE|RELIANCE-EQ|2885|Reliance Industries|Energy|1945000
NSE|NIFTY50|99926000|NIFTY 50|Index|0
NSE|HDFCBANK-EQ|1333|HDFC Bank|Banking|1200000
```

Find tokens using the **Instruments** tab → search → add to watchlist.
