// Fake orders from a fixed seed, so every screen shows the same orders in the same order.
import { runEvent } from "./engine";
import type { ChatMessage, Order, OrderStatus, Tenant, TenantConfig, WorkflowError } from "./types";

/** Seconds between clock ticks on the page. Each tick places one new order. */
export const TICK_SECONDS = 4;
/** Ticks an order waits before it is packed, and before it ships. */
const PACK_AFTER = 2;
const SHIP_AFTER = 4;
const SHOWN_ORDERS = 12;
const KEPT_MESSAGES = 80;

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(text: string): number {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

function finish(config: TenantConfig, id: string, customer: string, items: Order["items"], status: OrderStatus): Order {
  const total = items.reduce((sum, l) => sum + l.qty * l.price, 0);
  const cost = items.reduce((sum, l) => sum + l.qty * (config.catalog.find((c) => c.sku === l.sku)?.unitCost ?? l.price), 0);
  const margin = total > 0 ? Math.round(((total - cost) / total) * 1000) / 10 : 0;
  return { id, customer, items, total: Math.round(total * 100) / 100, cost: Math.round(cost * 100) / 100, margin, status };
}

/** Order number `index` for this customer. Same input, same order, every time. */
export function makeOrder(config: TenantConfig, index: number, status: OrderStatus = "placed"): Order {
  const r = rng(hash(config.company) + index * 7919);
  const customer = config.buyers[Math.floor(r() * config.buyers.length)];
  const lineCount = 1 + Math.floor(r() * 3);
  const picked = new Set<number>();
  while (picked.size < Math.min(lineCount, config.catalog.length)) picked.add(Math.floor(r() * config.catalog.length));
  const items = [...picked].map((i) => {
    const c = config.catalog[i];
    return { sku: c.sku, name: c.name, qty: 1 + Math.floor(r() * c.maxQty), price: c.price };
  });
  return finish(config, `${config.orderPrefix}-${1001 + index}`, customer, items, status);
}

/** The fixed order the Send a test order button uses. It is large on purpose, so size-based workflows match. */
export function makeTestOrder(config: TenantConfig): Order {
  const items = config.catalog.slice(0, 2).map((c) => ({
    sku: c.sku,
    name: c.name,
    qty: Math.ceil(3600 / c.price),
    price: c.price,
  }));
  return finish(config, `${config.orderPrefix}-TEST`, "Test buyer", items, "placed");
}

export interface SimState {
  tick: number;
  messages: ChatMessage[];
  errors: WorkflowError[];
}

function statusAt(index: number, tick: number): OrderStatus {
  const age = tick - index;
  return age >= SHIP_AFTER ? "shipped" : age >= PACK_AFTER ? "packed" : "placed";
}

/** Orders on screen at this tick, newest first. */
export function ordersAt(config: TenantConfig, tick: number): Order[] {
  const out: Order[] = [];
  for (let i = tick; i >= Math.max(0, tick - SHOWN_ORDERS + 1); i--) out.push(makeOrder(config, i, statusAt(i, tick)));
  return out;
}

/** Advance one tick: place a new order, pack an older one, ship an older one, and run each event through the workflows. */
export function step(state: SimState, tenant: Tenant): SimState {
  const tick = state.tick + 1;
  const events: [number, OrderStatus][] = [
    [tick - SHIP_AFTER, "shipped"],
    [tick - PACK_AFTER, "packed"],
    [tick, "placed"],
  ];
  let messages = state.messages;
  let errors = state.errors;
  for (const [index, status] of events) {
    if (index < 0) continue;
    const order = makeOrder(tenant.config, index, status);
    const r = runEvent(order, status, tenant.workflows, tenant.config.channels);
    messages = [...r.messages.reverse(), ...messages].slice(0, KEPT_MESSAGES);
    errors = [...r.errors, ...errors].slice(0, 20);
  }
  return { tick, messages, errors };
}

/** Where the page starts: a few ticks already run, so the screen is not empty. */
export function startState(tenant: Tenant, ticks = 6): SimState {
  let s: SimState = { tick: -1, messages: [], errors: [] };
  for (let i = 0; i < ticks; i++) s = step(s, tenant);
  return s;
}
