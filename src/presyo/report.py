"""Writes the current state of the pipeline into README.md.

A pipeline nobody can see is indistinguishable from a pipeline that died.
The data is public and the run log is public, but both live in Postgres,
so the only way to check whether this thing still works is to have
credentials. That is a bad answer for a project whose whole claim is
"it runs every day on its own".

So after each run, this rewrites a block in README.md with the latest
rates and the last few runs, and the workflow commits it. The repo page
becomes the status page — no hosting, no frontend, no second service to
keep alive. The commit history doubles as proof of life.

    python -m presyo.report
"""

from datetime import date, datetime, timezone
from pathlib import Path

from presyo import config, db

START = "<!-- PRESYO:START -->"
END = "<!-- PRESYO:END -->"

README = Path(__file__).resolve().parents[2] / "README.md"

RECENT_RUNS = 5
STATUS_ICON = {"success": "PASS", "failed": "FAIL", "running": "...."}


def _fmt_date(value: str) -> str:
    """2026-08-21 -> 21 Aug 2026."""
    try:
        return datetime.strptime(value[:10], "%Y-%m-%d").strftime("%d %b %Y")
    except (ValueError, TypeError):
        return str(value)


def _fmt_time(value: str | None) -> str:
    if not value:
        return "—"
    try:
        cleaned = value.replace("Z", "+00:00")
        return datetime.fromisoformat(cleaned).strftime("%d %b %Y %H:%M UTC")
    except (ValueError, TypeError):
        return str(value)[:16]


def render(latest: list[dict], runs: list[dict], coverage: dict) -> str:
    """Builds the markdown block. Pure — takes data, returns text."""
    lines: list[str] = []

    if not latest:
        lines.append("_No rates loaded yet._")
        return "\n".join(lines)

    rate_date = _fmt_date(str(latest[0]["rate_date"]))

    lines.append(f"**Latest rates — {rate_date}**")
    lines.append("")
    lines.append("| Currency | Pesos per unit |")
    lines.append("|---|---|")
    for row in latest:
        lines.append(f"| {row['currency']} | {float(row['php_per_unit']):.4f} |")

    lines.append("")
    lines.append(
        f"**{coverage['days']} days collected** "
        f"({_fmt_date(coverage['first'])} → {_fmt_date(coverage['last'])}) · "
        f"{coverage['rows']:,} rows"
    )

    if runs:
        lines.append("")
        lines.append("**Recent runs**")
        lines.append("")
        lines.append("| Started | Status | Read | Loaded | Rejected |")
        lines.append("|---|---|---|---|---|")
        for run in runs:
            icon = STATUS_ICON.get(run["status"], run["status"])
            lines.append(
                f"| {_fmt_time(run.get('started_at'))} | {icon} | "
                f"{run.get('rows_read', 0)} | {run.get('rows_loaded', 0)} | "
                f"{run.get('rows_rejected', 0)} |"
            )

    stamp = datetime.now(timezone.utc).strftime("%d %b %Y %H:%M UTC")
    lines.append("")
    lines.append(f"<sub>Updated automatically by the daily workflow · {stamp}</sub>")

    return "\n".join(lines)


def splice(readme: str, block: str) -> str:
    """Replaces whatever sits between the markers. Leaves the rest alone."""
    if START not in readme or END not in readme:
        raise RuntimeError(
            f"README.md is missing the {START} / {END} markers — "
            "add them where the status block should appear."
        )
    head = readme.split(START)[0]
    tail = readme.split(END)[1]
    return f"{head}{START}\n\n{block}\n\n{END}{tail}"


def gather(client) -> tuple[list[dict], list[dict], dict]:
    """Reads what the README needs. One query each, newest first."""
    newest = (
        client.table("fx_rates")
        .select("rate_date")
        .order("rate_date", desc=True)
        .limit(1)
        .execute()
    )
    if not newest.data:
        return [], [], {"days": 0, "rows": 0, "first": "", "last": ""}

    last_date = newest.data[0]["rate_date"]

    latest = (
        client.table("fx_rates")
        .select("currency, php_per_unit")
        .eq("rate_date", last_date)
        .order("currency")
        .execute()
    ).data or []

    runs = (
        client.table("pipeline_runs")
        .select("started_at, status, rows_read, rows_loaded, rows_rejected")
        .eq("pipeline", config.PIPELINE_NAME)
        .order("started_at", desc=True)
        .limit(RECENT_RUNS)
        .execute()
    ).data or []

    all_dates = (
        client.table("fx_rates").select("rate_date").order("rate_date").execute()
    ).data or []
    distinct = sorted({r["rate_date"] for r in all_dates})

    coverage = {
        "days": len(distinct),
        "rows": len(all_dates),
        "first": distinct[0] if distinct else "",
        "last": distinct[-1] if distinct else "",
    }
    return latest, runs, coverage


def main() -> int:
    client = db.get_client()
    latest, runs, coverage = gather(client)

    readme = README.read_text(encoding="utf-8")
    updated = splice(readme, render(latest, runs, coverage))

    if updated == readme:
        print("README already current — nothing to commit.")
        return 0

    README.write_text(updated, encoding="utf-8")
    print(f"README updated: {coverage['days']} days, {coverage['rows']} rows.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
