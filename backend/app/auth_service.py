from __future__ import annotations

from typing import Any

import requests

from .config import settings
from .models import AuthLoginRequest, AuthRefreshRequest, AuthSession, SessionHeaders, UserProfile

BASE_URL = "https://apiconnect.angelone.in"


def _base_headers(api_key: str, headers: SessionHeaders) -> dict[str, str]:
    return {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-UserType": headers.user_type,
        "X-SourceID": headers.source_id,
        "X-ClientLocalIP": headers.client_local_ip,
        "X-ClientPublicIP": headers.client_public_ip,
        "X-MACAddress": headers.mac_address,
        "X-PrivateKey": api_key,
    }


def login(request: AuthLoginRequest) -> AuthSession:
    response = requests.post(
        f"{BASE_URL}/rest/auth/angelbroking/user/v1/loginByPassword",
        json={
            "clientcode": request.client_code,
            "password": request.password.get_secret_value(),
            "totp": request.totp.get_secret_value(),
            "state": request.state,
        },
        headers=_base_headers(request.api_key, request.headers),
        timeout=settings.request_timeout_seconds,
    )
    data = _parse_response(response)
    payload = data.get("data") or {}
    return AuthSession(
        api_key=request.api_key,
        client_code=request.client_code,
        auth_token=payload.get("jwtToken", ""),
        refresh_token=payload.get("refreshToken", ""),
        feed_token=payload.get("feedToken"),
        state=payload.get("state"),
        headers=request.headers,
    )


def refresh(request: AuthRefreshRequest) -> AuthSession:
    headers = _base_headers(request.api_key, request.headers)
    headers["Authorization"] = f"Bearer {request.auth_token.get_secret_value()}"
    response = requests.post(
        f"{BASE_URL}/rest/auth/angelbroking/jwt/v1/generateTokens",
        json={"refreshToken": request.refresh_token.get_secret_value()},
        headers=headers,
        timeout=settings.request_timeout_seconds,
    )
    data = _parse_response(response)
    payload = data.get("data") or {}
    return AuthSession(
        api_key=request.api_key,
        client_code=request.client_code,
        auth_token=payload.get("jwtToken", ""),
        refresh_token=payload.get("refreshToken", request.refresh_token.get_secret_value()),
        feed_token=payload.get("feedToken"),
        headers=request.headers,
    )


def profile(api_key: str, client_code: str, auth_token: str, refresh_token: str | None, headers_in: SessionHeaders) -> UserProfile:
    headers = _base_headers(api_key, headers_in)
    headers["Authorization"] = f"Bearer {auth_token}"
    response = requests.get(
        f"{BASE_URL}/rest/secure/angelbroking/user/v1/getProfile",
        params={"refreshToken": refresh_token or ""},
        headers=headers,
        timeout=settings.request_timeout_seconds,
    )
    data = _parse_response(response)
    return UserProfile.model_validate(data.get("data") or {})


def _parse_response(response: requests.Response) -> dict[str, Any]:
    try:
        payload = response.json()
    except ValueError as exc:
        text = response.text.strip() or "Empty response body"
        snippet = text[:300]
        raise RuntimeError(f"SmartAPI returned a non-JSON response ({response.status_code}): {snippet}") from exc

    if not response.ok or not payload.get("status", False):
        message = payload.get("message") or payload.get("errorcode") or str(payload)
        raise RuntimeError(f"SmartAPI request failed ({response.status_code}): {message}")
    return payload
