# Helpdesk Agent test ids

| data-testid | Where | Notes |
|---|---|---|
| `helpdesk-console` | Page root | `data-customer` holds the customer id. |
| `company-name` | Header | "<Company> Support". |
| `chat` | Chat window | |
| `chat-messages` | Message list | |
| `chat-greeting` | First agent message | From `config.json` greeting. |
| `chat-message-user` | Each visitor message | |
| `chat-message-agent` | Each agent reply | Also used for error replies. |
| `chat-tool-used` | Badge under an agent reply | Text is "Used <toolName>". Shown when `showToolBadges` is true. |
| `chat-typing` | Typing dots | Present while the agent is answering. |
| `chat-suggestion` | Suggested question chip | Clicking sends it. |
| `chat-input` | Message box | |
| `chat-send` | Send button | |
| `how-it-works` | Right panel | |
| `tool-item` | Each tool in the panel | `data-tool` holds the tool name. Added tools have an "Added for <company>" badge. |
| `rule-item` | Each rule in the panel | `data-source` is `shared`, `policy`, or `added`. |

Chat API: `POST /helpdesk/<customer>/api/chat` with `{ "messages": [{ "role": "user", "content": "..." }] }`.
Returns `{ "reply": string, "tools": string[] }`.
