# Order Flows: guide for the factory's coding agent

Order Flows by Tallyflow moves a distributor's orders between its systems and its team chat.
Each customer has one page: `/orders/granite` (Granite Supply) and `/orders/bluewater` (Bluewater Distributors).

## Where a change goes

A "goes live" change edits only `products/orders/tenants/<customer>/`. Do not edit shared code for one customer.

| File | What it is for |
|---|---|
| `features.ts` | The customer's workflows. Add a new workflow to the `workflows` list. It shows on the Workflows list and runs on every order right away. |
| `config.json` | Company name, accent color, chat channels, connected systems, buyers, and catalog. Add a chat channel here before a workflow posts to it. |
| `flags.json` | On or off switches. `showMargin` shows the margin on each order. |

## How a workflow works

Every order moves through three steps: `placed`, then `packed`, then `shipped`.
When an order reaches a step, the engine runs every workflow whose `trigger` is that step.
If `when(order)` returns true, the engine calls `run(order, ctx)`.

`order` has `id`, `customer` (the buyer), `items` (sku, name, qty, price), `total` and `cost` in dollars, `margin` in percent, and `status`.

`ctx` can do three things, and nothing leaves the app:

- `ctx.post(channel, text)` posts to a team chat channel from `config.json`, for example `"big-orders"`. An unknown channel is an error.
- `ctx.notify(to, subject)` shows an email in the chat column. It is never sent.
- `ctx.money(amount)` formats dollars, for example `$5,420`.

## Example: "When an order over 5000 dollars ships, post to #big-orders with the margin"

Add this to the `workflows` list in `products/orders/tenants/granite/features.ts`:

```ts
{
  id: "big-orders-shipped",
  name: "Flag big shipped orders",
  trigger: "shipped",
  action: "Post to #big-orders with the margin",
  when: (order) => order.total > 5000,
  run: (order, ctx) =>
    ctx.post("big-orders", `Big order ${order.id} shipped to ${order.customer}: ${ctx.money(order.total)} at ${order.margin}% margin`),
},
```

Example with an email: when an order is packed with a margin under 15 percent, `ctx.notify("sales@granite.example", \`Low margin on ${order.id}\`)`.

## What needs a person

These are not "goes live" changes. Stop and say a person must approve them:

- Connecting or writing to an outside system, such as creating invoices in Accounting. Accounting shows "Not connected" on purpose.
- Sending real email, chat, or anything over the network. Workflows may only use `ctx`.
- Changing shared files: `engine.ts`, `simulate.ts`, `types.ts`, `Board.tsx`, `tenants.ts`, or anything in `app/orders/`.

## Rules

- `id` is unique within the customer's list, in kebab case. `name` and `action` are short plain English and show on screen.
- Keep messages short and professional. No em dashes. Fictional names only.
- The fixed test order is about $7,200 with a margin near 24 percent, so a size check like `order.total > 5000` matches it.

## Prove it

```
node products/orders/proof.mjs
```

with `PAGE_URL` set to the customer's page and `CUSTOMER` set to the customer id. It runs the test order through every workflow at `/orders/<customer>/api/test-order`, fails if any workflow throws, and checks the page renders. Test ids are in `TESTIDS.md`.
