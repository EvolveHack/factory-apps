# Helpdesk Agent: guide for the factory's coding agent

Northpeak's Helpdesk Agent is an AI support agent that answers a software company's customers in chat.
Each customer has a page at `/helpdesk/<customer>` (`lumen` or `cedar`).

## The only folder you edit for a customer change

`products/helpdesk/tenants/<customer>/`

| File | What it is for |
|---|---|
| `config.json` | Company name, product, agent name, accent color, tone, greeting, policies, suggested questions. |
| `features.tsx` | Three slots: `tools` (extra tools), `rules` (extra instructions), `ExtraPanel` (extra card on the page). |
| `flags.json` | `showToolBadges`, `showSuggestedQuestions`. |
| `scenarios.json` | Extra proof chats for this customer's new feature. Same shape as `products/helpdesk/scenarios/<customer>.json`. |

Do not edit shared files (`base.ts`, `agent.ts`, `data.ts`, `Chat.tsx`, `tenants.ts`, `app/helpdesk/**`) for a customer change.

## Where each kind of change goes

- **New thing the agent can look up or do**: add a tool to `tools` in `features.tsx`. It appears at once in "How this agent works" with an "Added for <company>" badge.
- **New behavior or wording rule**: add a sentence to `rules` in `features.tsx`. It shows in the rules list marked "(added)".
- **New policy, tone, greeting, or suggested question**: edit `config.json`.
- **New card on the page**: return JSX from `ExtraPanel` in `features.tsx` (server component, no hooks).
- **Turn a shown part on or off**: edit `flags.json`.
- **Prove it**: add one or two entries to `scenarios.json` that ask about the new feature and expect the new tool name.

## Data you can use (from `products/helpdesk/data.ts`, read only)

- `getStatusPage(tenant)`: current incidents, components, and overall status. Not wired into any agent yet.
- `getRefunds(tenant, invoiceId?)`: refund records. Not wired into any agent yet.
- `findAccount`, `findInvoice`, `openTicket`: already used by the shared tools `lookupAccount`, `lookupInvoice`, `createTicket`.

## Example: answer outage questions from the status page (lumen)

`tenants/lumen/features.tsx`:

```tsx
import { tool, type ToolSet } from "ai";
import { z } from "zod";
import { getStatusPage } from "../../data";

export const tools: ToolSet = {
  checkStatusPage: tool({
    description: "Check the status page for current incidents and outages.",
    inputSchema: z.object({}),
    execute: async () => getStatusPage("lumen"),
  }),
};

export const rules: string[] = [
  "When someone asks about an outage, slowness, or something being down, call checkStatusPage and answer with what it says, including the next update time.",
];

export function ExtraPanel() {
  return null;
}
```

`tenants/lumen/scenarios.json`:

```json
[{ "name": "outage from status page", "message": "Is anything down right now?", "expect": { "tools": ["checkStatusPage"], "anyKeyword": ["dashboard"] } }]
```

## Example: ExtraPanel

```tsx
export function ExtraPanel() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 text-xs text-neutral-600 shadow-sm">
      Urgent issue? Call the support line.
    </div>
  );
}
```

## Check your change

1. `npx tsc --noEmit` and `npm run build` pass.
2. `PAGE_URL=<preview>/helpdesk/<customer> CUSTOMER=<customer> node products/helpdesk/proof.mjs` exits 0.

## Rules

- Plain, short, professional English. No em dashes. Fictional names only.
- Never let the agent issue refunds, credits, or bill changes on its own. That needs a person.
- Nothing sends real email, SMS, or payments.
