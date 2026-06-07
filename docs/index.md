# Angel One Market Analysis Dashboard

## 📊 Analysis-Only Market Research Tool

A comprehensive market analysis workspace for Indian equities and indices, powered by Angel One SmartAPI. This tool is designed for market research and screener creation — **not for trading execution**.

### ✨ Key Features

- ✅ Official SmartAPI login and session management
- ✅ Historical candle analysis for technical indicators
- ✅ Formula-driven stock screeners with smart diagnostics
- ✅ Saved screener library for reuse
- ✅ Market performance tracker (daily to yearly deltas)
- ✅ Instrument master search and synchronization
- ✅ Mutual fund NAV tracking
- ✅ News market feed integration
- ✅ AI agent integration via MCP (Model Context Protocol)

### 🚀 Quick Links

| Guide | Purpose |
|-------|---------|
| **[User Guide](user-guide.md)** | Complete step-by-step walkthrough of the dashboard |
| **[Getting Missing Tokens](sensex-and-indices.md)** | How to find missing index tokens (SENSEX, NIFTY METAL, etc.) |
| **[MCP Integration](mcp-integration.md)** | Using the backend as an AI agent server |
| **[Technical Design](design.md)** | Architecture and SmartAPI API usage |
| **[AI Approach](aiapproach.md)** | First-principles AI recommendation design |
| **[Implementation Status](working.md)** | Current implementation flows and status |
| **[Docker Setup](docker-setup.md)** | Development environment setup |

### 🔐 Authentication

The application uses Angel One SmartAPI's official session flow:

1. Login with your API key, client code, password/PIN, and TOTP
2. Receive JWT token and refresh token (valid for one session day)
3. Optionally refresh and fetch profile details
4. Use tokens for read-only analysis in the dashboard

**Important:** Sessions expire around midnight. Daily login is required.

### 🎯 What You Can Do

✅ Create custom screeners with filters and formulas
✅ Search for stocks and indices by name
✅ Track daily/weekly/monthly/yearly performance
✅ Save screener templates for reuse
✅ Compare instruments against benchmarks
✅ Get technical analysis scores and recommendations

### ❌ What You Cannot Do

❌ Place buy/sell orders
❌ Modify or cancel trades
❌ Access live portfolio/holdings
❌ Automate order execution

---

## 📝 Documentation Structure

This documentation includes:

- **User Guides**: Step-by-step tutorials for dashboard features
- **Technical Docs**: Architecture, API design, and SmartAPI integration
- **AI Integration**: System prompts and MCP protocol setup for AI agents
- **Troubleshooting**: Common issues and resolution steps
- **Deployment**: Docker and GitHub Pages setup

## 🤖 For AI Agents

Want to integrate this backend with AI? See [MCP Integration](mcp-integration.md) for:
- MCP protocol setup
- Ready-to-copy system prompts
- Tool and resource definitions
- Example interactions

## 🐳 Getting Started

### Local Development

```bash
# Backend setup
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

```bash
# Frontend setup
cd frontend
npm install
npm run dev
```

### Docker Setup

```bash
# Using Docker Compose
docker-compose up -d
```

See [Docker Setup](docker-setup.md) for more options.

---

## 📞 Support

- Check the relevant guide for your question
- Review backend logs in `backend/logs/`
- Inspect cached data in `backend/data/`
- Verify SmartAPI status at https://smartapi.angelbroking.com/docs

---

**Last Updated:** May 2026
**License:** Check LICENSE file
**Status:** Active Development
