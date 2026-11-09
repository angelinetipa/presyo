// playwright.config.js
// Settings for the layout tests in e2e/. Run them with: npm run test:layout
//
// The tests start their own dev server on port 5174, with a fake Supabase
// address and key. The real project is never called, because every request
// to the two tables is answered by the test (see e2e/fixtures.js).
//
// First run on a new machine: npx playwright install chromium
//
// PW_CHROME_PATH can point to an installed Chrome or Chromium instead of the
// browser that Playwright downloads. It is only needed when that download is
// blocked.

import { defineConfig } from '@playwright/test';

const PORT = 5174;
const chromePath = process.env.PW_CHROME_PATH;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    launchOptions: chromePath ? { executablePath: chromePath, args: ['--no-sandbox'] } : {},
  },
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_SUPABASE_URL: 'https://layout-test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'layout-test-anon-key',
    },
  },
});