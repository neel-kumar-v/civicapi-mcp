# civicAPI MCP Server

Model Context Protocol (MCP) server for [civicAPI](https://civicapi.org) — live and historical election results worldwide. No API keys required.

Wraps the civicAPI v2 endpoints:

| Tool | civicAPI endpoint |
|------|-------------------|
| `search_elections` | `GET /api/v2/race/search` |
| `get_race_by_id` | `GET /api/v2/race/{id}` |
| `get_api_status` | `GET /api/v2/status` |

## Hosted MCP (Vercel)

After deploying to Vercel, connect clients to:

Production deployment: **https://civicapi-mcp.vercel.app/mcp**

Use **Streamable HTTP** transport (not stdio).

### Cursor

Add to `~/.cursor/mcp.json` (or project `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "civic-api": {
      "url": "https://civicapi-mcp.vercel.app/mcp"
    }
  }
}
```

### Zed

Add to `context_servers` in Zed settings:

```json
"civic-api": {
  "enabled": true,
  "url": "https://civicapi-mcp.vercel.app/mcp"
}
```

## Local stdio MCP (Python)

For Claude Desktop, Cursor, or Zed with a local process:

```bash
pip install -r python/requirements.txt
python python/server.py
```

### Cursor (local)

```json
{
  "mcpServers": {
    "civic-api": {
      "command": "python",
      "args": ["/absolute/path/to/civicapi-mcp/python/server.py"]
    }
  }
}
```

### Zed (local)

```json
"civic-api": {
  "enabled": true,
  "remote": false,
  "command": "python",
  "args": ["/absolute/path/to/civicapi-mcp/server.py"]
}
```

## Development

### Hosted server (TypeScript / Vercel)

```bash
npm install
npm run dev
```

MCP endpoint: `http://localhost:3000/mcp`

### Python server

```bash
pip install -r python/requirements.txt
python python/server.py
```

## Deploy to Vercel

```bash
npm install
vercel
```

Or connect this repository in the [Vercel dashboard](https://vercel.com/new). The `api/server.ts` function is rewritten to serve `/mcp`.

## Tools

### `search_elections`

Search live and historical races. At least one parameter is required:

- `query` — election name or keywords (e.g. `Canada Federal Election, 2025`)
- `type`, `province`, `district`, `country`, `election_type`, `election_date`

### `get_race_by_id`

Fetch full results for a race by civicAPI race ID (e.g. `3827`).

### `get_api_status`

Health check for civicAPI (`{"status":"ok"}` when available).

## Attribution

civicAPI requires attribution for non-personal projects. Link to [civicapi.org](https://civicapi.org) or mention civicAPI in your project.

## License

MIT
