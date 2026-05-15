import { FormEvent, useEffect, useMemo, useState } from "react";

type Field = { key: string; label: string; description: string; category: string };
type FilterRule = { field: string; operator: string; value?: number; min_value?: number; max_value?: number };
type SortRule = { field: string; direction: "asc" | "desc" };
type SessionHeaders = { user_type: string; source_id: string; client_local_ip: string; client_public_ip: string; mac_address: string };
type AuthSession = { api_key: string; client_code: string; auth_token: string; refresh_token: string; feed_token?: string | null; state?: string | null; headers: SessionHeaders; expires_note: string };
type UserProfile = { clientcode: string; name?: string | null; email?: string | null; mobileno?: string | null; exchanges?: string | string[] | null; products?: string | string[] | null; brokerid?: string | null };
type ScreenerDefinition = { id: string; name: string; description?: string | null; watchlist_text: string; benchmark_text?: string | null; filters: FilterRule[]; formula?: string | null; sort: SortRule; limit: number; created_at?: string | null; updated_at?: string | null };
type AnalysisInfo = { mode: string; trading_enabled: boolean; requires_authentication: boolean; authentication_note: string; data_scope: string[] };
type FieldsResponse = { fields: Field[]; operators: string[]; trigger_targets: string[]; formula_aliases: Record<string, string> };
type MCPHint = { title: string; description: string; resources: string[]; tools: string[] };
type SymbolRow = { exchange: string; trading_symbol: string; symbol_token: string; interval: string; lookback_candles: number; display_name: string; sector: string; market_cap?: number };
type ScanMetric = Record<string, string | number | null>;
type ScanResponse = { generated_at: string; benchmark_change_pct: number | null; total_symbols: number; matched_symbols: number; formula_applied?: string | null; metrics: ScanMetric[]; warnings?: string[]; triggered_events: Array<{ trigger_id: string; trigger_name: string; field: string; observed_value: number; fired_at: string; message: string }> };
type PeriodDeltas = { daily?: number | null; weekly?: number | null; fortnightly?: number | null; monthly?: number | null; quarterly?: number | null; six_months?: number | null; one_year?: number | null };
type MarketTrackerItem = { metric: ScanMetric; period_deltas: PeriodDeltas; previous_snapshot_close?: number | null; snapshot_delta_pct?: number | null };
type MarketTrackerResponse = { generated_at: string; snapshot_date: string; total_symbols: number; items: MarketTrackerItem[]; warnings?: string[] };
type InstrumentRecord = { token: string; symbol: string; name?: string | null; exchange: string; instrument_type?: string | null; expiry?: string | null; strike?: string | null; lot_size?: string | null; tick_size?: string | null };
type InstrumentStatus = { cache_exists: boolean; total: number; generated_at?: string | null; cache_file: string };
type InstrumentSearchResponse = { query: string; exchange?: string | null; source: string; total: number; instruments: InstrumentRecord[]; cache_generated_at?: string | null };
type NewsItem = { title: string; link: string; published_at?: string | null; source?: string | null };
type NewsResponse = { generated_at: string; query: string; items: NewsItem[] };
type MutualFundMetric = { scheme_code: string; scheme_name: string; latest_nav: number; latest_date: string; one_month_return_pct?: number | null; three_month_return_pct?: number | null; six_month_return_pct?: number | null; one_year_return_pct?: number | null; recommendation: string; recommendation_reason: string };
type MutualFundResponse = { generated_at: string; funds: MutualFundMetric[]; warnings?: string[] };
type IndexPreset = { name: string; row: string; kind: string };

