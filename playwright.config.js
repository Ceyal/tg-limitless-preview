// @ts-check
const { defineConfig, devices } = require('@playwright/test');

const LIVE_BASE = (
  process.env.TG_PREVIEW_LIVE_URL || 'https://ceyal.github.io/tg-limitless-preview'
).replace(/\/?$/, '/');

const livePagesOnly = process.argv.some((a) => String(a).includes('live-pages'));

module.exports = defineConfig({
  testDir: './tests',
  timeout: 120000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'qa-artifacts/playwright-report' }]],
  outputDir: 'qa-artifacts/test-results',
  use: {
    trace: 'retain-on-failure',
    screenshot: 'on',
    video: 'off',
  },
  projects: [
    {
      name: 'local-preview',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://127.0.0.1:4173',
      },
    },
    {
      name: 'live-pages',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: LIVE_BASE,
      },
    },
  ],
  webServer: livePagesOnly
    ? undefined
    : {
        command: 'npx --yes http-server . -p 4173 -c-1',
        url: 'http://127.0.0.1:4173/index.html',
        reuseExistingServer: true,
        timeout: 60000,
      },
});
