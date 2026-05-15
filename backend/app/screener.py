from __future__ import annotations

from datetime import datetime
from typing import Any

from .formula_engine import FORMULA_ALIASES, evaluate_formula
from .indicators import ema, pct_change, rsi, sma
from .models import FilterRule, IndicatorField, ScanResponse, StockMetric, SymbolInput, TriggerEvent, TriggerRule


AVAILABLE_FIELDS = [
    IndicatorField(key="current_price", label="Current Price", description="Latest closing price from the selected interval.", category="price"),
    IndicatorField(key="last_price", label="Last Price", description="Alias for current price.", category="price"),
    IndicatorField(key="change_pct", label="Change %", description="Percentage change from previous close.", category="momentum"),
    IndicatorField(key="range_pct", label="Range %", description="Intraday range percentage.", category="volatility"),
    IndicatorField(key="gap_pct", label="Gap %", description="Opening gap against previous close.", category="momentum"),
    IndicatorField(key="volume", label="Volume", description="Current candle volume.", category="volume"),
    IndicatorField(key="avg_volume_20", label="20 Avg Volume", description="Average volume across 20 candles.", category="volume"),
    IndicatorField(key="volume_vs_avg_20", label="Volume vs Avg 20", description="Current volume divided by the 20-candle average.", category="volume"),
    IndicatorField(key="market_cap", label="Market Cap", description="Market capitalization supplied in your watchlist metadata.", category="fundamental"),
    IndicatorField(key="sma_20", label="SMA 20", description="20-period simple moving average.", category="trend"),
    IndicatorField(key="sma_50", label="SMA 50", description="50-period simple moving average.", category="trend"),
    IndicatorField(key="ema_20", label="EMA 20", description="20-period exponential moving average.", category="trend"),
    IndicatorField(key="ema_50", label="EMA 50", description="50-period exponential moving average.", category="trend"),
    IndicatorField(key="rsi_14", label="RSI 14", description="14-period RSI.", category="momentum"),
    IndicatorField(key="all_time_high", label="All-Time High", description="Highest price in fetched history.", category="history"),
    IndicatorField(key="all_time_low", label="All-Time Low", description="Lowest price in fetched history.", category="history"),
    IndicatorField(key="distance_from_all_time_high_pct", label="Distance From ATH %", description="Distance from the fetched all-time high.", category="history"),
    IndicatorField(key="distance_from_all_time_low_pct", label="Distance From ATL %", description="Distance from the fetched all-time low.", category="history"),
    IndicatorField(key="price_vs_sma_20_pct", label="Price vs SMA20 %", description="Distance from the 20-period SMA.", category="trend"),
    IndicatorField(key="price_vs_sma_50_pct", label="Price vs SMA50 %", description="Distance from the 50-period SMA.", category="trend"),
    IndicatorField(key="trend_score", label="Trend Score", description="Technical momentum composite.", category="composite"),
    IndicatorField(key="analysis_score", label="Analysis Score", description="Composite recommendation score.", category="composite"),
]