const apiBase = "http://localhost:8000";
const defaultHeaders: SessionHeaders = { user_type: "USER", source_id: "WEB", client_local_ip: "127.0.0.1", client_public_ip: "127.0.0.1", mac_address: "00:00:00:00:00:00" };
const defaultBenchmark = "NSE|NIFTY50|99926000|NIFTY 50|Index|0";
const starterUniverse = `NSE|NIFTY50|99926000|NIFTY 50|Index|0
NSE|NIFTYBANK|99926009|NIFTY BANK|Sector Index|0
NSE|FINNIFTY|99926037|NIFTY FINANCIAL SERVICES|Sector Index|0
NSE|NIFTYIT|99926012|NIFTY IT|Sector Index|0
NSE|NIFTYPHARMA|99926015|NIFTY PHARMA|Sector Index|0
NSE|NIFTYFMCG|99926013|NIFTY FMCG|Sector Index|0
NSE|NIFTYAUTO|99926011|NIFTY AUTO|Sector Index|0`;
const presets: IndexPreset[] = [
  { name: "NIFTY 50", row: "NSE|NIFTY50|99926000|NIFTY 50|Index|0", kind: "Core" },
  { name: "SENSEX", row: "BSE|SENSEX|<token>|SENSEX|Index|0", kind: "Core" },
  { name: "NIFTY NEXT 50", row: "NSE|NIFTYNXT50|<token>|NIFTY NEXT 50|Index|0", kind: "Core" },
  { name: "NIFTY BANK", row: "NSE|NIFTYBANK|99926009|NIFTY BANK|Sector Index|0", kind: "Sector" },
  { name: "NIFTY FINANCIAL SERVICES", row: "NSE|FINNIFTY|99926037|NIFTY FIN SERVICE|Sector Index|0", kind: "Sector" },
  { name: "NIFTY IT", row: "NSE|NIFTYIT|99926012|NIFTY IT|Sector Index|0", kind: "Sector" },
  { name: "NIFTY FMCG", row: "NSE|NIFTYFMCG|99926013|NIFTY FMCG|Sector Index|0", kind: "Sector" },
  { name: "NIFTY AUTO", row: "NSE|NIFTYAUTO|99926011|NIFTY AUTO|Sector Index|0", kind: "Sector" },
  { name: "NIFTY PHARMA", row: "NSE|NIFTYPHARMA|99926015|NIFTY PHARMA|Sector Index|0", kind: "Sector" },
  { name: "NIFTY METAL", row: "NSE|NIFTYMETAL|<token>|NIFTY METAL|Sector Index|0", kind: "Sector" },
  { name: "NIFTY ENERGY", row: "NSE|NIFTYENERGY|<token>|NIFTY ENERGY|Sector Index|0", kind: "Sector" },
  { name: "NIFTY REALTY", row: "NSE|NIFTYREALTY|<token>|NIFTY REALTY|Sector Index|0", kind: "Sector" },
  { name: "NIFTY HEALTHCARE", row: "NSE|NIFTYHEALTHCARE|<token>|NIFTY HEALTHCARE|Sector Index|0", kind: "Needs token" },
  { name: "NIFTY CONSUMER DURABLES", row: "NSE|NIFTYCONSUMERDURABLES|<token>|NIFTY CONSUMER DURABLES|Sector Index|0", kind: "Needs token" },
];

