"""Tests for the README status block.

`render` and `splice` take data and return text — no network, no
database — so they can be tested with fixtures. The parts that talk to
Supabase are deliberately not tested here; there is nothing to assert
about them that a real run would not tell you faster.
"""

import pytest

from presyo import report


LATEST = [
    {"currency": "AED", "php_per_unit": 15.6021},
    {"currency": "HKD", "php_per_unit": 7.3145},
    {"currency": "SAR", "php_per_unit": 15.2788},
    {"currency": "SGD", "php_per_unit": 44.1902},
    {"currency": "USD", "php_per_unit": 57.3100},
]

RUNS = [
    {
        "started_at": "2026-08-21T01:15:04+00:00",
        "status": "success",
        "rows_read": 5,
        "rows_loaded": 5,
        "rows_rejected": 0,
    },
    {
        "started_at": "2026-08-20T01:15:03+00:00",
        "status": "failed",
        "rows_read": 0,
        "rows_loaded": 0,
        "rows_rejected": 0,
    },
]

COVERAGE = {"days": 75, "rows": 375, "first": "2026-06-08", "last": "2026-08-21"}


def test_render_shows_every_tracked_currency():
    out = report.render(LATEST, RUNS, COVERAGE)
    for currency in ("USD", "SAR", "AED", "SGD", "HKD"):
        assert currency in out


def test_render_accepts_exactly_what_gather_returns():
    """The regression that broke the first real run.

    gather() selects only `currency, php_per_unit` — it filters BY
    rate_date, so that column never comes back. render() was reading
    latest[0]["rate_date"] and raising KeyError in production while every
    test passed, because the fixtures bolted the key on by hand.

    This fixture is the exact shape Supabase returns. Nothing added.
    """
    from_supabase = [
        {"currency": "USD", "php_per_unit": 57.31},
        {"currency": "SAR", "php_per_unit": 15.2788},
    ]
    out = report.render(from_supabase, RUNS, COVERAGE)
    assert "57.3100" in out
    assert "21 Aug 2026" in out   # the date comes from coverage


def test_render_shows_coverage_so_the_claim_is_checkable():
    # The resume says "75 consecutive days". The README has to be able to
    # back that up without anyone logging into Supabase.
    out = report.render(LATEST, RUNS, COVERAGE)
    assert "75 days collected" in out
    assert "375 rows" in out


def test_render_does_not_hide_failed_runs():
    # A status block that only shows successes is marketing, not a log.
    out = report.render(LATEST, RUNS, COVERAGE)
    assert "FAIL" in out
    assert "PASS" in out


def test_render_formats_dates_readably():
    out = report.render(LATEST, RUNS, COVERAGE)
    assert "21 Aug 2026" in out


def test_render_handles_an_empty_table():
    out = report.render([], [], {"days": 0, "rows": 0, "first": "", "last": ""})
    assert "No rates loaded yet" in out


def test_splice_replaces_only_the_block():
    readme = (
        "# Presyo\n\nIntro stays.\n\n"
        f"{report.START}\n\nold content\n\n{report.END}\n\n"
        "## Setup\n\nAlso stays.\n"
    )
    out = report.splice(readme, "new content")
    assert "new content" in out
    assert "old content" not in out
    assert "Intro stays." in out
    assert "Also stays." in out


def test_splice_is_repeatable():
    # It runs every day forever; the file must not grow or drift.
    readme = f"head\n{report.START}\n\nx\n\n{report.END}\ntail\n"
    once = report.splice(readme, "block")
    twice = report.splice(once, "block")
    assert once == twice


def test_splice_fails_loudly_when_markers_are_missing():
    # Silently doing nothing would look exactly like a working pipeline.
    with pytest.raises(RuntimeError, match="markers"):
        report.splice("# Presyo\n\nNo markers here.\n", "block")