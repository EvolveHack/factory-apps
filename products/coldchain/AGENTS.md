# Cold Chain Monitor: guide for the factory's coding agent

Frostline's Cold Chain Monitor shows freezer units, their temperatures and doors, the alerts that fired,
the messages sent to the shift lead's pager, and each unit's device settings. Sensors are simulated from a fixed seed.

Customers: `freshfare` (FreshFare Markets, 3 grocery stores) and `northgate` (Northgate Warehousing, 1 cold warehouse).
Pages: `/coldchain/freshfare` and `/coldchain/northgate`.

## Where a change goes

A customer change edits only `products/coldchain/tenants/<customer>/`. Never edit shared code for one customer.

| File | What it holds | Kind of change |
|---|---|---|
| `features.ts` | `export const alerts: AlertRule[]`, the customer's alert rules | New or changed alerts and pages. Can go live. |
| `config.json` | Customer name, accent color, shift lead, sites and units, planned demo events | Names and labels. Can go live. |
| `flags.json` | `pager`: show the shift lead pager panel | Turn a panel on or off. Can go live. |
| `setpoints.json` | Each unit's setpoint, defrost start times, defrost length, defrost limit | **Device control.** Changes how freezers run. Always waits for a safety lead. |

`setpoints.json` is device control. Any change to setpoints, defrost cycles, or compressors goes in that file only,
and it never goes live without a person. Do not copy setpoint numbers into `features.ts` to work around this.

## Alert rules (`features.ts`)

```ts
interface AlertRule {
  id: string;            // unique, kebab-case
  name: string;          // shown on the Alerts panel
  check: (reading, history) => { message: string } | null;
  page?: boolean;        // true also sends the message to the shift lead pager (on screen only)
}
```

- `reading` is one unit's reading for one minute: `{ unitId, minute, tempC, doorOpen, defrosting }`.
- `history` holds that unit's earlier readings, oldest first.
- The engine runs every rule on every reading. A rule fires once when `check` starts returning a hit,
  and fires again only after `check` returns null for that unit.
- Helper: `streak(reading, history, test)` counts the minutes in a row, ending now, where `test` is true.
- Temperatures are in Celsius. Keep messages short and plain.

Every customer starts with one rule: too warm (above -15 C, not in defrost) for 10 minutes.

### Example: "Add a freezer door left open alert that pages the shift lead after 3 minutes."

Add this rule to `tenants/<customer>/features.ts`:

```ts
  {
    id: "door-open-3-min",
    name: "Door left open",
    page: true,
    check: (reading, history) =>
      streak(reading, history, (r) => r.doorOpen) >= 3
        ? { message: "Door open for 3 minutes. Please close it." }
        : null,
  },
```

On the live page, a planned door opening fires it about 15 seconds after load, and the Shift lead pager shows the message.
Yesterday's replay fires it for each door left open 3 minutes or more.

### Example that waits for a person: "Raise the defrost cycle setpoint on all freezers."

Change `defrostLimitC` (or `defrostTimes`, `defrostMinutes`, `setpointC`) in `tenants/<customer>/setpoints.json`.
This is device control, so it waits for a safety lead.

## Proof

`node products/coldchain/proof.mjs` with `PAGE_URL`, `CUSTOMER`, `BOARD_PACKAGE_JSON`, and `VERCEL_AUTOMATION_BYPASS_SECRET`.
It runs yesterday's readings through the customer's rules at `/coldchain/<customer>/api/replay`, checks the result,
then opens the page and checks the floor map renders and the live clock runs.

## Shared files (do not edit for one customer)

- `engine.ts`: alert engine, pure TypeScript.
- `simulator.ts`: seeded freezer simulator. It follows `setpoints.json`.
- `replay/<customer>.json`: yesterday's readings, 06:00 to 10:00 at 1-minute steps. Made by `replay/generate.mjs`.
- `replay.ts`, `tenants.ts`, `types.ts`, `ui/`: replay runner, import map, types, and the page.
