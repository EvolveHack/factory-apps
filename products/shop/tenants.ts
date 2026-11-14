// Static import map: one entry per retailer. Add nothing else here.
import type { ShopCustomer, Tenant, TenantConfig, Flags } from "./types";
import willowConfig from "./tenants/willow/config.json";
import willowFlags from "./tenants/willow/flags.json";
import * as willowFeatures from "./tenants/willow/features";
import summitConfig from "./tenants/summit/config.json";
import summitFlags from "./tenants/summit/flags.json";
import * as summitFeatures from "./tenants/summit/features";

export const TENANTS: Record<ShopCustomer, Tenant> = {
  willow: { config: willowConfig as TenantConfig, flags: willowFlags as Flags, features: willowFeatures },
  summit: { config: summitConfig as TenantConfig, flags: summitFlags as Flags, features: summitFeatures },
};

export function isShopCustomer(value: string): value is ShopCustomer {
  return value in TENANTS;
}
