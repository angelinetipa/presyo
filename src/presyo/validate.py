"""Checks every row before it reaches the database.

Bad data that lands in a table is much harder to fix than bad data that
never got in. Every rejection carries a reason so the run log is useful.
"""

from datetime import date, datetime, timedelta

from presyo import config


def _parse_date(value) -> date | None:
    if isinstance(value, date):
        return value
    try:
        return datetime.strptime(str(value), "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return None


def check_row(row: dict, today: date | None = None) -> str | None:
    """Returns None if the row is good, or a short reason if it is not."""
    today = today or date.today()

    currency = row.get("currency")
    if currency not in config.TRACKED_CURRENCIES:
        return f"untracked currency {currency!r}"

    rate_date = _parse_date(row.get("rate_date"))
    if rate_date is None:
        return "rate_date is missing or malformed"
    if rate_date > today:
        return f"rate_date {rate_date} is in the future"
    if rate_date < today - timedelta(days=config.MAX_STALENESS_DAYS):
        return f"rate_date {rate_date} is stale — the feed may be dead"

    try:
        value = float(row.get("php_per_unit"))
    except (TypeError, ValueError):
        return "php_per_unit is not a number"
    if value <= 0:
        return "php_per_unit must be positive"

    low, high = config.RATE_BANDS[currency]
    if not low <= value <= high:
        return f"{currency} rate {value} outside expected {low}-{high}"

    return None


def split(rows: list[dict], today: date | None = None) -> tuple[list[dict], list[dict]]:
    """Splits rows into (accepted, rejected). Rejected rows keep a reason."""
    accepted: list[dict] = []
    rejected: list[dict] = []
    seen: set[tuple] = set()

    for row in rows:
        reason = check_row(row, today=today)

        key = (row.get("rate_date"), row.get("currency"))
        if reason is None and key in seen:
            reason = "duplicate row in the same batch"

        if reason is None:
            seen.add(key)
            accepted.append(row)
        else:
            rejected.append({**row, "reason": reason})

    return accepted, rejected
