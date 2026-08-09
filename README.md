# civicAPI MCP Server

Model Context Protocol (MCP) server for [civicAPI](https://civicapi.org) - live and historical US election results . No API keys or authentication required.

## Hosted MCP (Vercel)

Production: **https://civicapi-mcp.vercel.app/mcp**

Use **Streamable HTTP** transport (not stdio).

### Cursor

```json
{
  "mcpServers": {
    "civic-api-hosted": {
      "url": "https://civicapi-mcp.vercel.app/mcp"
    }
  }
}
```

### Zed

```json
"civic-api-hosted": {
  "enabled": true,
  "url": "https://civicapi-mcp.vercel.app/mcp"
}
```

## Local stdio MCP (Python)

Clone the project, then:

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
  "args": ["/absolute/path/to/civicapi-mcp/python/server.py"]
}
```

## Tools

| Tool | civicAPI endpoint |
|------|-------------------|
| `search_races` | `GET /api/v2/race/search` |
| `get_race_by_id` | `GET /api/v2/race/{raceid}` |
| `get_race_history` | `GET /api/v2/race/{raceid}/history` or `/history/{timestamp}` |
| `get_election_dates` | `GET /api/v2/getElectionDates` |
| `get_election_years` | `GET /api/v2/getElectionYears` |
| `get_api_status` | `GET /api/v2/status` |

### `search_races`

Search by name, country, province, district, election type, and date range. At least one filter is required.

- `query` — race name (slow alone; prefer geographic/date filters)
- `country` — ISO 3166-1 alpha-2 (`US`) or alpha-3 for limited-recognition states (`USA`)
- `province` — e.g. `AL`, `JP-07`
- `district` — English district name
- `election_type`
- `start_date` / `end_date` — `YYYY-MM-DD`
- `limit` — default 20, max 50000

### `get_race_by_id`

Full race payload. Optional flags:

- `generate_map` / `generate_map_png` — rendered map (SVG or PNG)
- `testdata` — random test data
- `data` — `json` or `csv`
- `embed` — embed iframe JSON
- `precinct` — include precinct-level results
- `format` — map style (`percentage`, `raw`, etc.)

Non-JSON responses (CSV, SVG, PNG) are returned with `_content_type` and `_body` or `_body_base64`.

### `get_race_history`

Historical snapshots for timeline/progression views. Data available for races tracked after October 9, 2025.

- Omit `timestamp` to list available UTC timestamps
- Set `timestamp` (`YYYY-MM-DDTHH:MM:SS.sssZ`) for a full snapshot
- Optional: `generate_map`, `generate_map_png`, `light`, `precinct`

### `get_election_dates`

Election dates for a year (defaults to current year). Optional `country` and `province` filters.

### `get_election_years`

All election years in the database.

### `get_api_status`

Service health check (`{"status":"ok"}` when available).


## Attribution

civicAPI requires attribution for non-personal projects. Link to [civicapi.org](https://civicapi.org) or mention civicAPI in your project.

## License

MIT
