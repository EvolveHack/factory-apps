// Features for this customer only. Shared code reads these three slots. Each one starts empty.
import type { ToolSet } from "ai";

// tools: extra tools this customer's agent can call. They show up in "How this agent works".
// Example:
//   import { tool } from "ai";
//   import { z } from "zod";
//   import { getStatusPage } from "../../data";
//   export const tools: ToolSet = {
//     checkStatusPage: tool({
//       description: "Check the status page for current incidents and outages.",
//       inputSchema: z.object({}),
//       execute: async () => getStatusPage("lumen"),
//     }),
//   };
export const tools: ToolSet = {};

// rules: extra instructions for this customer's agent, one plain sentence each.
// Example: "When someone asks about an outage, call checkStatusPage and answer with what it says."
export const rules: string[] = [];

// ExtraPanel: an extra card shown under "How this agent works". Return null for none.
export function ExtraPanel() {
  return null;
}
