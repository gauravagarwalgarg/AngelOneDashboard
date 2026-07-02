from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

import requests

from .config import settings
from .indicators import pct_change
from .models import MutualFundMetric, MutualFundResponse


MFAPI_BASE = "https://api.mfapi.in"
TRACKED_FUND_QUERIES = [
    "HDFC Index Fund Nifty 50 Direct Growth",
    "HDFC Flexi Cap Fund Direct Growth",
    "Parag Parikh Flexi Cap Fund Direct Growth",
    "HDFC Small Cap Fund Direct Growth",
    "HDFC Mid-Cap Opportunities Fund Direct Growth",
]


def tracked_mutual_funds() -> MutualFundResponse:
    warnings: list[str] = []
    funds: list[MutualFundMetric] = []
    for query in TRACKED_FUND_QUERIES:
        try:
            scheme = _search_best_scheme(query)
            funds.append(_build_metric(scheme["schemeCode"], scheme["schemeName"]))
        except Exception as exc:
            warnings.append(f"{query}: {exc}")
    funds.sort(key=lambda item: item.one_month_return_pct if item.one_month_return_pct is not None else -999, reverse=True)
    return MutualFundResponse(generated_at=datetime.utcnow(), funds=funds, warnings=warnings)


def _search_best_scheme(query: str) -> dict[str, Any]:
    response = requests.get(f"{MFAPI_BASE}/mf/search", params={"q": query}, timeout=settings.request_timeout_seconds)
    response.raise_for_status()
    payload = response.json()
    if not isinstance(payload, list) or not payload:
        raise RuntimeError("No matching scheme found.")
    lowered = query.lower()
    direct_growth = [
        item for item in payload
        if "direct" in item.get("schemeName", "").lower()
        and "growth" in item.get("schemeName", "").lower()
    ]
    candidates = direct_growth or payload
    return max(candidates, key=lambda item: _score_scheme(lowered, item.get("schemeName", "")))


def _score_scheme(query: str, scheme_name: str) -> int:
    words = [word for word in query.replace("-", " ").split() if len(word) > 2]
    name = scheme_name.lower()
    return sum(1 for word in words if word.lower() in name)


def _build_metric(scheme_code: str | int, scheme_name: str) -> MutualFundMetric:
    response = requests.get(f"{MFAPI_BASE}/mf/{scheme_code}", timeout=settings.request_timeout_seconds)
    response.raise_for_status()
    payload = response.json()
    rows = payload.get("data") or []
    if not rows:
        raise RuntimeError("NAV history is empty.")
    latest = rows[0]
    latest_nav = float(latest["nav"])
    latest_date = datetime.strptime(latest["date"], "%d-%m-%Y")
    one_month = _return_since(rows, latest_nav, latest_date - timedelta(days=30))
    three_month = _return_since(rows, latest_nav, latest_date - timedelta(days=91))
    six_month = _return_since(rows, latest_nav, latest_date - timedelta(days=182))
    one_year = _return_since(rows, latest_nav, latest_date - timedelta(days=365))
    recommendation, reason = _classify_fund(one_month, six_month, one_year)
    return MutualFundMetric(
        scheme_code=str(scheme_code),
        scheme_name=payload.get("meta", {}).get("scheme_name") or scheme_name,
        latest_nav=round(latest_nav, 4),
        latest_date=latest["date"],
        one_month_return_pct=one_month,
        three_month_return_pct=three_month,
        six_month_return_pct=six_month,
        one_year_return_pct=one_year,
        recommendation=recommendation,
        recommendation_reason=reason,
    )


def _return_since(rows: list[dict[str, str]], latest_nav: float, target_date: datetime) -> float | None:
    dated_rows = []
    for row in rows:
        try:
            dated_rows.append((datetime.strptime(row["date"], "%d-%m-%Y"), float(row["nav"])))
        except (KeyError, ValueError):
            continue
    older_rows = [(date, nav) for date, nav in dated_rows if date <= target_date]
    if not older_rows:
        return None
    _, base_nav = max(older_rows, key=lambda item: item[0])
    return round(pct_change(latest_nav, base_nav), 2)


def _classify_fund(one_month: float | None, six_month: float | None, one_year: float | None) -> tuple[str, str]:
    short = one_month or 0.0
    medium = six_month or 0.0
    long = one_year or 0.0
    if short > 2 and medium > 5 and long > 8:
        return "Momentum leader", "Positive 1M, 6M, and 1Y NAV trend among tracked funds."
    if long > 8:
        return "Long-term watch", "One-year trend is positive; short-term trend needs comparison."
    if short > 2:
        return "Monthly watch", "Recent monthly NAV trend is positive."
    return "Review", "Trend is mixed or data is insufficient."
