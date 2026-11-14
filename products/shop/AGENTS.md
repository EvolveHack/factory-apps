# Shopping App (Cartwise): guide for the coding agent

The mobile app a retailer's shoppers use. Two retailers: `willow` (Willow Pine Home, home goods) and `summit` (Summit Outdoor, outdoor gear). Pages: `/shop/willow`, `/shop/summit`.

## Where a change goes

Edit only `products/shop/tenants/<customer>/`. Never edit shared files (`ShopApp.tsx`, `ShopPage.tsx`, `types.ts`, `tenants.ts`).

| Ask | File |
|---|---|
| A new button, banner, section, or tool | `features.tsx`, in the matching slot |
| Brand name, colors, hero text, products, past orders | `config.json` |
| Turn on the new checkout | `flags.json` (`"newCheckout": true`) |

## Slots in `features.tsx`

Every slot gets `shop` (see `Shop` in `products/shop/types.ts`). Useful parts:
`shop.orders` (newest first), `shop.products`, `shop.cart`, `shop.cartTotal`, `shop.productById(id)`, `shop.orderTotal(order)`, `shop.addToCart(productId, qty)`, `shop.removeFromCart(productId)`, `shop.open({ name: "home" | "cart" | "orders" })` or `shop.open({ name: "product", productId })`, `shop.notify(message)`, `shop.formatPrice(dollars)`.

| Slot | Where it shows | Extra props | Example ask |
|---|---|---|---|
| `HomeTop` | Home, above the hero | none | Add a Reorder my last purchase button on the home screen. |
| `HomeSection` | Home, below the categories | none | Show a Picked for you row with three products. |
| `ProductActions` | Product page, under Add to cart | `product` | Add a Save for later button. |
| `CartExtras` | Cart, above the order summary | none | Show how much more to spend for a free gift. |
| `OrderActions` | Each past order on the Orders screen | `order` | Add a Buy again button on past orders. |

Rules:
- Return `null` when there is nothing to show. Keep the props type in the signature.
- Use Tailwind classes. Brand colors are CSS variables: `bg-[var(--brand)]`, `text-[var(--brand-text)]`, `bg-[var(--accent)]`.
- Add a `data-testid` to anything new you add, for example `data-testid="reorder-last"`.
- No network calls, no real payments, no real names. Prices in dollars.
- If a feature needs `useState`, import it from `react`. The file already runs on the client.

## Example: Reorder my last purchase (HomeTop)

```tsx
export function HomeTop({ shop }: SlotProps) {
  const last = shop.orders[0];
  if (!last) return null;
  const names = last.items.map((l) => shop.productById(l.productId)?.name).filter(Boolean).join(", ");
  return (
    <button
      data-testid="reorder-last"
      onClick={() => {
        last.items.forEach((l) => shop.addToCart(l.productId, l.qty));
        shop.notify("Your last order is in your cart");
        shop.open({ name: "cart" });
      }}
      className="flex w-full items-center gap-3 rounded-2xl bg-[var(--brand)] p-4 text-left text-[var(--brand-text)] shadow-sm"
    >
      <span className="text-2xl">🔁</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">Reorder my last purchase</span>
        <span className="block truncate text-xs opacity-80">{names}</span>
      </span>
      <span className="text-sm font-semibold">{shop.formatPrice(shop.orderTotal(last))}</span>
    </button>
  );
}
```

## Other slot examples

- `HomeSection`: `shop.products.slice(0, 3)` as a row of buttons that call `shop.open({ name: "product", productId: p.id })`.
- `ProductActions`: a button that calls `shop.notify(\`Saved ${product.name} for later\`)`.
- `CartExtras`: `const left = 100 - shop.cartTotal;` then a row that says "Spend $X more for a free gift" when `left > 0`.
- `OrderActions`: a button that adds `order.items` to the cart and opens the cart.

## Check your change

`node products/shop/proof.mjs` with `PAGE_URL`, `CUSTOMER`, and `BOARD_PACKAGE_JSON`. It loads the app at 390 by 844, opens a product, adds it to the cart, checks the cart and orders, and fails on any page error. New slot content slides in on its own, and open phones reload within 10 seconds of a change going live.
