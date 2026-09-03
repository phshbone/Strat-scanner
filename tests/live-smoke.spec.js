const { test, expect } = require('@playwright/test');

function attachRuntimeWatch(page) {
  const problems = [];
  page.on('pageerror', error => problems.push(`pageerror: ${error.message}`));
  page.on('requestfailed', request => {
    const url = request.url();
    if (/phshbone\.github\.io|workers\.dev|unpkg\.com/.test(url)) {
      problems.push(`requestfailed: ${url} :: ${request.failure()?.errorText || 'unknown'}`);
    }
  });
  return problems;
}

test('deployed crypto scan -> chart -> two panels -> watch live preserves layout', async ({ page }) => {
  const runtimeProblems = attachRuntimeWatch(page);

  await page.goto(`?live-smoke=${Date.now()}`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /Trading Research Console/i })).toBeVisible();

  await page.getByRole('button', { name: 'Candidates', exact: true }).click();
  const symbols = page.locator('#liveCandidateSymbols');
  await expect(symbols).toBeVisible();
  await symbols.fill('BTC/USD');
  await page.locator('#liveCandidateTimeframe').selectOption('15');
  await page.locator('#loadLiveCandidates').click();

  const status = page.locator('#liveCandidateStatus');
  await expect(status).toContainText(/LIVE PROXY\s*•\s*1\/1 loaded/i, { timeout: 45000 });
  await expect(page.locator('#candidateBody')).toContainText('BTC/USD');
  await expect(page.locator('#liveReferencePriceNotice')).toContainText('VERIFY WITH BROKER');

  const chartButton = page.getByRole('button', { name: 'Chart', exact: true }).first();
  await expect(chartButton).toBeVisible({ timeout: 15000 });
  await chartButton.click();

  await expect(page.locator('#charts')).toHaveClass(/active/);
  await expect(page.locator('#chartWorkspaceStatus')).toContainText('BTC/USD');
  await expect(page.locator('#chartPanel0')).toBeVisible({ timeout: 30000 });

  const panelCount = page.locator('#chartPanelCount');
  await expect(panelCount).toBeVisible();
  await panelCount.selectOption('2');
  await expect(panelCount).toHaveValue('2');
  await expect(page.locator('#chartPanel0')).toBeVisible();
  await expect(page.locator('#chartPanel1')).toBeVisible();

  await page.locator('#startChartLiveWatch').click();
  const watchStatus = page.locator('#chartLiveWatchStatus');
  await expect(watchStatus).toContainText('WATCH LIVE');
  await expect(watchStatus).toContainText(/updated/i, { timeout: 30000 });

  // Regression check for the bug found during manual iPhone testing:
  // a live refresh must not collapse a two-panel workspace back to one.
  await expect(panelCount).toHaveValue('2');
  await expect(page.locator('#chartPanel0')).toBeVisible();
  await expect(page.locator('#chartPanel1')).toBeVisible();

  await page.waitForTimeout(17000);
  await expect(panelCount).toHaveValue('2');
  await expect(page.locator('#chartPanel1')).toBeVisible();

  await page.locator('#stopChartLiveWatch').click();
  await expect(watchStatus).toContainText(/WATCH STOPPED|snapshot retained/i);

  expect(runtimeProblems, runtimeProblems.join('\n')).toEqual([]);
});
