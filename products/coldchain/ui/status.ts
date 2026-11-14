import type { Reading } from "../engine";
import type { UnitSetpoint } from "../types";

export type UnitStatus = "ok" | "defrost" | "door" | "warming" | "alarm";

export function unitStatus(r: Reading | undefined, setpoint: UnitSetpoint): UnitStatus {
  if (!r) return "ok";
  if (r.tempC > -15 && !r.defrosting) return "alarm";
  if (r.doorOpen) return "door";
  if (r.defrosting) return "defrost";
  if (r.tempC > setpoint.setpointC + 3) return "warming";
  return "ok";
}

export const STATUS_LABEL: Record<UnitStatus, string> = {
  ok: "Normal",
  defrost: "Defrost",
  door: "Door open",
  warming: "Warming",
  alarm: "Too warm",
};

export const STATUS_COLOR: Record<UnitStatus, string> = {
  ok: "#22c55e",
  defrost: "#38bdf8",
  door: "#f59e0b",
  warming: "#f59e0b",
  alarm: "#ef4444",
};
