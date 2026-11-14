// Features for this customer only. Shared code reads these three slots.
import { tool, type ToolSet } from "ai";
import { z } from "zod";
import { getStatusPage } from "../../data";

// tools: extra tools this customer's agent can call. They show up in "How this agent works".
export const tools: ToolSet = {
  checkStatusPage: tool({
    description:
      "Check the Lumen Analytics status page for the overall status, each component's status, and current incidents and outages.",
    inputSchema: z.object({}),
    execute: async () => getStatusPage("lumen"),
  }),
};

// rules: extra instructions for this customer's agent, one plain sentence each.
export const rules: string[] = [
  "When someone asks about an outage, slowness, errors across the service, or whether something is down, call checkStatusPage and answer only with what it says: the overall status, the affected parts, the incident status, the latest update, and the next update time.",
  "If the status page shows no incident for what the visitor asks about, say the status page shows it as operational and offer to open a ticket.",
];

// ExtraPanel: an extra card shown under "How this agent works". Return null for none.
export function ExtraPanel() {
  return null;
}
