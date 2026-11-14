// Seeded freezer simulator. Same seed, same readings, so screenshots compare cleanly.
// Each call to `step` moves the clock one minute and returns one reading per unit.
// Units follow their device settings from setpoints.json: setpoint, defrost times, and defrost limit.

import type { Reading } from "./engine";
import type { SimEvent, UnitSetpoint } from "./types";

/** Small seeded random number generator (mulberry32). */
export function seededRandom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedFrom(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** "06:30" to minutes after midnight. */
export function clockToMinutes(clock: string): number {
  const [h, m] = clock.split(":").map(Number);
  return h * 60 + m;
}

/** Minutes after midnight to "06:30". */
export function minutesToClock(total: number): string {
  const day = ((Math.round(total) % 1440) + 1440) % 1440;
  return `${String(Math.floor(day / 60)).padStart(2, "0")}:${String(day % 60).padStart(2, "0")}`;
}

export function isDefrosting(setpoint: UnitSetpoint, minuteOfDay: number): boolean {
  const day = ((minuteOfDay % 1440) + 1440) % 1440;
  return setpoint.defrostTimes.some((time) => {
    const start = clockToMinutes(time);
    const since = (day - start + 1440) % 1440;
    return since < setpoint.defrostMinutes;
  });
}

interface UnitState {
  tempC: number;
  doorLeft: number;
  driftLeft: number;
}

const DOOR_CHANCE = 1 / 110;
const DRIFT_CHANCE = 1 / 1800;
const DOOR_WARM_PER_MIN = 0.65;
const DRIFT_WARM_PER_MIN = 0.3;
const DEFROST_WARM_PER_MIN = 0.6;

export interface SimulatorOptions {
  seed: number;
  /** Clock time of minute 0, as minutes after midnight. */
  startMinuteOfDay: number;
  setpoints: Record<string, UnitSetpoint>;
  unitIds: string[];
  /** Planned events, so a demo or a replay always shows a door left open and a slow drift. */
  events?: SimEvent[];
}

export function createSimulator(options: SimulatorOptions) {
  const random = seededRandom(options.seed);
  const events = options.events ?? [];
  const state = new Map<string, UnitState>();
  for (const id of options.unitIds) {
    state.set(id, { tempC: options.setpoints[id].setpointC + (random() - 0.5) * 0.6, doorLeft: 0, driftLeft: 0 });
  }
  let minute = 0;

  function step(): Reading[] {
    const readings: Reading[] = [];
    for (const unitId of options.unitIds) {
      const setpoint = options.setpoints[unitId];
      const s = state.get(unitId)!;
      for (const event of events) {
        if (event.unitId !== unitId || event.minute !== minute) continue;
        if (event.kind === "door") s.doorLeft = event.minutes;
        else s.driftLeft = event.minutes;
      }
      if (s.doorLeft === 0 && random() < DOOR_CHANCE) s.doorLeft = 1 + Math.floor(random() * 2);
      if (s.driftLeft === 0 && random() < DRIFT_CHANCE) s.driftLeft = 15 + Math.floor(random() * 15);

      const defrosting = isDefrosting(setpoint, options.startMinuteOfDay + minute);
      const doorOpen = s.doorLeft > 0;
      const noise = (random() - 0.5) * 0.3;

      if (doorOpen) {
        s.tempC += DOOR_WARM_PER_MIN;
      } else if (s.driftLeft > 0) {
        s.tempC += DRIFT_WARM_PER_MIN;
      } else if (defrosting) {
        s.tempC = Math.min(s.tempC + DEFROST_WARM_PER_MIN, setpoint.defrostLimitC);
      } else {
        s.tempC += (setpoint.setpointC - s.tempC) * 0.25;
      }
      s.tempC = Math.min(s.tempC, 8);
      if (s.doorLeft > 0) s.doorLeft--;
      if (s.driftLeft > 0) s.driftLeft--;

      readings.push({
        unitId,
        minute,
        tempC: Math.round((s.tempC + noise) * 10) / 10,
        doorOpen,
        defrosting,
      });
    }
    minute++;
    return readings;
  }

  return { step };
}
