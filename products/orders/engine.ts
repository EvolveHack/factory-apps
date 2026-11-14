// The workflow engine. Pure TypeScript: no network, no storage, no timers.
import type {
  ChatMessage,
  Order,
  OrderStatus,
  Workflow,
  WorkflowContext,
  WorkflowError,
  WorkflowRun,
} from "./types";

export const TRIGGERS: OrderStatus[] = ["placed", "packed", "shipped"];

export function money(amount: number): string {
  return `$${Math.round(amount).toLocaleString("en-US")}`;
}

export interface RunResult {
  messages: ChatMessage[];
  errors: WorkflowError[];
  runs: WorkflowRun[];
}

/** Run one order event through every workflow whose trigger matches. A failing workflow never stops the others. */
export function runEvent(
  order: Order,
  trigger: OrderStatus,
  workflows: Workflow[],
  channels: string[],
  opts: { test?: boolean } = {},
): RunResult {
  const result: RunResult = { messages: [], errors: [], runs: [] };
  for (const wf of workflows) {
    if (wf.trigger !== trigger) continue;
    const pending: ChatMessage[] = [];
    const add = (channel: string, text: string) =>
      pending.push({
        id: `${order.id}-${trigger}-${wf.id}-${pending.length}${opts.test ? "-test" : ""}`,
        channel,
        text,
        workflowId: wf.id,
        orderId: order.id,
        test: opts.test,
      });
    const ctx: WorkflowContext = {
      post(channel, text) {
        const name = channel.replace(/^#/, "");
        if (!channels.includes(name)) throw new Error(`There is no #${name} channel.`);
        add(name, text);
      },
      notify(to, subject) {
        add("email", `To ${to}: ${subject}`);
      },
      money,
    };
    let matched = false;
    try {
      matched = Boolean(wf.when(order));
      if (matched) wf.run(order, ctx);
      result.messages.push(...pending);
      result.runs.push({ workflowId: wf.id, trigger, matched, ok: true });
    } catch (err) {
      result.runs.push({ workflowId: wf.id, trigger, matched, ok: false });
      result.errors.push({
        workflowId: wf.id,
        trigger,
        orderId: order.id,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return result;
}

/** Run one order through all three triggers, in order. */
export function runAllTriggers(order: Order, workflows: Workflow[], channels: string[], opts: { test?: boolean } = {}): RunResult {
  const out: RunResult = { messages: [], errors: [], runs: [] };
  for (const trigger of TRIGGERS) {
    const r = runEvent({ ...order, status: trigger }, trigger, workflows, channels, opts);
    out.messages.push(...r.messages);
    out.errors.push(...r.errors);
    out.runs.push(...r.runs);
  }
  return out;
}
