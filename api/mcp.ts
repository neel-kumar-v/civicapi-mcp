import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

const BASE_URL = "https://civicapi.org/api/v2";

async function civicGet(path: string, params?: Record<string, string>) {
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

  return response.json();
}

function asText(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

const searchParams = {
  query: z.string().optional().describe("Search query for election name or keywords"),
  type: z.string().optional().describe("Race type filter"),
  province: z.string().optional(),
  district: z.string().optional(),
  country: z.string().optional(),
  election_type: z.string().optional(),
  election_date: z.string().optional(),
};

const handler = createMcpHandler(
  (server) => {
    server.tool(
      "search_elections",
      "Search civicAPI for live and historical election races worldwide. At least one parameter is required.",
      searchParams,
      async (params) => {
        const filtered: Record<string, string> = {};
        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined) {
            filtered[key] = value;
          }
        }

        if (Object.keys(filtered).length === 0) {
          throw new Error(
            "At least one search parameter is required: query, type, province, district, country, election_type, or election_date.",
          );
        }

        return asText(await civicGet("/race/search", filtered));
      },
    );

    server.tool(
      "get_race_by_id",
      "Get detailed live or historical race data, vote percentages, and race calls for a specific race ID.",
      { race_id: z.string().describe("civicAPI race ID") },
      async ({ race_id }) => asText(await civicGet(`/race/${race_id}`)),
    );

    server.tool(
      "get_api_status",
      "Check civicAPI service health and availability.",
      {},
      async () => asText(await civicGet("/status")),
    );
  },
  {},
  {
    streamableHttpEndpoint: "/mcp",
    sessionIdGenerator: undefined,
    disableSse: true,
  },
);

export { handler as GET, handler as POST, handler as DELETE };