function App() {
  const [analysisInfo, setAnalysisInfo] = useState<AnalysisInfo | null>(null);
  const [fieldsResponse, setFieldsResponse] = useState<FieldsResponse>({ fields: [], operators: [], trigger_targets: [], formula_aliases: {} });
  const [mcpHint, setMcpHint] = useState<MCPHint | null>(null);
  const [savedScreeners, setSavedScreeners] = useState<ScreenerDefinition[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [clientCode, setClientCode] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [stateValue, setStateValue] = useState("analysis-lab");
  const [sessionHeaders, setSessionHeaders] = useState<SessionHeaders>(defaultHeaders);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [screenerId, setScreenerId] = useState<string>(crypto.randomUUID());
  const [screenerName, setScreenerName] = useState("50% Off High Cap Scan");
  const [screenerDescription, setScreenerDescription] = useState("Current price at or below half of fetched all-time high with large market cap.");
  const [watchlistText, setWatchlistText] = useState(starterUniverse);
  const [benchmarkText, setBenchmarkText] = useState(defaultBenchmark);
  const [formula, setFormula] = useState("Current price <= 0.50 * High price all time AND Market Capitalization > 5000");
  const [filters, setFilters] = useState<FilterRule[]>([{ field: "analysis_score", operator: "gte", value: 8 }, { field: "rsi_14", operator: "between", min_value: 35, max_value: 75 }]);
  const [sortField, setSortField] = useState("analysis_score");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [scan, setScan] = useState<ScanResponse | null>(null);
  const [tracker, setTracker] = useState<MarketTrackerResponse | null>(null);
  const [instrumentStatus, setInstrumentStatus] = useState<InstrumentStatus | null>(null);
  const [instrumentQuery, setInstrumentQuery] = useState("NIFTY");
  const [instrumentExchange, setInstrumentExchange] = useState("NSE");
  const [instrumentResults, setInstrumentResults] = useState<InstrumentRecord[]>([]);
  const [instrumentLoading, setInstrumentLoading] = useState(false);
  const [news, setNews] = useState<NewsResponse | null>(null);
  const [newsLoading, setNewsLoading] = useState(false);
  const [mutualFunds, setMutualFunds] = useState<MutualFundResponse | null>(null);
  const [fundLoading, setFundLoading] = useState(false);

  useEffect(() => {
    void Promise.all([
      fetch(`${apiBase}/api/info`).then((response) => response.json() as Promise<AnalysisInfo>),
      fetch(`${apiBase}/api/fields`).then((response) => response.json() as Promise<FieldsResponse>),
      fetch(`${apiBase}/api/screeners`).then((response) => response.json() as Promise<ScreenerDefinition[]>),
      fetch(`${apiBase}/api/mcp-capabilities`).then((response) => response.json() as Promise<MCPHint>),
      fetch(`${apiBase}/api/instruments/status`).then((response) => response.json() as Promise<InstrumentStatus>),
    ]).then(([info, fields, screeners, mcp, instruments]) => {
      setAnalysisInfo(info);
      setFieldsResponse(fields);
      setSavedScreeners(screeners);
      setMcpHint(mcp);
      setInstrumentStatus(instruments);
      if (fields.fields[0] && !fields.fields.some((field) => field.key === sortField)) setSortField(fields.fields[0].key);
    }).catch(() => setError("Unable to load analysis metadata from the backend."));
  }, []);

  const columns = useMemo(() => ["display_name", "sector", "market_cap", "current_price", "all_time_high", "distance_from_all_time_high_pct", "analysis_score", "recommendation"], []);

  async function login(event?: FormEvent) {
    event?.preventDefault();
    setAuthLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`${apiBase}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ api_key: apiKey, client_code: clientCode, password, totp, state: stateValue, headers: sessionHeaders }) });
      const data = (await response.json()) as AuthSession | { detail?: string };
      if (!response.ok) throw new Error("detail" in data ? data.detail ?? "Authentication failed." : "Authentication failed.");
      setSession(data as AuthSession);
      setMessage("Authenticated with SmartAPI. Dashboard unlocked.");
      setPassword("");
      setTotp("");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  }
  async function refreshSession() {
    if (!session) return;
    setAuthLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`${apiBase}/api/auth/refresh`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ api_key: session.api_key, client_code: session.client_code, auth_token: session.auth_token, refresh_token: session.refresh_token, headers: session.headers }) });
      const data = (await response.json()) as AuthSession | { detail?: string };
      if (!response.ok) throw new Error("detail" in data ? data.detail ?? "Session refresh failed." : "Session refresh failed.");
      setSession(data as AuthSession);
      setMessage("Refreshed SmartAPI session tokens.");
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Session refresh failed.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function loadProfile() {
    if (!session) return;
    setAuthLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`${apiBase}/api/auth/profile`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session }) });
      const data = (await response.json()) as UserProfile | { detail?: string };
      if (!response.ok) throw new Error("detail" in data ? data.detail ?? "Profile fetch failed." : "Profile fetch failed.");
      setProfile(data as UserProfile);
      setMessage("Loaded Angel One profile information.");
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : "Profile fetch failed.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function runScan(event?: FormEvent) {
    event?.preventDefault();
    if (!session) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`${apiBase}/api/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credentials: { api_key: session.api_key, client_code: session.client_code, auth_token: session.auth_token, refresh_token: session.refresh_token, feed_token: session.feed_token ?? undefined },
          symbols: parseSymbols(watchlistText),
          benchmark: parseSymbols(benchmarkText)[0],
          filters,
          formula,
          sort: { field: sortField, direction: sortDirection },
          limit,
          triggers: [],
        }),
      });
      const data = (await response.json()) as ScanResponse | { detail?: string };
      if (!response.ok) throw new Error("detail" in data ? data.detail ?? "Scan failed." : "Scan failed.");
      setScan(data as ScanResponse);
      setMessage(`Analysis complete for ${(data as ScanResponse).matched_symbols} matched symbols.`);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Scan failed.");
    } finally {
      setLoading(false);
    }
  }

  async function saveCurrentScreener() {
    setError(null);
    setMessage(null);
    try {
      const payload: ScreenerDefinition = { id: screenerId, name: screenerName, description: screenerDescription, watchlist_text: watchlistText, benchmark_text: benchmarkText, filters, formula, sort: { field: sortField, direction: sortDirection }, limit };
      const response = await fetch(`${apiBase}/api/screeners`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error("Unable to save screener.");
      const saved = (await response.json()) as ScreenerDefinition;
      setSavedScreeners((current) => {
        const others = current.filter((item) => item.id !== saved.id);
        return [saved, ...others].sort((left, right) => left.name.localeCompare(right.name));
      });
      setMessage(`Saved screener \"${saved.name}\".`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save screener.");
    }
  }

  function loadScreener(screener: ScreenerDefinition) {
    setScreenerId(screener.id);
    setScreenerName(screener.name);
    setScreenerDescription(screener.description ?? "");
    setWatchlistText(screener.watchlist_text);
    setBenchmarkText(screener.benchmark_text ?? defaultBenchmark);
    setFilters(screener.filters);
    setFormula(screener.formula ?? "");
    setSortField(screener.sort.field);
    setSortDirection(screener.sort.direction);
    setLimit(screener.limit);
    setMessage(`Loaded screener \"${screener.name}\".`);
  }

  async function deleteSavedScreener(id: string) {
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`${apiBase}/api/screeners/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Unable to delete screener.");
      setSavedScreeners((current) => current.filter((item) => item.id !== id));
      if (screenerId === id) setScreenerId(crypto.randomUUID());
      setMessage("Deleted saved screener.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete screener.");
    }
  }

  async function syncInstruments() {
    setInstrumentLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`${apiBase}/api/instruments/sync`, { method: "POST" });
      const data = (await response.json()) as { total?: number; detail?: string };
      if (!response.ok) throw new Error(data.detail ?? "Instrument sync failed.");
      setMessage(`Synced ${data.total ?? 0} instruments from Angel One scrip master.`);
      const statusResponse = await fetch(`${apiBase}/api/instruments/status`);
      setInstrumentStatus((await statusResponse.json()) as InstrumentStatus);
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "Instrument sync failed.");
    } finally {
      setInstrumentLoading(false);
    }
  }

  async function searchInstrument(event?: FormEvent) {
    event?.preventDefault();
    setInstrumentLoading(true);
    setError(null);
    setMessage(null);
    try {
      const params = new URLSearchParams({ query: instrumentQuery, limit: "25" });
      if (instrumentExchange.trim()) params.set("exchange", instrumentExchange.trim().toUpperCase());
      const response = await fetch(`${apiBase}/api/instruments/search?${params.toString()}`);
      const data = (await response.json()) as InstrumentSearchResponse | { detail?: string };
      if (!response.ok) throw new Error("detail" in data ? data.detail ?? "Instrument search failed." : "Instrument search failed.");
      setInstrumentResults((data as InstrumentSearchResponse).instruments);
      setMessage(`Found ${(data as InstrumentSearchResponse).total} matching instruments.`);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Instrument search failed.");
    } finally {
      setInstrumentLoading(false);
    }
  }

  async function loadCachedIndices() {
    setInstrumentLoading(true);
    setError(null);
    setMessage(null);
    try {
      const params = new URLSearchParams({ limit: "250" });
      if (instrumentExchange.trim()) params.set("exchange", instrumentExchange.trim().toUpperCase());
      const response = await fetch(`${apiBase}/api/instruments/indices?${params.toString()}`);
      const data = (await response.json()) as InstrumentSearchResponse | { detail?: string };
      if (!response.ok) throw new Error("detail" in data ? data.detail ?? "Index lookup failed." : "Index lookup failed.");
      setInstrumentResults((data as InstrumentSearchResponse).instruments);
      setMessage(`Loaded ${(data as InstrumentSearchResponse).total} cached index instruments.`);
    } catch (indexError) {
      setError(indexError instanceof Error ? indexError.message : "Index lookup failed.");
    } finally {
      setInstrumentLoading(false);
    }
  }

  async function loadMarketNews() {
    setNewsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase}/api/news/market`);
      const data = (await response.json()) as NewsResponse | { detail?: string };
      if (!response.ok) throw new Error("detail" in data ? data.detail ?? "News fetch failed." : "News fetch failed.");
      setNews(data as NewsResponse);
    } catch (newsError) {
      setError(newsError instanceof Error ? newsError.message : "News fetch failed.");
    } finally {
      setNewsLoading(false);
    }
  }

  async function loadMutualFunds() {
    setFundLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase}/api/mutual-funds/tracked`);
      const data = (await response.json()) as MutualFundResponse | { detail?: string };
      if (!response.ok) throw new Error("detail" in data ? data.detail ?? "Mutual fund fetch failed." : "Mutual fund fetch failed.");
      setMutualFunds(data as MutualFundResponse);
      setMessage(`Loaded ${(data as MutualFundResponse).funds.length} tracked mutual funds.`);
    } catch (fundError) {
      setError(fundError instanceof Error ? fundError.message : "Mutual fund fetch failed.");
    } finally {
      setFundLoading(false);
    }
  }

  function addFilter() { setFilters((current) => [...current, { field: "analysis_score", operator: "gte", value: 0 }]); }
  function updateFilter(index: number, patch: Partial<FilterRule>) { setFilters((current) => current.map((rule, ruleIndex) => (ruleIndex === index ? { ...rule, ...patch } : rule))); }
  function removeFilter(index: number) { setFilters((current) => current.filter((_, ruleIndex) => ruleIndex !== index)); }
  function updateSessionHeader(key: keyof SessionHeaders, value: string) { setSessionHeaders((current) => ({ ...current, [key]: value })); }
  function addPreset(row: string) {
    if (row.includes("<token>")) {
      setMessage("This preset needs a symbol token from the Angel One scrip master before it can be scanned.");
      return;
    }
    setWatchlistText((current) => current.includes(row) ? current : `${current.trim()}\n${row}`.trim());
  }
  function addInstrumentToWatchlist(instrument: InstrumentRecord) {
    const row = instrumentToWatchlistRow(instrument);
    setWatchlistText((current) => current.includes(row) ? current : `${current.trim()}\n${row}`.trim());
    setMessage(`Added ${instrument.symbol} to watchlist.`);
  }
  function setInstrumentAsBenchmark(instrument: InstrumentRecord) {
    setBenchmarkText(instrumentToWatchlistRow(instrument));
    setMessage(`Set ${instrument.symbol} as benchmark.`);
  }

  async function runMarketTracker() {
    if (!session) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`${apiBase}/api/market-tracker`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credentials: { api_key: session.api_key, client_code: session.client_code, auth_token: session.auth_token, refresh_token: session.refresh_token, feed_token: session.feed_token ?? undefined },
          symbols: parseSymbols(watchlistText),
        }),
      });
      const data = (await response.json()) as MarketTrackerResponse | { detail?: string };
      if (!response.ok) throw new Error("detail" in data ? data.detail ?? "Market tracker failed." : "Market tracker failed.");
      setTracker(data as MarketTrackerResponse);
      setMessage(`Stored daily market snapshot for ${(data as MarketTrackerResponse).total_symbols} instruments.`);
    } catch (trackerError) {
      setError(trackerError instanceof Error ? trackerError.message : "Market tracker failed.");
    } finally {
      setLoading(false);
    }
  }
  function loadOnlyPresets() {
    setWatchlistText(presets.filter((item) => !item.row.includes("<token>")).map((item) => item.row).join("\n"));
    setMessage("Loaded index presets with known SmartAPI tokens. Template-only sectors were skipped.");
  }
  function logout() { setSession(null); setProfile(null); setScan(null); setTracker(null); setMessage(null); setError(null); }

  if (!session) {
    return (
      <div className="app-shell auth-shell">
        <section className="auth-page panel focus-panel">
          <p className="eyebrow">Angel One Analysis Lab</p>
          <h1>Authenticate first</h1>
          <p className="hero-copy">This page only handles SmartAPI login. Once authenticated, you enter the separate analysis dashboard.</p>
          {analysisInfo ? <p className="note-banner">{analysisInfo.authentication_note}</p> : null}
          {error ? <p className="error-banner">{error}</p> : null}
          {message ? <p className="success-banner">{message}</p> : null}
          <form className="stack" onSubmit={login}>
            <div className="input-grid credentials-grid">
              <label>API Key<input value={apiKey} onChange={(event) => setApiKey(event.target.value)} required /></label>
              <label>Client Code<input value={clientCode} onChange={(event) => setClientCode(event.target.value)} required /></label>
              <label>PIN / Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
              <label>TOTP<input value={totp} onChange={(event) => setTotp(event.target.value)} required /></label>
              <label>State<input value={stateValue} onChange={(event) => setStateValue(event.target.value)} /></label>
            </div>
            <div className="section-head"><div><h3>Request headers</h3><p>These are required by SmartAPI auth endpoints.</p></div></div>
            <div className="input-grid credentials-grid">
              <label>Local IP<input value={sessionHeaders.client_local_ip} onChange={(event) => updateSessionHeader("client_local_ip", event.target.value)} /></label>
              <label>Public IP<input value={sessionHeaders.client_public_ip} onChange={(event) => updateSessionHeader("client_public_ip", event.target.value)} /></label>
              <label>MAC Address<input value={sessionHeaders.mac_address} onChange={(event) => updateSessionHeader("mac_address", event.target.value)} /></label>
              <label>Source ID<input value={sessionHeaders.source_id} onChange={(event) => updateSessionHeader("source_id", event.target.value)} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={authLoading}>{authLoading ? "Authenticating..." : "Enter dashboard"}</button>
          </form>
        </section>
      </div>
    );
  }
  return (
    <div className="app-shell">
      <header className="hero-panel dashboard-hero">
        <div>
          <p className="eyebrow">Analysis Dashboard</p>
          <h1>Query, screen, and compare the market</h1>
          <p className="hero-copy">Authentication is complete. Use this dashboard for index analysis, saved screeners, and filter-based stock discovery.</p>
        </div>
        <div className="row-actions">
          <button type="button" className="secondary-button" onClick={refreshSession} disabled={authLoading}>Refresh tokens</button>
          <button type="button" className="secondary-button" onClick={loadProfile} disabled={authLoading}>Profile</button>
          <button type="button" className="ghost-button" onClick={logout}>Back to auth</button>
        </div>
      </header>
      <main className="content-grid">
        <section className="left-column">
          <article className="panel">
            <div className="section-head"><div><h2>Session</h2><p>{session.expires_note}</p></div></div>
            {profile ? <div className="profile-box"><strong>{profile.name ?? profile.clientcode}</strong><p>Broker: {profile.brokerid ?? "-"}</p></div> : <p className="muted-text">Profile not loaded yet.</p>}
          </article>
          <article className="panel">
            <div className="section-head with-action"><div><h2>Index templates</h2><p>Quick-add common index rows. Use Instrument search for current SENSEX and full sector tokens.</p></div><button type="button" className="secondary-button" onClick={loadOnlyPresets}>Load known templates</button></div>
            <div className="preset-grid">{presets.map((preset) => <button key={preset.name} type="button" className="preset-card" onClick={() => addPreset(preset.row)}><span>{preset.kind}</span><strong>{preset.name}</strong></button>)}</div>
            <p className="muted-text">Templates are just watchlist shortcuts. Rows with <code>&lt;token&gt;</code> must be resolved from the synced Angel scrip master before scanning.</p>
          </article>
          <article className="panel">
            <div className="section-head with-action"><div><h2>Instrument search</h2><p>{instrumentStatus?.cache_exists ? `${instrumentStatus.total} cached instruments.` : "Sync Angel One scrip master before searching."}</p></div><button type="button" className="secondary-button" onClick={syncInstruments} disabled={instrumentLoading}>{instrumentLoading ? "Working..." : "Sync master"}</button></div>
            <form className="instrument-search" onSubmit={searchInstrument}>
              <input value={instrumentQuery} onChange={(event) => setInstrumentQuery(event.target.value)} placeholder="Search NIFTY, HDFCBANK, PHARMA..." />
              <select value={instrumentExchange} onChange={(event) => setInstrumentExchange(event.target.value)}>
                <option value="">All</option>
                <option value="NSE">NSE</option>
                <option value="BSE">BSE</option>
                <option value="NFO">NFO</option>
                <option value="CDS">CDS</option>
                <option value="MCX">MCX</option>
              </select>
              <button className="primary-button" type="submit" disabled={instrumentLoading}>{instrumentLoading ? "Searching..." : "Search"}</button>
            </form>
            <button type="button" className="secondary-button" onClick={loadCachedIndices} disabled={instrumentLoading}>Load cached indices</button>
            <div className="instrument-results">{instrumentResults.length ? instrumentResults.map((instrument) => <div key={`${instrument.exchange}-${instrument.token}-${instrument.symbol}`} className="instrument-item"><div><strong>{instrument.symbol}</strong><p>{instrument.exchange} · {instrument.token} · {instrument.name ?? "-"} · {instrument.instrument_type ?? "instrument"}</p></div><div className="row-actions"><button type="button" className="ghost-button" onClick={() => addInstrumentToWatchlist(instrument)}>Add</button><button type="button" className="ghost-button" onClick={() => setInstrumentAsBenchmark(instrument)}>Benchmark</button></div></div>) : <p className="muted-text">Search results will appear here.</p>}</div>
          </article>
          <article className="panel">
            <div className="section-head with-action"><div><h2>Saved screeners</h2><p>Load an existing filter set or save the current one.</p></div><button type="button" className="secondary-button" onClick={saveCurrentScreener}>Save current</button></div>
            <div className="input-grid"><label>Screener name<input value={screenerName} onChange={(event) => setScreenerName(event.target.value)} /></label><label>Description<input value={screenerDescription} onChange={(event) => setScreenerDescription(event.target.value)} /></label></div>
            <div className="saved-list">{savedScreeners.length ? savedScreeners.map((screener) => <div key={screener.id} className="saved-item"><div><strong>{screener.name}</strong><p>{screener.description}</p></div><div className="row-actions"><button type="button" className="ghost-button" onClick={() => loadScreener(screener)}>Load</button><button type="button" className="ghost-button" onClick={() => deleteSavedScreener(screener.id)}>Delete</button></div></div>) : <p className="muted-text">No saved screeners yet.</p>}</div>
          </article>
        </section>
        <section className="right-column">
          <article className="panel status-panel">
            <div className="stat-grid"><div><span className="label">Matched</span><strong>{scan?.matched_symbols ?? 0}</strong></div><div><span className="label">Universe</span><strong>{scan?.total_symbols ?? 0}</strong></div><div><span className="label">Benchmark</span><strong>{scan?.benchmark_change_pct?.toFixed(2) ?? "0.00"}%</strong></div></div>
            {message ? <p className="success-banner">{message}</p> : null}
            {error ? <p className="error-banner">{error}</p> : null}
            {scan?.warnings?.length ? <p className="note-banner">{scan.warnings.slice(0, 3).join(" ")}</p> : null}
            {tracker?.warnings?.length ? <p className="note-banner">{tracker.warnings.slice(0, 3).join(" ")}</p> : null}
          </article>
          <article className="panel">
            <div className="section-head with-action"><div><h2>Market all indices daily tracker</h2><p>Fetch once, save a local JSON snapshot, then compare daily to 1-year deltas whenever the app runs fresh.</p></div><button type="button" className="secondary-button" onClick={runMarketTracker} disabled={loading}>{loading ? "Fetching..." : "Refresh tracker"}</button></div>
            <div className="table-wrap"><table><thead><tr>{["index", "today", "week", "fortnight", "month", "quarter", "6m", "1y", "snapshot"].map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{tracker?.items.length ? tracker.items.map((item) => <tr key={`${item.metric.symbol_token}-tracker`}><td>{formatValue(item.metric.display_name)}</td><td>{formatPct(item.period_deltas.daily)}</td><td>{formatPct(item.period_deltas.weekly)}</td><td>{formatPct(item.period_deltas.fortnightly)}</td><td>{formatPct(item.period_deltas.monthly)}</td><td>{formatPct(item.period_deltas.quarterly)}</td><td>{formatPct(item.period_deltas.six_months)}</td><td>{formatPct(item.period_deltas.one_year)}</td><td>{formatPct(item.snapshot_delta_pct)}</td></tr>) : <tr><td className="empty-cell" colSpan={9}>Refresh tracker to store today&apos;s index snapshot.</td></tr>}</tbody></table></div>
          </article>
          <article className="panel">
            <div className="section-head with-action"><div><h2>Mutual fund analysis</h2><p>Tracks selected index/flexi/small/mid-cap funds from external NAV data, not SmartAPI.</p></div><button type="button" className="secondary-button" onClick={loadMutualFunds} disabled={fundLoading}>{fundLoading ? "Loading..." : "Load funds"}</button></div>
            <div className="table-wrap"><table><thead><tr>{["fund", "nav", "date", "1m", "3m", "6m", "1y", "view"].map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{mutualFunds?.funds.length ? mutualFunds.funds.map((fund) => <tr key={fund.scheme_code}><td>{fund.scheme_name}</td><td>{fund.latest_nav.toFixed(4)}</td><td>{fund.latest_date}</td><td>{formatPct(fund.one_month_return_pct)}</td><td>{formatPct(fund.three_month_return_pct)}</td><td>{formatPct(fund.six_month_return_pct)}</td><td>{formatPct(fund.one_year_return_pct)}</td><td>{fund.recommendation}</td></tr>) : <tr><td className="empty-cell" colSpan={8}>Load tracked funds to compare monthly and longer NAV returns.</td></tr>}</tbody></table></div>
            {mutualFunds?.warnings?.length ? <p className="note-banner">{mutualFunds.warnings.slice(0, 2).join(" ")}</p> : null}
          </article>
          <article className="panel">
            <div className="section-head with-action"><div><h2>News feed</h2><p>Google News RSS for Indian market opportunity tracking.</p></div><button type="button" className="secondary-button" onClick={loadMarketNews} disabled={newsLoading}>{newsLoading ? "Loading..." : "Refresh news"}</button></div>
            <div className="news-list">{news?.items.length ? news.items.map((item) => <a key={item.link} className="news-item" href={item.link} target="_blank" rel="noreferrer"><strong>{item.title}</strong><span>{item.source ?? "Google News"} · {item.published_at ?? ""}</span></a>) : <p className="muted-text">Refresh news to populate the latest market headlines.</p>}</div>
          </article>
          <form className="panel stack" onSubmit={runScan}>
            <div className="section-head"><div><h2>Universe query</h2><p>Run analysis against the selected universe and filter set.</p></div></div>
            <label>Watchlist / index universe<textarea rows={8} value={watchlistText} onChange={(event) => setWatchlistText(event.target.value)} /></label>
            <label>Benchmark<input value={benchmarkText} onChange={(event) => setBenchmarkText(event.target.value)} /></label>
            <label>Formula<textarea rows={4} value={formula} onChange={(event) => setFormula(event.target.value)} /></label>
            <div className="formula-help"><strong>Formula aliases</strong><div className="alias-list">{Object.entries(fieldsResponse.formula_aliases).map(([label, key]) => <span key={label}>{label}{" -> "}{key}</span>)}</div></div>
            <div className="section-head with-action"><div><h2>Bottom filters</h2><p>Apply structured filters, then load or save the screen.</p></div><button type="button" className="secondary-button" onClick={addFilter}>Add filter</button></div>
            {filters.map((rule, index) => <div className="filter-row" key={`filter-${index}`}><select value={rule.field} onChange={(event) => updateFilter(index, { field: event.target.value })}>{fieldsResponse.fields.map((field) => <option key={field.key} value={field.key}>{field.label}</option>)}</select><select value={rule.operator} onChange={(event) => updateFilter(index, { operator: event.target.value })}>{fieldsResponse.operators.map((operator) => <option key={operator} value={operator}>{operator}</option>)}</select>{rule.operator === "between" ? <><input type="number" value={rule.min_value ?? 0} onChange={(event) => updateFilter(index, { min_value: Number(event.target.value) })} /><input type="number" value={rule.max_value ?? 0} onChange={(event) => updateFilter(index, { max_value: Number(event.target.value) })} /></> : <input type="number" value={rule.value ?? 0} onChange={(event) => updateFilter(index, { value: Number(event.target.value) })} />}<button type="button" className="ghost-button" onClick={() => removeFilter(index)}>Remove</button></div>)}
            <div className="input-grid controls-grid"><label>Sort<select value={sortField} onChange={(event) => setSortField(event.target.value)}>{fieldsResponse.fields.map((field) => <option key={field.key} value={field.key}>{field.label}</option>)}</select></label><label>Direction<select value={sortDirection} onChange={(event) => setSortDirection(event.target.value as "asc" | "desc")}><option value="desc">desc</option><option value="asc">asc</option></select></label><label>Limit<input type="number" min={1} max={250} value={limit} onChange={(event) => setLimit(Number(event.target.value))} /></label><button className="primary-button" type="submit" disabled={loading}>{loading ? "Running analysis..." : "Run analysis"}</button></div>
          </form>
          <article className="panel"><div className="section-head"><div><h2>Recommendation output</h2><p>Read-only signal table from the latest query.</p></div></div><div className="table-wrap"><table><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{scan?.metrics.length ? scan.metrics.map((metric, index) => <tr key={`${metric.symbol_token}-${index}`}>{columns.map((column) => <td key={`${metric.symbol_token}-${column}`}>{formatValue(metric[column])}</td>)}</tr>) : <tr><td className="empty-cell" colSpan={columns.length}>Run a scan to see recommendations.</td></tr>}</tbody></table></div></article>
          <article className="panel mcp-panel"><div className="section-head"><div><h2>{mcpHint?.title ?? "MCP integration"}</h2><p>{mcpHint?.description ?? "Backend MCP surface not loaded yet."}</p></div></div><div className="mcp-grid"><div><h3>Resources</h3><ul>{(mcpHint?.resources ?? []).map((resource) => <li key={resource}>{resource}</li>)}</ul></div><div><h3>Tools</h3><ul>{(mcpHint?.tools ?? []).map((tool) => <li key={tool}>{tool}</li>)}</ul></div></div></article>
        </section>
      </main>
    </div>
  );
}

function parseSymbols(raw: string): SymbolRow[] {
  return raw.split(/\n+/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const [exchange, trading_symbol, symbol_token, display_name = trading_symbol, sector = "", market_cap] = line.split("|");
    return { exchange, trading_symbol, symbol_token, display_name, sector, market_cap: market_cap ? Number(market_cap) : undefined, interval: "ONE_DAY", lookback_candles: 400 };
  });
}

function instrumentToWatchlistRow(instrument: InstrumentRecord) {
  const displayName = instrument.name && instrument.name !== "-" ? instrument.name : instrument.symbol;
  const sector = instrument.instrument_type || "Instrument";
  return `${instrument.exchange}|${instrument.symbol}|${instrument.token}|${displayName}|${sector}|0`;
}

function formatValue(value: string | number | null | undefined) {
  if (typeof value === "number") return Number.isInteger(value) ? value.toString() : value.toFixed(2);
  return value ?? "-";
}

function formatPct(value: number | null | undefined) {
  if (typeof value !== "number") return "-";
  return `${value.toFixed(2)}%`;
}

export default App;
