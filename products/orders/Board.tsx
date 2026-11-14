"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { money } from "./engine";
import { TICK_SECONDS, ordersAt, startState, step } from "./simulate";
import { TENANTS, type OrdersCustomer } from "./tenants";
import type { ChatMessage, OrderStatus, WorkflowError } from "./types";

const STATUS_STYLE: Record<OrderStatus, string> = {
  placed: "bg-amber-50 text-amber-800 ring-amber-200",
  packed: "bg-sky-50 text-sky-800 ring-sky-200",
  shipped: "bg-emerald-50 text-emerald-800 ring-emerald-200",
};

const SYSTEMS = [
  { id: "accounting", label: "Accounting" },
  { id: "warehouse", label: "Warehouse" },
  { id: "email", label: "Email" },
] as const;

interface TestResult {
  ok: boolean;
  orderId: string;
  total: number;
  ran: number;
  matched: number;
  messages: number;
  errors: WorkflowError[];
}

let testRun = 0;

export default function Board({ customer }: { customer: OrdersCustomer }) {
  const tenant = TENANTS[customer];
  const { config, flags, workflows } = tenant;
  const [sim, setSim] = useState(() => startState(tenant));
  const [filter, setFilter] = useState<string>("all");
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setSim((s) => step(s, tenant)), TICK_SECONDS * 1000);
    return () => clearInterval(timer);
  }, [tenant]);

  async function sendTestOrder() {
    setTesting(true);
    setTestError(null);
    try {
      const res = await fetch(`/orders/${customer}/api/test-order`, { method: "POST" });
      const data = await res.json();
      if (!res.ok && !data.errors) throw new Error(data.error ?? `The test order failed with status ${res.status}.`);
      const run = ++testRun;
      const fresh: ChatMessage[] = (data.messages as ChatMessage[]).map((m) => ({ ...m, id: `${m.id}-${run}`, test: true }));
      setSim((s) => ({ ...s, messages: [...fresh.reverse(), ...s.messages].slice(0, 80) }));
      setResult({
        ok: data.ok,
        orderId: data.order.id,
        total: data.order.total,
        ran: data.runs.length,
        matched: data.runs.filter((r: { matched: boolean }) => r.matched).length,
        messages: data.messages.length,
        errors: data.errors,
      });
    } catch (err) {
      setTestError(err instanceof Error ? err.message : "The test order failed.");
    } finally {
      setTesting(false);
    }
  }

  const orders = ordersAt(config, sim.tick);
  const shown = filter === "all" ? sim.messages : sim.messages.filter((m) => m.channel === filter);
  const workflowName = (id: string) => workflows.find((w) => w.id === id)?.name ?? id;
  const errors = [...(result?.errors ?? []), ...sim.errors];

  return (
    <div data-testid="orders-board" data-customer={customer} className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg text-sm font-bold text-white" style={{ background: config.accent }}>
              {config.company.charAt(0)}
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Order Flows by Tallyflow</p>
              <h1 data-testid="company-name" className="text-lg font-semibold leading-tight">
                {config.company}
              </h1>
            </div>
          </div>
          <ul data-testid="connected-systems" className="flex flex-wrap gap-2 text-xs">
            {SYSTEMS.map((s) => {
              const on = config.systems[s.id];
              return (
                <li
                  key={s.id}
                  data-testid={`system-${s.id}`}
                  data-connected={on ? "true" : "false"}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 ring-1 ${
                    on ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-slate-100 text-slate-500 ring-slate-200"
                  }`}
                >
                  <span className={`size-1.5 rounded-full ${on ? "bg-emerald-500" : "bg-slate-400"}`} />
                  {s.label}: {on ? "Connected" : "Not connected"}
                </li>
              );
            })}
          </ul>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-4 sm:px-6 lg:grid-cols-3">
        {/* Live orders */}
        <section data-testid="live-orders" className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="font-semibold">Live orders</h2>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="size-2 animate-pulse rounded-full bg-emerald-500" />A new order every {TICK_SECONDS} seconds
            </span>
          </div>
          <ul className="divide-y divide-slate-100">
            <AnimatePresence initial={false}>
              {orders.map((o) => (
                <motion.li
                  key={o.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  data-testid="order-row"
                  data-order-id={o.id}
                  data-status={o.status}
                  data-total={o.total}
                  className="px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">
                      <span className="font-mono text-slate-500">{o.id}</span> {o.customer}
                    </p>
                    <span data-testid="order-status" className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ${STATUS_STYLE[o.status]}`}>
                      {o.status}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span className="truncate">
                      {o.items[0].qty} x {o.items[0].name}
                      {o.items.length > 1 ? `, and ${o.items.length - 1} more` : ""}
                    </span>
                    <span className="shrink-0">
                      <span data-testid="order-total" className="font-semibold text-slate-900">
                        {money(o.total)}
                      </span>
                      {flags.showMargin && <span data-testid="order-margin"> · {o.margin}% margin</span>}
                    </span>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </section>

        {/* Workflows */}
        <section data-testid="workflows" className="h-fit rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="font-semibold">Workflows</h2>
            <span className="text-xs text-slate-500">{workflows.length} active</span>
          </div>
          <ul data-testid="workflows-list" className="divide-y divide-slate-100">
            {workflows.map((w) => (
              <li key={w.id} data-testid="workflow-row" data-workflow-id={w.id} className="px-4 py-3">
                <p className="text-sm font-medium">{w.name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  When an order is <span className="font-medium text-slate-700">{w.trigger}</span>, {w.action.charAt(0).toLowerCase() + w.action.slice(1)}.
                </p>
              </li>
            ))}
            {workflows.length === 0 && <li className="px-4 py-3 text-sm text-slate-500">No workflows yet.</li>}
          </ul>
          <div className="border-t border-slate-100 p-4">
            <button
              type="button"
              data-testid="test-order-button"
              onClick={sendTestOrder}
              disabled={testing}
              className="w-full rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: config.accent }}
            >
              {testing ? "Sending a test order" : "Send a test order"}
            </button>
            {result && (
              <p
                data-testid="test-order-result"
                data-ok={result.ok ? "true" : "false"}
                className={`mt-3 rounded-lg px-3 py-2 text-xs ${result.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}
              >
                Test order {result.orderId} ({money(result.total)}) went through all three steps. {result.matched} workflow
                {result.matched === 1 ? "" : "s"} matched and posted {result.messages} message{result.messages === 1 ? "" : "s"}.{" "}
                {result.ok ? "No errors." : `${result.errors.length} error${result.errors.length === 1 ? "" : "s"}.`}
              </p>
            )}
            {testError && (
              <p data-testid="test-order-error" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800">
                {testError}
              </p>
            )}
            {errors.length > 0 && (
              <ul className="mt-3 space-y-1">
                {errors.slice(0, 5).map((e, i) => (
                  <li key={i} data-testid="workflow-error" data-workflow-id={e.workflowId} className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800">
                    {workflowName(e.workflowId)} failed on {e.orderId}: {e.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Team chat */}
        <section data-testid="team-chat" className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="font-semibold">Team chat</h2>
            <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
              {["all", ...config.channels, "email"].map((c) => (
                <button
                  key={c}
                  type="button"
                  data-testid={`channel-filter-${c}`}
                  onClick={() => setFilter(c)}
                  className={`rounded-full px-2.5 py-1 ring-1 ${filter === c ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-600 ring-slate-200"}`}
                >
                  {c === "all" ? "All" : c === "email" ? "Email" : `#${c}`}
                </button>
              ))}
            </div>
          </div>
          <ul data-testid="chat-feed" className="max-h-[70vh] divide-y divide-slate-100 overflow-y-auto">
            <AnimatePresence initial={false}>
              {shown.map((m) => (
                <motion.li
                  key={m.id}
                  layout
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  data-testid="chat-message"
                  data-channel={m.channel}
                  data-workflow-id={m.workflowId}
                  data-order-id={m.orderId}
                  data-test={m.test ? "true" : "false"}
                  className="px-4 py-3"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold" style={{ color: config.accent }}>
                      {m.channel === "email" ? "Email (shown here only)" : `#${m.channel}`}
                    </span>
                    <span className="text-slate-400">{workflowName(m.workflowId)}</span>
                    {m.test && <span className="rounded bg-violet-50 px-1.5 py-0.5 font-medium text-violet-700">Test</span>}
                  </div>
                  <p data-testid="chat-text" className="mt-1 text-sm">
                    {m.text}
                  </p>
                </motion.li>
              ))}
            </AnimatePresence>
            {shown.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-500">No messages in this channel yet.</li>}
          </ul>
        </section>
      </main>
    </div>
  );
}
