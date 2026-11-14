"use client";

// The page around the app: full screen on a phone, a phone frame plus a QR code on a wide screen.
// It also checks for a new version every 10 seconds and reloads, so a change that goes live
// shows up on every open phone without anyone touching it.

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import ShopApp from "./ShopApp";
import { TENANTS } from "./tenants";
import type { ShopCustomer } from "./types";

const POLL_MS = 10_000;

function useLiveVersion() {
  const [updated, setUpdated] = useState(false);
  useEffect(() => {
    let first: string | null = null;
    let done = false;
    const check = async () => {
      if (done) return;
      try {
        const res = await fetch(`/shop/api/version?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return;
        const { version } = (await res.json()) as { version: string };
        if (first === null) first = version;
        else if (version !== first) {
          done = true;
          setUpdated(true);
          setTimeout(() => window.location.reload(), 1800);
        }
      } catch {
        // Offline for a moment. Try again on the next tick.
      }
    };
    check();
    const timer = setInterval(check, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return updated;
}

export default function ShopPage({ customer }: { customer: ShopCustomer }) {
  const tenant = TENANTS[customer];
  const updated = useLiveVersion();
  const [url, setUrl] = useState("");
  useEffect(() => setUrl(window.location.origin + window.location.pathname), []);

  const { brand, accent } = tenant.config.colors;

  // One app tree only: on a phone it fills the screen, on a wide screen CSS turns it into a phone frame.
  return (
    <div
      className="min-h-[100dvh] font-sans lg:flex lg:items-center lg:justify-center lg:gap-16 lg:p-6"
      style={{ background: `radial-gradient(circle at 30% 20%, ${accent}, #f5f5f4 60%)` }}
    >
      <div
        data-testid="phone-frame"
        className="relative h-[100dvh] w-full lg:h-[min(844px,calc(100dvh-48px))] lg:w-[390px] lg:shrink-0 lg:overflow-hidden lg:rounded-[52px] lg:border-[12px] lg:border-neutral-900 lg:bg-neutral-900 lg:shadow-2xl"
      >
        <div className="absolute left-1/2 top-2 z-40 hidden h-6 w-28 -translate-x-1/2 rounded-full bg-black lg:block" />
        <div className="h-full lg:overflow-hidden lg:rounded-[40px] lg:pt-6">
          <ShopApp customer={customer} tenant={tenant} updateNotice={updated ? "This app was just updated" : null} />
        </div>
      </div>

      <div className="hidden max-w-xs text-neutral-900 lg:block">
        <p className="text-sm font-semibold uppercase tracking-[0.14em]" style={{ color: brand }}>
          {tenant.config.name}
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">Try the app on your phone</h2>
        <div data-testid="qr-code" className="mt-6 inline-block rounded-3xl bg-white p-5 shadow-lg ring-1 ring-black/5">
          {url ? <QRCodeSVG value={url} size={200} fgColor={brand} /> : <div className="h-[200px] w-[200px]" />}
        </div>
        <p className="mt-4 text-lg font-medium">Scan to open on your phone</p>
        <p className="mt-1 break-all text-sm text-neutral-500">{url}</p>
        <p className="mt-6 text-xs text-neutral-400">Shopping App by Cartwise. Demo store with sample data.</p>
      </div>
    </div>
  );
}
