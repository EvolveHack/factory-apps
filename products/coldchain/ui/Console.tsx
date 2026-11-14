"use client";

import { useEffect, useState } from "react";
import { createEngine, type Alert, type Reading } from "../engine";
import { clockToMinutes, createSimulator, minutesToClock, seedFrom } from "../simulator";
import { allUnits, getTenant, pageText } from "../tenants";
import type { Tenant } from "../types";
import { FloorMap } from "./FloorMap";
import { STATUS_COLOR, STATUS_LABEL, type UnitStatus, unitStatus } from "./status";

/** One simulated minute passes every TICK_MS. */
const TICK_MS = 2000;
/** Minutes simulated before the page opens, so the map and panels start with history. */
const WARMUP_MINUTES = 40;
/** Minutes of readings kept per unit for the small trend line. */
const TRACE_MINUTES = 30;

interface LiveAlert extends Alert {
  clock: string;
}

interface Snapshot {
  minute: number;
  latest: Record<string, Reading>;
  traces: Record<string, number[]>;
  alerts: LiveAlert[];
}

function startLive(tenant: Tenant) {
  const unitIds = allUnits(tenant.config).map((u) => u.id);
  const startMinuteOfDay = clockToMinutes(tenant.config.shiftStart);
  const sim = createSimulator({
    seed: seedFrom(`live:${tenant.id}`),
    startMinuteOfDay,
    setpoints: tenant.setpoints.units,
    unitIds,
    events: tenant.config.simEvents,
  });
  const engine = createEngine(tenant.alerts);
  let snap: Snapshot = { minute: -1, latest: {}, traces: {}, alerts: [] };

  function tick(): Snapshot {
    const readings = sim.step();
    const fired = engine.push(readings).map((a) => ({ ...a, clock: minutesToClock(startMinuteOfDay + a.minute) }));
    const latest = { ...snap.latest };
    const traces = { ...snap.traces };
    for (const r of readings) {
      latest[r.unitId] = r;
      traces[r.unitId] = [...(traces[r.unitId] ?? []), r.tempC].slice(-TRACE_MINUTES);
    }
    snap = { minute: readings[0]?.minute ?? snap.minute + 1, latest, traces, alerts: [...fired.reverse(), ...snap.alerts] };
    return snap;
  }

  for (let i = 0; i < WARMUP_MINUTES; i++) tick();
  return { tick, first: snap, startMinuteOfDay };
}

export function Console({ customerId }: { customerId: string }) {
  const tenant = getTenant(customerId)!;
  const [live] = useState(() => startLive(tenant));
  const [snap, setSnap] = useState(live.first);

  useEffect(() => {
    const timer = setInterval(() => setSnap(live.tick()), TICK_MS);
    return () => clearInterval(timer);
  }, [live]);

  const { config, setpoints, flags } = tenant;
  const units = allUnits(config);
  const counts = { ok: 0, attention: 0, alarm: 0 };
  for (const u of units) {
    const s = unitStatus(snap.latest[u.id], setpoints.units[u.id]);
    if (s === "alarm") counts.alarm++;
    else if (s === "door" || s === "warming") counts.attention++;
    else counts.ok++;
  }
  const pages = snap.alerts.filter((a) => a.paged);

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-200" style={{ fontFamily: "var(--font-geist-sans)" }}>
      <header className="border-b border-slate-800 bg-[#0b111c] px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full" style={{ background: config.accent }} />
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">Frostline Cold Chain Monitor</p>
              <h1 className="text-lg font-semibold text-white" data-testid="coldchain-customer">
                {config.name}
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 font-mono text-sm">
            <span data-testid="coldchain-counts" className="flex gap-3">
              <span className="text-green-400">{counts.ok} normal</span>
              <span className="text-amber-400">{counts.attention} check</span>
              <span className="text-red-400">{counts.alarm} too warm</span>
            </span>
            <span className="rounded border border-slate-700 px-2 py-1 text-slate-300">
              Live <span data-testid="coldchain-clock">{minutesToClock(live.startMinuteOfDay + snap.minute)}</span>
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0 space-y-4">
          <Panel title="Floor map" accent={config.accent} note="Simulated sensors. One minute passes every two seconds.">
            <FloorMap config={config} setpoints={setpoints.units} latest={snap.latest} traces={snap.traces} />
            <Legend />
          </Panel>
          <SettingsPanel tenant={tenant} />
        </section>

        <aside className="min-w-0 space-y-4">
          <Panel title="Alerts" accent={config.accent} note={`${tenant.alerts.length} rule${tenant.alerts.length === 1 ? "" : "s"} on`}>
            <ul className="max-h-[420px] space-y-2 overflow-y-auto" data-testid="coldchain-alerts">
              {snap.alerts.length === 0 && <li className="text-sm text-slate-500">No alerts this shift.</li>}
              {snap.alerts.map((a) => {
                const unit = units.find((u) => u.id === a.unitId);
                return (
                  <li
                    key={a.id}
                    data-testid="coldchain-alert"
                    data-rule-id={a.ruleId}
                    data-unit-id={a.unitId}
                    className="rounded border border-red-900/60 bg-red-950/30 p-2 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-red-200">{a.ruleName}</span>
                      <span className="font-mono text-xs text-slate-400">{a.clock}</span>
                    </div>
                    <p className="text-slate-300">
                      {unit?.name}, {unit?.siteName}
                    </p>
                    <p className="text-slate-400">{a.message}</p>
                    {a.paged && <p className="mt-1 text-xs text-amber-300">Paged the shift lead</p>}
                  </li>
                );
              })}
            </ul>
          </Panel>

          {flags.pager && (
            <Panel
              title="Shift lead pager"
              accent={config.accent}
              note={`On shift: ${config.shiftLead.name}, ${config.shiftLead.phone}`}
            >
              <ul className="max-h-[300px] space-y-2 overflow-y-auto" data-testid="coldchain-pages">
                {pages.length === 0 && <li className="text-sm text-slate-500">No pages sent this shift.</li>}
                {pages.map((a) => (
                  <li key={a.id} data-testid="coldchain-page" className="rounded bg-slate-900 p-2 font-mono text-xs">
                    <p className="text-slate-400">
                      {a.clock} to {config.shiftLead.name}
                    </p>
                    <p className="text-amber-200">{pageText(config, a.unitId, a.message)}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-slate-500">Messages show on this screen only. Nothing is sent.</p>
            </Panel>
          )}

          <ReplayPanel customerId={tenant.id} accent={config.accent} />
        </aside>
      </main>
    </div>
  );
}

function Panel(props: { title: string; accent: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-[#0d1420] p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-l-2 pl-2" style={{ borderColor: props.accent }}>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">{props.title}</h2>
        {props.note && <p className="text-xs text-slate-500">{props.note}</p>}
      </div>
      {props.children}
    </div>
  );
}

function Legend() {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
      {(Object.keys(STATUS_LABEL) as UnitStatus[]).map((s) => (
        <li key={s} className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLOR[s] }} />
          {STATUS_LABEL[s]}
        </li>
      ))}
    </ul>
  );
}

