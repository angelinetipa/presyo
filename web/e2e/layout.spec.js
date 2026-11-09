// e2e/layout.spec.js
// Layout checks at seven screen sizes, in a real browser. Run: npm run test:layout
//
// Every size is checked for
//   no sideways scroll, and nothing drawn outside the screen
//   no panel on top of another panel
//   no figure or label cut off inside its own box
//   a readable chart
//   the popover staying on screen
// Sizes marked fits must also fit one screen without vertical scroll.
// Sizes marked stacked must show one column in reading order.
// On a phone, every input must be 16px or larger so iOS does not zoom.
//
// The numbers come from the browser, not from the code, so a change to the
// CSS that breaks a size shows up here.

import { test, expect } from '@playwright/test';
import { SIZES, openDashboard, readPanels } from './fixtures.js';

const TOLERANCE = 1; // pixels of rounding that are not a real problem

// Text that must never be cut off. Labels that end in an ellipsis on purpose
// are not listed.
const FIGURES = [
  '.board__value',
  '.board__code',
  '.kpi__value',
  '.budget__php',
  '.brow__php',
  '.brow__src',
  '.savecalc__big',
  '.savecalc__row span',
  '.slim__label',
  '.slim__hint',
  '.panel__title',
  '.chip',
  '.seg button',
];

for (const size of SIZES) {
  test.describe(size.name, () => {
    test.beforeEach(async ({ page }) => {
      await openDashboard(page, size);
    });

    test('has no sideways scroll and draws nothing off screen', async ({ page }) => {
      const result = await page.evaluate(() => {
        const out = [];
        document.querySelectorAll('.wrap *').forEach((el) => {
          if (el.closest('.infotip__tip, svg, .sr-only, .report')) return;
          if (!el.getClientRects().length) return;
          const r = el.getBoundingClientRect();
          if (r.right > window.innerWidth + 1 || r.left < -1) {
            out.push(`${el.tagName.toLowerCase()}.${el.className}`);
          }
        });
        return {
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          outside: out.slice(0, 5),
        };
      });
      expect(result.scrollWidth).toBeLessThanOrEqual(result.innerWidth);
      expect(result.outside).toEqual([]);
    });

    test('has no panel on top of another panel', async ({ page }) => {
      const panels = await readPanels(page);
      const overlaps = [];
      for (let i = 0; i < panels.length; i += 1) {
        for (let j = i + 1; j < panels.length; j += 1) {
          const a = panels[i];
          const b = panels[j];
          const across = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
          const down = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
          if (across > TOLERANCE && down > TOLERANCE) overlaps.push(`${a.id} and ${b.id}`);
        }
      }
      expect(overlaps).toEqual([]);
    });

    test('shows every figure and label in full', async ({ page }) => {
      const cut = await page.evaluate((selectors) => {
        const out = [];
        document.querySelectorAll(selectors.join(',')).forEach((el) => {
          if (!el.getClientRects().length) return;
          if (el.scrollWidth > el.clientWidth + 1) {
            out.push(`${el.className || el.tagName}: ${el.textContent.trim().slice(0, 30)}`);
          }
        });
        return out.slice(0, 5);
      }, FIGURES);
      expect(cut).toEqual([]);
    });

    test('keeps a readable chart', async ({ page }) => {
      const box = await page.locator('.chart__box').boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(100);
      expect(box.width).toBeGreaterThanOrEqual(240);
    });

    test('keeps the popover on screen', async ({ page }) => {
      await page.locator('.slim').first().click();
      const pop = page.locator('.pop');
      await expect(pop).toBeVisible();
      const box = await pop.boundingBox();
      const view = page.viewportSize();
      expect(box.x).toBeGreaterThanOrEqual(-TOLERANCE);
      expect(box.y).toBeGreaterThanOrEqual(-TOLERANCE);
      expect(box.x + box.width).toBeLessThanOrEqual(view.width + TOLERANCE);
      expect(box.y + box.height).toBeLessThanOrEqual(view.height + TOLERANCE);
    });

    if (size.fits) {
      test('fits one screen with no vertical scroll', async ({ page }) => {
        const heights = await page.evaluate(() => ({
          page: document.documentElement.scrollHeight,
          screen: window.innerHeight,
        }));
        expect(heights.page).toBeLessThanOrEqual(heights.screen);
      });
    }

    if (size.stacked) {
      test('stacks the panels in one column in reading order', async ({ page }) => {
        const panels = await readPanels(page);
        const first = (group) => panels.find((p) => p.group === group);
        const order = ['board', 'kpi', 'chart', 'budget', 'savings', 'health', 'card'].map(first);

        // The tiles and the three small cards sit in rows of their own, so only
        // the full width panels are compared for width.
        const main = order.filter((p) => p.group !== 'kpi' && p.group !== 'card');
        for (const p of main) {
          expect(Math.abs(p.x - main[0].x)).toBeLessThanOrEqual(TOLERANCE);
          expect(Math.abs(p.w - main[0].w)).toBeLessThanOrEqual(TOLERANCE);
        }
        for (let i = 1; i < order.length; i += 1) {
          expect(order[i].y).toBeGreaterThanOrEqual(order[i - 1].y);
        }
      });
    } else {
      test('puts the board beside the chart and the budget beside the calculator', async ({ page }) => {
        const panels = await readPanels(page);
        const one = (group) => panels.find((p) => p.group === group);
        const board = one('board');
        const chart = one('chart');
        const budget = one('budget');
        const savings = one('savings');

        expect(board.x + board.w).toBeLessThanOrEqual(chart.x + TOLERANCE);
        expect(budget.x + budget.w).toBeLessThanOrEqual(savings.x + TOLERANCE);
        // Row two starts below row one.
        expect(budget.y).toBeGreaterThanOrEqual(Math.max(board.y + board.h, chart.y + chart.h) - TOLERANCE);
      });
    }

    if (size.width <= 560) {
      test('uses 16px or larger inputs so iOS does not zoom', async ({ page }) => {
        const small = await page.evaluate(() => {
          const out = [];
          document.querySelectorAll('.wrap input, .wrap select').forEach((el) => {
            if (!el.getClientRects().length) return;
            const px = parseFloat(getComputedStyle(el).fontSize);
            if (px < 16) out.push(`${el.id || el.className}: ${px}px`);
          });
          return out;
        });
        expect(small).toEqual([]);
      });
    }
  });
}