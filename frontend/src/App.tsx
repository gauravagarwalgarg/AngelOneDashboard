import { FormEvent, useEffect, useMemo, useState } from "react";

function useTheme() {
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem('dashboard-theme');
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('dashboard-theme', theme);
  }, [theme]);

  const toggle = () => setThemeState(t => t === 'dark' ? 'light' : 'dark');
  return { theme, toggle };
}

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

type TabId = "summary" | "mutual-funds" | "news" | "screener" | "filters" | "snapshots" | "ai";

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

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "summary", label: "Summary", icon: "📊" },
  { id: "mutual-funds", label: "Mutual Funds", icon: "💰" },
  { id: "news", label: "News", icon: "📰" },
  { id: "screener", label: "Instruments", icon: "🔍" },
  { id: "filters", label: "Stock Screener", icon: "⚙️" },
  { id: "snapshots", label: "Snapshots", icon: "📈" },
  { id: "ai", label: "AI Predictions", icon: "🤖" },
];

function App() {
  const { theme, toggle: toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabId>("summary");
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
  const [formula, setFormula] = useState("");
  const [filters, setFilters] = useState<FilterRule[]>([]);
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

  // --- Auth functions ---
  async function login(event?: FormEvent) {
    event?.preventDefault();
    setAuthLoading(true); setError(null); setMessage(null);
    try {
      const response = await fetch(`${apiBase}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ api_key: apiKey, client_code: clientCode, password, totp, state: stateValue, headers: sessionHeaders }) });
      const data = (await response.json()) as AuthSession | { detail?: string };
      if (!response.ok) throw new Error("detail" in data ? data.detail ?? "Authentication failed." : "Authentication failed.");
      setSession(data as AuthSession); setMessage("Authenticated with SmartAPI. Dashboard unlocked."); setPassword(""); setTotp("");
    } catch (authError) { setError(authError instanceof Error ? authError.message : "Authentication failed."); } finally { setAuthLoading(false); }
  }
  async function refreshSession() {
    if (!session) return;
    setAuthLoading(true); setError(null); setMessage(null);
    try {
      const response = await fetch(`${apiBase}/api/auth/refresh`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ api_key: session.api_key, client_code: session.client_code, auth_token: session.auth_token, refresh_token: session.refresh_token, headers: session.headers }) });
      const data = (await response.json()) as AuthSession | { detail?: string };
      if (!response.ok) throw new Error("detail" in data ? data.detail ?? "Session refresh failed." : "Session refresh failed.");
      setSession(data as AuthSession); setMessage("Refreshed SmartAPI session tokens.");
    } catch (refreshError) { setError(refreshError instanceof Error ? refreshError.message : "Session refresh failed."); } finally { setAuthLoading(false); }
  }
  async function loadProfile() {
    if (!session) return;
    setAuthLoading(true); setError(null); setMessage(null);
    try {
      const response = await fetch(`${apiBase}/api/auth/profile`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session }) });
      const data = (await response.json()) as UserProfile | { detail?: string };
      if (!response.ok) throw new Error("detail" in data ? data.detail ?? "Profile fetch failed." : "Profile fetch failed.");
      setProfile(data as UserProfile); setMessage("Loaded Angel One profile information.");
    } catch (profileError) { setError(profileError instanceof Error ? profileError.message : "Profile fetch failed."); } finally { setAuthLoading(false); }
  }

  // --- Scan functions ---
  async function runScan(event?: FormEvent) {
    event?.preventDefault();
    if (!session) return;
    setLoading(true); setError(null); setMessage(null);
    try {
      const response = await fetch(`${apiBase}/api/scan`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ credentials: { api_key: session.api_key, client_code: session.client_code, auth_token: session.auth_token, refresh_token: session.refresh_token, feed_token: session.feed_token ?? undefined }, symbols: parseSymbols(watchlistText), benchmark: parseSymbols(benchmarkText)[0], filters, formula: formula.trim() || null, sort: { field: sortField, direction: sortDirection }, limit, triggers: [] }) });
      const data = (await response.json()) as ScanResponse | { detail?: string };
      if (!response.ok) throw new Error("detail" in data ? data.detail ?? "Scan failed." : "Scan failed.");
      setScan(data as ScanResponse); setMessage(`Analysis complete for ${(data as ScanResponse).matched_symbols} matched symbols.`);
    } catch (scanError) { setError(scanError instanceof Error ? scanError.message : "Scan failed."); } finally { setLoading(false); }
  }

  // --- Screener CRUD ---
  async function saveCurrentScreener() {
    setError(null); setMessage(null);
    try {
      const payload: ScreenerDefinition = { id: screenerId, name: screenerName, description: screenerDescription, watchlist_text: watchlistText, benchmark_text: benchmarkText, filters, formula: formula.trim() || null, sort: { field: sortField, direction: sortDirection }, limit };
      const response = await fetch(`${apiBase}/api/screeners`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error("Unable to save screener.");
      const saved = (await response.json()) as ScreenerDefinition;
      setSavedScreeners((current) => { const others = current.filter((item) => item.id !== saved.id); return [saved, ...others].sort((left, right) => left.name.localeCompare(right.name)); });
      setMessage(`Saved screener "${saved.name}".`);
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Unable to save screener."); }
  }
  function loadScreener(screener: ScreenerDefinition) {
    setScreenerId(screener.id); setScreenerName(screener.name); setScreenerDescription(screener.description ?? ""); setWatchlistText(screener.watchlist_text); setBenchmarkText(screener.benchmark_text ?? defaultBenchmark); setFilters(screener.filters); setFormula(screener.formula ?? ""); setSortField(screener.sort.field); setSortDirection(screener.sort.direction); setLimit(screener.limit); setMessage(`Loaded screener "${screener.name}".`); setActiveTab("filters");
  }
  async function deleteSavedScreener(id: string) {
    setError(null); setMessage(null);
    try {
      const response = await fetch(`${apiBase}/api/screeners/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Unable to delete screener.");
      setSavedScreeners((current) => current.filter((item) => item.id !== id));
      if (screenerId === id) setScreenerId(crypto.randomUUID());
      setMessage("Deleted saved screener.");
    } catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : "Unable to delete screener."); }
  }

  // --- Instrument functions ---
  async function syncInstruments() {
    setInstrumentLoading(true); setError(null); setMessage(null);
    try {
      const response = await fetch(`${apiBase}/api/instruments/sync`, { method: "POST" });
      const data = (await response.json()) as { total?: number; detail?: string };
      if (!response.ok) throw new Error(data.detail ?? "Instrument sync failed.");
      setMessage(`Synced ${data.total ?? 0} instruments from Angel One scrip master.`);
      const statusResponse = await fetch(`${apiBase}/api/instruments/status`);
      setInstrumentStatus((await statusResponse.json()) as InstrumentStatus);
    } catch (syncError) { setError(syncError instanceof Error ? syncError.message : "Instrument sync failed."); } finally { setInstrumentLoading(false); }
  }
  async function searchInstrument(event?: FormEvent) {
    event?.preventDefault();
    setInstrumentLoading(true); setError(null); setMessage(null);
    try {
      const params = new URLSearchParams({ query: instrumentQuery, limit: "25" });
      if (instrumentExchange.trim()) params.set("exchange", instrumentExchange.trim().toUpperCase());
      const response = await fetch(`${apiBase}/api/instruments/search?${params.toString()}`);
      const data = (await response.json()) as InstrumentSearchResponse | { detail?: string };
      if (!response.ok) throw new Error("detail" in data ? data.detail ?? "Instrument search failed." : "Instrument search failed.");
      setInstrumentResults((data as InstrumentSearchResponse).instruments); setMessage(`Found ${(data as InstrumentSearchResponse).total} matching instruments.`);
    } catch (searchError) { setError(searchError instanceof Error ? searchError.message : "Instrument search failed."); } finally { setInstrumentLoading(false); }
  }
  async function loadCachedIndices() {
    setInstrumentLoading(true); setError(null); setMessage(null);
    try {
      const params = new URLSearchParams({ limit: "250" });
      if (instrumentExchange.trim()) params.set("exchange", instrumentExchange.trim().toUpperCase());
      const response = await fetch(`${apiBase}/api/instruments/indices?${params.toString()}`);
      const data = (await response.json()) as InstrumentSearchResponse | { detail?: string };
      if (!response.ok) throw new Error("detail" in data ? data.detail ?? "Index lookup failed." : "Index lookup failed.");
      setInstrumentResults((data as InstrumentSearchResponse).instruments); setMessage(`Loaded ${(data as InstrumentSearchResponse).total} cached index instruments.`);
    } catch (indexError) { setError(indexError instanceof Error ? indexError.message : "Index lookup failed."); } finally { setInstrumentLoading(false); }
  }

  // --- News & MF ---
  async function loadMarketNews() {
    setNewsLoading(true); setError(null);
    try {
      const response = await fetch(`${apiBase}/api/news/market`);
      const data = (await response.json()) as NewsResponse | { detail?: string };
      if (!response.ok) throw new Error("detail" in data ? data.detail ?? "News fetch failed." : "News fetch failed.");
      setNews(data as NewsResponse);
    } catch (newsError) { setError(newsError instanceof Error ? newsError.message : "News fetch failed."); } finally { setNewsLoading(false); }
  }
  async function loadMutualFunds() {
    setFundLoading(true); setError(null);
    try {
      const response = await fetch(`${apiBase}/api/mutual-funds/tracked`);
      const data = (await response.json()) as MutualFundResponse | { detail?: string };
      if (!response.ok) throw new Error("detail" in data ? data.detail ?? "Mutual fund fetch failed." : "Mutual fund fetch failed.");
      setMutualFunds(data as MutualFundResponse); setMessage(`Loaded ${(data as MutualFundResponse).funds.length} tracked mutual funds.`);
    } catch (fundError) { setError(fundError instanceof Error ? fundError.message : "Mutual fund fetch failed."); } finally { setFundLoading(false); }
  }

  // --- Tracker ---
  async function runMarketTracker() {
    if (!session) return;
    setLoading(true); setError(null); setMessage(null);
    try {
      const response = await fetch(`${apiBase}/api/market-tracker`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ credentials: { api_key: session.api_key, client_code: session.client_code, auth_token: session.auth_token, refresh_token: session.refresh_token, feed_token: session.feed_token ?? undefined }, symbols: parseSymbols(watchlistText) }) });
      const data = (await response.json()) as MarketTrackerResponse | { detail?: string };
      if (!response.ok) throw new Error("detail" in data ? data.detail ?? "Market tracker failed." : "Market tracker failed.");
      setTracker(data as MarketTrackerResponse); setMessage(`Stored daily market snapshot for ${(data as MarketTrackerResponse).total_symbols} instruments.`);
    } catch (trackerError) { setError(trackerError instanceof Error ? trackerError.message : "Market tracker failed."); } finally { setLoading(false); }
  }

  // --- Helpers ---
  function loadOnlyPresets() { setWatchlistText(presets.filter((item) => !item.row.includes("<token>")).map((item) => item.row).join("\n")); setMessage("Loaded index presets with known SmartAPI tokens."); }
  function logout() { setSession(null); setProfile(null); setScan(null); setTracker(null); setMessage(null); setError(null); }
  function addFilter() { setFilters((current) => [...current, { field: "analysis_score", operator: "gte", value: 0 }]); }
  function updateFilter(index: number, patch: Partial<FilterRule>) { setFilters((current) => current.map((rule, ruleIndex) => (ruleIndex === index ? { ...rule, ...patch } : rule))); }
  function removeFilter(index: number) { setFilters((current) => current.filter((_, ruleIndex) => ruleIndex !== index)); }
  function updateSessionHeader(key: keyof SessionHeaders, value: string) { setSessionHeaders((current) => ({ ...current, [key]: value })); }
  function addPreset(row: string) {
    if (row.includes("<token>")) { setMessage("This preset needs a symbol token from the Angel One scrip master before it can be scanned."); return; }
    setWatchlistText((current) => current.includes(row) ? current : `${current.trim()}\n${row}`.trim());
  }
  function addInstrumentToWatchlist(instrument: InstrumentRecord) {
    const row = instrumentToWatchlistRow(instrument);
    setWatchlistText((current) => current.includes(row) ? current : `${current.trim()}\n${row}`.trim());
    setMessage(`Added ${instrument.symbol} to watchlist.`);
  }
  function setInstrumentAsBenchmark(instrument: InstrumentRecord) { setBenchmarkText(instrumentToWatchlistRow(instrument)); setMessage(`Set ${instrument.symbol} as benchmark.`); }

  // --- AUTH PAGE ---
  if (!session) {
    return (
      <div className="app-shell auth-shell">
        <section className="auth-page panel focus-panel">
          <div className="auth-header">
            <p className="eyebrow">Angel One Analysis Lab</p>
            <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
          <h1>Authenticate first</h1>
          <p className="hero-copy">This page only handles SmartAPI login. Once authenticated, you enter the analysis dashboard.</p>
          {analysisInfo ? <p className="note-banner">{analysisInfo.authentication_note}</p> : null}
          {error ? <p className="error-banner">{error}</p> : null}
          {message ? <p className="success-banner">{message}</p> : null}
          <form className="stack" onSubmit={login}>
            <div className="input-grid credentials-grid">
              <label>API Key<input value={apiKey} onChange={(e) => setApiKey(e.target.value)} required /></label>
              <label>Client Code<input value={clientCode} onChange={(e) => setClientCode(e.target.value)} required /></label>
              <label>PIN / Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
              <label>TOTP<input value={totp} onChange={(e) => setTotp(e.target.value)} required /></label>
              <label>State<input value={stateValue} onChange={(e) => setStateValue(e.target.value)} /></label>
            </div>
            <div className="section-head"><div><h3>Request headers</h3><p>Required by SmartAPI auth endpoints.</p></div></div>
            <div className="input-grid credentials-grid">
              <label>Local IP<input value={sessionHeaders.client_local_ip} onChange={(e) => updateSessionHeader("client_local_ip", e.target.value)} /></label>
              <label>Public IP<input value={sessionHeaders.client_public_ip} onChange={(e) => updateSessionHeader("client_public_ip", e.target.value)} /></label>
              <label>MAC Address<input value={sessionHeaders.mac_address} onChange={(e) => updateSessionHeader("mac_address", e.target.value)} /></label>
              <label>Source ID<input value={sessionHeaders.source_id} onChange={(e) => updateSessionHeader("source_id", e.target.value)} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={authLoading}>{authLoading ? "Authenticating..." : "Enter dashboard"}</button>
          </form>
        </section>
      </div>
    );
  }

  // --- DASHBOARD (TABBED) ---
  return (
    <div className="app-shell dashboard-shell">
      {/* Top header bar */}
      <header className="top-bar panel">
        <div className="top-bar-left">
          <h2 className="brand">Angel One Dashboard</h2>
          {profile ? <span className="user-badge">{profile.name ?? profile.clientcode}</span> : null}
        </div>
        <div className="top-bar-right">
          {message ? <span className="status-msg success-text">{message}</span> : null}
          {error ? <span className="status-msg error-text">{error}</span> : null}
          <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">{theme === 'dark' ? '☀️' : '🌙'}</button>
          <button type="button" className="secondary-button" onClick={refreshSession} disabled={authLoading}>Refresh</button>
          <button type="button" className="secondary-button" onClick={loadProfile} disabled={authLoading}>Profile</button>
          <button type="button" className="ghost-button" onClick={logout}>Logout</button>
        </div>
      </header>

      {/* Tab navigation */}
      <nav className="tab-nav">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            className={`tab-button ${activeTab === tab.id ? "tab-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Tab content */}
      <main className="tab-content">
        {activeTab === "summary" && <SummaryTab tracker={tracker} scan={scan} runMarketTracker={runMarketTracker} loading={loading} />}
        {activeTab === "mutual-funds" && <MutualFundsTab mutualFunds={mutualFunds} loadMutualFunds={loadMutualFunds} fundLoading={fundLoading} />}
        {activeTab === "news" && <NewsTab news={news} loadMarketNews={loadMarketNews} newsLoading={newsLoading} />}
        {activeTab === "screener" && (
          <ScreenerTab
            instrumentStatus={instrumentStatus} instrumentQuery={instrumentQuery} setInstrumentQuery={setInstrumentQuery}
            instrumentExchange={instrumentExchange} setInstrumentExchange={setInstrumentExchange}
            instrumentResults={instrumentResults} instrumentLoading={instrumentLoading}
            syncInstruments={syncInstruments} searchInstrument={searchInstrument} loadCachedIndices={loadCachedIndices}
            addInstrumentToWatchlist={addInstrumentToWatchlist} setInstrumentAsBenchmark={setInstrumentAsBenchmark}
            savedScreeners={savedScreeners} loadScreener={loadScreener} deleteSavedScreener={deleteSavedScreener}
            presets={presets} addPreset={addPreset} loadOnlyPresets={loadOnlyPresets}
          />
        )}
        {activeTab === "filters" && (
          <FiltersTab
            watchlistText={watchlistText} setWatchlistText={setWatchlistText}
            benchmarkText={benchmarkText} setBenchmarkText={setBenchmarkText}
            formula={formula} setFormula={setFormula}
            filters={filters} addFilter={addFilter} updateFilter={updateFilter} removeFilter={removeFilter}
            sortField={sortField} setSortField={setSortField}
            sortDirection={sortDirection} setSortDirection={setSortDirection}
            limit={limit} setLimit={setLimit}
            fieldsResponse={fieldsResponse}
            loading={loading} runScan={runScan}
            scan={scan} columns={columns}
            screenerName={screenerName} setScreenerName={setScreenerName}
            screenerDescription={screenerDescription} setScreenerDescription={setScreenerDescription}
            saveCurrentScreener={saveCurrentScreener}
          />
        )}
        {activeTab === "snapshots" && <SnapshotsTab tracker={tracker} runMarketTracker={runMarketTracker} loading={loading} />}
        {activeTab === "ai" && <AITab mcpHint={mcpHint} tracker={tracker} scan={scan} />}
      </main>
    </div>
  );
}

// ===================== TAB COMPONENTS =====================

function SummaryTab({ tracker, scan, runMarketTracker, loading }: { tracker: MarketTrackerResponse | null; scan: ScanResponse | null; runMarketTracker: () => void; loading: boolean }) {
  const indices = tracker?.items ?? [];
  const topGainers = [...indices].sort((a, b) => (b.period_deltas.daily ?? 0) - (a.period_deltas.daily ?? 0)).slice(0, 3);
  const topLosers = [...indices].sort((a, b) => (a.period_deltas.daily ?? 0) - (b.period_deltas.daily ?? 0)).slice(0, 3);

  return (
    <div className="tab-panel-grid">
      <div className="section-head with-action">
        <div>
          <h2>Market Summary</h2>
          <p>Today's index overview and daily performance at a glance.</p>
        </div>
        <button type="button" className="primary-button" onClick={runMarketTracker} disabled={loading}>{loading ? "Fetching..." : "Refresh Data"}</button>
      </div>

      {/* Index cards row */}
      <div className="index-cards-row">
        {indices.length > 0 ? indices.slice(0, 8).map((item) => (
          <div key={String(item.metric.symbol_token)} className="index-card panel">
            <span className="index-card-name">{String(item.metric.display_name)}</span>
            <strong className="index-card-price">{formatValue(item.metric.current_price)}</strong>
            <span className={`index-card-change ${(item.period_deltas.daily ?? 0) >= 0 ? 'text-good' : 'text-bad'}`}>
              {formatPct(item.period_deltas.daily)}
            </span>
          </div>
        )) : (
          <p className="muted-text">Click "Refresh Data" to load index information.</p>
        )}
      </div>

      {/* Top Gainers and Losers */}
      {indices.length > 0 && (
        <div className="summary-grid-2col">
          <div className="panel">
            <h3 className="text-good">▲ Top Gainers (Daily)</h3>
            <div className="mover-list">
              {topGainers.map((item) => (
                <div key={String(item.metric.symbol_token)} className="mover-item">
                  <span>{String(item.metric.display_name)}</span>
                  <span><strong>{formatValue(item.metric.current_price)}</strong></span>
                  <span className="text-good">{formatPct(item.period_deltas.daily)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="panel">
            <h3 className="text-bad">▼ Top Losers (Daily)</h3>
            <div className="mover-list">
              {topLosers.map((item) => (
                <div key={String(item.metric.symbol_token)} className="mover-item">
                  <span>{String(item.metric.display_name)}</span>
                  <span><strong>{formatValue(item.metric.current_price)}</strong></span>
                  <span className="text-bad">{formatPct(item.period_deltas.daily)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="summary-grid-2col">
        <div className="panel">
          <h3>Scan Status</h3>
          <div className="stat-grid stats-row">
            <div><span className="label">Matched</span><strong>{scan?.matched_symbols ?? 0}</strong></div>
            <div><span className="label">Universe</span><strong>{scan?.total_symbols ?? 0}</strong></div>
            <div><span className="label">Benchmark</span><strong>{scan?.benchmark_change_pct?.toFixed(2) ?? ""}%</strong></div>
          </div>
        </div>
        <div className="panel">
          <h3>Tracker Info</h3>
          <div className="stat-grid stats-row">
            <div><span className="label">Date</span><strong>{tracker?.snapshot_date ?? ""}</strong></div>
            <div><span className="label">Instruments</span><strong>{tracker?.total_symbols ?? 0}</strong></div>
          </div>
          {tracker?.warnings?.length ? <p className="note-banner">{tracker.warnings.slice(0, 2).join(" ")}</p> : null}
        </div>
      </div>
    </div>
  );
}

function MutualFundsTab({ mutualFunds, loadMutualFunds, fundLoading }: { mutualFunds: MutualFundResponse | null; loadMutualFunds: () => void; fundLoading: boolean }) {
  return (
    <div className="tab-panel-grid">
      <div className="section-head with-action">
        <div>
          <h2>Mutual Fund Tracker</h2>
          <p>Tracked index, flexi-cap, small-cap, and mid-cap fund NAV returns from external data (not SmartAPI).</p>
        </div>
        <button type="button" className="primary-button" onClick={loadMutualFunds} disabled={fundLoading}>{fundLoading ? "Loading..." : "Load Funds"}</button>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fund</th><th>NAV</th><th>Date</th><th>1M</th><th>3M</th><th>6M</th><th>1Y</th><th>Signal</th>
              </tr>
            </thead>
            <tbody>
              {mutualFunds?.funds.length ? mutualFunds.funds.map((fund) => (
                <tr key={fund.scheme_code}>
                  <td>{fund.scheme_name}</td>
                  <td>{fund.latest_nav.toFixed(4)}</td>
                  <td>{fund.latest_date}</td>
                  <td className={getReturnClass(fund.one_month_return_pct)}>{formatPct(fund.one_month_return_pct)}</td>
                  <td className={getReturnClass(fund.three_month_return_pct)}>{formatPct(fund.three_month_return_pct)}</td>
                  <td className={getReturnClass(fund.six_month_return_pct)}>{formatPct(fund.six_month_return_pct)}</td>
                  <td className={getReturnClass(fund.one_year_return_pct)}>{formatPct(fund.one_year_return_pct)}</td>
                  <td><span className="recommendation-badge">{fund.recommendation}</span></td>
                </tr>
              )) : (
                <tr><td className="empty-cell" colSpan={8}>Click "Load Funds" to see tracked mutual fund performance.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {mutualFunds?.warnings?.length ? <p className="note-banner">{mutualFunds.warnings.slice(0, 2).join(" ")}</p> : null}
      </div>
    </div>
  );
}

function NewsTab({ news, loadMarketNews, newsLoading }: { news: NewsResponse | null; loadMarketNews: () => void; newsLoading: boolean }) {
  return (
    <div className="tab-panel-grid">
      <div className="section-head with-action">
        <div>
          <h2>Market News Feed</h2>
          <p>Google News RSS for Indian stock market opportunities and headlines.</p>
        </div>
        <button type="button" className="primary-button" onClick={loadMarketNews} disabled={newsLoading}>{newsLoading ? "Loading..." : "Refresh News"}</button>
      </div>

      <div className="news-grid">
        {news?.items.length ? news.items.map((item) => (
          <a key={item.link} className="news-card panel" href={item.link} target="_blank" rel="noreferrer">
            <strong>{item.title}</strong>
            <span className="news-meta">{item.source ?? "Google News"} · {item.published_at ?? ""}</span>
          </a>
        )) : (
          <p className="muted-text">Click "Refresh News" to load the latest market headlines.</p>
        )}
      </div>
    </div>
  );
}

function ScreenerTab({
  instrumentStatus, instrumentQuery, setInstrumentQuery, instrumentExchange, setInstrumentExchange,
  instrumentResults, instrumentLoading, syncInstruments, searchInstrument, loadCachedIndices,
  addInstrumentToWatchlist, setInstrumentAsBenchmark, savedScreeners, loadScreener, deleteSavedScreener,
  presets, addPreset, loadOnlyPresets,
}: {
  instrumentStatus: InstrumentStatus | null; instrumentQuery: string; setInstrumentQuery: (v: string) => void;
  instrumentExchange: string; setInstrumentExchange: (v: string) => void;
  instrumentResults: InstrumentRecord[]; instrumentLoading: boolean;
  syncInstruments: () => void; searchInstrument: (e?: FormEvent) => void; loadCachedIndices: () => void;
  addInstrumentToWatchlist: (i: InstrumentRecord) => void; setInstrumentAsBenchmark: (i: InstrumentRecord) => void;
  savedScreeners: ScreenerDefinition[]; loadScreener: (s: ScreenerDefinition) => void; deleteSavedScreener: (id: string) => void;
  presets: IndexPreset[]; addPreset: (row: string) => void; loadOnlyPresets: () => void;
}) {
  return (
    <div className="tab-panel-grid">
      {/* Index presets */}
      <article className="panel">
        <div className="section-head with-action">
          <div><h2>Index Templates</h2><p>Quick-add common index rows. Use instrument search for token lookup.</p></div>
          <button type="button" className="secondary-button" onClick={loadOnlyPresets}>Load known presets</button>
        </div>
        <div className="preset-grid">
          {presets.map((preset) => (
            <button key={preset.name} type="button" className="preset-card" onClick={() => addPreset(preset.row)}>
              <span>{preset.kind}</span><strong>{preset.name}</strong>
            </button>
          ))}
        </div>
      </article>

      {/* Instrument search */}
      <article className="panel">
        <div className="section-head with-action">
          <div><h2>Instrument Search</h2><p>{instrumentStatus?.cache_exists ? `${instrumentStatus.total} cached instruments.` : "Sync Angel One scrip master before searching."}</p></div>
          <button type="button" className="secondary-button" onClick={syncInstruments} disabled={instrumentLoading}>{instrumentLoading ? "Working..." : "Sync master"}</button>
        </div>
        <form className="instrument-search" onSubmit={searchInstrument}>
          <input value={instrumentQuery} onChange={(e) => setInstrumentQuery(e.target.value)} placeholder="Search NIFTY, HDFCBANK, PHARMA..." />
          <select value={instrumentExchange} onChange={(e) => setInstrumentExchange(e.target.value)}>
            <option value="">All</option><option value="NSE">NSE</option><option value="BSE">BSE</option><option value="NFO">NFO</option><option value="CDS">CDS</option><option value="MCX">MCX</option>
          </select>
          <button className="primary-button" type="submit" disabled={instrumentLoading}>{instrumentLoading ? "..." : "Search"}</button>
        </form>
        <button type="button" className="secondary-button" onClick={loadCachedIndices} disabled={instrumentLoading}>Load cached indices</button>
        <div className="instrument-results">
          {instrumentResults.length ? instrumentResults.map((instrument) => (
            <div key={`${instrument.exchange}-${instrument.token}-${instrument.symbol}`} className="instrument-item">
              <div><strong>{instrument.symbol}</strong><p>{instrument.exchange} · {instrument.token} · {instrument.name ?? "-"} · {instrument.instrument_type ?? "instrument"}</p></div>
              <div className="row-actions">
                <button type="button" className="ghost-button" onClick={() => addInstrumentToWatchlist(instrument)}>Add</button>
                <button type="button" className="ghost-button" onClick={() => setInstrumentAsBenchmark(instrument)}>Benchmark</button>
              </div>
            </div>
          )) : <p className="muted-text">Search results will appear here.</p>}
        </div>
      </article>

      {/* Saved screeners */}
      <article className="panel">
        <div className="section-head"><div><h2>Saved Screeners</h2><p>Load an existing filter set into the Stock Screener tab.</p></div></div>
        <div className="saved-list">
          {savedScreeners.length ? savedScreeners.map((screener) => (
            <div key={screener.id} className="saved-item">
              <div><strong>{screener.name}</strong><p>{screener.description}</p></div>
              <div className="row-actions">
                <button type="button" className="ghost-button" onClick={() => loadScreener(screener)}>Load</button>
                <button type="button" className="ghost-button" onClick={() => deleteSavedScreener(screener.id)}>Delete</button>
              </div>
            </div>
          )) : <p className="muted-text">No saved screeners yet.</p>}
        </div>
      </article>
    </div>
  );
}

function FiltersTab({
  watchlistText, setWatchlistText, benchmarkText, setBenchmarkText, formula, setFormula,
  filters, addFilter, updateFilter, removeFilter, sortField, setSortField, sortDirection, setSortDirection,
  limit, setLimit, fieldsResponse, loading, runScan, scan, columns,
  screenerName, setScreenerName, screenerDescription, setScreenerDescription, saveCurrentScreener,
}: {
  watchlistText: string; setWatchlistText: (v: string) => void;
  benchmarkText: string; setBenchmarkText: (v: string) => void;
  formula: string; setFormula: (v: string) => void;
  filters: FilterRule[]; addFilter: () => void; updateFilter: (i: number, p: Partial<FilterRule>) => void; removeFilter: (i: number) => void;
  sortField: string; setSortField: (v: string) => void;
  sortDirection: "asc" | "desc"; setSortDirection: (v: "asc" | "desc") => void;
  limit: number; setLimit: (v: number) => void;
  fieldsResponse: FieldsResponse; loading: boolean; runScan: (e?: FormEvent) => void;
  scan: ScanResponse | null; columns: string[];
  screenerName: string; setScreenerName: (v: string) => void;
  screenerDescription: string; setScreenerDescription: (v: string) => void;
  saveCurrentScreener: () => void;
}) {
  return (
    <div className="tab-panel-grid">
      {/* Query form */}
      <form className="panel stack" onSubmit={runScan}>
        <div className="section-head with-action">
          <div><h2>Stock Screener</h2><p>Run analysis against the selected universe and filter set.</p></div>
          <button type="button" className="secondary-button" onClick={saveCurrentScreener}>Save screener</button>
        </div>
        <div className="input-grid credentials-grid">
          <label>Screener name<input value={screenerName} onChange={(e) => setScreenerName(e.target.value)} /></label>
          <label>Description<input value={screenerDescription} onChange={(e) => setScreenerDescription(e.target.value)} /></label>
        </div>
        <label>Watchlist / index universe<textarea rows={6} value={watchlistText} onChange={(e) => setWatchlistText(e.target.value)} /></label>
        <label>Benchmark<input value={benchmarkText} onChange={(e) => setBenchmarkText(e.target.value)} /></label>
        <label>Formula<textarea rows={3} value={formula} onChange={(e) => setFormula(e.target.value)} /></label>
        <div className="formula-help"><strong>Formula aliases</strong><div className="alias-list">{Object.entries(fieldsResponse.formula_aliases).map(([label, key]) => <span key={label}>{label} → {key}</span>)}</div></div>

        <div className="section-head with-action"><div><h3>Structured Filters</h3></div><button type="button" className="secondary-button" onClick={addFilter}>Add filter</button></div>
        {filters.map((rule, index) => (
          <div className="filter-row" key={`filter-${index}`}>
            <select value={rule.field} onChange={(e) => updateFilter(index, { field: e.target.value })}>{fieldsResponse.fields.map((field) => <option key={field.key} value={field.key}>{field.label}</option>)}</select>
            <select value={rule.operator} onChange={(e) => updateFilter(index, { operator: e.target.value })}>{fieldsResponse.operators.map((op) => <option key={op} value={op}>{op}</option>)}</select>
            {rule.operator === "between" ? (
              <><input type="number" value={rule.min_value ?? 0} onChange={(e) => updateFilter(index, { min_value: Number(e.target.value) })} /><input type="number" value={rule.max_value ?? 0} onChange={(e) => updateFilter(index, { max_value: Number(e.target.value) })} /></>
            ) : (
              <input type="number" value={rule.value ?? 0} onChange={(e) => updateFilter(index, { value: Number(e.target.value) })} />
            )}
            <button type="button" className="ghost-button" onClick={() => removeFilter(index)}>✕</button>
          </div>
        ))}

        <div className="input-grid controls-grid">
          <label>Sort<select value={sortField} onChange={(e) => setSortField(e.target.value)}>{fieldsResponse.fields.map((field) => <option key={field.key} value={field.key}>{field.label}</option>)}</select></label>
          <label>Direction<select value={sortDirection} onChange={(e) => setSortDirection(e.target.value as "asc" | "desc")}><option value="desc">desc</option><option value="asc">asc</option></select></label>
          <label>Limit<input type="number" min={1} max={250} value={limit} onChange={(e) => setLimit(Number(e.target.value))} /></label>
          <button className="primary-button" type="submit" disabled={loading}>{loading ? "Running analysis..." : "Run Analysis"}</button>
        </div>
      </form>

      {/* Results */}
      <article className="panel">
        <div className="section-head"><div><h2>Results</h2><p>Read-only signal table from the latest scan.</p></div></div>
        {scan?.warnings?.length ? <p className="note-banner">{scan.warnings.slice(0, 3).join(" ")}</p> : null}
        <div className="table-wrap">
          <table>
            <thead><tr>{columns.map((col) => <th key={col}>{col}</th>)}</tr></thead>
            <tbody>
              {scan?.metrics.length ? scan.metrics.map((metric, i) => (
                <tr key={`${metric.symbol_token}-${i}`}>{columns.map((col) => <td key={`${metric.symbol_token}-${col}`}>{formatValue(metric[col])}</td>)}</tr>
              )) : <tr><td className="empty-cell" colSpan={columns.length}>Run a scan to see recommendations.</td></tr>}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}

function SnapshotsTab({ tracker, runMarketTracker, loading }: { tracker: MarketTrackerResponse | null; runMarketTracker: () => void; loading: boolean }) {
  return (
    <div className="tab-panel-grid">
      <div className="section-head with-action">
        <div>
          <h2>Market Snapshots</h2>
          <p>Compare performance across daily, weekly, monthly, quarterly, half-yearly, and yearly windows. Each refresh stores a JSON snapshot for historical comparison.</p>
        </div>
        <button type="button" className="primary-button" onClick={runMarketTracker} disabled={loading}>{loading ? "Fetching..." : "Refresh Snapshot"}</button>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Index / Stock</th><th>Today</th><th>Week</th><th>Fortnight</th><th>Month</th><th>Quarter</th><th>6 Months</th><th>1 Year</th><th>vs Snapshot</th>
              </tr>
            </thead>
            <tbody>
              {tracker?.items.length ? tracker.items.map((item) => (
                <tr key={String(item.metric.symbol_token)}>
                  <td><strong>{String(item.metric.display_name)}</strong></td>
                  <td className={getReturnClass(item.period_deltas.daily)}>{formatPct(item.period_deltas.daily)}</td>
                  <td className={getReturnClass(item.period_deltas.weekly)}>{formatPct(item.period_deltas.weekly)}</td>
                  <td className={getReturnClass(item.period_deltas.fortnightly)}>{formatPct(item.period_deltas.fortnightly)}</td>
                  <td className={getReturnClass(item.period_deltas.monthly)}>{formatPct(item.period_deltas.monthly)}</td>
                  <td className={getReturnClass(item.period_deltas.quarterly)}>{formatPct(item.period_deltas.quarterly)}</td>
                  <td className={getReturnClass(item.period_deltas.six_months)}>{formatPct(item.period_deltas.six_months)}</td>
                  <td className={getReturnClass(item.period_deltas.one_year)}>{formatPct(item.period_deltas.one_year)}</td>
                  <td className={getReturnClass(item.snapshot_delta_pct)}>{formatPct(item.snapshot_delta_pct)}</td>
                </tr>
              )) : <tr><td className="empty-cell" colSpan={9}>Click "Refresh Snapshot" to load and store today&apos;s data.</td></tr>}
            </tbody>
          </table>
        </div>
        {tracker && (
          <p className="muted-text" style={{ marginTop: 12 }}>
            Snapshot date: <strong>{tracker.snapshot_date}</strong> · {tracker.total_symbols} instruments tracked.
            Each day you open the app, a new snapshot is stored for comparison.
          </p>
        )}
      </div>

      {/* Period explanation */}
      <div className="panel">
        <h3>Period Offset Reference</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Period</th><th>Trading Sessions</th><th>Explanation</th></tr></thead>
            <tbody>
              <tr><td>Daily</td><td>1</td><td>Previous trading close</td></tr>
              <tr><td>Weekly</td><td>5</td><td>~1 week ago</td></tr>
              <tr><td>Fortnightly</td><td>10</td><td>~2 weeks ago</td></tr>
              <tr><td>Monthly</td><td>21</td><td>~1 month ago</td></tr>
              <tr><td>Quarterly</td><td>63</td><td>~3 months ago</td></tr>
              <tr><td>6 Months</td><td>126</td><td>~6 months ago</td></tr>
              <tr><td>1 Year</td><td>252</td><td>~12 months ago</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AITab({ mcpHint, tracker, scan }: { mcpHint: MCPHint | null; tracker: MarketTrackerResponse | null; scan: ScanResponse | null }) {
  const indices = tracker?.items ?? [];
  const bullish = indices.filter(i => (i.period_deltas.daily ?? 0) > 0);
  const bearish = indices.filter(i => (i.period_deltas.daily ?? 0) < 0);

  // Simple momentum scoring
  const momentumScores = indices.map(item => {
    const d = item.period_deltas;
    const shortTerm = ((d.daily ?? 0) * 3 + (d.weekly ?? 0) * 2) / 5;
    const mediumTerm = ((d.monthly ?? 0) * 2 + (d.quarterly ?? 0)) / 3;
    const longTerm = ((d.six_months ?? 0) + (d.one_year ?? 0)) / 2;
    const momentum = shortTerm * 0.4 + mediumTerm * 0.35 + longTerm * 0.25;
    return { name: String(item.metric.display_name), momentum: momentum, shortTerm, mediumTerm, longTerm };
  }).sort((a, b) => b.momentum - a.momentum);

  return (
    <div className="tab-panel-grid">
      <div className="section-head">
        <div>
          <h2>AI Predictions & Analysis</h2>
          <p>Algorithm-driven market outlook based on tracked data. Uses momentum scoring across multiple timeframes for long-term investment and short-term trade ideas.</p>
        </div>
      </div>

      {/* Market sentiment */}
      <div className="summary-grid-2col">
        <div className="panel">
          <h3>Market Sentiment</h3>
          <div className="stat-grid stats-row">
            <div><span className="label">Bullish Indices</span><strong className="text-good">{bullish.length}</strong></div>
            <div><span className="label">Bearish Indices</span><strong className="text-bad">{bearish.length}</strong></div>
            <div><span className="label">Sentiment</span><strong className={bullish.length > bearish.length ? 'text-good' : 'text-bad'}>{bullish.length > bearish.length ? '🟢 Bullish' : bullish.length === bearish.length ? '🟡 Neutral' : '🔴 Bearish'}</strong></div>
          </div>
        </div>
        <div className="panel">
          <h3>MCP Integration</h3>
          <p className="muted-text">{mcpHint?.description ?? "Backend MCP surface not loaded yet."}</p>
          <div className="mcp-grid">
            <div><strong>Resources:</strong> {(mcpHint?.resources ?? []).join(", ") || ""}</div>
            <div><strong>Tools:</strong> {(mcpHint?.tools ?? []).join(", ") || ""}</div>
          </div>
        </div>
      </div>

      {/* Momentum ranking */}
      {momentumScores.length > 0 && (
        <div className="panel">
          <h3>Momentum Ranking (Composite Score)</h3>
          <p className="muted-text">Weighted: 40% short-term (daily + weekly), 35% medium-term (monthly + quarterly), 25% long-term (6M + 1Y)</p>
          <div className="table-wrap">
            <table>
              <thead><tr><th>#</th><th>Index</th><th>Short-term</th><th>Medium-term</th><th>Long-term</th><th>Momentum Score</th><th>Signal</th></tr></thead>
              <tbody>
                {momentumScores.map((item, i) => (
                  <tr key={item.name}>
                    <td>{i + 1}</td>
                    <td><strong>{item.name}</strong></td>
                    <td className={getReturnClass(item.shortTerm)}>{item.shortTerm.toFixed(2)}%</td>
                    <td className={getReturnClass(item.mediumTerm)}>{item.mediumTerm.toFixed(2)}%</td>
                    <td className={getReturnClass(item.longTerm)}>{item.longTerm.toFixed(2)}%</td>
                    <td className={getReturnClass(item.momentum)}><strong>{item.momentum.toFixed(2)}</strong></td>
                    <td>{getSignal(item.momentum, item.shortTerm, item.longTerm)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Predictions panel */}
      <div className="panel">
        <h3>Prediction Framework</h3>
        <div className="ai-prediction-grid">
          <div className="ai-card">
            <h4>📅 Next Few Days</h4>
            <p>Based on daily momentum and RSI. Look for indices with positive short-term scores and RSI between 40-65 for entry points.</p>
            {momentumScores.length > 0 && <p><strong>Top pick:</strong> {momentumScores[0]?.name} (score: {momentumScores[0]?.momentum.toFixed(2)})</p>}
          </div>
          <div className="ai-card">
            <h4>📆 Next Few Weeks</h4>
            <p>Weekly to fortnightly trend continuation. Sectors with rising medium-term scores are likely to maintain direction.</p>
            {momentumScores.filter(m => m.mediumTerm > 0).length > 0 && <p><strong>Positive medium-term:</strong> {momentumScores.filter(m => m.mediumTerm > 0).map(m => m.name).join(", ")}</p>}
          </div>
          <div className="ai-card">
            <h4>📊 Next Few Months (Quarterly)</h4>
            <p>For position building. Look for sectors with positive long-term scores but temporarily weak short-term (dip buying).</p>
            {momentumScores.filter(m => m.longTerm > 0 && m.shortTerm < 0).length > 0 && <p><strong>Dip candidates:</strong> {momentumScores.filter(m => m.longTerm > 0 && m.shortTerm < 0).map(m => m.name).join(", ")}</p>}
          </div>
          <div className="ai-card">
            <h4>🏦 Long-term Investment (1Y+)</h4>
            <p>For SIP and lumpsum allocation. Prefer sectors with consistently positive long-term and medium-term momentum.</p>
            {momentumScores.filter(m => m.longTerm > 0 && m.mediumTerm > 0).length > 0 && <p><strong>Strong long-term:</strong> {momentumScores.filter(m => m.longTerm > 0 && m.mediumTerm > 0).map(m => m.name).join(", ")}</p>}
          </div>
        </div>
      </div>

      {/* Scan-based recommendations */}
      {scan && scan.metrics.length > 0 && (
        <div className="panel">
          <h3>Stock Screener AI Insights</h3>
          <p className="muted-text">Based on latest scan with {scan.matched_symbols} matched symbols from a universe of {scan.total_symbols}.</p>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Stock</th><th>Score</th><th>RSI</th><th>Recommendation</th></tr></thead>
              <tbody>
                {scan.metrics.slice(0, 10).map((m, i) => (
                  <tr key={`ai-${i}`}>
                    <td><strong>{String(m.display_name)}</strong></td>
                    <td>{formatValue(m.analysis_score)}</td>
                    <td>{formatValue(m.rsi_14)}</td>
                    <td><span className="recommendation-badge">{String(m.recommendation)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!tracker && !scan && (
        <div className="panel">
          <p className="muted-text">Load market data from the Summary or Snapshots tab first, then return here for AI-driven analysis.</p>
        </div>
      )}
    </div>
  );
}

// ===================== HELPERS =====================

function getSignal(momentum: number, shortTerm: number, longTerm: number): string {
  if (momentum > 2 && shortTerm > 0) return "🟢 Strong Buy";
  if (momentum > 0.5) return "🟢 Buy";
  if (momentum > -0.5) return "🟡 Hold";
  if (momentum > -2 && longTerm > 0) return "🟠 Accumulate on dips";
  return "🔴 Avoid short-term";
}

function getReturnClass(value: number | null | undefined): string {
  if (typeof value !== "number") return "";
  return value >= 0 ? "text-good" : "text-bad";
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
  return value ?? "";
}

function formatPct(value: number | null | undefined) {
  if (typeof value !== "number") return "";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export default App;
