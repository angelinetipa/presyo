"""Entry point: fetch, validate, load, log. One run, one log row.

    python -m presyo.run
"""

import logging
import sys

from presyo import config, db, validate
from presyo.sources import fx

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s %(message)s",
    datefmt="%H:%M:%S",
)

# The HTTP libraries log every request. Useful when debugging, noise otherwise.
for noisy in ("httpx", "httpcore", "hpack", "urllib3"):
    logging.getLogger(noisy).setLevel(logging.WARNING)

log = logging.getLogger("presyo")


def main() -> int:
    client = db.get_client()
    run_id = db.start_run(client)
    log.info("Run %s started.", run_id)

    try:
        payload = fx.fetch_raw()
        rows = fx.to_php_rows(payload)
        log.info("Fetched %s rows from %s.", len(rows), config.FX_SOURCE_NAME)

        accepted, rejected = validate.split(rows)
        for bad in rejected:
            log.warning("Rejected %s: %s", bad.get("currency"), bad["reason"])

        loaded = db.upsert_rates(client, accepted)
        for row in accepted:
            log.info(
                "  %s  %s  PHP %.4f",
                row["rate_date"],
                row["currency"],
                row["php_per_unit"],
            )

        db.finish_run(
            client,
            run_id,
            status="success",
            rows_read=len(rows),
            rows_loaded=loaded,
            rows_rejected=len(rejected),
        )
        log.info(
            "Run %s finished. %s loaded, %s rejected.", run_id, loaded, len(rejected)
        )
        return 0

    except Exception as error:  # noqa: BLE001 — every failure must be logged
        log.exception("Run %s failed.", run_id)
        db.finish_run(client, run_id, status="failed", error_message=str(error))
        return 1


if __name__ == "__main__":
    sys.exit(main())