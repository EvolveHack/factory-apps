// Bluewater Distributors' workflows. Add a new workflow to this list to turn it on for Bluewater Distributors only.
// Each workflow runs when an order reaches its trigger: "placed", "packed", or "shipped".
import type { Workflow } from "../../types";

export const workflows: Workflow[] = [
  {
    id: "post-placed-orders",
    name: "Share new orders",
    trigger: "placed",
    action: "Post to #orders",
    when: () => true,
    run: (order, ctx) => ctx.post("orders", `New order ${order.id} from ${order.customer}: ${ctx.money(order.total)}`),
  },
];
