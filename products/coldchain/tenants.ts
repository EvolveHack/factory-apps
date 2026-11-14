// Static import map: one entry per customer. Shared code reads customers only through this file.
import type { Tenant, TenantConfig, TenantFlags, TenantSetpoints, Unit } from "./types";

import freshfareConfig from "./tenants/freshfare/config.json";
import freshfareSetpoints from "./tenants/freshfare/setpoints.json";
import freshfareFlags from "./tenants/freshfare/flags.json";
import { alerts as freshfareAlerts } from "./tenants/freshfare/features";

import northgateConfig from "./tenants/northgate/config.json";
import northgateSetpoints from "./tenants/northgate/setpoints.json";
import northgateFlags from "./tenants/northgate/flags.json";
import { alerts as northgateAlerts } from "./tenants/northgate/features";

export const TENANTS: Record<string, Tenant> = {
  freshfare: {
    id: "freshfare",
    config: freshfareConfig as TenantConfig,
    setpoints: freshfareSetpoints as TenantSetpoints,
    flags: freshfareFlags as TenantFlags,
    alerts: freshfareAlerts,
  },
  northgate: {
    id: "northgate",
    config: northgateConfig as TenantConfig,
    setpoints: northgateSetpoints as TenantSetpoints,
    flags: northgateFlags as TenantFlags,
    alerts: northgateAlerts,
  },
};

export function getTenant(id: string): Tenant | null {
  return Object.hasOwn(TENANTS, id) ? TENANTS[id] : null;
}

export function allUnits(config: TenantConfig): (Unit & { siteName: string })[] {
  return config.sites.flatMap((site) => site.units.map((unit) => ({ ...unit, siteName: site.name })));
}

/** Text the shift lead pager shows for an alert. Shared by the live page and the replay API. */
export function pageText(config: TenantConfig, unitId: string, message: string): string {
  const unit = allUnits(config).find((u) => u.id === unitId);
  return unit ? `${unit.name}, ${unit.siteName}: ${message}` : `${unitId}: ${message}`;
}
