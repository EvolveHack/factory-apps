// Runs yesterday's readings for one customer through that customer's alert rules.
import { runAll, type Reading } from "./engine";
import { clockToMinutes, minutesToClock } from "./simulator";
import { pageText } from "./tenants";
import type { Tenant } from "./types";
import freshfareReplay from "./replay/freshfare.json";
import northgateReplay from "./replay/northgate.json";

interface ReplayFile {
  customer: string;
  label: string;
  startClock: string;
  minutes: number;
  units: Record<string, { tempC: number[]; doorOpen: string; defrosting: string }>;
}

const REPLAYS: Record<string, ReplayFile> = {
  freshfare: freshfareReplay,
  northgate: northgateReplay,
};

export function replayMinutes(file: ReplayFile): Reading[][] {
  const minutes: Reading[][] = [];
  for (let minute = 0; minute < file.minutes; minute++) {
    minutes.push(
      Object.entries(file.units).map(([unitId, u]) => ({
        unitId,
        minute,
        tempC: u.tempC[minute],
        doorOpen: u.doorOpen[minute] === "1",
        defrosting: u.defrosting[minute] === "1",
      })),
    );
  }
  return minutes;
}

export function runReplay(tenant: Tenant) {
  const file = REPLAYS[tenant.id];
  if (!file) throw new Error(`No replay data for ${tenant.id}`);
  const start = clockToMinutes(file.startClock);
  const alerts = runAll(tenant.alerts, replayMinutes(file)).map((a) => ({
    ...a,
    clock: minutesToClock(start + a.minute),
  }));
  const pages = alerts
    .filter((a) => a.paged)
    .map((a) => ({
      alertId: a.id,
      clock: a.clock,
      to: tenant.config.shiftLead.name,
      text: pageText(tenant.config, a.unitId, a.message),
    }));
  return {
    customer: tenant.id,
    label: file.label,
    units: Object.keys(file.units).length,
    minutes: file.minutes,
    readings: Object.keys(file.units).length * file.minutes,
    rules: tenant.alerts.map((r) => ({ id: r.id, name: r.name, page: r.page === true })),
    alerts,
    pages,
  };
}
