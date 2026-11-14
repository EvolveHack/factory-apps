# Cold Chain Monitor test ids

| data-testid | Element | Extra attributes |
|---|---|---|
| `coldchain-customer` | Customer name in the header | |
| `coldchain-clock` | Live simulated clock, like `06:41` | |
| `coldchain-counts` | Normal, check, and too warm counts | |
| `coldchain-map` | Floor map SVG | |
| `coldchain-site` | One site (store or warehouse) on the map | `data-site-id` |
| `coldchain-unit` | One freezer unit on the map | `data-unit-id`, `data-status` (`ok`, `defrost`, `door`, `warming`, `alarm`), `data-door` (`open`, `closed`) |
| `coldchain-unit-temp` | Unit temperature in Celsius | |
| `coldchain-unit-door` | Unit door drawing | |
| `coldchain-alerts` | Alerts list, newest first | |
| `coldchain-alert` | One alert | `data-rule-id`, `data-unit-id` |
| `coldchain-pages` | Shift lead pager list | |
| `coldchain-page` | One pager message | |
| `coldchain-settings` | Device settings table | |
| `coldchain-setting` | One unit's settings row | `data-unit-id` |
| `coldchain-setting-setpoint` | That unit's setpoint | |
| `coldchain-replay-run` | Run replay button | |
| `coldchain-replay-result` | Replay result | |
