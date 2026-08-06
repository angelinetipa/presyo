"""Fetches exchange rates and turns them into 'pesos per 1 unit'."""

from datetime import date, datetime, timezone

import requests

from presyo import config


class SourceError(Exception):
    """The source is down, changed shape, or sent something unusable."""


def fetch_raw() -> dict:
    """Calls the API once and returns the raw JSON."""
    response = requests.get(config.FX_API_URL, timeout=config.REQUEST_TIMEOUT)
    response.raise_for_status()
    payload = response.json()

    if payload.get("result") != "success":
        raise SourceError(f"API did not report success: {payload.get('result')!r}")

    if "rates" not in payload:
        raise SourceError("Response has no 'rates' key — the API shape changed.")

    return payload


def parse_rate_date(payload: dict) -> date:
    """Reads the date the rates belong to, falling back to today (UTC)."""
    stamp = payload.get("time_last_update_unix")
    if not stamp:
        return datetime.now(timezone.utc).date()
    return datetime.fromtimestamp(stamp, tz=timezone.utc).date()


def to_php_rows(payload: dict) -> list[dict]:
    """Converts 'units per USD' into 'pesos per unit' for tracked currencies.

    The API is based on USD, so rates['PHP'] is pesos per 1 USD and
    rates['SAR'] is riyals per 1 USD. Dividing one by the other gives
    pesos per 1 riyal.
    """
    rates = payload["rates"]

    if "PHP" not in rates:
        raise SourceError("Response has no PHP rate — cannot convert.")

    php_per_usd = float(rates["PHP"])
    rate_date = parse_rate_date(payload)
    rows: list[dict] = []

    for currency in config.TRACKED_CURRENCIES:
        if currency not in rates:
            continue

        units_per_usd = float(rates[currency])
        if units_per_usd <= 0:
            continue

        rows.append(
            {
                "rate_date": rate_date.isoformat(),
                "currency": currency,
                "php_per_unit": round(php_per_usd / units_per_usd, 6),
                "source": config.FX_SOURCE_NAME,
            }
        )

    return rows