def build_metric(symbol: SymbolInput, candles: list[list[Any]]) -> StockMetric:
    highs = [float(row[2]) for row in candles]
    lows = [float(row[3]) for row in candles]
    closes = [float(row[4]) for row in candles]
    volumes = [float(row[5]) for row in candles]
    opens = [float(row[1]) for row in candles]

    current_price = closes[-1]
    previous_close = closes[-2]
    open_price = opens[-1]
    day_high = highs[-1]
    day_low = lows[-1]
    volume = volumes[-1]
    avg_volume_20 = sum(volumes[-20:]) / 20
    sma_20 = sma(closes, 20)
    sma_50 = sma(closes, 50)
    ema_20 = ema(closes, 20)
    ema_50 = ema(closes, 50)
    rsi_14 = rsi(closes, 14)
    highest_20 = max(highs[-20:])
    lowest_20 = min(lows[-20:])
    all_time_high = max(highs)
    all_time_low = min(lows)
    change_pct = pct_change(current_price, previous_close)
    gap_pct = pct_change(open_price, previous_close)
    range_pct = pct_change(day_high, day_low)
    breakout_20d = pct_change(current_price, highest_20)
    breakdown_20d = pct_change(current_price, lowest_20)
    price_vs_sma_20_pct = pct_change(current_price, sma_20)
    price_vs_sma_50_pct = pct_change(current_price, sma_50)
    distance_from_all_time_high_pct = pct_change(current_price, all_time_high)
    distance_from_all_time_low_pct = pct_change(current_price, all_time_low)
    volume_vs_avg_20 = volume / avg_volume_20 if avg_volume_20 else 0.0
    trend_score = (
        (change_pct * 0.35)
        + (price_vs_sma_20_pct * 0.2)
        + (price_vs_sma_50_pct * 0.2)
        + ((rsi_14 - 50) * 0.15)
        + ((volume_vs_avg_20 - 1) * 10 * 0.1)
    )
    analysis_score = (
        trend_score
        + (max(0.0, 100 + distance_from_all_time_high_pct) * 0.03)
        + (5 if symbol.market_cap and symbol.market_cap >= 5000 else 0)
    )
    recommendation, reason = classify_recommendation(analysis_score, rsi_14, distance_from_all_time_high_pct, symbol.market_cap)

    return StockMetric(
        exchange=symbol.exchange,
        trading_symbol=symbol.trading_symbol,
        symbol_token=symbol.symbol_token,
        display_name=symbol.display_name or symbol.trading_symbol,
        sector=symbol.sector,
        market_cap=round(symbol.market_cap, 2) if symbol.market_cap is not None else None,
        last_price=round(current_price, 2),
        current_price=round(current_price, 2),
        previous_close=round(previous_close, 2),
        open_price=round(open_price, 2),
        day_high=round(day_high, 2),
        day_low=round(day_low, 2),
        volume=round(volume, 2),
        change_pct=round(change_pct, 2),
        range_pct=round(range_pct, 2),
        gap_pct=round(gap_pct, 2),
        sma_20=round(sma_20, 2),
        sma_50=round(sma_50, 2),
        ema_20=round(ema_20, 2),
        ema_50=round(ema_50, 2),
        rsi_14=round(rsi_14, 2),
        breakout_20d=round(breakout_20d, 2),
        breakdown_20d=round(breakdown_20d, 2),
        avg_volume_20=round(avg_volume_20, 2),
        volume_vs_avg_20=round(volume_vs_avg_20, 2),
        price_vs_sma_20_pct=round(price_vs_sma_20_pct, 2),
        price_vs_sma_50_pct=round(price_vs_sma_50_pct, 2),
        all_time_high=round(all_time_high, 2),
        all_time_low=round(all_time_low, 2),
        distance_from_all_time_high_pct=round(distance_from_all_time_high_pct, 2),
        distance_from_all_time_low_pct=round(distance_from_all_time_low_pct, 2),
        trend_score=round(trend_score, 2),
        analysis_score=round(analysis_score, 2),
        recommendation=recommendation,
        recommendation_reason=reason,
    )


def classify_recommendation(score: float, rsi_value: float, distance_from_ath: float, market_cap: float | None) -> tuple[str, str]:
    cap_text = "large-cap bias present" if market_cap and market_cap >= 5000 else "market-cap input missing or below preferred threshold"
    if score >= 18 and 45 <= rsi_value <= 72:
        return "High-conviction candidate", f"Strong composite score, balanced RSI, and {cap_text}."
    if score >= 10:
        return "Accumulation watchlist", f"Positive technical structure with {cap_text}."
    if distance_from_ath <= -50:
        return "Deep value review", "Trading far below fetched high; needs thesis validation before action."
    return "Monitor", "Signals are mixed; keep on watch rather than acting immediately."


def _value_for(metric: StockMetric, field: str) -> float:
    value = getattr(metric, field, None)
    if value is None:
        raise KeyError(f"Unknown screener field: {field}")
    return float(value)


def matches_filter(metric: StockMetric, rule: FilterRule) -> bool:
    left = _value_for(metric, rule.field)
    right = _value_for(metric, rule.compare_field) if rule.compare_field else rule.value

    if rule.operator == "gt":
        return left > float(right)
    if rule.operator == "gte":
        return left >= float(right)
    if rule.operator == "lt":
        return left < float(right)
    if rule.operator == "lte":
        return left <= float(right)
    if rule.operator == "eq":
        return left == float(right)
    if rule.operator == "between":
        return float(rule.min_value) <= left <= float(rule.max_value)
    if rule.operator == "crosses_above":
        return left > float(right)
    if rule.operator == "crosses_below":
        return left < float(right)
    raise ValueError(f"Unsupported operator: {rule.operator}")


def apply_filters(metrics: list[StockMetric], filters: list[FilterRule], formula: str | None = None) -> list[StockMetric]:
    filtered = metrics
    for rule in filters:
        filtered = [metric for metric in filtered if matches_filter(metric, rule)]
    if formula:
        filtered = [metric for metric in filtered if evaluate_formula(metric, formula)]
    return filtered


def sort_metrics(metrics: list[StockMetric], field: str, direction: str) -> list[StockMetric]:
    reverse = direction == "desc"
    return sorted(metrics, key=lambda metric: getattr(metric, field), reverse=reverse)


