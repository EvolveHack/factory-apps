# factory-apps: rules for every agent

Four fictional enterprise products live in this one Next.js app. Phone-a-factory's builder edits them when customers call.
Read `contract/products.ts` first. It is the registry of products and customers. Never edit `contract/`.

## Layout (each product owns only its own two folders)

| Product | Pages | Code and data |
|---|---|---|
| helpdesk | `app/helpdesk/` | `products/helpdesk/` |
| orders | `app/orders/` | `products/orders/` |
| coldchain | `app/coldchain/` | `products/coldchain/` |
| shop | `app/shop/` | `products/shop/` |

Root files (`app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `package.json`, `contract/`) belong to the owner. If you need a new npm package or a root change, write it in `CONTRACT-REQUEST.md` in your worktree and do not add it yourself. Installed already: `ai` (AI SDK 7, call models as "anthropic/claude-haiku-5.5" through Vercel AI Gateway), `zod`, `motion`, `qrcode.react`, Tailwind 4.

## Every product follows the same shape

1. **One page per customer** at the path in `contract/products.ts` (for example `/helpdesk/lumen`). The page reads that customer's files through a static import map, like `products/<product>/tenants.ts`.
2. **Each customer's own files live in `products/<product>/tenants/<customer>/`.** That folder is the only place a "goes live" change may edit. It holds:
   - `config.json`: settings for that customer (names, thresholds, labels, rules).
   - `features.tsx`: named slots that add **new features** for that customer only (new buttons, panels, tools, alerts, workflow steps). Start every slot as an empty stub that returns null or does nothing, with a one-line comment saying what the slot is for.
   - `flags.json`: feature flags for that customer.
   Shared code reads these files; it never hard-codes one customer's behavior.
3. **A proof script** at `products/<product>/proof.mjs`. The builder runs it inside the repo after a build: `node products/<product>/proof.mjs` with env `PAGE_URL` (the preview page for one customer), `CUSTOMER` (customer id), `BOARD_PACKAGE_JSON` (path to package.json, for `createRequire` to load `playwright`), and `VERCEL_AUTOMATION_BYPASS_SECRET` (send it as the `x-vercel-protection-bypass` header plus `x-vercel-set-bypass-cookie: true`). It proves the product still works for that customer (replayed chats, a test order, replayed sensor data, the app renders). Print one line per check, exit 0 when all pass, print `ASSERT_FAIL <reason>` and exit 1 otherwise. It must finish in under 60 seconds.
4. **Stable `data-testid`s** on everything a check might read, listed in `products/<product>/TESTIDS.md`.
5. **`products/<product>/AGENTS.md`**: a short guide for the factory's coding agent: what each slot is for, where each kind of feature goes, and one example per slot.

## Rules

- Stay in your two folders and your branch. Commit there. Never commit to `main`, never push, never edit another product's folders.
- `npx tsc --noEmit` and `npm run build` must pass before every commit.
- Plain, short, professional English on every screen. No em dashes. No real company names; customers are the fictional ones in the registry.
- Fake data only, generated from a fixed seed so screenshots compare cleanly. Nothing sends real email, SMS, or payments.
- Pages must look good at 390 px wide (a phone) and at 1280 px wide.
