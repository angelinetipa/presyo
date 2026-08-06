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
# USD for freelancers; SAR, AED, HKD, SGD for the biggest OFW destinations.
TRACKED_CURRENCIES = ["USD", "SAR", "AED", "SGD", "HKD"]

# Sanity bands: pesos per 1 unit. A value outside this range means the
# source broke, not that the peso collapsed overnight. Reject, don't load.
RATE_BANDS = {
    "USD": (30.0, 100.0),
    "SAR": (5.0, 30.0),
    "AED": (5.0, 35.0),
    "SGD": (20.0, 70.0),
    "HKD": (2.0, 15.0),
}

# How stale a quoted date may be before we treat it as a dead feed.
MAX_STALENESS_DAYS = 7

# ---- Supabase -----------------------------------------------------------
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

PIPELINE_NAME = "fx_daily"
