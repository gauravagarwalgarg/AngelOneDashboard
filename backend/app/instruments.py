from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any

import requests

from .config import settings
from .models import InstrumentRecord, InstrumentSearchResponse, InstrumentStatusResponse, InstrumentSyncResponse


SCRIP_MASTER_URL = "https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json"
DATA_DIR = Path(__file__).resolve().parents[1] / "data"
INSTRUMENT_CACHE_DIR = DATA_DIR / "instruments"
INSTRUMENT_CACHE_FILE = INSTRUMENT_CACHE_DIR / "scrip_master.json"


def sync_instruments() -> InstrumentSyncResponse:
    response = requests.get(SCRIP_MASTER_URL, timeout=max(settings.request_timeout_seconds, 90))
    response.raise_for_status()
    raw = response.json()
    if not isinstance(raw, list) or not raw:
        raise RuntimeError("Instrument master returned no instruments.")

    instruments = [_normalise_record(item).model_dump(mode="json") for item in raw if isinstance(item, dict)]
    if not instruments:
        raise RuntimeError("Instrument master did not contain usable records.")

    INSTRUMENT_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    now = datetime.utcnow()
    payload = {
        "source_url": SCRIP_MASTER_URL,
        "generated_at": now.isoformat(),
        "total": len(instruments),
        "instruments": instruments,
    }
    INSTRUMENT_CACHE_FILE.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return InstrumentSyncResponse(
        synced_at=now,
        total=len(instruments),
        source_url=SCRIP_MASTER_URL,
        cache_file=str(INSTRUMENT_CACHE_FILE),
    )


def instrument_status() -> InstrumentStatusResponse:
    payload = _read_cache(required=False)
    if not payload:
        return InstrumentStatusResponse(cache_exists=False, cache_file=str(INSTRUMENT_CACHE_FILE))
    return InstrumentStatusResponse(
        cache_exists=True,
        total=int(payload.get("total") or len(payload.get("instruments", []))),
        generated_at=_parse_datetime(payload.get("generated_at")),
        cache_file=str(INSTRUMENT_CACHE_FILE),
    )


def search_instruments(query: str, exchange: str | None = None, limit: int = 25) -> InstrumentSearchResponse:
    payload = _read_cache(required=True)
    cache_generated_at = _parse_datetime(payload.get("generated_at"))
    needle = query.strip().upper()
    exchange_filter = exchange.strip().upper() if exchange else None
    if not needle:
        raise RuntimeError("Search query is required.")

    matches: list[InstrumentRecord] = []
    for item in payload.get("instruments", []):
        record = InstrumentRecord.model_validate(item)
        if exchange_filter and record.exchange.upper() != exchange_filter:
            continue
        haystack = " ".join([record.symbol, record.name or "", record.instrument_type or "", record.token]).upper()
        if needle not in haystack:
            continue
        matches.append(record)
        if len(matches) >= limit:
            break

    return InstrumentSearchResponse(
        query=query,
        exchange=exchange_filter,
        source="local_scrip_master",
        total=len(matches),
        instruments=matches,
        cache_generated_at=cache_generated_at,
    )


def list_indices(exchange: str | None = None, limit: int = 250) -> InstrumentSearchResponse:
    payload = _read_cache(required=True)
    exchange_filter = exchange.strip().upper() if exchange else None
    matches: list[InstrumentRecord] = []
    for item in payload.get("instruments", []):
        record = InstrumentRecord.model_validate(item)
        if exchange_filter and record.exchange.upper() != exchange_filter:
            continue
        symbol_blob = " ".join([record.symbol, record.name or "", record.instrument_type or ""]).upper()
        token_is_index = record.token.startswith("999")
        type_is_index = (record.instrument_type or "").upper() == "INDEX"
        name_is_index = any(marker in symbol_blob for marker in ["NIFTY", "SENSEX", "INDEX", "CNX", "BANKNIFTY", "FINNIFTY"])
        if not (token_is_index or type_is_index or name_is_index):
            continue
        matches.append(record)
        if len(matches) >= limit:
            break

    return InstrumentSearchResponse(
        query="indices",
        exchange=exchange_filter,
        source="local_scrip_master",
        total=len(matches),
        instruments=matches,
        cache_generated_at=_parse_datetime(payload.get("generated_at")),
    )


def _read_cache(required: bool) -> dict[str, Any] | None:
    if not INSTRUMENT_CACHE_FILE.exists():
        if required:
            raise RuntimeError("Instrument master cache is empty. Sync instruments first.")
        return None
    return json.loads(INSTRUMENT_CACHE_FILE.read_text(encoding="utf-8"))


def _normalise_record(raw: dict[str, Any]) -> InstrumentRecord:
    return InstrumentRecord(
        token=str(raw.get("token") or raw.get("symboltoken") or "").strip(),
        symbol=str(raw.get("symbol") or raw.get("tradingsymbol") or "").strip(),
        name=_optional_text(raw.get("name")),
        exchange=str(raw.get("exch_seg") or raw.get("exchange") or "").strip(),
        instrument_type=_optional_text(raw.get("instrumenttype")),
        expiry=_optional_text(raw.get("expiry")),
        strike=_optional_text(raw.get("strike")),
        lot_size=_optional_text(raw.get("lotsize")),
        tick_size=_optional_text(raw.get("tick_size")),
    )


def _optional_text(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _parse_datetime(value: Any) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value))
    except ValueError:
        return None
