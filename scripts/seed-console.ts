/**
 * Console demo seed.
 *
 * Creates the console tables if they are absent, then writes a full twelve
 * month record for one demo Cyprus SME workspace. The dashboard reads only
 * from these tables, so replacing demo with live data never touches the UI.
 *
 *   bun run scripts/seed-console.ts
 */
import postgres from "postgres";

const sql = postgres((process.env.DATABASE_URL ?? process.env.SUPABASE_DATABASE_URL)!, { max: 4 });

const WS = "ws_demo_cy";

async function ddl() {
  await sql.unsafe(`
  create table if not exists workspaces (
    id text primary key,
    name text not null,
    legal_name text,
    sector text not null,
    employees integer not null default 0,
    sites integer not null default 1,
    country text not null default 'CY',
    baseline_year integer not null default 2025,
    framework text not null default 'VSME',
    owner_name text,
    owner_role text,
    owner_avatar text,
    is_demo boolean not null default false,
    created_at timestamp not null default now()
  );
  create table if not exists metric_definitions (
    key text primary key,
    label text not null,
    short_label text,
    unit text not null,
    precision integer not null default 1,
    category text not null default 'emissions',
    good_direction text not null default 'down',
    description text,
    sort_order integer not null default 0
  );
  create table if not exists metric_readings (
    id serial primary key,
    workspace_id text not null,
    metric_key text not null,
    period_start text not null,
    period_label text not null,
    value real not null,
    source text not null default 'agent',
    confidence real not null default 1,
    created_at timestamp not null default now()
  );
  create table if not exists agents (
    key text primary key,
    name text not null,
    role text not null,
    mission text not null,
    cadence text not null default 'daily',
    autonomy text not null default 'suggest',
    status text not null default 'active',
    health_score real not null default 100,
    glyph text not null default 'spine',
    sort_order integer not null default 0
  );
  create table if not exists agent_runs (
    id serial primary key,
    workspace_id text not null,
    agent_key text not null,
    started_at timestamp not null default now(),
    finished_at timestamp,
    status text not null default 'succeeded',
    summary text not null,
    items_processed integer not null default 0,
    confidence real not null default 1,
    duration_ms integer not null default 0
  );
  create table if not exists agent_tasks (
    id serial primary key,
    workspace_id text not null,
    agent_key text not null,
    kind text not null default 'approval',
    title text not null,
    detail text,
    severity text not null default 'normal',
    status text not null default 'open',
    due_at text,
    created_at timestamp not null default now()
  );
  create table if not exists data_connections (
    id text primary key,
    workspace_id text not null,
    provider text not null,
    category text not null,
    status text not null default 'available',
    coverage_pct real not null default 0,
    last_sync_at timestamp,
    note text,
    sort_order integer not null default 0
  );
  create table if not exists obligations (
    id text primary key,
    workspace_id text not null,
    framework text not null,
    title text not null,
    detail text,
    due_date text not null,
    status text not null default 'on_track',
    progress_pct real not null default 0,
    owner_name text,
    agent_key text
  );
  create table if not exists activity_events (
    id serial primary key,
    workspace_id text not null,
    actor_type text not null default 'agent',
    actor_name text not null,
    verb text not null,
    object text not null,
    detail text,
    created_at timestamp not null default now()
  );
  create index if not exists idx_readings_ws on metric_readings (workspace_id, metric_key);
  create index if not exists idx_runs_ws on agent_runs (workspace_id, started_at desc);
  create index if not exists idx_events_ws on activity_events (workspace_id, created_at desc);
  `);
}

const MONTHS: [string, string][] = [
  ["2025-08-01", "Aug"], ["2025-09-01", "Sep"], ["2025-10-01", "Oct"],
  ["2025-11-01", "Nov"], ["2025-12-01", "Dec"], ["2026-01-01", "Jan"],
  ["2026-02-01", "Feb"], ["2026-03-01", "Mar"], ["2026-04-01", "Apr"],
  ["2026-05-01", "May"], ["2026-06-01", "Jun"], ["2026-07-01", "Jul"],
];

