# Angel One Market Dashboard

Personal finance tracking, trade ideas, and market performance dashboard built on **Angel One SmartAPI**.

**Analysis-only**  does not place orders.

## What You Get

| Tab | Purpose |
|-----|---------|
| 📊 **Summary** | Market snapshot  index performance, period deltas, snapshot comparison |
| 💰 **Mutual Funds** | NAV tracking for your fund portfolio (1M/3M/6M/1Y returns) |
| 📰 **News** | Indian market headlines from Google News |
| 🔍 **Instruments** | Search 90k+ Angel One instruments, find tokens |
| ⚙️ **Stock Screener** | Formula-based stock discovery with 25+ technical indicators |
| 📈 **Snapshots** | Day-over-day market comparison (locally persisted) |
| 🤖 **AI Predictions** | AI-powered explanations and anomaly detection *(planned)* |

## Quick Start

```bash
# One command to run everything
docker-compose up --build

# Frontend: http://localhost:5173
# Backend:  http://localhost:8000
```

Then login with your Angel One SmartAPI credentials (API key + client code + PIN + TOTP).

## Why This Exists

- **Programmable**  Your own formulas, your own analysis pipeline
- **Local-first**  Data cached on disk, works offline after first fetch
- **Free**  No subscriptions, no vendor lock-in
- **Developer-friendly**  JSON everywhere, REST API, Docker
- **AI-ready**  Signals are structured for LLM interpretation

## What This App Does NOT Do

!!! warning "Read-Only Tool"
    - Does **not** place, modify, or cancel orders
    - Does **not** automate trading strategies
    - Does **not** access margin or fund transfer APIs
    - Runs **locally only**  your credentials never leave your machine
