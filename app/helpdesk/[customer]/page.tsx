import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { PRODUCTS } from "@/contract/products";
import { agentTools } from "@/products/helpdesk/agent";
import { BASE_RULES } from "@/products/helpdesk/base";
import { Chat } from "@/products/helpdesk/Chat";
import { getTenant, TENANTS } from "@/products/helpdesk/tenants";

export function generateStaticParams() {
  return Object.keys(TENANTS).map((customer) => ({ customer }));
}

export async function generateMetadata({ params }: { params: Promise<{ customer: string }> }) {
  const tenant = getTenant((await params).customer);
  return { title: tenant ? `${tenant.config.company} Support` : "Helpdesk Agent" };
}

export default async function HelpdeskPage({ params }: { params: Promise<{ customer: string }> }) {
  const tenant = getTenant((await params).customer);
  if (!tenant) notFound();
  const { config, flags, features } = tenant;
  const product = PRODUCTS.helpdesk;

  const tenantToolNames = new Set(Object.keys(features.tools));
  const tools = Object.entries(agentTools(tenant)).map(([name, t]) => ({
    name,
    description: typeof t.description === "string" ? t.description : "",
    added: tenantToolNames.has(name),
  }));
  const rules = [
    ...BASE_RULES.map((text) => ({ text, source: "shared" })),
    ...config.policies.map((text) => ({ text, source: "policy" })),
    ...features.rules.map((text) => ({ text, source: "added" })),
  ];

  return (
    <div
      data-testid="helpdesk-console"
      data-customer={tenant.id}
      className="min-h-screen bg-neutral-50 text-neutral-900"
      style={{ "--accent": config.accent } as CSSProperties}
    >
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full" style={{ background: "var(--accent)" }} />
            <h1 data-testid="company-name" className="text-lg font-semibold">
              {config.company} Support
            </h1>
          </div>
          <p className="text-xs text-neutral-500">
            {product.name} by {product.vendor}
          </p>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_360px]">
        <Chat
          customer={tenant.id}
          agentName={config.agentName}
          greeting={config.greeting}
          suggestedQuestions={flags.showSuggestedQuestions ? config.suggestedQuestions : []}
          showToolBadges={flags.showToolBadges}
        />

        <aside data-testid="how-it-works" className="space-y-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold">How this agent works</h2>
            <p className="mt-1 text-xs text-neutral-500">
              {config.agentName} answers {config.company} customers. It can use these tools and follows these rules.
            </p>

            <h3 className="mt-5 text-xs font-medium uppercase tracking-wide text-neutral-500">Tools</h3>
            <ul className="mt-2 space-y-2">
              {tools.map((t) => (
                <li
                  key={t.name}
                  data-testid="tool-item"
                  data-tool={t.name}
                  className={`rounded-lg border px-3 py-2 ${t.added ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_6%,white)]" : "border-neutral-200"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold">{t.name}</span>
                    {t.added && (
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white" style={{ background: "var(--accent)" }}>
                        Added for {config.company}
                      </span>
                    )}
                  </div>
                  {t.description && <p className="mt-0.5 text-xs text-neutral-600">{t.description}</p>}
                </li>
              ))}
            </ul>

            <h3 className="mt-5 text-xs font-medium uppercase tracking-wide text-neutral-500">Rules</h3>
            <ul className="mt-2 space-y-1.5">
              {rules.map((r) => (
                <li key={r.text} data-testid="rule-item" data-source={r.source} className="flex gap-2 text-xs text-neutral-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: r.source === "shared" ? "#a3a3a3" : "var(--accent)" }} />
                  <span>
                    {r.text}
                    {r.source === "added" && <span className="ml-1 font-medium text-[var(--accent)]">(added)</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <features.ExtraPanel />
        </aside>
      </main>
    </div>
  );
}
