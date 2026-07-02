from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

from .models import MarketTrackerItem, ScreenerDefinition


DATA_DIR = Path(__file__).resolve().parents[1] / "data"
SCREENERS_FILE = DATA_DIR / "screeners.json"
SNAPSHOT_DIR = DATA_DIR / "market_snapshots"


def load_screeners() -> list[ScreenerDefinition]:
    if not SCREENERS_FILE.exists():
        return []
    raw = json.loads(SCREENERS_FILE.read_text(encoding="utf-8"))
    return [ScreenerDefinition.model_validate(item) for item in raw]


def save_screener(definition: ScreenerDefinition) -> ScreenerDefinition:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    screeners = {item.id: item for item in load_screeners()}
    now = datetime.utcnow()
    existing = screeners.get(definition.id)
    created_at = existing.created_at if existing else now
    updated = definition.model_copy(update={"created_at": created_at, "updated_at": now})
    screeners[definition.id] = updated
    SCREENERS_FILE.write_text(
        json.dumps([item.model_dump(mode="json") for item in screeners.values()], indent=2),
        encoding="utf-8",
    )
    return updated


def delete_screener(screener_id: str) -> None:
    screeners = {item.id: item for item in load_screeners()}
    if screener_id not in screeners:
        return
    screeners.pop(screener_id)
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    SCREENERS_FILE.write_text(
        json.dumps([item.model_dump(mode="json") for item in screeners.values()], indent=2),
        encoding="utf-8",
    )


def save_market_snapshot(snapshot_date: str, items: list[MarketTrackerItem]) -> Path:
    SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)
    path = SNAPSHOT_DIR / f"{snapshot_date}.json"
    payload = {
        "snapshot_date": snapshot_date,
        "saved_at": datetime.utcnow().isoformat(),
        "items": [item.model_dump(mode="json") for item in items],
    }
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return path


def load_latest_market_snapshot(before_date: str | None = None) -> dict[str, float]:
    if not SNAPSHOT_DIR.exists():
        return {}
    paths = sorted(SNAPSHOT_DIR.glob("*.json"), reverse=True)
    for path in paths:
        snapshot_date = path.stem
        if before_date and snapshot_date >= before_date:
            continue
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue
        return {
            item["metric"]["symbol_token"]: float(item["metric"]["current_price"])
            for item in payload.get("items", [])
            if item.get("metric", {}).get("symbol_token") and item.get("metric", {}).get("current_price") is not None
        }
    return {}
