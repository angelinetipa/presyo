"""Everything that talks to Supabase lives here."""

from datetime import datetime, timezone

from supabase import Client, create_client

from presyo import config


def get_client() -> Client:
    """Builds a Supabase client from environment variables."""
    if not config.SUPABASE_URL or not config.SUPABASE_SERVICE_KEY:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_KEY are not set. "
            "Copy .env.example to .env and fill it in."
        )
    return create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY)


def upsert_rates(client: Client, rows: list[dict]) -> int:
    """Inserts rates, overwriting any row with the same date and currency.

    This is what makes the pipeline safe to re-run. Running it five times
    in one day leaves exactly the same table as running it once.
    """
    if not rows:
        return 0

    result = (
        client.table("fx_rates")
        .upsert(rows, on_conflict="rate_date,currency")
        .execute()
    )
    return len(result.data or [])


def start_run(client: Client) -> int:
    """Opens a run log row and returns its id."""
    result = (
        client.table("pipeline_runs")
        .insert(
            {
                "pipeline": config.PIPELINE_NAME,
                "started_at": datetime.now(timezone.utc).isoformat(),
                "status": "running",
            }
        )
        .execute()
    )
    return result.data[0]["id"]


def finish_run(
    client: Client,
    run_id: int,
    status: str,
    rows_read: int = 0,
    rows_loaded: int = 0,
    rows_rejected: int = 0,
    error_message: str | None = None,
) -> None:
    """Closes the run log row with the final counts."""
    client.table("pipeline_runs").update(
        {
            "finished_at": datetime.now(timezone.utc).isoformat(),
            "status": status,
            "rows_read": rows_read,
            "rows_loaded": rows_loaded,
            "rows_rejected": rows_rejected,
            "error_message": error_message[:500] if error_message else None,
        }
    ).eq("id", run_id).execute()
