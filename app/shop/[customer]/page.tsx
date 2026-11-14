import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import ShopPage from "@/products/shop/ShopPage";
import { TENANTS, isShopCustomer } from "@/products/shop/tenants";

type Props = { params: Promise<{ customer: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(TENANTS).map((customer) => ({ customer }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { customer } = await params;
  if (!isShopCustomer(customer)) return {};
  const { name } = TENANTS[customer].config;
  return { title: name, description: `Shop ${name} on your phone.` };
}

export async function generateViewport({ params }: Props): Promise<Viewport> {
  const { customer } = await params;
  const color = isShopCustomer(customer) ? TENANTS[customer].config.colors.background : "#ffffff";
  return { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: color };
}

export default async function Page({ params }: Props) {
  const { customer } = await params;
  if (!isShopCustomer(customer)) notFound();
  return <ShopPage customer={customer} />;
}
