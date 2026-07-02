from __future__ import annotations

from datetime import datetime

from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .auth_service import login as login_service
from .auth_service import profile as profile_service
from .auth_service import refresh as refresh_service
from .config import settings
from .formula_engine import FORMULA_ALIASES
from .instruments import instrument_status, list_indices, search_instruments, sync_instruments
from .models import (
    AnalysisInfo,
    AuthLoginRequest,
    AuthRefreshRequest,
    AuthSession,
    InstrumentSearchResponse,
    InstrumentStatusResponse,
    InstrumentSyncResponse,
    MCPIntegrationHint,
    MarketTrackerRequest,
    MarketTrackerResponse,
    MutualFundResponse,
    NewsResponse,
    ScanFieldCatalog,
    ScanRequest,
    ScanResponse,
    ScreenerDefinition,
    TriggerRule,
    UserProfile,
)
from .mutual_funds import tracked_mutual_funds
from .news import market_news
from .screener import AVAILABLE_FIELDS, apply_filters, build_metric, make_scan_response, sort_metrics
from .smartapi_client import SmartAPIAuthError, SmartAPIClient
from .storage import delete_screener, load_latest_market_snapshot, load_screeners, save_market_snapshot, save_screener
from .tracker import build_tracker_item, snapshot_date


class TriggerEvaluationRequest(ScanRequest):
    triggers: list[TriggerRule] = Field(default_factory=list)


class ProfileRequest(BaseModel):
    session: AuthSession


def _is_valid_symbol_token(symbol_token: str) -> bool:
    token = symbol_token.strip()
    return bool(token) and "<" not in token and ">" not in token


app = FastAPI(title=settings.app_name)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/info", response_model=AnalysisInfo)
def info() -> AnalysisInfo:
    return AnalysisInfo(
        mode="analysis-only",
        trading_enabled=False,
        requires_authentication=True,
        authentication_note="Official SmartAPI auth starts with loginByPassword using client code, PIN/password, and TOTP. After login, this app uses jwtToken, refreshToken, and feedToken only for read-only analysis workflows.",
        data_scope=["historical candles", "market feed data", "saved screeners", "formula analysis", "recommendation scoring"],
    )


@app.post("/api/auth/login", response_model=AuthSession)
def auth_login(request: AuthLoginRequest) -> AuthSession:
    try:
        return login_service(request)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/auth/refresh", response_model=AuthSession)
def auth_refresh(request: AuthRefreshRequest) -> AuthSession:
    try:
        return refresh_service(request)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/auth/profile", response_model=UserProfile)
