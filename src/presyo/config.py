"""Settings for the Presyo pipeline. Change values here, not in the logic."""

import os

from dotenv import load_dotenv

load_dotenv()

# ---- Source -------------------------------------------------------------
# Free, no API key needed. Base USD, so every rate is "units per 1 USD".
FX_API_URL = "https://open.er-api.com/v6/latest/USD"
FX_SOURCE_NAME = "open.er-api.com"
REQUEST_TIMEOUT = 20  # seconds

# ---- What we track ------------------------------------------------------
# USD for freelancers and the largest remittance source by far. SAR, AED,
# SGD, HKD for the biggest work destinations. JPY, GBP, CAD added later:
# Japan and the UK are both in the central bank's top sources, and Canada
# is a common destination for families settling permanently.
#
# Adding a currency here starts collection from the NEXT run. Nothing is
# backfilled, so a new currency will have a shorter history than USD for
# a while. The page handles that; the numbers just look thin at first.
TRACKED_CURRENCIES = ["USD", "SAR", "AED", "SGD", "HKD", "JPY", "GBP", "CAD"]

# Sanity bands: pesos per 1 unit. A value outside this range means the
# source broke, not that the peso collapsed overnight. Reject, don't load.
#
# Deliberately wide. The job is to catch a feed returning nonsense — an
# inverted rate, a zero, a different currency — not to second-guess real
# market movement. If a band is ever too tight, the row is rejected with
# a reason in the run log rather than silently dropped, and the fix is to
# widen the number here.
RATE_BANDS = {
    "USD": (30.0, 100.0),
    "SAR": (5.0, 30.0),
    "AED": (5.0, 35.0),
    "SGD": (20.0, 70.0),
    "HKD": (2.0, 15.0),
    "JPY": (0.15, 1.20),    # around 0.40 pesos per yen
    "GBP": (40.0, 140.0),   # around 82 pesos per pound
    "CAD": (20.0, 90.0),    # around 45 pesos per Canadian dollar
}

# How stale a quoted date may be before we treat it as a dead feed.
MAX_STALENESS_DAYS = 7

# ---- Supabase -----------------------------------------------------------
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

PIPELINE_NAME = "fx_daily"