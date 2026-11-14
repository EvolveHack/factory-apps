// Features for this customer only. Shared code reads these three slots.
import { tool, type ToolSet } from "ai";
import { z } from "zod";
import { getStatusPage } from "../../data";

// tools: extra tools this customer's agent can call. They show up in "How this agent works".
// checkStatusPage reads the live status page on every call, so replies follow the latest update.
export const tools: ToolSet = {
  checkStatusPage: tool({
    description:
      "Check the Lumen Analytics status page for the overall status, component status, and current incidents with their latest update text.",
    inputSchema: z.object({}),
    execute: async () => getStatusPage("lumen"),
  }),
};

// rules: extra instructions for this customer's agent, one plain sentence each.
export const rules: string[] = [
  "When someone asks about an outage, slowness, an incident, or something being down, call checkStatusPage first and never answer from memory.",
  "Answer with what the status page says: the overall status, each affected component, and the latest update text of each open incident quoted word for word, including the next update time.",
  "If the status page shows no open incidents, say that all systems are operational according to the status page.",
];

// ExtraPanel: an extra card shown under "How this agent works". Return null for none.
export function ExtraPanel() {
  return null;
}
