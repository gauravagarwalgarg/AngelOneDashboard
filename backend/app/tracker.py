from __future__ import annotations

from datetime import datetime
from typing import Any

from .indicators import pct_change
from .models import MarketTrackerItem, PeriodDeltas, StockMetric


PERIOD_OFFSETS = {
    "daily": 1,
    "weekly": 5,
    "fortnightly": 10,
    "monthly": 21,
    "quarterly": 63,
    "six_months": 126,
    "one_year": 252,
}


def build_period_deltas(candles: list[list[Any]]) -> PeriodDeltas:
    closes = [float(row[4]) for row in candles]
    latest = closes[-1]
    values = {}
    for key, offset in PERIOD_OFFSETS.items():
        values[key] = round(pct_change(latest, closes[-offset - 1]), 2) if len(closes) > offset else None
    return PeriodDeltas(**values)


def build_tracker_item(metric: StockMetric, candles: list[list[Any]], previous_close: float | None = None) -> MarketTrackerItem:
    snapshot_delta = round(pct_change(metric.current_price, previous_close), 2) if previous_close else None
    return MarketTrackerItem(
        metric=metric,
        period_deltas=build_period_deltas(candles),
        previous_snapshot_close=previous_close,
        snapshot_delta_pct=snapshot_delta,
    )


def snapshot_date() -> str:
    return datetime.now().strftime("%Y-%m-%d")
