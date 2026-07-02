# Missing Index Tokens - Quick Reference Guide

## The Problem

Some index presets show `<token>` instead of a numeric ID:

```
NSE|SENSEX|<token>|SENSEX|Index|0
NSE|NIFTYNXT50|<token>|NIFTY NEXT 50|Index|0
NSE|NIFTYMETAL|<token>|NIFTY METAL|Sector Index|0
```

SmartAPI requires numeric tokens to fetch data. This guide shows how to resolve them.

---

## Step-by-Step Resolution

### Step 1: Open Dashboard & Login

1. Login with your SmartAPI credentials
2. Wait for dashboard to load

### Step 2: Click "Sync Instruments" Button

**Location**: Left panel, below the watchlist text area

**What happens**:
- Backend downloads Angel One's master instrument list
- Takes 10-30 seconds
- Shows progress message
- Displays status: "Master synced: 7,234 instruments"

### Step 3: Search for the Index

**After sync completes:**

1. **Search field appears** below "Sync Instruments"
2. **Search for**: Type the index name exactly
3. **Exchange**: Leave as "NSE" (unless searching for BSE indices like SENSEX)
4. **Click Search**

**Example searches**:
```
Search: "SENSEX"     → Results show BSE SENSEX with token
Search: "NIFTY NEXT" → Results show NIFTY NEXT 50 with token
Search: "NIFTY METAL" → Results show NIFTY METAL with token
```

### Step 4: Copy the Token

**Results table shows**:
| Name | Exchange | Token | Type |
|------|----------|-------|------|
| SENSEX | BSE | 507649 | Index |

**Copy**: `507649`

### Step 5: Update Your Watchlist

**Find the row** with `<token>`:
```
NSE|SENSEX|<token>|SENSEX|Index|0
```

**Replace `<token>` with the copied token**:
```
NSE|SENSEX|507649|SENSEX|Index|0
```

---

## Common Indices with Missing Tokens

### Core Indices (BSE)

| Index | Search For | Typical Token | Exchange |
|-------|-----------|---------------|----------|
| **SENSEX** | SENSEX | 507649 | BSE |
| **BSE 100** | BSE 100 | 507648 | BSE |
| **BSE 200** | BSE 200 | 507643 | BSE |
| **BSE 500** | BSE 500 | 507644 | BSE |

**Note**: SENSEX is BSE's equivalent of NIFTY 50. It includes 30 largest BSE stocks.

### NSE Indices Needing Resolution

| Index | Search For | Status |
|-------|-----------|--------|
| **NIFTY NEXT 50** | NIFTY NEXT 50 | ⚠️ Token needed |
| **NIFTY 100** | NIFTY 100 | ⚠️ Token needed |
| **NIFTY 200** | NIFTY 200 | ⚠️ Token needed |
| **NIFTY 500** | NIFTY 500 | ⚠️ Token needed |
| **NIFTY METAL** | NIFTY METAL | ⚠️ Token needed |
| **NIFTY ENERGY** | NIFTY ENERGY | ⚠️ Token needed |
| **NIFTY REALTY** | NIFTY REALTY | ⚠️ Token needed |
| **NIFTY HEALTHCARE** | NIFTY HEALTHCARE | ⚠️ Token needed |
| **NIFTY COMMODITIES** | NIFTY COMMODITIES | ⚠️ Token needed |
| **NIFTY PSU BANK** | NIFTY PSU BANK | ⚠️ Token needed |
| **NIFTY PRIVATE BANK** | NIFTY PRIVATE BANK | ⚠️ Token needed |
| **NIFTY SERVICES SECTOR** | NIFTY SERVICES SECTOR | ⚠️ Token needed |

### Already Resolved (Ready to Use)

These have tokens pre-configured:

| Index | Token | Use Case |
|-------|-------|----------|
| NIFTY 50 | 99926000 | ✅ Largest 50 stocks |
| NIFTY BANK | 99926009 | ✅ 12 major banks |
| NIFTY IT | 99926012 | ✅ Tech companies |
| NIFTY PHARMA | 99926015 | ✅ Pharma sector |
| NIFTY AUTO | 99926011 | ✅ Auto sector |
| NIFTY FMCG | 99926013 | ✅ Consumer goods |
| NIFTY FIN SERVICE | 99926037 | ✅ Financial services |

---

## Sensex Deep Dive

### What is Sensex?

