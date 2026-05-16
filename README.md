# encoding-mcp

[![npm](https://img.shields.io/npm/v/@mukundakatta/encoding-mcp.svg)](https://www.npmjs.com/package/@mukundakatta/encoding-mcp)
[![mcp](https://img.shields.io/badge/protocol-MCP-blue.svg)](https://modelcontextprotocol.io)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

MCP server: encode and decode text in three common formats — HTML entities,
URL percent-encoding, and JavaScript `\uXXXX` Unicode escapes. No deps.

## Tool

### `transform`

```json
{ "text": "<b>hi</b>", "flavor": "html", "op": "encode" }
```

→ `{ "result": "&lt;b&gt;hi&lt;/b&gt;" }`

| flavor   | encode → | decode ← |
|----------|----------|----------|
| html     | `<a>` → `&lt;a&gt;`, `©` → `&copy;`, non-ASCII → `&#NNN;`  | named + decimal + hex entities |
| url      | `a b` → `a%20b` (encodeURIComponent)                       | percent-decoding |
| unicode  | `héllo` → `héllo`                                     | `\uXXXX` sequences |

## Configure

```json
{ "mcpServers": { "encoding": { "command": "npx", "args": ["-y", "@mukundakatta/encoding-mcp"] } } }
```

## License

MIT.
