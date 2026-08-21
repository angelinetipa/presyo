from datetime import date, timedelta

from presyo import validate

TODAY = date(2026, 8, 6)


def row(**overrides):
    base = {"rate_date": TODAY.isoformat(), "currency": "USD", "php_per_unit": 57.0}
    return {**base, **overrides}


def test_good_row_passes():
    assert validate.check_row(row(), today=TODAY) is None


def test_future_date_is_rejected():
    future = (TODAY + timedelta(days=1)).isoformat()
    assert "future" in validate.check_row(row(rate_date=future), today=TODAY)


def test_stale_date_is_rejected():
    old = (TODAY - timedelta(days=30)).isoformat()
    assert "stale" in validate.check_row(row(rate_date=old), today=TODAY)


def test_rate_outside_band_is_rejected():
    assert "outside" in validate.check_row(row(php_per_unit=5000), today=TODAY)


def test_negative_rate_is_rejected():
    assert validate.check_row(row(php_per_unit=-1), today=TODAY) is not None


def test_untracked_currency_is_rejected():
    # NOT a real currency code. JPY was used here until it became tracked,
    # and the test then failed for the right reason — the fixture, not the
    # logic, had gone stale. Pick something that will never be added.
    assert "untracked" in validate.check_row(row(currency="XTS"), today=TODAY)


def test_split_separates_good_from_bad():
    rows = [row(), row(currency="SAR", php_per_unit=15.2), row(php_per_unit=9999)]
    accepted, rejected = validate.split(rows, today=TODAY)
    assert len(accepted) == 2
    assert len(rejected) == 1
    assert "reason" in rejected[0]


def test_duplicate_in_same_batch_is_rejected():
    accepted, rejected = validate.split([row(), row()], today=TODAY)
    assert len(accepted) == 1
    assert "duplicate" in rejected[0]["reason"]