/** Cyprus shape of year: cooling load in summer, solar share peaks with it. */
const SERIES: Record<string, number[]> = {
  co2e_total:      [41.2, 38.4, 32.1, 28.9, 31.4, 33.2, 30.1, 27.4, 25.2, 28.1, 34.6, 36.8],
  electricity_kwh: [67200, 62300, 52400, 47500, 50800, 54100, 49200, 44300, 41000, 45900, 55700, 59000],
  renewable_share: [21, 23, 25, 24, 22, 22, 26, 29, 32, 34, 33, 31],
  grid_intensity:  [648, 641, 630, 622, 634, 640, 628, 612, 601, 596, 604, 610],
  data_coverage:   [42, 51, 58, 63, 67, 71, 76, 81, 84, 88, 91, 94],
  automation_rate: [12, 18, 27, 34, 41, 47, 55, 62, 68, 74, 79, 83],
  scope1:          [9.1, 8.4, 7.2, 6.6, 7.1, 7.4, 6.8, 6.1, 5.6, 6.2, 7.7, 8.2],
  scope2:          [22.4, 20.9, 17.3, 15.4, 16.8, 17.9, 16.1, 14.6, 13.4, 15.0, 18.6, 19.8],
  scope3:          [9.7, 9.1, 7.6, 6.9, 7.5, 7.9, 7.2, 6.7, 6.2, 6.9, 8.3, 8.8],
  cost_eur:        [14820, 13710, 11530, 10450, 11180, 11910, 10820, 9750, 9020, 10100, 12250, 12980],
};

const DEFS = [
  ["co2e_total", "Total footprint", "Footprint", "tCO₂e", 1, "emissions", "down", "Scope 1, 2 and 3 combined for the reporting month.", 1],
  ["electricity_kwh", "Electricity", "Power", "kWh", 0, "energy", "down", "Metered consumption across all sites.", 2],
  ["renewable_share", "Renewable share", "Renewables", "%", 0, "energy", "up", "Share of electricity from renewable supply, own and grid.", 3],
  ["grid_intensity", "Grid intensity", "Grid", "gCO₂/kWh", 0, "energy", "down", "Carbon intensity of the Cyprus grid for the period.", 4],
  ["data_coverage", "Data coverage", "Coverage", "%", 0, "assurance", "up", "Share of spend and consumption backed by primary evidence.", 5],
  ["automation_rate", "Automated by agents", "Automated", "%", 0, "assurance", "up", "Share of the reporting workload closed without a human step.", 6],
  ["scope1", "Scope 1", "Scope 1", "tCO₂e", 1, "emissions", "down", "Direct combustion: fleet, generators, refrigerants.", 7],
  ["scope2", "Scope 2", "Scope 2", "tCO₂e", 1, "emissions", "down", "Purchased electricity, location based.", 8],
  ["scope3", "Scope 3", "Scope 3", "tCO₂e", 1, "emissions", "down", "Purchased goods, travel, waste and logistics.", 9],
  ["cost_eur", "Energy spend", "Spend", "EUR", 0, "finance", "down", "Invoiced energy cost read from EAC bills.", 10],
];

const AGENTS = [
  ["ingest", "Ledger", "Data ingestion", "Reads EAC bills, bank feeds and invoices, then writes clean activity data.", "hourly", "auto", "active", 99, "spine", 1],
  ["factors", "Factor", "Emission factors", "Keeps factor sets current and re-states past periods when a factor changes.", "weekly", "auto", "active", 97, "lattice", 2],
  ["cbam", "Border", "CBAM reporting", "Prepares the quarterly CBAM declaration from customs and supplier data.", "quarterly", "act_with_approval", "active", 92, "gate", 3],
  ["vsme", "Scribe", "VSME and CSRD drafting", "Drafts the disclosure narrative and cites every figure to its evidence.", "monthly", "draft", "active", 95, "quill", 4],
  ["reduce", "Compass", "Reduction planning", "Finds the cheapest next tonne and models the payback for each measure.", "weekly", "suggest", "active", 88, "compass", 5],
  ["assure", "Warden", "Assurance and audit", "Checks every figure against its evidence and flags what an auditor will ask.", "daily", "act_with_approval", "active", 94, "shield", 6],
  ["grants", "Forager", "Funding watch", "Watches EU and Cyprus calls and matches them to your reduction plan.", "daily", "suggest", "active", 90, "seed", 7],
  ["supply", "Weaver", "Supplier engagement", "Collects supplier data for Scope 3 and chases the missing responses.", "weekly", "draft", "paused", 71, "weave", 8],
];

