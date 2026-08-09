import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

const BASE_URL = "https://civicapi.org/api/v2";

type QueryValue = string | number | boolean | undefined | null;

function buildParams(values: Record<string, QueryValue>): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null || value === false) {
      continue;
    }
    if (value === true) {
      params[key] = "";
    } else {
      params[key] = String(value);
    }
  }
  return params;
}

async function civicRequest(path: string, params?: Record<string, string>) {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`civicAPI request failed (${response.status}): ${body}`);
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  if (contentType.includes("image/")) {
    const buffer = await response.arrayBuffer();
    return {
      _content_type: contentType,
      _body_base64: Buffer.from(buffer).toString("base64"),
    };
  }

  return {
    _content_type: contentType,
    _body: await response.text(),
  };
}

function asText(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

const optionalString = z.string().optional();
const optionalInt = z.number().int().optional();
const optionalBool = z.boolean().optional();

const handler = createMcpHandler(
  (server) => {
    server.tool(
      "search_races",
      "Search races by name, country, province, district, election type, and date range. At least one filter is required.",
      {
        query: optionalString.describe(
          "Race name to search for. Slow without other filters; prefer country/province/dates.",
        ),
        country: optionalString.describe("ISO 3166-1 alpha-2 country code (e.g. US)"),
        province: optionalString.describe("Province code (e.g. AL, JP-07)"),
        district: optionalString.describe("District name in English"),
        election_type: optionalString.describe("Election type filter"),
        start_date: optionalString.describe("Start date filter (YYYY-MM-DD)"),
        end_date: optionalString.describe("End date filter (YYYY-MM-DD)"),
        limit: optionalInt.describe("Max races to return (default 20, max 50000)"),
      },
      async (params) => {
        const queryParams = buildParams({
          query: params.query,
          country: params.country,
          province: params.province,
          district: params.district,
          election_type: params.election_type,
          startDate: params.start_date,
          endDate: params.end_date,
          limit: params.limit,
        });

        if (Object.keys(queryParams).length === 0) {
          throw new Error(
            "At least one parameter is required: query, country, province, district, election_type, start_date, end_date, or limit.",
          );
        }

        return asText(await civicRequest("/race/search", queryParams));
      },
    );

    server.tool(
      "get_race_by_id",
      "Fetch full JSON, CSV, map SVG/PNG, or embed payload for a single race.",
      {
        race_id: z.string().describe("civicAPI race ID"),
        generate_map: optionalBool.describe("Return rendered map SVG (has_map races only)"),
        generate_map_png: optionalBool.describe("Return rendered map PNG"),
        testdata: optionalBool.describe("Return random test data"),
        data: z.enum(["json", "csv"]).optional().describe("Response format (default json)"),
        embed: optionalBool.describe("Return embed iframe JSON"),
        precinct: optionalBool.describe("Include precinct data in region_results"),
        format: optionalString.describe("Map format (e.g. percentage, raw)"),
      },
      async (params) => {
        const queryParams = buildParams({
          generateMap: params.generate_map,
          generateMapPNG: params.generate_map_png,
          testdata: params.testdata,
          data: params.data,
          embed: params.embed,
          precinct: params.precinct,
          format: params.format,
        });

        return asText(
          await civicRequest(
            `/race/${params.race_id}`,
            Object.keys(queryParams).length > 0 ? queryParams : undefined,
          ),
        );
      },
    );

    server.tool(
      "get_race_history",
      "List race history timestamps or fetch a snapshot at a specific UTC timestamp.",
      {
        race_id: z.string().describe("civicAPI race ID"),
        timestamp: optionalString.describe(
          "UTC snapshot timestamp (YYYY-MM-DDTHH:MM:SS.sssZ). Omit to list timestamps.",
        ),
        generate_map: optionalBool.describe("Include map SVG for snapshot"),
        generate_map_png: optionalBool.describe("Include map PNG for snapshot"),
        light: optionalBool.describe("Exclude region_results for lighter payload"),
        precinct: optionalBool.describe("Include precinct results when available"),
      },
      async (params) => {
        const path = params.timestamp
          ? `/race/${params.race_id}/history/${params.timestamp}`
          : `/race/${params.race_id}/history`;

        const queryParams = buildParams({
          generateMap: params.generate_map,
          generateMapPNG: params.generate_map_png,
          light: params.light,
          precinct: params.precinct,
        });

        return asText(
          await civicRequest(
            path,
            Object.keys(queryParams).length > 0 ? queryParams : undefined,
          ),
        );
      },
    );

    server.tool(
      "get_election_dates",
      "List election dates for a year, optionally filtered by country or province.",
      {
        year: optionalInt.describe("Election year (YYYY). Defaults to current year."),
        country: optionalString.describe("ISO country code filter"),
        province: optionalString.describe("Province code filter"),
      },
      async (params) => {
        const queryParams = buildParams({
          year: params.year,
          country: params.country,
          province: params.province,
        });

        return asText(
          await civicRequest(
            "/getElectionDates",
            Object.keys(queryParams).length > 0 ? queryParams : undefined,
          ),
        );
      },
    );

    server.tool(
      "get_election_years",
      "List all election years available in civicAPI.",
      {},
      async () => asText(await civicRequest("/getElectionYears")),
    );

    server.tool(
      "get_api_status",
      "Check civicAPI service health and availability.",
      {},
      async () => asText(await civicRequest("/status")),
    );
  },
  {
    serverInfo: { name: "CivicAPI Elections", version: "1.1.0" },
  },
  {
    streamableHttpEndpoint: "/mcp",
    sessionIdGenerator: undefined,
    disableSse: true,
  },
);

export { handler as GET, handler as POST, handler as DELETE };