def _compare_value(value: float, rule: TriggerRule) -> bool:
    if rule.operator == "gt":
        return value > float(rule.threshold)
    if rule.operator == "gte":
        return value >= float(rule.threshold)
    if rule.operator == "lt":
        return value < float(rule.threshold)
    if rule.operator == "lte":
        return value <= float(rule.threshold)
    if rule.operator == "eq":
        return value == float(rule.threshold)
    if rule.operator == "between":
        return float(rule.min_value) <= value <= float(rule.max_value)
    if rule.operator == "crosses_above":
        return value > float(rule.threshold)
    if rule.operator == "crosses_below":
        return value < float(rule.threshold)
    return False


def evaluate_triggers(benchmark_change_pct: float | None, metrics: list[StockMetric], trigger_rules: list[TriggerRule]) -> list[TriggerEvent]:
    events: list[TriggerEvent] = []
    benchmark_metric = {
        "benchmark_change_pct": benchmark_change_pct or 0.0,
        "matched_count": float(len(metrics)),
    }

    for rule in trigger_rules:
        if not rule.enabled:
            continue

        observed = benchmark_metric.get(rule.target_field)
        if observed is None and metrics:
            observed = getattr(metrics[0], rule.target_field, None)
        if observed is None:
            continue

        if not _compare_value(float(observed), rule):
            continue

        events.append(
            TriggerEvent(
                trigger_id=rule.id,
                trigger_name=rule.name,
                field=rule.target_field,
                observed_value=round(float(observed), 2),
                fired_at=datetime.utcnow(),
                message=f"{rule.name} fired because {rule.target_field} reached {round(float(observed), 2)}.",
            )
        )
    return events


def _analyze_no_match_diagnostics(
    metrics: list[StockMetric], filters: list[FilterRule], formula: str | None
) -> list[str]:
    """
    When no symbols match, analyze which filters are the bottleneck.
    This helps users understand why their query returned nothing.
    """
    if not filters and not formula:
        return ["No filters or formula provided; try adding constraints to narrow results."]

    diagnostics: list[str] = []

    # Check each filter individually to see how many symbols it eliminates
    for i, rule in enumerate(filters):
        matches = [m for m in metrics if matches_filter(m, rule)]
        elimination_pct = 100 * (1 - len(matches) / len(metrics)) if metrics else 0
        if len(matches) == 0:
            diagnostics.append(
                f"🔴 Filter #{i+1} ({rule.field} {rule.operator} {rule.value or f'{rule.min_value}-{rule.max_value}'}) "
                f"eliminated ALL symbols. Try loosening this constraint."
            )
        elif elimination_pct > 80:
            diagnostics.append(
                f"⚠️  Filter #{i+1} ({rule.field}) is very restrictive, eliminating {elimination_pct:.0f}% of symbols. "
                f"Consider relaxing it or removing it."
            )

    # Check formula
    if formula:
        try:
            matches = [m for m in metrics if evaluate_formula(m, formula)]
            elimination_pct = 100 * (1 - len(matches) / len(metrics)) if metrics else 0
            if len(matches) == 0:
                diagnostics.append(f"🔴 Formula eliminated ALL symbols. Check your formula syntax or try simpler conditions.")
            elif elimination_pct > 80:
                diagnostics.append(f"⚠️  Formula is very restrictive, eliminating {elimination_pct:.0f}% of symbols.")
        except Exception as e:
            diagnostics.append(f"⚠️  Formula syntax issue: {str(e)}")

    # Provide recommendations
    if not diagnostics:
        diagnostics.append("No matches found, but filters look reasonable. Try a different watchlist or benchmark.")
    else:
        # Add suggestions
        sample_looser_suggestions = [
            "Try loosening numeric thresholds (e.g., rsi_14 > 70 → rsi_14 > 60)",
            "Check if your watchlist has valid tokens (no <token> placeholders)",
            "Expand your watchlist to include more instruments",
            "Run Market Tracker first to see current price ranges",
        ]
        diagnostics.append("\n💡 Suggestions: " + " OR ".join(sample_looser_suggestions[:2]))

    return diagnostics


def make_scan_response(
    benchmark_change_pct: float | None,
    metrics: list[StockMetric],
    filtered_metrics: list[StockMetric],
    trigger_rules: list[TriggerRule],
    formula: str | None,
    filters: list[FilterRule] | None = None,
    warnings: list[str] | None = None,
) -> ScanResponse:
    warnings_list = warnings or []

    # Add diagnostics if no matches found
    if len(filtered_metrics) == 0 and len(metrics) > 0:
        diagnostics = _analyze_no_match_diagnostics(metrics, filters or [], formula)
        warnings_list.extend(diagnostics)

    return ScanResponse(
        generated_at=datetime.utcnow(),
        benchmark_change_pct=benchmark_change_pct,
        total_symbols=len(metrics),
        matched_symbols=len(filtered_metrics),
        formula_applied=formula,
        metrics=filtered_metrics,
        triggered_events=evaluate_triggers(benchmark_change_pct, filtered_metrics, trigger_rules),
        warnings=warnings_list,
    )