def auth_profile(request: ProfileRequest) -> UserProfile:
    try:
        return profile_service(
            api_key=request.session.api_key,
            client_code=request.session.client_code,
            auth_token=request.session.auth_token,
            refresh_token=request.session.refresh_token,
            headers_in=request.session.headers,
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/fields", response_model=ScanFieldCatalog)
def fields() -> ScanFieldCatalog:
    return ScanFieldCatalog(
        fields=AVAILABLE_FIELDS,
        operators=["gt", "gte", "lt", "lte", "eq", "between", "crosses_above", "crosses_below"],
        trigger_targets=["benchmark_change_pct", "matched_count", *[field.key for field in AVAILABLE_FIELDS]],
        formula_aliases=FORMULA_ALIASES,
    )


@app.get("/api/screeners", response_model=list[ScreenerDefinition])
def list_screeners() -> list[ScreenerDefinition]:
    return load_screeners()


@app.post("/api/screeners", response_model=ScreenerDefinition)
def upsert_screener(definition: ScreenerDefinition) -> ScreenerDefinition:
    return save_screener(definition)


@app.delete("/api/screeners/{screener_id}", status_code=204)
def remove_screener(screener_id: str) -> Response:
    delete_screener(screener_id)
    return Response(status_code=204)


@app.get("/api/mcp-capabilities", response_model=MCPIntegrationHint)
def mcp_capabilities() -> MCPIntegrationHint:
    return MCPIntegrationHint(
        title="MCP-ready analytics surface",
        description="This backend can be exposed as an MCP server so AI clients can log in, refresh tokens, load saved screeners, run scans, and inspect field catalogs without any trading permissions.",
        resources=["screeners://saved", "analysis://fields", "analysis://latest-scan", "auth://session", "instruments://scrip-master"],
        tools=["login_smartapi", "refresh_smartapi_session", "run_scan", "save_screener", "delete_screener", "sync_instruments", "search_instruments", "explain_formula"],
    )


@app.get("/api/instruments/status", response_model=InstrumentStatusResponse)
def instruments_status() -> InstrumentStatusResponse:
    return instrument_status()


@app.post("/api/instruments/sync", response_model=InstrumentSyncResponse)
def instruments_sync() -> InstrumentSyncResponse:
    try:
        return sync_instruments()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/instruments/search", response_model=InstrumentSearchResponse)
def instruments_search(query: str, exchange: str | None = None, limit: int = 25) -> InstrumentSearchResponse:
    try:
        return search_instruments(query=query, exchange=exchange, limit=max(1, min(limit, 100)))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/instruments/indices", response_model=InstrumentSearchResponse)
def instruments_indices(exchange: str | None = None, limit: int = 250) -> InstrumentSearchResponse:
    try:
        return list_indices(exchange=exchange, limit=max(1, min(limit, 500)))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/news/market", response_model=NewsResponse)
def news_market(query: str = "Indian stock market OR Nifty OR Sensex market opportunity", limit: int = 12) -> NewsResponse:
    try:
        return market_news(query=query, limit=max(1, min(limit, 25)))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/mutual-funds/tracked", response_model=MutualFundResponse)
def mutual_funds_tracked() -> MutualFundResponse:
    try:
        return tracked_mutual_funds()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/scan", response_model=ScanResponse)
def scan_market(request: TriggerEvaluationRequest) -> ScanResponse:
    client = SmartAPIClient(request.credentials)
    try:
        client.login()
        warnings: list[str] = []
        metrics = []
        valid_symbols = [symbol for symbol in request.symbols if _is_valid_symbol_token(symbol.symbol_token)]
        skipped_count = len(request.symbols) - len(valid_symbols)
        if skipped_count:
            warnings.append(f"Skipped {skipped_count} row(s) with missing or placeholder symbol tokens.")

        for symbol in valid_symbols:
            try:
                metrics.append(build_metric(symbol, client.get_candles(symbol)))
            except SmartAPIAuthError:
                raise
            except Exception as exc:
                warnings.append(f"{symbol.display_name or symbol.trading_symbol}: {exc}")

        if not metrics:
            detail = "No market data could be loaded. " + " ".join(warnings)
            raise RuntimeError(detail.strip())

        benchmark_change_pct = None
        if request.benchmark and _is_valid_symbol_token(request.benchmark.symbol_token):
            try:
                benchmark_metric = build_metric(request.benchmark, client.get_candles(request.benchmark))
                benchmark_change_pct = benchmark_metric.change_pct
            except SmartAPIAuthError:
                raise
            except Exception as exc:
                warnings.append(f"Benchmark {request.benchmark.display_name or request.benchmark.trading_symbol}: {exc}")

        filtered = apply_filters(metrics, request.filters, request.formula)
        sorted_metrics = sort_metrics(filtered, request.sort.field, request.sort.direction)[: request.limit]
        return make_scan_response(benchmark_change_pct, metrics, sorted_metrics, request.triggers, request.formula, request.filters, warnings)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        client.close()


@app.post("/api/market-tracker", response_model=MarketTrackerResponse)
def market_tracker(request: MarketTrackerRequest) -> MarketTrackerResponse:
    client = SmartAPIClient(request.credentials)
    today = snapshot_date()
    try:
        client.login()
        warnings: list[str] = []
        items = []
        previous_closes = load_latest_market_snapshot(before_date=today)
        valid_symbols = [symbol for symbol in request.symbols if _is_valid_symbol_token(symbol.symbol_token)]
        skipped_count = len(request.symbols) - len(valid_symbols)
        if skipped_count:
            warnings.append(f"Skipped {skipped_count} row(s) with missing or placeholder symbol tokens.")

        for symbol in valid_symbols:
            try:
                candles = client.get_candles(symbol)
                metric = build_metric(symbol, candles)
                previous_close = previous_closes.get(symbol.symbol_token)
                items.append(build_tracker_item(metric, candles, previous_close))
            except SmartAPIAuthError:
                raise
            except Exception as exc:
                warnings.append(f"{symbol.display_name or symbol.trading_symbol}: {exc}")

        if items:
            save_market_snapshot(today, items)

        return MarketTrackerResponse(
            generated_at=snapshot_date_to_datetime(),
            snapshot_date=today,
            total_symbols=len(items),
            items=items,
            warnings=warnings,
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        client.close()


def snapshot_date_to_datetime() -> datetime:
    return datetime.utcnow()
