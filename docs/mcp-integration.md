# MCP Integration & AI Agent Prompts

This document explains how to use the Angel One Market Analysis backend as an MCP (Model Context Protocol) server and provides ready-to-use system prompts for AI agents.

## What is MCP?

**MCP** (Model Context Protocol) is a protocol that allows AI agents to safely interact with tools and resources without requiring direct access to APIs or sensitive data.

**In this context:**
- Your backend exposes analysis tools (screeners, formulas, instrument search)
- AI agents can call these tools through the MCP server
- Agents can explain results, refine queries, and suggest screeners
- **No trading permissions are exposed** — only read-only analysis

---

## Architecture

```
AI Agent (Claude, GPT, etc.)
    ↓
MCP Client (connects via stdio, HTTP, or local socket)
    ↓
MCP Server (backend adapter layer)
    ↓
Angel One Backend
    ├─ /api/auth/*              (login, refresh, profile)
    ├─ /api/scan                (run screener/filter)
    ├─ /api/screeners/*         (save, load, delete)
    ├─ /api/instruments/*       (search, sync, list)
    └─ /api/fields              (available metrics & formulas)
```

---

## MCP Server Capabilities

### Resources (Read-Only Data)

| Resource | Purpose | Example |
|----------|---------|---------|
| `screeners://saved` | Your saved screener definitions | Lists all saved filters |
| `analysis://fields` | Available metrics and fields for filtering | `rsi_14`, `market_cap`, `analysis_score`, etc. |
| `analysis://latest-scan` | Last scan results | Results from your most recent "Run Analysis" |
| `auth://session` | Current auth session info | Token expiry, user profile |
| `instruments://scrip-master` | Master instrument catalog | All NSE/BSE stocks, indices, tokens |

### Tools (Callable Operations)

| Tool | Parameters | Returns | Use Case |
|------|-----------|---------|----------|
| `login_smartapi` | api_key, client_code, password, totp | auth token, refresh token | Start new session |
| `refresh_smartapi_session` | api_key, client_code, auth_token, refresh_token | new auth_token | Keep session active |
| `run_scan` | watchlist_text, filters, formula, benchmark | matched instruments | Execute screener |
| `save_screener` | name, description, watchlist, filters, formula | screener_id | Store filter for reuse |
| `delete_screener` | screener_id | status | Remove saved filter |
| `sync_instruments` | (none) | sync status, count | Download latest instrument master |
| `search_instruments` | query, exchange | instrument list with tokens | Find stock/index tokens |
| `explain_formula` | formula_text | parsed structure, warnings | Validate and explain formula |

---

## System Prompts for AI Agents

### Prompt 1: General Market Analysis Assistant

You are an expert financial analyst with access to Indian equity market data through the Angel One SmartAPI.

**Your Role:**
- Help users create and execute stock screeners
- Explain market trends and technical indicators
- Suggest investment themes based on data
- Validate user queries and convert them to structured filters

**Your Constraints:**
- You can ONLY view and analyze market data (historical prices, technical indicators, fundamentals)
- You CANNOT place trades, modify orders, or access trading permissions
- You CANNOT access live portfolio or holdings data
- All recommendations are educational; users make their own decisions

---

## Example MCP Interaction

### Scenario: User asks "Find undervalued pharma stocks"

**Agent's Process:**
1. Search for NIFTY PHARMA using search_instruments
2. Build screener with:
   - Market cap: > 5000 (large-cap)
   - Distance from ATH: < -40% (trading 40% below 52-week high)
   - RSI: < 50 (momentum not extreme)
3. Execute via run_scan
4. Explain results with specific data points

**Agent's Response:**
```
📊 Undervalued Pharma Scan Results

Watchlist: NIFTY PHARMA (12 stocks)
Matched: 4 stocks

Top Matches:
- Cipla: ₹1,250 (RSI: 48, Distance from ATH: -42%)
- Lupin: ₹890 (RSI: 52, Distance from ATH: -38%)

Sector vs Benchmark:
PHARMA -1.2% vs NIFTY 50 +0.8%
→ Sector underperforming; potential mean reversion
```
