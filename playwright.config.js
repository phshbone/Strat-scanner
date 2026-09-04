const { defineConfig } = require('@playwright/test');

const baseURL = process.env.BASE_URL;
if (!baseURL) throw new Error('BASE_URL is required. Resolve Local or Deployed Mode before Playwright starts.');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 90000,
  expect: { timeout: 20000 },
  retries: 1,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    { name: 'desktop-chromium', use: { browserName: 'chromium', viewport: { width: 1365, height: 900 } } },
    { name: 'mobile-portrait-chromium', use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: 'mobile-landscape-chromium', use: { browserName: 'chromium', viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true } }
  ]
});
