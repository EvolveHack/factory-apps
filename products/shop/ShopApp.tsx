"use client";

// The shopping app shoppers see. Shared by every retailer: it reads the tenant's
// config, flags, and feature slots, and never hard-codes one retailer.

import { useCallback, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { CartLine, Order, Screen, Shop, ShopCustomer, Tenant } from "./types";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const formatPrice = (dollars: number) => money.format(dollars);

/** Wraps a feature slot so new content slides in. Renders nothing when the slot is empty. */
function Slot({ name, children }: { name: string; children: ReactNode }) {
  return (
    <motion.div
      data-testid={`slot-${name}`}
      className="empty:hidden"
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.15 }}
    >
      {children}
    </motion.div>
  );
}

export default function ShopApp({
  customer,
  tenant,
  updateNotice,
}: {
  customer: ShopCustomer;
  tenant: Tenant;
  /** Set by the page when a new version is live. */
  updateNotice?: string | null;
}) {
  const { config, flags, features } = tenant;
  const { HomeTop, HomeSection, ProductActions, CartExtras, OrderActions } = features;

  const [screen, setScreen] = useState<Screen>({ name: "home" });
  const [cartQty, setCartQty] = useState<Record<string, number>>({});
  const [placedOrders, setPlacedOrders] = useState<Order[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [message, setMessage] = useState<{ id: number; text: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const productById = useCallback((id: string) => config.products.find((p) => p.id === id), [config.products]);

  const shop: Shop = useMemo(() => {
    const cart: CartLine[] = Object.entries(cartQty).flatMap(([id, qty]) => {
      const product = productById(id);
      return product && qty > 0 ? [{ product, qty }] : [];
    });
    const orderTotal = (order: Order) =>
      order.items.reduce((sum, line) => sum + (productById(line.productId)?.price ?? 0) * line.qty, 0);
    return {
      customer,
      config,
      flags,
      products: config.products,
      orders: [...placedOrders, ...config.orders],
      cart,
      cartCount: cart.reduce((n, l) => n + l.qty, 0),
      cartTotal: cart.reduce((n, l) => n + l.product.price * l.qty, 0),
      productById,
      orderTotal,
      addToCart: (productId, qty = 1) =>
        setCartQty((c) => ({ ...c, [productId]: Math.max(0, (c[productId] ?? 0) + qty) })),
      removeFromCart: (productId) =>
        setCartQty((c) => {
          const next = { ...c };
          delete next[productId];
          return next;
        }),
      open: (next) => {
        setScreen(next);
        scrollRef.current?.scrollTo({ top: 0 });
      },
      notify: (text) => {
        if (messageTimer.current) clearTimeout(messageTimer.current);
        setMessage({ id: Date.now(), text });
        messageTimer.current = setTimeout(() => setMessage(null), 2200);
      },
      formatPrice,
    };
  }, [customer, config, flags, cartQty, placedOrders, productById]);

  const placeOrder = () => {
    const order: Order = {
      id: `${config.orders[0]?.id.split("-")[0] ?? "NO"}-${1100 + placedOrders.length + 1}`,
      date: "Today",
      status: "Placed",
      items: shop.cart.map((l) => ({ productId: l.product.id, qty: l.qty })),
    };
    setPlacedOrders((o) => [order, ...o]);
    setCartQty({});
    shop.open({ name: "orders" });
    shop.notify("Order placed. Thank you!");
  };

  const toast = updateNotice ?? message?.text ?? null;
  const theme = {
    "--brand": config.colors.brand,
    "--brand-text": config.colors.brandText,
    "--accent": config.colors.accent,
    "--bg": config.colors.background,
  } as CSSProperties;

  return (
    <div
      data-testid="shop-app"
      data-customer={customer}
      data-screen={screen.name}
      style={theme}
      className="relative flex h-full w-full flex-col overflow-hidden bg-[var(--bg)] text-neutral-900"
    >
      {/* Top bar */}
      <header className="flex shrink-0 items-center justify-between bg-[var(--bg)] px-5 pb-3 pt-[max(14px,env(safe-area-inset-top))]">
        {screen.name === "product" ? (
          <button
            data-testid="back"
            onClick={() => shop.open({ name: "home" })}
            className="-ml-2 flex h-9 items-center gap-1 rounded-full px-2 text-sm font-medium text-neutral-700 active:bg-black/5"
          >
            <Icon d="M15 18l-6-6 6-6" /> Back
          </button>
        ) : (
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">Hi, {config.shopperName}</p>
            <p data-testid="brand-name" className="text-lg font-semibold tracking-tight text-[var(--brand)]">
              {config.name}
            </p>
          </div>
        )}
        <button
          aria-label="Open cart"
          onClick={() => shop.open({ name: "cart" })}
          className="relative grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm ring-1 ring-black/5"
        >
          <Icon d="M6 7h12l-1 13H7L6 7zm3 0a3 3 0 016 0" />
          {shop.cartCount > 0 && (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--brand)] px-1 text-[11px] font-semibold text-[var(--brand-text)]">
              {shop.cartCount}
            </span>
          )}
        </button>
      </header>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={updateNotice ? "update" : message?.id}
            data-testid={updateNotice ? "update-toast" : "toast"}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="pointer-events-none absolute inset-x-4 top-[max(14px,env(safe-area-inset-top))] z-30 rounded-2xl bg-neutral-900 px-4 py-3 text-center text-sm font-medium text-white shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screen */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <motion.main
          key={screen.name === "product" ? `product-${screen.productId}` : screen.name}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.18 }}
          className="px-5 pb-6"
        >
          {screen.name === "home" && (
            <div data-testid="screen-home" className="space-y-6">
              <Slot name="HomeTop">
                <HomeTop shop={shop} />
              </Slot>

              <section
                data-testid="hero"
                className="relative overflow-hidden rounded-3xl bg-[var(--accent)] p-5"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">
                  {config.hero.eyebrow}
                </p>
                <h1 className="mt-2 max-w-[13rem] text-[26px] font-semibold leading-[1.1] tracking-tight">
                  {config.hero.title}
                </h1>
                <p className="mt-2 max-w-[14rem] text-sm text-neutral-700">{config.hero.subtitle}</p>
                <button
                  onClick={() => setCategory(null)}
                  className="mt-4 rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-[var(--brand-text)]"
                >
                  {config.hero.cta}
                </button>
                <span aria-hidden className="absolute -bottom-3 -right-2 text-[96px] leading-none opacity-90">
                  {config.hero.emoji}
                </span>
              </section>

              <section>
                <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
                  {[{ id: null, name: "All", emoji: "✨" }, ...config.categories].map((c) => {
                    const active = category === c.id;
                    return (
                      <button
                        key={c.id ?? "all"}
                        data-testid={`category-${c.id ?? "all"}`}
                        onClick={() => setCategory(c.id)}
                        className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition ${
                          active
                            ? "bg-[var(--brand)] text-[var(--brand-text)]"
                            : "bg-white text-neutral-700 ring-1 ring-black/5"
                        }`}
                      >
                        <span>{c.emoji}</span>
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </section>

              <Slot name="HomeSection">
                <HomeSection shop={shop} />
              </Slot>

              <section>
                <h2 className="mb-3 text-base font-semibold">
                  {category ? config.categories.find((c) => c.id === category)?.name : "Popular now"}
                </h2>
                <div data-testid="product-grid" className="grid grid-cols-2 gap-3">
                  {config.products
                    .filter((p) => !category || p.category === category)
                    .map((p) => (
                      <button
                        key={p.id}
                        data-testid="product-card"
                        data-product-id={p.id}
                        onClick={() => shop.open({ name: "product", productId: p.id })}
                        className="overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-black/5 transition active:scale-[0.98]"
                      >
                        <div className="grid aspect-square place-items-center text-6xl" style={{ background: p.tint }}>
                          {p.emoji}
                        </div>
                        <div className="p-3">
                          <p className="line-clamp-2 text-sm font-medium leading-snug">{p.name}</p>
                          <p className="mt-1 text-sm font-semibold text-[var(--brand)]">{formatPrice(p.price)}</p>
                        </div>
                      </button>
                    ))}
                </div>
              </section>
            </div>
          )}

          {screen.name === "product" &&
            (() => {
              const p = productById(screen.productId);
              if (!p) return null;
              return (
                <div data-testid="screen-product" data-product-id={p.id} className="space-y-5">
                  <div className="grid aspect-square place-items-center rounded-3xl text-[140px]" style={{ background: p.tint }}>
                    {p.emoji}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                      {config.categories.find((c) => c.id === p.category)?.name}
                    </p>
                    <h1 data-testid="product-name" className="mt-1 text-2xl font-semibold tracking-tight">
                      {p.name}
                    </h1>
                    <div className="mt-2 flex items-center gap-3">
                      <p data-testid="product-price" className="text-xl font-semibold text-[var(--brand)]">
                        {formatPrice(p.price)}
                      </p>
                      <p className="text-sm text-neutral-500">★ {p.rating.toFixed(1)}</p>
                    </div>
                    <p className="mt-3 text-[15px] leading-relaxed text-neutral-700">{p.blurb}</p>
                  </div>
                  <button
                    data-testid="add-to-cart"
                    onClick={() => {
                      shop.addToCart(p.id);
                      shop.notify(`Added ${p.name} to your cart`);
                    }}
                    className="w-full rounded-2xl bg-[var(--brand)] py-3.5 text-base font-semibold text-[var(--brand-text)] shadow-sm active:opacity-90"
                  >
                    Add to cart
                  </button>
                  <Slot name="ProductActions">
                    <ProductActions shop={shop} product={p} />
                  </Slot>
                </div>
              );
            })()}

          {screen.name === "cart" && (
            <div data-testid="screen-cart" className="space-y-4">
              <h1 className="text-2xl font-semibold tracking-tight">Your cart</h1>
              {shop.cart.length === 0 ? (
                <div data-testid="cart-empty" className="rounded-3xl bg-white p-8 text-center ring-1 ring-black/5">
                  <p className="text-5xl">🛍️</p>
                  <p className="mt-3 font-medium">Your cart is empty</p>
                  <button
                    onClick={() => shop.open({ name: "home" })}
                    className="mt-4 rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-[var(--brand-text)]"
                  >
                    Start shopping
                  </button>
                </div>
              ) : (
                <ul className="space-y-3">
                  {shop.cart.map(({ product: p, qty }) => (
                    <li
                      key={p.id}
                      data-testid="cart-item"
                      data-product-id={p.id}
                      className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-black/5"
                    >
                      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl text-3xl" style={{ background: p.tint }}>
                        {p.emoji}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p data-testid="cart-item-name" className="truncate text-sm font-medium">
                          {p.name}
                        </p>
                        <p className="text-sm font-semibold text-[var(--brand)]">{formatPrice(p.price * qty)}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <Stepper label="Remove one" onClick={() => shop.addToCart(p.id, -1)}>
                            −
                          </Stepper>
                          <span data-testid="cart-item-qty" className="w-5 text-center text-sm font-medium">
                            {qty}
                          </span>
                          <Stepper label="Add one" onClick={() => shop.addToCart(p.id, 1)}>
                            +
                          </Stepper>
                        </div>
                      </div>
                      <button
                        aria-label={`Remove ${p.name}`}
                        onClick={() => shop.removeFromCart(p.id)}
                        className="self-start p-1 text-neutral-400"
                      >
                        <Icon d="M6 6l12 12M18 6L6 18" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <Slot name="CartExtras">
                <CartExtras shop={shop} />
              </Slot>

              {shop.cart.length > 0 && (
                <div className="space-y-2 rounded-2xl bg-white p-4 text-sm ring-1 ring-black/5">
                  <Row label="Subtotal" value={formatPrice(shop.cartTotal)} />
                  <Row label="Delivery" value="Free" />
                  {flags.newCheckout && <Row label="Arrives" value="In 2 days" />}
                  <div className="border-t border-black/5 pt-2">
                    <Row label="Total" value={<span data-testid="cart-total">{formatPrice(shop.cartTotal)}</span>} bold />
                  </div>
                  <button
                    data-testid="checkout"
                    onClick={placeOrder}
                    className="mt-2 w-full rounded-2xl bg-[var(--brand)] py-3.5 text-base font-semibold text-[var(--brand-text)]"
                  >
                    {flags.newCheckout ? "Pay in one tap" : "Check out"}
                  </button>
                  <p className="text-center text-xs text-neutral-400">Demo store. No real payment is taken.</p>
                </div>
              )}
            </div>
          )}

          {screen.name === "orders" && (
            <div data-testid="screen-orders" className="space-y-4">
              <h1 className="text-2xl font-semibold tracking-tight">Your orders</h1>
              <ul className="space-y-3">
                {shop.orders.map((o) => (
                  <li
                    key={o.id}
                    data-testid="order-card"
                    data-order-id={o.id}
                    className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-black/5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold">Order {o.id}</p>
                        <p className="text-xs text-neutral-500">{o.date}</p>
                      </div>
                      <span className="rounded-full bg-[var(--accent)] px-2.5 py-1 text-xs font-medium text-[var(--brand)]">
                        {o.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {o.items.map((line) => {
                        const p = productById(line.productId);
                        return p ? (
                          <div
                            key={line.productId}
                            title={p.name}
                            className="relative grid h-12 w-12 place-items-center rounded-xl text-2xl"
                            style={{ background: p.tint }}
                          >
                            {p.emoji}
                            {line.qty > 1 && (
                              <span className="absolute -bottom-1 -right-1 rounded-full bg-neutral-900 px-1.5 text-[10px] font-semibold text-white">
                                ×{line.qty}
                              </span>
                            )}
                          </div>
                        ) : null;
                      })}
                      <p className="ml-auto text-sm font-semibold">{formatPrice(shop.orderTotal(o))}</p>
                    </div>
                    <p className="text-xs text-neutral-500">
                      {o.items.map((l) => `${l.qty} × ${productById(l.productId)?.name ?? l.productId}`).join(", ")}
                    </p>
                    <Slot name="OrderActions">
                      <OrderActions shop={shop} order={o} />
                    </Slot>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.main>
      </div>

      {/* Tab bar */}
      <nav className="flex shrink-0 justify-around border-t border-black/5 bg-white/90 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
        {(
          [
            ["home", "Home", "M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9z"],
            ["cart", "Cart", "M6 7h12l-1 13H7L6 7zm3 0a3 3 0 016 0"],
            ["orders", "Orders", "M5 4h14v16H5zM9 9h6M9 13h6"],
          ] as const
        ).map(([name, label, d]) => {
          const active = screen.name === name || (name === "home" && screen.name === "product");
          return (
            <button
              key={name}
              data-testid={`nav-${name}`}
              onClick={() => shop.open({ name })}
              className={`relative flex w-20 flex-col items-center gap-0.5 py-1 text-[11px] font-medium ${
                active ? "text-[var(--brand)]" : "text-neutral-400"
              }`}
            >
              <Icon d={d} />
              {label}
              {name === "cart" && shop.cartCount > 0 && (
                <span
                  data-testid="cart-count"
                  className="absolute right-4 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--brand)] px-1 text-[10px] font-semibold text-[var(--brand-text)]"
                >
                  {shop.cartCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function Icon({ d }: { d: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

function Stepper({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="grid h-7 w-7 place-items-center rounded-full bg-neutral-100 text-base leading-none text-neutral-700"
    >
      {children}
    </button>
  );
}

function Row({ label, value, bold }: { label: string; value: ReactNode; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-base font-semibold" : "text-neutral-600"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
