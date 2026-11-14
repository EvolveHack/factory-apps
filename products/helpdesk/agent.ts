// Runs one chat turn for one customer: shared base plus that customer's files.
import { generateText, isStepCount, type ModelMessage } from "ai";
import { baseTools, buildInstructions, MODEL } from "./base";
import type { Tenant } from "./tenants";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ChatReply {
  reply: string;
  tools: string[];
}

export function agentTools(tenant: Tenant) {
  return { ...baseTools(tenant.id), ...tenant.features.tools };
}

export async function runChat(tenant: Tenant, history: ChatTurn[]): Promise<ChatReply> {
  const messages: ModelMessage[] = history.slice(-20).map((m) => ({ role: m.role, content: m.content }));
  const result = await generateText({
    model: MODEL,
    instructions: buildInstructions(tenant.config, tenant.features.rules),
    messages,
    tools: agentTools(tenant),
    stopWhen: isStepCount(5),
  });
  const tools = [...new Set(result.steps.flatMap((s) => s.toolCalls.map((c) => c.toolName)))];
  return { reply: result.text, tools };
}
