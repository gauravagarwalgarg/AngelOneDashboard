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

```
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

**Your Tools:**
- run_scan: Execute a screener with filters and formulas
- save_screener: Store a screener template
- search_instruments: Find stocks/indices by name or token
- sync_instruments: Download the latest instrument master

**When a user asks you to "find [something]":**
1. Understand their intent (e.g., "Find large-cap pharma stocks near their 52-week high")
2. Convert to a structured screener:
   - Watchlist: Which index/sector? (e.g., NIFTY PHARMA)
   - Filters: Numeric conditions (e.g., market_cap > 5000, rsi_14 < 70)
   - Formula: Optional complex logic (e.g., "Current price > 0.9 * High price all time")
3. Execute via run_scan
4. Explain results in plain English with insights

**Always:**
- Reference specific data: "RSI is 72, suggesting overbought conditions"
- Acknowledge limitations: "Market cap is estimated; use official sources for exact figures"
- Suggest timeframe context: "Weekly momentum is positive, but daily RSI is extended"
- Avoid certainty: "This pattern suggests..." not "This will definitely..."
```

### Prompt 2: Sector Rotation & Momentum Scout

```
You are a market analyst focused on sector rotation and momentum signals.

**Your Specialty:**
- Detect where money is flowing across sectors
- Identify outperformers vs underperformers
- Spot emerging trends in sector indices
- Rank sectors by technical strength

**Your Process:**
1. Load multiple sector indices: NIFTY BANK, NIFTY IT, NIFTY PHARMA, NIFTY AUTO, etc.
2. Run market tracker to see 1-week, 1-month, and 3-month returns
3. Identify sectors with:
   - Positive momentum across multiple timeframes
   - Outperformance vs NIFTY 50 benchmark
   - Volume surge (volume > 1.5x average)
4. Suggest related stock screeners

**Example Output:**
```
📈 Sector Alert: NIFTY IT
- Weekly: +2.1%, Monthly: +4.3%, 3M: +8.7%
- Outperforming NIFTY 50 by 1.8% this month
- TCS and Infosys both above SMA50
- Recommendation: Run "IT Large-Cap Breakout" screener
```

**When asked "What's leading the market?":**
- Compare all major sector indices
- Show rankings by 1-month, 3-month, 1-year returns
- Highlight sectors with improving momentum (weekly > monthly)
- Suggest screening for the leading sector
```

### Prompt 3: Formula & Filter Debugger

```
You are a financial data structures expert helping users build complex screeners.

**Your Job:**
- Validate filter syntax
- Explain what formulas will do
- Optimize filters for speed and clarity
- Suggest alternatives if filters match nothing

**Available Fields** (from analysis://fields):
- Price: current_price, previous_close, day_change_pct
- Volume: volume, avg_volume_20, volume_vs_avg_20
- Technicals: rsi_14, sma_20, sma_50, ema_20, ema_50
- History: all_time_high, all_time_low, distance_from_ath_pct
- Composite: trend_score (0-10), analysis_score (0-10)
- Fundamentals: market_cap (if provided in watchlist)

**When a user describes a screen** like:
> "Large-cap stocks near 52-week high with strong RSI"

**You respond with:**
1. Plain English breakdown:
   - "Large-cap": market_cap > 5000
   - "Near 52-week high": distance_from_ath_pct > -10 (within 10% of high)
   - "Strong RSI": rsi_14 > 60

2. Structured filters:
   ```
   - Filter 1: market_cap >= 5000
   - Filter 2: distance_from_ath_pct between -15 and 0
   - Filter 3: rsi_14 > 60
   ```

3. Alternative formula:
   ```
   Market Capitalization > 5000 AND Distance From ATH % > -10 AND RSI 14 > 60
   ```

4. When to use each:
   - **Filters** = faster, easier to adjust
   - **Formula** = more flexible for complex logic

**If a filter returns zero results:**
- Suggest loosening constraints
- Show which filter eliminated the most symbols
- Recommend a broader universe
```

---

## Example MCP Interaction

### Scenario: User asks "Find undervalued pharma stocks"

**Agent's Internal Reasoning:**
```
User request: "undervalued pharma stocks"

Step 1: Clarify intent
- Sector: Pharma (NIFTY PHARMA)
- "Undervalued" likely means: 
  - Trading below 50% of 52-week high
  - OR: RSI < 50 (not overbought)

Step 2: Build screener
- Watchlist: NIFTY PHARMA (search_instruments: "NIFTY PHARMA")
- Filters:
  1. distance_from_ath_pct < -40 (trading below 60% of high)
  2. rsi_14 < 50 (momentum not extreme)
  3. analysis_score >= 5 (reasonable technicals)

Step 3: Execute
- run_scan(watchlist, filters, benchmark=NIFTY50)

Step 4: Explain
- Show matched instruments
- Highlight strongest candidates
- Explain why each matched
```

**Agent's Response to User:**
```
📊 Undervalued Pharma Scan Results

Watchlist: NIFTY PHARMA (12 stocks)
Matched: 4 stocks

Top Matches:
1. **Cipla** - ₹1,250 (RSI: 48, Distance from ATH: -42%)
   → Trading 42% below 52-week high with neutral momentum
   → Volume solid at 1.2x 20-day average
   
2. **Lupin** - ₹890 (RSI: 52, Distance from ATH: -38%)
   → Below high with stabilizing technicals
   
Benchmark: NIFTY 50 +0.8% vs PHARMA -1.2% 
→ Sector is underperforming; potential mean reversion play

💡 Suggested next steps:
- Run Market Tracker on these 4 to see longer-term trends
- Check news for any sector-specific catalysts
- Consider adding: volume surge filter for confirmation
```

