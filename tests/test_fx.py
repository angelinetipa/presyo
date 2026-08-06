import pytest

from presyo.sources import fx

PAYLOAD = {
    "result": "success",
    "time_last_update_unix": 1754438400,  # 2025-08-06 UTC
    "rates": {"USD": 1.0, "PHP": 57.0, "SAR": 3.75, "AED": 3.6725, "SGD": 1.29, "HKD": 7.8},
}


def test_usd_row_is_the_php_rate():
    rows = {r["currency"]: r for r in fx.to_php_rows(PAYLOAD)}
    assert rows["USD"]["php_per_unit"] == pytest.approx(57.0)


def test_cross_rate_is_correct():
    rows = {r["currency"]: r for r in fx.to_php_rows(PAYLOAD)}
    assert rows["SAR"]["php_per_unit"] == pytest.approx(57.0 / 3.75, rel=1e-6)
    assert rows["HKD"]["php_per_unit"] == pytest.approx(57.0 / 7.8, rel=1e-6)


def test_all_tracked_currencies_present():
    rows = fx.to_php_rows(PAYLOAD)
    assert len(rows) == 5


def test_missing_php_raises():
    broken = {**PAYLOAD, "rates": {"USD": 1.0, "SAR": 3.75}}
    with pytest.raises(fx.SourceError):
        fx.to_php_rows(broken)


def test_missing_rates_key_raises():
    with pytest.raises(KeyError):
        fx.to_php_rows({"result": "success"})
