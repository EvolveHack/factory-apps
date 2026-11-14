// Shared agent parts that every customer gets. Never put one customer's behavior here.
import { tool, type ToolSet } from "ai";
import { z } from "zod";
import { findAccount, findInvoice, openTicket, type TenantId } from "./data";
import type { TenantConfig } from "./tenants";

export const MODEL = "anthropic/claude-haiku-5.5";

export function baseTools(tenant: TenantId): ToolSet {
  return {
    lookupAccount: tool({
      description: "Look up a customer account by account id, email, or company name.",
      inputSchema: z.object({ query: z.string().describe("Account id, email, or company name") }),
      execute: async ({ query }) => findAccount(tenant, query) ?? { error: "No account found." },
    }),
    lookupInvoice: tool({
      description: "Look up an invoice by its id and see the amount, due date, and status.",
      inputSchema: z.object({ invoiceId: z.string().describe("Invoice id, for example INV-1234") }),
      execute: async ({ invoiceId }) => findInvoice(tenant, invoiceId) ?? { error: "No invoice found." },
    }),
    createTicket: tool({
      description: "Open a support ticket so a person on the team follows up.",
      inputSchema: z.object({
        subject: z.string().describe("One line summary of the problem"),
        email: z.string().optional().describe("Visitor email, if they gave one"),
      }),
      execute: async ({ subject, email }) => openTicket(tenant, subject, email),
    }),
  };
}

export const BASE_RULES = [
  "Answer only from tool results, the policies, and the rules. Never guess facts.",
  "If you cannot do something with your tools, say so and offer to open a ticket.",
  "Never promise refunds, credits, or changes to a bill. A person decides those.",
  "Keep answers short: two to four sentences, plain words.",
];

export function buildInstructions(config: TenantConfig, extraRules: string[]): string {
  const rules = [...BASE_RULES, ...config.policies, ...extraRules];
  return [
    `You are ${config.agentName}, the support agent for ${config.company}. ${config.company} makes ${config.product}.`,
    `Tone: ${config.tone}`,
    "Rules:",
    ...rules.map((r) => `- ${r}`),
  ].join("\n");
}
