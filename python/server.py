import base64
import requests
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("CivicAPI Elections")
BASE_URL = "https://civicapi.org/api/v2"


def _build_params(**kwargs: str | int | bool | None) -> dict[str, str]:
    params: dict[str, str] = {}
    for key, value in kwargs.items():
        if value is None or value is False:
            continue
        if value is True:
            params[key] = ""
        else:
            params[key] = str(value)
    return params


def _request(path: str, params: dict[str, str] | None = None) -> dict | str:
    response = requests.get(f"{BASE_URL}{path}", params=params, timeout=120)
    response.raise_for_status()
    content_type = response.headers.get("content-type", "")

    if "application/json" in content_type:
        return response.json()

    if "image/" in content_type:
        return {
            "_content_type": content_type,
            "_body_base64": base64.b64encode(response.content).decode("ascii"),
        }

    return {"_content_type": content_type, "_body": response.text}


@mcp.tool()
def search_races(
    query: str | None = None,
    country: str | None = None,
    province: str | None = None,
    district: str | None = None,
    election_type: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    limit: int | None = None,
) -> dict | str:
    """
    Search races by name, country, province, district, election type, and date range.
    At least one filter is required. Dates use YYYY-MM-DD. Country uses ISO 3166-1
    alpha-2 (US) or alpha-3 for limited-recognition states (USA). Default limit is 20.
    """
    params = _build_params(
        query=query,
        country=country,
        province=province,
        district=district,
        election_type=election_type,
        startDate=start_date,
        endDate=end_date,
        limit=limit,
    )
    if not params:
        raise ValueError(
            "At least one parameter is required: query, country, province, district, "
            "election_type, start_date, end_date, or limit."
        )
    return _request("/race/search", params)


@mcp.tool()
def get_race_by_id(
    race_id: str,
    generate_map: bool = False,
    generate_map_png: bool = False,
    testdata: bool = False,
    data: str | None = None,
    embed: bool = False,
    precinct: bool = False,
    format: str | None = None,
) -> dict | str:
    """
    Fetch full results for a single race. Optional flags: generate_map (SVG),
    generate_map_png, testdata, embed, precinct. data can be 'json' or 'csv'.
    format customizes map output (e.g. percentage, raw).
    """
    params = _build_params(
        generateMap=generate_map,
        generateMapPNG=generate_map_png,
        testdata=testdata,
        data=data,
        embed=embed,
        precinct=precinct,
        format=format,
    )
    return _request(f"/race/{race_id}", params or None)


@mcp.tool()
def get_race_history(
    race_id: str,
    timestamp: str | None = None,
    generate_map: bool = False,
    generate_map_png: bool = False,
    light: bool = False,
    precinct: bool = False,
) -> dict | str:
    """
    List historical snapshots for a race, or fetch a snapshot at a specific timestamp.
    Timestamps are UTC (YYYY-MM-DDTHH:MM:SS.sssZ). History is available for races
    tracked after October 9, 2025.
    """
    path = f"/race/{race_id}/history"
    if timestamp:
        path = f"{path}/{timestamp}"

    params = _build_params(
        generateMap=generate_map,
        generateMapPNG=generate_map_png,
        light=light,
        precinct=precinct,
    )
    return _request(path, params or None)


@mcp.tool()
def get_election_dates(
    year: int | None = None,
    country: str | None = None,
    province: str | None = None,
) -> dict | str:
    """
    List past and current election dates for a year. Year defaults to the current year.
    Filter by country (ISO alpha-2) or province (e.g. AL, JP-06).
    """
    params = _build_params(year=year, country=country, province=province)
    return _request("/getElectionDates", params or None)


@mcp.tool()
def get_election_years() -> dict | str:
    """List all election years available in civicAPI."""
    return _request("/getElectionYears")


@mcp.tool()
def get_api_status() -> dict | str:
    """Check civicAPI service health and availability."""
    return _request("/status")


if __name__ == "__main__":
    mcp.run()
