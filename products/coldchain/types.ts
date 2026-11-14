import type { AlertRule } from "./engine";

export interface Unit {
  id: string;
  name: string;
}

export interface Site {
  id: string;
  name: string;
  units: Unit[];
}

/** A planned event in the live simulator, so the demo shows a door left open and a slow drift. */
export interface SimEvent {
  unitId: string;
  minute: number;
  kind: "door" | "drift";
  minutes: number;
}

/** config.json */
export interface TenantConfig {
  name: string;
  accent: string;
  shiftLead: { name: string; phone: string };
  /** Clock time the live simulator starts at, like "06:00". */
  shiftStart: string;
  sites: Site[];
  simEvents: SimEvent[];
}

/** One unit in setpoints.json. This is device control: it changes how the freezer runs. */
export interface UnitSetpoint {
  setpointC: number;
  /** Clock times the defrost cycle starts, like "02:00". */
  defrostTimes: string[];
  defrostMinutes: number;
  /** Highest air temperature allowed during defrost. */
  defrostLimitC: number;
}

/** setpoints.json */
export interface TenantSetpoints {
  units: Record<string, UnitSetpoint>;
}

/** flags.json */
export interface TenantFlags {
  /** Show the shift lead pager panel. */
  pager: boolean;
}

export interface Tenant {
  id: string;
  config: TenantConfig;
  alerts: AlertRule[];
  setpoints: TenantSetpoints;
  flags: TenantFlags;
}
