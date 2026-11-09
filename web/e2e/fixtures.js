// e2e/fixtures.js
// Screen sizes, fake data and page setup for the layout tests.
//
// Sizes
//   fits     the whole dashboard must fit in one screen with no scrolling
//   stacked  every panel takes the full width, one under the other
//   Sizes with neither flag are allowed to scroll, but nothing may break.
//
// Data
//   89 days of 8 currencies with six decimals, and 30 pipeline runs with one
//   failed run. The numbers are made from a fixed formula, so every run of
//   the tests sees the same page.

export const SIZES = [
  { name: 'desktop 1920x1080', width: 1920, height: 1080, fits: true },
  { name: 'laptop 1440x900', width: 1440, height: 900, fits: true },
  { name: 'small laptop 1366x768', width: 1366, height: 768, fits: true },
  { name: 'short laptop 1280x720', width: 1280, height: 720 },
  { name: 'tablet landscape 1024x768', width: 1024, height: 768, fits: true },
  { name: 'tablet 820x1180', width: 820, height: 1180, stacked: true },
  { name: 'phone 390x844', width: 390, height: 844, stacked: true },
];

const BASE = {
  USD: 63.5199,
  SAR: 16.9386,
  AED: 17.2961,
  SGD: 49.5814,
  HKD: 8.0961,
  JPY: 0.401,
  GBP: 85.2138,
  CAD: 45.3901,
};

const DAY = 24 * 60 * 60 * 1000;
const FIRST_DAY = Date.parse('2026-08-06T00:00:00Z');
const DAYS = 89;

function makeRates() {
  const rows = [];
  for (let d = 0; d < DAYS; d += 1) {
    const rate_date = new Date(FIRST_DAY + d * DAY).toISOString().slice(0, 10);
    Object.entries(BASE).forEach(([currency, value], i) => {
      const wave = 1 + Math.sin(d / 7 + i) * 0.012 + (d % 5) * 0.001;
      rows.push({ rate_date, currency, php_per_unit: Number((value * wave).toFixed(6)) });
    });
  }
  return rows;
}

function makeRuns() {
  const newest = Date.parse('2026-11-04T07:28:00Z');
  return Array.from({ length: 30 }, (_, i) => {
    const failed = i === 7;
    return {
      started_at: new Date(newest - i * DAY).toISOString(),
      status: failed ? 'failed' : 'success',
      rows_read: 8,
      rows_loaded: failed ? 0 : 8,
      rows_rejected: 0,
    };
  });
}

const RATES = makeRates();
const RUNS = makeRuns();

/**
 * Opens the dashboard at one size with fake data, and waits until it is
 * ready to measure. Motion is turned off so no panel is mid animation, and
 * saved settings are cleared so every test starts from the defaults.
 */
export async function openDashboard(page, { width, height }) {
  await page.setViewportSize({ width, height });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/rest/v1/fx_rates**', (route) => route.fulfill({ json: RATES }));
  await page.route('**/rest/v1/pipeline_runs**', (route) => route.fulfill({ json: RUNS }));
  // Web fonts come from Google. They are blocked here so the tests do not
  // wait on the network. The page then uses its fallback fonts.
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
  await page.addInitScript(() => {
    try {
      window.localStorage.clear();
    } catch {
      // Storage can be blocked. The dashboard works without it.
    }
  });
  await page.goto('/');
  await page.waitForSelector('.dash');
  await page.evaluate(() => document.fonts.ready);
}

/** Reads the position and size of every panel that must not overlap. */
export function readPanels(page) {
  return page.evaluate(() => {
    const groups = [
      ['board', '.board'],
      ['kpi', '.kpi'],
      ['chart', '.chart'],
      ['budget', '.budget'],
      ['savings', '.savecalc'],
      ['health', '.health'],
      ['card', '.slim'],
    ];
    const out = [];
    for (const [name, selector] of groups) {
      document.querySelectorAll(selector).forEach((el, i) => {
        const r = el.getBoundingClientRect();
        out.push({
          id: document.querySelectorAll(selector).length > 1 ? `${name} ${i + 1}` : name,
          group: name,
          x: r.x,
          y: r.y + window.scrollY,
          w: r.width,
          h: r.height,
        });
      });
    }
    return out;
  });
}