---

## Setting Up MCP Server Locally

### Option 1: Python MCP Server Adapter (Recommended)

Create `mcp_server.py`:

```python
from typing import Any
import json
import sys
from . import backend  # Your FastAPI backend

class MCPServer:
    def __init__(self, backend_url: str = "http://localhost:8000"):
        self.backend_url = backend_url
        self.session = None
    
    # Resources
    async def get_resource(self, uri: str) -> str:
        if uri == "screeners://saved":
            response = await self.backend_call("GET", "/api/screeners")
            return json.dumps(response)
        elif uri == "analysis://fields":
            response = await self.backend_call("GET", "/api/fields")
            return json.dumps(response)
        # ... more resources
        
    # Tools
    async def call_tool(self, name: str, arguments: dict[str, Any]) -> str:
        if name == "run_scan":
            response = await self.backend_call("POST", "/api/scan", arguments)
            return json.dumps(response)
        elif name == "save_screener":
            response = await self.backend_call("POST", "/api/screeners", arguments)
            return json.dumps(response)
        # ... more tools
```

### Option 2: HTTP/WebSocket Gateway

Expose MCP endpoints directly from FastAPI:

```python
@app.get("/mcp/resources/{path:path}")
async def mcp_get_resource(path: str):
    """MCP resource endpoint"""
    # Translate path to internal call
    
@app.post("/mcp/tools/{tool_name}")
async def mcp_call_tool(tool_name: str, args: dict):
    """MCP tool endpoint"""
    # Translate tool call to API call
```

---

## AI Agent Capabilities

With MCP integration, agents can:

### 1. Smart Screener Creation
```
User: "Show me momentum stocks in the bank sector"
Agent: 
  - Loads NIFTY BANK
  - Applies: rsi_14 > 65, volume > 1.5x avg
  - Runs screener
  - Explains results with conviction scores
```

### 2. Iterative Refinement
```
User: "That's too strict. Show me more options."
Agent:
  - Loosens RSI threshold (65 → 60)
  - Re-runs scan
  - Shows 2x more matches
```

### 3. Saved Screener Suggestion
```
User: "Save this for later"
Agent:
  - Saves with name "Momentum Bank Stocks"
  - Confirms it's accessible via screeners://saved
  - Suggests when to re-run it
```

### 4. Cross-Market Insights
```
User: "Which sector looks strongest?"
Agent:
  - Runs market tracker on all major indices
  - Compares 1-week, 1-month, 3-month returns
  - Suggests screener for the strongest sector
```

---

## Safety & Guardrails

### What Agents CANNOT Do
- ❌ Place, modify, or cancel trades
- ❌ Access user holdings or portfolio data
- ❌ Change account settings or permissions
- ❌ Access live real-time price feeds (only OHLCV)
- ❌ Execute any action without user approval

### What Agents CAN Do
- ✅ View historical candles, technicals, fundamentals
- ✅ Create and run screeners (read-only)
- ✅ Explain market trends and anomalies
- ✅ Suggest investment themes
- ✅ Save screener templates for reuse

### Audit Trail
Every agent action is logged:
```
{
  "timestamp": "2026-05-16T14:32:00Z",
  "agent": "claude-3",
  "action": "run_scan",
  "query": {"watchlist": "NIFTY PHARMA", "formula": "..."},
  "result_count": 7,
  "status": "success"
}
```

---

## Testing MCP Integration

### Test 1: Login & Session
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "your_api_key",
    "client_code": "your_code",
    "password": "your_pin",
    "totp": "123456"
  }'
```

### Test 2: Run Scan via MCP
```bash
curl -X POST http://localhost:8000/mcp/tools/run_scan \
  -H "Content-Type: application/json" \
  -d '{
    "credentials": {...},
    "watchlist_text": "NSE|NIFTY50|99926000|NIFTY 50|Index|0",
    "filters": [
      {"field": "rsi_14", "operator": "gt", "value": 60}
    ]
  }'
```

### Test 3: Get Resources
```bash
curl http://localhost:8000/mcp/resources/screeners://saved
curl http://localhost:8000/mcp/resources/analysis://fields
```

---

## Next Steps

1. **Implement MCP Server adapter** in your backend
2. **Test with Claude AI** or other agent frameworks
3. **Deploy to production** with auth middleware
4. **Monitor agent activity** for audit trails
5. **Add natural language → formula translator** (AI-powered)

---

## FAQ

**Q: Can agents see my SmartAPI credentials?**
A: No. Agents pass credentials once per session. The backend handles all API calls. Credentials are not logged or exposed.

**Q: Can I give agents limited watchlists?**
A: Yes. You can provide pre-defined watchlists or restrict the instrument master that agents can access.

**Q: How do I prevent agents from running expensive screeners?**
A: Implement rate limiting on `/api/scan` endpoint and set daily query limits per agent.

**Q: Can agents access real-time prices?**
A: Only OHLCV historical candles. Real-time WebSocket feed is not exposed through MCP.

**Q: What if an agent generates an invalid formula?**
A: The backend validates and returns a clear error. The agent learns and refines.

---

**Ready to connect your first AI agent?** Start with the General Market Analysis Assistant prompt above and test with a simple screener query.
