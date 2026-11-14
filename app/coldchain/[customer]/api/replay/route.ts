import { getTenant } from "@/products/coldchain/tenants";
import { runReplay } from "@/products/coldchain/replay";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ customer: string }> }) {
  const { customer } = await params;
  const tenant = getTenant(customer);
  if (!tenant) return Response.json({ ok: false, error: `Unknown customer: ${customer}` }, { status: 404 });
  try {
    return Response.json({ ok: true, ...runReplay(tenant) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
