from __future__ import annotations

import hashlib
import json
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

from SmartApi import SmartConnect

from .models import AngelCredentials, SymbolInput


CANDLE_CACHE_DIR = Path(__file__).resolve().parents[1] / "data" / "candles"
REQUEST_DELAY_SECONDS = 1.35
MAX_RETRIES = 3


class SmartAPIAuthError(RuntimeError):
    pass


class SmartAPIClient:
    def __init__(self, credentials: AngelCredentials):
        self._credentials = credentials
        self._client = SmartConnect(api_key=credentials.api_key)
        self._last_request_at = 0.0
        auth_token = credentials.auth_token.get_secret_value()
        if hasattr(self._client, "setAccessToken"):
            self._client.setAccessToken(auth_token)
        if hasattr(self._client, "access_token"):
            self._client.access_token = auth_token
        if credentials.feed_token and hasattr(self._client, "feed_token"):
            self._client.feed_token = credentials.feed_token.get_secret_value()

    def login(self) -> None:
        if not self._credentials.auth_token.get_secret_value():
            raise RuntimeError("An auth token is required for analysis requests.")

    def close(self) -> None:
        return None

    def get_candles(self, symbol: SymbolInput) -> list[list[Any]]:
        end = datetime.now()
        start = end - timedelta(days=max(symbol.lookback_candles * 2, 45))
        payload = {
            "exchange": symbol.exchange,
            "symboltoken": symbol.symbol_token,
            "interval": symbol.interval,
            "fromdate": start.strftime("%Y-%m-%d %H:%M"),
            "todate": end.strftime("%Y-%m-%d %H:%M"),
        }
        cache_path = self._cache_path(symbol, payload)
        cached = self._read_cache(cache_path)
        if cached:
            return cached[-symbol.lookback_candles :]

        response = None
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                self._throttle()
                response = self._client.getCandleData(payload)
            except Exception as exc:
                if self._is_rate_limit_error(str(exc)) and attempt < MAX_RETRIES:
                    time.sleep(REQUEST_DELAY_SECONDS * attempt * 2)
                    continue
                raise RuntimeError(f"Failed to fetch candles for {symbol.trading_symbol}: {exc}") from exc

            if response and self._is_success_response(response):
                break

            self._raise_auth_error_if_needed(symbol, response)
            message = str(response)
            if self._is_rate_limit_error(message) and attempt < MAX_RETRIES:
                time.sleep(REQUEST_DELAY_SECONDS * attempt * 2)
                continue
            raise RuntimeError(f"Failed to fetch candles for {symbol.trading_symbol}: {response}")

        candles = response.get("data") or []
        if len(candles) < 30:
            raise RuntimeError(f"Not enough candles returned for {symbol.trading_symbol}.")
        self._write_cache(cache_path, candles)
        return candles[-symbol.lookback_candles :]

    def _throttle(self) -> None:
        elapsed = time.monotonic() - self._last_request_at
        if elapsed < REQUEST_DELAY_SECONDS:
            time.sleep(REQUEST_DELAY_SECONDS - elapsed)
        self._last_request_at = time.monotonic()

    def _cache_path(self, symbol: SymbolInput, payload: dict[str, str]) -> Path:
        cache_payload = {**payload, "lookback_candles": str(symbol.lookback_candles)}
        digest = hashlib.sha256(json.dumps(cache_payload, sort_keys=True).encode("utf-8")).hexdigest()[:16]
        safe_name = f"{symbol.exchange}_{symbol.symbol_token}_{symbol.interval}_{digest}.json"
        return CANDLE_CACHE_DIR / safe_name

    def _read_cache(self, path: Path) -> list[list[Any]] | None:
        if not path.exists():
            return None
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
            return payload.get("candles") or None
        except Exception:
            return None

    def _write_cache(self, path: Path, candles: list[list[Any]]) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps({"cached_at": datetime.utcnow().isoformat(), "candles": candles}), encoding="utf-8")

    def _is_rate_limit_error(self, message: str) -> bool:
        lowered = message.lower()
        return "access rate" in lowered or "exceeding" in lowered or "couldn't parse the json" in lowered

    def _is_success_response(self, response: dict[str, Any]) -> bool:
        return bool(response.get("status", response.get("success", False)))

    def _raise_auth_error_if_needed(self, symbol: SymbolInput, response: dict[str, Any] | None) -> None:
        if not response:
            return
        error_code = response.get("errorcode") or response.get("errorCode")
        message = str(response.get("message") or "")
        if error_code == "AG8001" or message.lower() == "invalid token":
            raise SmartAPIAuthError(
                "SmartAPI rejected the historical-data token/session. Re-login with a fresh TOTP, verify the API key belongs to a Historical Data API/Market Data enabled app, and confirm the portal static IP matches your public IP."
            )
