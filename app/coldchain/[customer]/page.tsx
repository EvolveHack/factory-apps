import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TENANTS, getTenant } from "@/products/coldchain/tenants";
import { Console } from "@/products/coldchain/ui/Console";

export function generateStaticParams() {
  return Object.keys(TENANTS).map((customer) => ({ customer }));
}

export async function generateMetadata({ params }: { params: Promise<{ customer: string }> }): Promise<Metadata> {
  const { customer } = await params;
  const tenant = getTenant(customer);
  return { title: tenant ? `${tenant.config.name} · Cold Chain Monitor` : "Cold Chain Monitor" };
}

export default async function ColdChainPage({ params }: { params: Promise<{ customer: string }> }) {
  const { customer } = await params;
  if (!getTenant(customer)) notFound();
  return <Console customerId={customer} />;
}
