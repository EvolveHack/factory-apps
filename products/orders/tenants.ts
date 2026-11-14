// Static import map: one entry per customer. Shared code reads tenants only through this file.
import type { Tenant, TenantConfig, TenantFlags } from "./types";
import graniteConfig from "./tenants/granite/config.json";
import graniteFlags from "./tenants/granite/flags.json";
import { workflows as graniteWorkflows } from "./tenants/granite/features";
import bluewaterConfig from "./tenants/bluewater/config.json";
import bluewaterFlags from "./tenants/bluewater/flags.json";
import { workflows as bluewaterWorkflows } from "./tenants/bluewater/features";

export const TENANTS = {
  granite: { config: graniteConfig as TenantConfig, flags: graniteFlags as TenantFlags, workflows: graniteWorkflows },
  bluewater: { config: bluewaterConfig as TenantConfig, flags: bluewaterFlags as TenantFlags, workflows: bluewaterWorkflows },
} satisfies Record<string, Tenant>;

export type OrdersCustomer = keyof typeof TENANTS;

export function isOrdersCustomer(id: string): id is OrdersCustomer {
  return Object.prototype.hasOwnProperty.call(TENANTS, id);
}
