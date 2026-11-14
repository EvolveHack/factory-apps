// Writes yesterday's readings for each customer. Run once: node products/coldchain/replay/generate.mjs
// Seeded, so running it again gives the same files.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { clockToMinutes, createSimulator, seedFrom } from "../simulator.ts";

const here = dirname(fileURLToPath(import.meta.url));
const MINUTES = 240;
const START = "06:00";

// Each replay holds at least one door left open for 5 minutes and one temperature excursion.
const EVENTS = {
  freshfare: [
    { unitId: "ff-elm-3", minute: 35, kind: "door", minutes: 5 },
    { unitId: "ff-maple-1", minute: 90, kind: "drift", minutes: 35 },
    { unitId: "ff-harbor-2", minute: 160, kind: "door", minutes: 7 },
  ],
  northgate: [
    { unitId: "ng-room-2", minute: 50, kind: "door", minutes: 5 },
    { unitId: "ng-seafood", minute: 120, kind: "drift", minutes: 50 },
    { unitId: "ng-dock", minute: 185, kind: "door", minutes: 6 },
  ],
};

for (const customer of Object.keys(EVENTS)) {
  const read = (file) => JSON.parse(readFileSync(join(here, "..", "tenants", customer, file), "utf8"));
  const config = read("config.json");
  const setpoints = read("setpoints.json");
  const unitIds = config.sites.flatMap((s) => s.units.map((u) => u.id));
  const sim = createSimulator({
    seed: seedFrom(`replay:${customer}`),
    startMinuteOfDay: clockToMinutes(START),
    setpoints: setpoints.units,
    unitIds,
    events: EVENTS[customer],
  });
  const units = Object.fromEntries(unitIds.map((id) => [id, { tempC: [], doorOpen: "", defrosting: "" }]));
  for (let m = 0; m < MINUTES; m++) {
    for (const r of sim.step()) {
      const u = units[r.unitId];
      u.tempC.push(r.tempC);
      u.doorOpen += r.doorOpen ? "1" : "0";
      u.defrosting += r.defrosting ? "1" : "0";
    }
  }
  const out = { customer, label: "Yesterday, 06:00 to 10:00", startClock: START, minutes: MINUTES, units };
  writeFileSync(join(here, `${customer}.json`), JSON.stringify(out) + "\n");
  console.log(`wrote replay/${customer}.json (${unitIds.length} units, ${MINUTES} minutes)`);
}
