// Shared types for Order Flows. Tenant files import from here.

export type OrderStatus = "placed" | "packed" | "shipped";

export interface OrderLine {
  sku: string;
  name: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  /** The distributor's buyer, for example a contractor or a restaurant. */
  customer: string;
  items: OrderLine[];
  /** Order total in dollars. */
  total: number;
  /** What the goods cost the distributor, in dollars. */
  cost: number;
  /** Margin as a percent of the total, for example 23.5. */
  margin: number;
  status: OrderStatus;
}

/** What a workflow can do. Nothing here leaves the app. */
export interface WorkflowContext {
  /** Post a message to one of this customer's team chat channels, for example "big-orders". */
  post(channel: string, text: string): void;
  /** Show an email on screen. It is never sent. */
  notify(to: string, subject: string): void;
  /** Format dollars, for example 5,420.00 becomes "$5,420". */
  money(amount: number): string;
}

export interface Workflow {
  id: string;
  name: string;
  trigger: OrderStatus;
  /** Plain sentence shown on the Workflows list, for example "Post to #big-orders". */
  action: string;
  when(order: Order): boolean;
  run(order: Order, ctx: WorkflowContext): void;
}

export interface ChatMessage {
  id: string;
  /** A channel name like "orders", or "email" for a notify() call. */
  channel: string;
  text: string;
  workflowId: string;
  orderId: string;
  /** True when the message came from the Send a test order button. */
  test?: boolean;
}

export interface WorkflowRun {
  workflowId: string;
  trigger: OrderStatus;
  matched: boolean;
  ok: boolean;
}

export interface WorkflowError {
  workflowId: string;
  trigger: OrderStatus;
  orderId: string;
  message: string;
}

export interface CatalogItem {
  sku: string;
  name: string;
  price: number;
  unitCost: number;
  maxQty: number;
}

export interface TenantConfig {
  company: string;
  industry: string;
  /** Short prefix for order numbers, for example "GS". */
  orderPrefix: string;
  accent: string;
  channels: string[];
  systems: { accounting: boolean; warehouse: boolean; email: boolean };
  buyers: string[];
  catalog: CatalogItem[];
}

export interface TenantFlags {
  showMargin: boolean;
}

export interface Tenant {
  config: TenantConfig;
  flags: TenantFlags;
  workflows: Workflow[];
}
