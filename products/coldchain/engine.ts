// Alert engine. Pure TypeScript: no React, no Node APIs, no network.
// It runs sensor readings through one customer's alert rules and returns the alerts and pages.

/** One sensor reading for one freezer unit, taken once per minute. */
export interface Reading {
  unitId: string;
  /** Minutes since the start of the shift (or of the replay). */
  minute: number;
  tempC: number;
  doorOpen: boolean;
  /** True while the unit runs its defrost cycle. */
  defrosting: boolean;
}

/** What a rule returns when it fires. */
export interface AlertHit {
  message: string;
}

export interface AlertRule {
  id: string;
  name: string;
  /** `history` holds this unit's earlier readings, oldest first. It does not include `reading`. */
  check: (reading: Reading, history: Reading[]) => AlertHit | null;
  /** True sends a message to the on-shift lead's pager when the rule fires. */
  page?: boolean;
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  unitId: string;
  minute: number;
  message: string;
  paged: boolean;
}

/** Number of minutes in a row, ending with `reading`, where `test` holds. */
export function streak(reading: Reading, history: Reading[], test: (r: Reading) => boolean): number {
  if (!test(reading)) return 0;
  let count = 1;
  for (let i = history.length - 1; i >= 0 && test(history[i]); i--) count++;
  return count;
}

/** How many past readings per unit the engine keeps for rules to read. */
const HISTORY_LIMIT = 240;

/**
 * A running engine. Feed it each minute's readings with `push`.
 * A rule fires once when its check starts to return a hit for a unit, and can fire again
 * only after the check returns null for that unit.
 */
export function createEngine(rules: AlertRule[]) {
  const history = new Map<string, Reading[]>();
  const active = new Set<string>();

  function push(readings: Reading[]): Alert[] {
    const fired: Alert[] = [];
    for (const reading of readings) {
      const past = history.get(reading.unitId) ?? [];
      for (const rule of rules) {
        const key = `${rule.id}:${reading.unitId}`;
        const hit = rule.check(reading, past);
        if (!hit) {
          active.delete(key);
          continue;
        }
        if (active.has(key)) continue;
        active.add(key);
        fired.push({
          id: `${key}:${reading.minute}`,
          ruleId: rule.id,
          ruleName: rule.name,
          unitId: reading.unitId,
          minute: reading.minute,
          message: hit.message,
          paged: rule.page === true,
        });
      }
      past.push(reading);
      if (past.length > HISTORY_LIMIT) past.shift();
      history.set(reading.unitId, past);
    }
    return fired;
  }

  return { push };
}

/** Runs a full list of minutes through the rules. Each entry is one minute's readings. */
export function runAll(rules: AlertRule[], minutes: Reading[][]): Alert[] {
  const engine = createEngine(rules);
  return minutes.flatMap((readings) => engine.push(readings));
}
