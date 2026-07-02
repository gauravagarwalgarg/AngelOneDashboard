from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, SecretStr


Operator = Literal["gt", "gte", "lt", "lte", "eq", "between", "crosses_above", "crosses_below"]


class SessionHeaders(BaseModel):
    user_type: str = "USER"
    source_id: str = "WEB"
    client_local_ip: str = "127.0.0.1"
    client_public_ip: str = "127.0.0.1"
    mac_address: str = "00:00:00:00:00:00"


class AngelCredentials(BaseModel):
    api_key: str
    client_code: str
    auth_token: SecretStr
    feed_token: SecretStr | None = None
    refresh_token: SecretStr | None = None
    secret_key: SecretStr | None = None


class AuthLoginRequest(BaseModel):
    api_key: str
    client_code: str
    password: SecretStr
    totp: SecretStr
    state: str | None = None
    headers: SessionHeaders = Field(default_factory=SessionHeaders)


class AuthRefreshRequest(BaseModel):
    api_key: str
    client_code: str
    auth_token: SecretStr
    refresh_token: SecretStr
    headers: SessionHeaders = Field(default_factory=SessionHeaders)


class AuthSession(BaseModel):
    api_key: str
    client_code: str
    auth_token: str
    refresh_token: str
    feed_token: str | None = None
    state: str | None = None
    headers: SessionHeaders = Field(default_factory=SessionHeaders)
    expires_note: str = "SmartAPI session remains active until 12 midnight unless the user logs out."


class UserProfile(BaseModel):
    clientcode: str
    name: str | None = None
    email: str | None = None
    mobileno: str | None = None
    exchanges: str | list[str] | None = None
    products: str | list[str] | None = None
    lastlogintime: str | None = None
    brokerid: str | None = None


class SymbolInput(BaseModel):
    exchange: str = "NSE"
    trading_symbol: str
    symbol_token: str
    interval: str = "ONE_DAY"
    lookback_candles: int = Field(default=250, ge=30, le=2000)
    display_name: str | None = None
    sector: str | None = None
    market_cap: float | None = None


class FilterRule(BaseModel):
    field: str
    operator: Operator
    value: float | None = None
    min_value: float | None = None
    max_value: float | None = None
    compare_field: str | None = None


class SortRule(BaseModel):
    field: str = "analysis_score"
    direction: Literal["asc", "desc"] = "desc"


class TriggerRule(BaseModel):
    id: str
    name: str
    enabled: bool = True
    target_field: str
    operator: Operator
    threshold: float | None = None
    min_value: float | None = None
    max_value: float | None = None
    compare_field: str | None = None
    cooldown_minutes: int = Field(default=15, ge=1, le=1440)


class ScanRequest(BaseModel):
    credentials: AngelCredentials
    symbols: list[SymbolInput] = Field(min_length=1, max_length=250)
    filters: list[FilterRule] = Field(default_factory=list)
    formula: str | None = None
    sort: SortRule = Field(default_factory=SortRule)
    limit: int = Field(default=25, ge=1, le=250)
    benchmark: SymbolInput | None = None


class IndicatorField(BaseModel):
    key: str
    label: str
    description: str
    category: str


class StockMetric(BaseModel):
    exchange: str
    trading_symbol: str
    symbol_token: str
    display_name: str
    sector: str | None = None
    market_cap: float | None = None
    last_price: float
    current_price: float
    previous_close: float
    open_price: float
    day_high: float
    day_low: float
    volume: float
    change_pct: float
    range_pct: float
    gap_pct: float
    sma_20: float
    sma_50: float
    ema_20: float
    ema_50: float
    rsi_14: float
    breakout_20d: float
    breakdown_20d: float
    avg_volume_20: float
    volume_vs_avg_20: float
    price_vs_sma_20_pct: float
    price_vs_sma_50_pct: float
    all_time_high: float
    all_time_low: float
    distance_from_all_time_high_pct: float
    distance_from_all_time_low_pct: float
    trend_score: float
    analysis_score: float
    recommendation: str
    recommendation_reason: str


class TriggerEvent(BaseModel):
    trigger_id: str
    trigger_name: str
    field: str
    observed_value: float
    fired_at: datetime
    message: str


class ScanResponse(BaseModel):
    generated_at: datetime
    benchmark_change_pct: float | None = None
    total_symbols: int
    matched_symbols: int
    formula_applied: str | None = None
    metrics: list[StockMetric]
    triggered_events: list[TriggerEvent] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class PeriodDeltas(BaseModel):
    daily: float | None = None
    weekly: float | None = None
    fortnightly: float | None = None
    monthly: float | None = None
    quarterly: float | None = None
    six_months: float | None = None
    one_year: float | None = None


class MarketTrackerItem(BaseModel):
    metric: StockMetric
    period_deltas: PeriodDeltas
    previous_snapshot_close: float | None = None
    snapshot_delta_pct: float | None = None


class MarketTrackerRequest(BaseModel):
    credentials: AngelCredentials
    symbols: list[SymbolInput] = Field(min_length=1, max_length=250)


class MarketTrackerResponse(BaseModel):
    generated_at: datetime
    snapshot_date: str
    total_symbols: int
    items: list[MarketTrackerItem]
    warnings: list[str] = Field(default_factory=list)


class InstrumentRecord(BaseModel):
    token: str
    symbol: str
    name: str | None = None
    exchange: str
    instrument_type: str | None = None
    expiry: str | None = None
    strike: str | None = None
    lot_size: str | None = None
    tick_size: str | None = None


class InstrumentSearchResponse(BaseModel):
    query: str
    exchange: str | None = None
    source: str
    total: int
    instruments: list[InstrumentRecord]
    cache_generated_at: datetime | None = None


class InstrumentSyncResponse(BaseModel):
    synced_at: datetime
    total: int
    source_url: str
    cache_file: str


class InstrumentStatusResponse(BaseModel):
    cache_exists: bool
    total: int = 0
    generated_at: datetime | None = None
    cache_file: str


class NewsItem(BaseModel):
    title: str
    link: str
    published_at: str | None = None
    source: str | None = None


class NewsResponse(BaseModel):
    generated_at: datetime
    query: str
    items: list[NewsItem]


class MutualFundMetric(BaseModel):
    scheme_code: str
    scheme_name: str
    latest_nav: float
    latest_date: str
    one_month_return_pct: float | None = None
    three_month_return_pct: float | None = None
    six_month_return_pct: float | None = None
    one_year_return_pct: float | None = None
    recommendation: str
    recommendation_reason: str


class MutualFundResponse(BaseModel):
    generated_at: datetime
    funds: list[MutualFundMetric]
    warnings: list[str] = Field(default_factory=list)


class ScreenerDefinition(BaseModel):
    id: str
    name: str
    description: str | None = None
    watchlist_text: str
    benchmark_text: str | None = None
    filters: list[FilterRule] = Field(default_factory=list)
    formula: str | None = None
    sort: SortRule = Field(default_factory=SortRule)
    limit: int = Field(default=25, ge=1, le=250)
    created_at: datetime | None = None
    updated_at: datetime | None = None


class AnalysisInfo(BaseModel):
    mode: str
    trading_enabled: bool
    requires_authentication: bool
    authentication_note: str
    data_scope: list[str]


class ScanFieldCatalog(BaseModel):
    fields: list[IndicatorField]
    operators: list[str]
    trigger_targets: list[str]
    formula_aliases: dict[str, str]


class MCPIntegrationHint(BaseModel):
    title: str
    description: str
    resources: list[str]
    tools: list[str]