async function seed() {
  await sql`delete from metric_readings where workspace_id = ${WS}`;
  await sql`delete from agent_runs where workspace_id = ${WS}`;
  await sql`delete from agent_tasks where workspace_id = ${WS}`;
  await sql`delete from data_connections where workspace_id = ${WS}`;
  await sql`delete from obligations where workspace_id = ${WS}`;
  await sql`delete from activity_events where workspace_id = ${WS}`;
  await sql`delete from workspaces where id = ${WS}`;

  await sql`insert into workspaces ${sql({
    id: WS,
    name: "StaUniverse",
    legal_name: "StaUniverse Ltd",
    sector: "Professional services",
    employees: 42,
    sites: 3,
    country: "CY",
    baseline_year: 2025,
    framework: "VSME",
    owner_name: "Emmanuel",
    owner_role: "Sustainability lead",
    is_demo: true,
  })}`;

  for (const d of DEFS) {
    await sql`insert into metric_definitions ${sql({
      key: d[0] as string, label: d[1] as string, short_label: d[2] as string,
      unit: d[3] as string, precision: d[4] as number, category: d[5] as string,
      good_direction: d[6] as string, description: d[7] as string, sort_order: d[8] as number,
    })} on conflict (key) do update set
      label = excluded.label, short_label = excluded.short_label, unit = excluded.unit,
      precision = excluded.precision, category = excluded.category,
      good_direction = excluded.good_direction, description = excluded.description,
      sort_order = excluded.sort_order`;
  }

  const rows: Record<string, unknown>[] = [];
  for (const [key, values] of Object.entries(SERIES)) {
    values.forEach((value, i) => {
      const [periodStart, label] = MONTHS[i];
      rows.push({
        workspace_id: WS, metric_key: key, period_start: periodStart,
        period_label: label, value,
        source: i > 8 ? "agent" : "bill",
        confidence: 0.82 + i * 0.014,
      });
    });
  }
  await sql`insert into metric_readings ${sql(rows as never[])}`;

  for (const a of AGENTS) {
    await sql`insert into agents ${sql({
      key: a[0] as string, name: a[1] as string, role: a[2] as string, mission: a[3] as string,
      cadence: a[4] as string, autonomy: a[5] as string, status: a[6] as string,
      health_score: a[7] as number, glyph: a[8] as string, sort_order: a[9] as number,
    })} on conflict (key) do update set
      name = excluded.name, role = excluded.role, mission = excluded.mission,
      cadence = excluded.cadence, autonomy = excluded.autonomy, status = excluded.status,
      health_score = excluded.health_score, glyph = excluded.glyph, sort_order = excluded.sort_order`;
  }

  const now = Date.now();
  const ago = (min: number) => new Date(now - min * 60_000);
  const runs = [
    ["ingest", "succeeded", "Read 14 EAC invoices and 212 bank lines. No exceptions.", 226, 0.99, 8, 4200],
    ["assure", "needs_review", "3 figures lack primary evidence for June.", 3, 0.74, 41, 6100],
    ["factors", "succeeded", "Applied the July 2026 Cyprus grid factor. 12 periods re-stated.", 12, 1, 96, 3300],
    ["cbam", "succeeded", "Drafted the Q2 2026 declaration. Awaiting your signature.", 9, 0.93, 180, 12400],
    ["reduce", "succeeded", "Ranked 6 measures. Best payback: 2.4 years on rooftop solar phase 2.", 6, 0.87, 320, 9800],
    ["grants", "succeeded", "2 open calls match your plan. Deadline in 46 days.", 2, 0.91, 640, 5200],
    ["vsme", "running", "Drafting section B3, energy and emissions.", 0, 0.9, 2, 0],
    ["supply", "failed", "Supplier portal refused the credential. Reconnect required.", 0, 0.4, 1500, 2100],
  ];
  for (const r of runs) {
    const started = ago(r[5] as number);
    await sql`insert into agent_runs ${sql({
      workspace_id: WS, agent_key: r[0] as string, status: r[1] as string,
      summary: r[2] as string, items_processed: r[3] as number, confidence: r[4] as number,
      started_at: started,
      finished_at: r[1] === "running" ? null : new Date(started.getTime() + (r[6] as number)),
      duration_ms: r[6] as number,
    })}`;
  }

  const tasks = [
    ["cbam", "approval", "Sign the Q2 2026 CBAM declaration", "Border prepared 9 import lines from 3 suppliers. Two supplier emission values use default factors.", "high", "2026-08-14"],
    ["assure", "evidence", "Upload the June invoice for the Limassol site", "Warden cannot close June Scope 2 without the missing bill.", "high", "2026-08-05"],
    ["vsme", "approval", "Approve the VSME B3 narrative", "Scribe drafted 340 words with 11 citations to source documents.", "normal", "2026-08-20"],
    ["supply", "exception", "Reconnect the supplier portal", "Weaver lost access after the credential rotation on 26 July.", "high", null],
    ["reduce", "approval", "Commit to rooftop solar phase 2", "Compass models 34 tCO₂e a year and a 2.4 year payback.", "normal", "2026-09-01"],
    ["grants", "approval", "Open the RIF call application", "Forager matched a 60% grant to the solar measure. Closes in 46 days.", "normal", "2026-09-13"],
  ];
  for (const t of tasks) {
    await sql`insert into agent_tasks ${sql({
      workspace_id: WS, agent_key: t[0] as string, kind: t[1] as string, title: t[2] as string,
      detail: t[3] as string, severity: t[4] as string, due_at: t[5] as string | null,
    })}`;
  }

  const conns = [
    ["eac", "EAC", "Electricity", "live", 100, 35, "Three meters. Bills read on issue.", 1],
    ["bank", "Bank of Cyprus", "Finance", "live", 92, 140, "PSD2 feed, 2 accounts.", 2],
    ["xero", "Xero", "Accounting", "live", 88, 220, "Purchase ledger for Scope 3 spend.", 3],
    ["customs", "Cyprus Customs", "Imports", "syncing", 61, 12, "CBAM import lines.", 4],
    ["fleet", "Fleet telematics", "Transport", "error", 0, 2880, "Token expired on 26 July.", 5],
    ["electricitymaps", "Electricity Maps", "Grid", "live", 100, 18, "Cyprus grid intensity, hourly.", 6],
    ["softone", "SoftOne", "ERP", "available", 0, null, "Not connected yet.", 7],
    ["registrar", "Registrar of Companies", "Entity", "live", 100, 10080, "Company record and filings.", 8],
  ];
  for (const c of conns) {
    await sql`insert into data_connections ${sql({
      id: `${WS}_${c[0]}`, workspace_id: WS, provider: c[1] as string, category: c[2] as string,
      status: c[3] as string, coverage_pct: c[4] as number,
      last_sync_at: c[5] == null ? null : ago(c[5] as number),
      note: c[6] as string, sort_order: c[7] as number,
    })}`;
  }

  const obs = [
    ["cbam_q2", "CBAM", "Q2 2026 declaration", "Definitive regime. Nine import lines from three suppliers.", "2026-08-31", "at_risk", 76, "Border", "cbam"],
    ["vsme_2026", "VSME", "Voluntary disclosure 2026", "Requested by Bank of Cyprus for the credit review.", "2026-12-31", "on_track", 58, "Scribe", "vsme"],
    ["csrd_w3", "CSRD", "Wave 3 first report", "Listed SMEs report on financial year 2026.", "2027-01-01", "on_track", 24, "Scribe", "vsme"],
    ["cbam_q3", "CBAM", "Q3 2026 declaration", "Opens 1 October 2026.", "2026-11-30", "planned", 0, "Border", "cbam"],
    ["energy_audit", "Cyprus law", "Energy audit renewal", "Article 8 audit for medium enterprises.", "2027-03-31", "planned", 8, "Warden", "assure"],
  ];
  for (const o of obs) {
    await sql`insert into obligations ${sql({
      id: `${WS}_${o[0]}`, workspace_id: WS, framework: o[1] as string, title: o[2] as string,
      detail: o[3] as string, due_date: o[4] as string, status: o[5] as string,
      progress_pct: o[6] as number, owner_name: o[7] as string, agent_key: o[8] as string,
    })}`;
  }

  const events = [
    ["agent", "Ledger", "ingested", "14 EAC invoices", "July 2026 billing period, 3 meters.", 8],
    ["agent", "Warden", "flagged", "3 unevidenced figures", "June Scope 2, Limassol site.", 41],
    ["human", "Emmanuel", "approved", "May VSME narrative", "Signed off with 2 edits.", 96],
    ["agent", "Factor", "restated", "12 monthly periods", "New Cyprus grid factor, 610 gCO₂/kWh.", 96],
    ["agent", "Border", "drafted", "Q2 2026 CBAM declaration", "Awaiting signature.", 180],
    ["agent", "Compass", "ranked", "6 reduction measures", "Rooftop solar phase 2 leads on payback.", 320],
    ["system", "Vuneli", "rotated", "supplier portal credential", "Weaver lost access as a result.", 1500],
    ["agent", "Forager", "matched", "2 funding calls", "RIF and Horizon Europe cascade.", 640],
  ];
  for (const e of events) {
    await sql`insert into activity_events ${sql({
      workspace_id: WS, actor_type: e[0] as string, actor_name: e[1] as string,
      verb: e[2] as string, object: e[3] as string, detail: e[4] as string,
      created_at: ago(e[5] as number),
    })}`;
  }
}

await ddl();
await seed();
console.log("console demo seeded for", WS);
await sql.end();
