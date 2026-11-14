import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Board from "@/products/orders/Board";
import { TENANTS, isOrdersCustomer } from "@/products/orders/tenants";

export function generateStaticParams() {
  return Object.keys(TENANTS).map((customer) => ({ customer }));
}

export async function generateMetadata({ params }: { params: Promise<{ customer: string }> }): Promise<Metadata> {
  const { customer } = await params;
  if (!isOrdersCustomer(customer)) return {};
  return { title: `Order Flows · ${TENANTS[customer].config.company}` };
}

export default async function OrdersPage({ params }: { params: Promise<{ customer: string }> }) {
  const { customer } = await params;
  if (!isOrdersCustomer(customer)) notFound();
  return <Board customer={customer} />;
}