function SettingsPanel({ tenant }: { tenant: Tenant }) {
  return (
    <Panel title="Device settings" accent={tenant.config.accent} note="Read only. A safety lead approves every change.">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm" data-testid="coldchain-settings">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              <th className="py-1 pr-3 font-medium">Unit</th>
              <th className="py-1 pr-3 font-medium">Setpoint</th>
              <th className="py-1 pr-3 font-medium">Defrost starts</th>
              <th className="py-1 pr-3 font-medium">Length</th>
              <th className="py-1 font-medium">Defrost limit</th>
            </tr>
          </thead>
          <tbody className="font-mono text-slate-300">
            {allUnits(tenant.config).map((u) => {
              const s = tenant.setpoints.units[u.id];
              return (
                <tr key={u.id} className="border-t border-slate-800" data-testid="coldchain-setting" data-unit-id={u.id}>
                  <td className="py-1.5 pr-3 font-sans">
                    {u.name}
                    <span className="block text-xs text-slate-500">{u.siteName}</span>
                  </td>
                  <td className="py-1.5 pr-3" data-testid="coldchain-setting-setpoint">{s.setpointC} C</td>
                  <td className="py-1.5 pr-3">{s.defrostTimes.join(", ")}</td>
                  <td className="py-1.5 pr-3">{s.defrostMinutes} min</td>
                  <td className="py-1.5">{s.defrostLimitC} C</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

interface ReplayResult {
  ok: boolean;
  error?: string;
  label: string;
  readings: number;
  alerts: { id: string; clock: string; ruleName: string; unitId: string; message: string }[];
  pages: { alertId: string }[];
}

function ReplayPanel({ customerId, accent }: { customerId: string; accent: string }) {
  const [result, setResult] = useState<ReplayResult | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const res = await fetch(`/coldchain/${customerId}/api/replay`);
      setResult(await res.json());
    } catch {
      setResult({ ok: false, error: "The replay did not load.", label: "", readings: 0, alerts: [], pages: [] });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="Yesterday's replay" accent={accent} note="Runs yesterday's readings through today's rules.">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        data-testid="coldchain-replay-run"
        className="rounded border border-slate-600 px-3 py-1.5 text-sm text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {busy ? "Running" : "Run replay"}
      </button>
      {result && (
        <div className="mt-3 text-sm" data-testid="coldchain-replay-result">
          {result.ok ? (
            <>
              <p className="text-slate-300">
                {result.label}: {result.readings} readings, {result.alerts.length} alerts, {result.pages.length} pages.
              </p>
              <ul className="mt-2 space-y-1 font-mono text-xs text-slate-400">
                {result.alerts.map((a) => (
                  <li key={a.id}>
                    {a.clock} {a.ruleName}: {a.unitId}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-red-300">{result.error}</p>
          )}
        </div>
      )}
    </Panel>
  );
}
