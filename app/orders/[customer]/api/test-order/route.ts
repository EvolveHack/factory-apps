import { NextResponse } from "next/server";
import { runAllTriggers } from "@/products/orders/engine";
import { makeTestOrder } from "@/products/orders/simulate";
import { TENANTS, isOrdersCustomer } from "@/products/orders/tenants";

export const dynamic = "force-dynamic";

/** Runs one fixed test order through every workflow, for all three triggers. Nothing leaves the app. */
export async function GET(_req: Request, { params }: { params: Promise<{ customer: string }> }) {
  const { customer } = await params;
  if (!isOrdersCustomer(customer)) {
    return NextResponse.json({ ok: false, error: `There is no customer named ${customer}.` }, { status: 404 });
  }
  const tenant = TENANTS[customer];
  const order = makeTestOrder(tenant.config);
  const result = runAllTriggers(order, tenant.workflows, tenant.config.channels, { test: true });
  return NextResponse.json({
    ok: result.errors.length === 0,
    customer,
    order,
    workflows: tenant.workflows.map((w) => ({ id: w.id, name: w.name, trigger: w.trigger })),
    ...result,
  });
}

export const POST = GET;
