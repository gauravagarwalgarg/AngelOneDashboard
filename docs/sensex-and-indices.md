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
