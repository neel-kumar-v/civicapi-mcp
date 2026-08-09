import requests
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("CivicAPI Elections")
BASE_URL = "https://civicapi.org/api/v2"


def _get(path: str, params: dict | None = None) -> dict:
    response = requests.get(f"{BASE_URL}{path}", params=params, timeout=60)
    response.raise_for_status()
    return response.json()


@mcp.tool()
def search_elections(
    query: str | None = None,
    type: str | None = None,
    province: str | None = None,
    district: str | None = None,
    country: str | None = None,
    election_type: str | None = None,
    election_date: str | None = None,
) -> dict:
    """
    Search civicAPI for live and historical election races worldwide.
    At least one parameter is required (query, type, province, district,
    country, election_type, or election_date).
  """
    params: dict[str, str] = {}
    if query is not None:
        params["query"] = query
    if type is not None:
        params["type"] = type
    if province is not None:
        params["province"] = province
    if district is not None:
        params["district"] = district
    if country is not None:
        params["country"] = country
    if election_type is not None:
        params["election_type"] = election_type
    if election_date is not None:
        params["election_date"] = election_date

    if not params:
        raise ValueError(
            "At least one search parameter is required: query, type, province, "
            "district, country, election_type, or election_date."
        )

    return _get("/race/search", params)


@mcp.tool()
def get_race_by_id(race_id: str) -> dict:
    """
    Get detailed live or historical race data, vote percentages, and race calls
    for a specific election race using its civicAPI race ID.
    """
    return _get(f"/race/{race_id}")


@mcp.tool()
def get_api_status() -> dict:
    """Check civicAPI service health and availability."""
    return _get("/status")


if __name__ == "__main__":
    mcp.run()
