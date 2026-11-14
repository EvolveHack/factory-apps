# Order Flows test ids

| data-testid | Where | Extra attributes |
|---|---|---|
| `orders-board` | Page root | `data-customer` |
| `company-name` | Header company name | |
| `connected-systems` | Connected systems strip | |
| `system-accounting`, `system-warehouse`, `system-email` | One connected system | `data-connected` = `true` or `false` |
| `live-orders` | Live orders column | |
| `order-row` | One order | `data-order-id`, `data-status` (`placed`, `packed`, `shipped`), `data-total` |
| `order-status` | Status pill on an order | |
| `order-total` | Order total | |
| `order-margin` | Order margin (only when `showMargin` is on) | |
| `workflows` | Workflows column | |
| `workflows-list` | List of workflows | |
| `workflow-row` | One workflow | `data-workflow-id` |
| `test-order-button` | Send a test order button | |
| `test-order-result` | Summary after a test order | `data-ok` = `true` or `false` |
| `test-order-error` | Shown when the test order request fails | |
| `workflow-error` | One workflow that threw | `data-workflow-id` |
| `team-chat` | Team chat column | |
| `channel-filter-<name>` | Channel filter button: `all`, each channel, `email` | |
| `chat-feed` | List of chat messages, newest first | |
| `chat-message` | One chat message | `data-channel`, `data-workflow-id`, `data-order-id`, `data-test` = `true` for test orders |
| `chat-text` | Text of a chat message | |

API: `GET` or `POST /orders/<customer>/api/test-order` returns `{ ok, customer, order, workflows, messages, errors, runs }`.
