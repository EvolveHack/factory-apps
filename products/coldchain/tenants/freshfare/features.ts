// Alert rules for this customer only. The engine runs every rule on every reading, once a minute.
// Add a new alert by adding one rule to this list. Set `page: true` to message the shift lead.
import { streak, type AlertRule } from "../../engine";

export const alerts: AlertRule[] = [
  {
    id: "warm-10-min",
    name: "Too warm for 10 minutes",
    check: (reading, history) =>
      streak(reading, history, (r) => r.tempC > -15 && !r.defrosting) >= 10
        ? { message: `Above -15 C for 10 minutes. Now ${reading.tempC.toFixed(1)} C.` }
        : null,
  },
];
