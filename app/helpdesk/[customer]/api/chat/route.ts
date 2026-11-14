import { runChat, type ChatTurn } from "@/products/helpdesk/agent";
import { getTenant } from "@/products/helpdesk/tenants";

export const maxDuration = 60;

export async function POST(req: Request, { params }: { params: Promise<{ customer: string }> }) {
  const { customer } = await params;
  const tenant = getTenant(customer);
  if (!tenant) return Response.json({ error: "Unknown customer." }, { status: 404 });

  const body = (await req.json().catch(() => null)) as { messages?: ChatTurn[] } | null;
  const messages = (body?.messages ?? []).filter(
    (m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim(),
  );
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return Response.json({ error: "Send at least one visitor message." }, { status: 400 });
  }

  try {
    return Response.json(await runChat(tenant, messages));
  } catch (err) {
    console.error("helpdesk chat failed", err);
    return Response.json({ error: "The agent could not answer. Please try again." }, { status: 502 });
  }
}
