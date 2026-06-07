# UI Redesign Plan

> Split the monolithic App.tsx into focused tabs with dark/light mode support.

---

## Tab Structure

### Tab 1: Dashboard (Post-Login Home)

**Purpose**: Quick market snapshot new_textwhat happened today?

- **Index cards**: NIFTY 50, SENSEX, NIFTY 500, BANK NIFTY (price + % change, green/red)
- **Top 3 Gainers / Losers** (from cached data)
- **52W High / Low stocks** (from screener data)
- **Market sentiment indicator** (based on advance/decline, RSI of NIFTY)
- **Data source**: Locally cached market snapshots + live tracker refresh

**Reference**: INDmoney post-market stats card (dark gradient, index cards, top movers grid)

---

### Tab 2: Tracker (Weekly / Monthly / Historical)

**Purpose**: How has the market moved over time?

- **Index performance table**: Daily, Weekly, Fortnightly, Monthly, Quarterly, 6M, 1Y deltas
- **Comparison with previous snapshots** (locally cached)
- **News feed** (Google News RSS, market headlines)
- **Mutual fund tracker** (NAV returns: 1M, 3M, 6M, 1Y)
- **Personalized watchlist** performance over time

---

### Tab 3: Screener

**Purpose**: Formula-based stock discovery

- **Saved screeners** (load/save/delete)
- **Watchlist editor** (textarea + instrument search + presets)
- **Filter builder** (field + operator + value, add/remove rows)
- **Formula editor** (free-text with alias hints)
- **Sort + limit controls**
- **Results table** with recommendations
- **No-match diagnostics** (why did my query return nothing?)

---

### Tab 4: Portfolio (Holdings + P&L)

**Purpose**: Track your actual investments and their performance over time.

**Data source**: SmartAPI `/getHolding`, `/getPosition`, `/getTradeBook`

- **Holdings table**: Symbol, Qty, Avg Price, LTP, Invested, Current Value, P&L, P&L %
- **Period performance per holding**: Daily, Weekly, Monthly, Quarterly, Half-Yearly, Yearly
- **Portfolio summary**: Total invested, current value, total P&L, day P&L
- **Positions**: Open intraday/carry-forward with unrealised P&L
- **Trade book**: Today's executed trades (buy/sell, qty, price, time)
- **Historical snapshots**: Compare portfolio value over time (locally cached)

---

### Tab 5: AI Agent (MCP Integration)

**Purpose**: AI-powered market analysis and recommendations

- **MCP server status** (connected/disconnected)
- **Chat interface** for natural language queries
- **Available tools** (login, scan, screener, instruments, explain formula)
- **Recommendation engine** output
- **Anomaly detection** alerts

---

## Dark / Light Mode

### CSS Variables Approach

```css
:root, [data-theme="light"] {
  --bg: #f3ede3;
  --bg-secondary: rgba(255, 250, 242, 0.88);
  --text: #1b1612;
  --text-muted: #68594d;
  --border: rgba(45, 31, 20, 0.14);
  --accent: #b85c2f;
  --good: #246847;
  --bad: #a13229;
}

[data-theme="dark"] {
  --bg: #0f1117;
  --bg-secondary: #1a1d2e;
  --text: #e4e4e7;
  --text-muted: #a1a1aa;
  --border: #27272a;
  --accent: #f59e0b;
  --good: #22c55e;
  --bad: #ef4444;
}
```

### Implementation

- Inline `<script>` in `index.html` to prevent FOUC
- Toggle button in header
- localStorage persistence
- System preference detection via `prefers-color-scheme`

---

## Component Structure (Target)

```
src/
├── components/
│   ├── Header.tsx          # Logo, tabs, theme toggle, profile
│   ├── LoginPage.tsx       # Auth form (pre-dashboard)
│   ├── Dashboard.tsx       # Tab 1: Market snapshot
│   ├── Tracker.tsx         # Tab 2: Historical + news + MF
│   ├── Screener.tsx        # Tab 3: Filter builder + results
│   ├── AIAgent.tsx         # Tab 4: MCP chat + recommendations
│   ├── IndexCard.tsx       # Reusable index price card
│   ├── DataTable.tsx       # Reusable sortable table
│   ├── ThemeToggle.tsx     # Dark/light switch
│   └── InstrumentSearch.tsx # Search modal
├── hooks/
│   ├── useAuth.ts          # Auth state + login/refresh/logout
│   ├── useTheme.ts         # Dark/light mode hook
│   └── useApi.ts           # Fetch wrapper with error handling
├── types.ts                # All TypeScript interfaces
├── constants.ts            # API base, presets, default values
├── App.tsx                 # Tab router + layout shell
├── main.tsx                # Entry point
└── styles.css              # Global styles with CSS variables
```

---

## Implementation Order

1. **Phase 1** (this session): Add dark mode CSS, theme toggle, basic tab navigation
2. **Phase 2**: Split App.tsx into components (LoginPage, Dashboard, Tracker, Screener)
3. **Phase 3**: Build Dashboard tab with INDmoney-style market cards
4. **Phase 4**: MCP server implementation + AI Agent tab
5. **Phase 5**: Polish, mobile responsiveness, animations

---

## MCP Server Plan

Expose the FastAPI backend as an MCP server so AI clients can:

1. `login_smartapi` new_textauthenticate with credentials
2. `run_scan` new_textexecute a screener with filters
3. `get_market_tracker` new_textfetch index performance
4. `search_instruments` new_textfind stock/index tokens
5. `explain_formula` new_textparse and explain a formula
6. `get_recommendations` new_textAI-scored stock picks

**Implementation**: Add `mcp_server.py` using the MCP Python SDK that wraps existing FastAPI endpoints.

---

*This is a living document. Update as implementation progresses.*