- **Full name**: BSE Sensex (S&P BSE Sensitive Index)
- **Exchange**: BSE (Bombay Stock Exchange)
- **Constituents**: 30 largest companies by market cap
- **Equivalent to**: NIFTY 50 (NSE's index)
- **Coverage**: ~45% of BSE market cap

### Sensex vs NIFTY 50

| Aspect | SENSEX | NIFTY 50 |
|--------|--------|----------|
| **Exchange** | BSE | NSE |
| **Stocks** | 30 | 50 |
| **Rebalance** | Semi-annual | Quarterly |
| **Major Holdings** | RIL, TCS, HDFC, Infosys | NIFTY 50 stocks |
| **Overlap** | ~80% same stocks | ~80% same stocks |

### Top 10 Sensex Stocks (as of May 2026)

Usually includes:
1. Reliance Industries (RIL)
2. TCS
3. HDFC Bank
4. Infosys
5. State Bank of India
6. Hindustan Unilever
7. ITC
8. Bharati Airtel
9. Maruti Suzuki
10. ICICI Bank

### How to Use Sensex in Your Screener

**After resolving the token** (e.g., 507649):

1. **Add to watchlist**:
```
NSE|SENSEX|507649|SENSEX|Index|0
```

2. **Run analysis** on it:
   - View Sensex daily/weekly/monthly deltas
   - Compare individual stocks against it
   - Detect stocks diverging from Sensex trend

3. **Use as benchmark**:
   - Set SENSEX as benchmark when screening BSE stocks
   - See if your stock outperforms the index

---

## Troubleshooting

### "Search returns no results"

**Cause**: Index name might be different in master data

**Fix**: Try alternative names:
- "NIFTY METAL" → "NIFTY METALS"
- "NIFTY ENERGY" → "NIFTY OIL & GAS" (might be separate)
- "SENSEX" → Search with exchange "BSE"

### "Token works but API calls still fail"

**Error**: `AG8001 Invalid Token`

**Causes & Fixes**:
1. **Wrong exchange**: Change NSE to BSE (for SENSEX)
2. **Token outdated**: Re-sync instruments (indices get rebalanced)
3. **SmartAPI doesn't support this index**: Check Design.md for supported indices

### "Sync takes too long"

**Normal**: First sync takes 30 seconds (downloads 7K+ instruments)

**After**: Subsequent searches are instant (cached locally)

**Location**: Cached at `backend/data/instruments/scrip_master.json`

---

## Pro Tips

### 1. Batch Add Multiple Indices

Instead of searching one by one:
1. Sync instruments once
2. Search for multiple indices (METAL, ENERGY, REALTY)
3. Copy all tokens together
4. Paste all rows at once into watchlist

### 2. Create Sector Rotation Screener

Use all sector indices as your watchlist:
```
NSE|NIFTYBANK|99926009|NIFTY BANK|Sector Index|0
NSE|NIFTYIT|99926012|NIFTY IT|Sector Index|0
NSE|NIFTYPHARMA|99926015|NIFTY PHARMA|Sector Index|0
NSE|NIFTYFMCG|99926013|NIFTY FMCG|Sector Index|0
NSE|NIFTYAUTO|99926011|NIFTY AUTO|Sector Index|0
NSE|FINNIFTY|99926037|NIFTY FIN SERVICE|Sector Index|0
```

Then run Market Tracker to see which sectors are performing best across timeframes.

### 3. Compare BSE vs NSE

Create two watchlists:
- **NSE Large Cap**: NIFTY 50
- **BSE Large Cap**: SENSEX

Compare their performance to understand exchange dynamics.

---

## When Indices Are Missing Entirely

**Scenario**: You search for an index but it doesn't exist in SmartAPI.

**Why**: SmartAPI might not have historical data for that index.

**Examples of potentially missing indices**:
- NIFTY MID CAP 50 (might be available under different name)
- NIFTY SMALL CAP 50 (might be available under different name)
- Custom or new sector indices

**What to do**:
1. Check official [NSE index list](https://www.nseindia.com/products/content/indices/indices_new.htm)
2. Search in MCP_INTEGRATION guide for alternative data sources
3. Use constituent stocks directly instead (e.g., screen NIFTY IT instead of a mid-cap tech index)

---

## Saving Your Work

After you've resolved all tokens:

1. **Save the complete watchlist** by creating a screener:
   - Name: "Master Universe - All Sectors"
   - Description: "All major indices and sectors with resolved tokens"
   - Save it

2. **Next time you login**:
   - Load this saved screener
   - All tokens are ready to use
   - Run analysis immediately

---

## Summary

| Task | Steps | Time |
|------|-------|------|
| Resolve first index token | Sync → Search → Copy → Paste | 1 min |
| Resolve remaining tokens | Search → Copy → Paste (x5) | 2 mins |
| Create complete watchlist | Paste all rows + Save screener | 1 min |
| **Total setup time** | | **4 mins** |

After this, you can create and run screeners instantly without token resolution delays.

---

**Need help?** Check the [User Guide](user-guide.md) for a detailed step-by-step walkthrough or refer to the [API Design](design.md) for SmartAPI limitations.
