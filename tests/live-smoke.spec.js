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

test('deployed crypto scan -> chart -> two panels -> watch live preserves layout', async ({ page }, testInfo) => {
  const runtimeProblems = attachRuntimeWatch(page);

  await page.goto(`?live-smoke=${Date.now()}`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /Trading Research Console/i })).toBeVisible();

  const viewport = page.viewportSize();
  if (testInfo.project.name.includes('mobile-landscape')) {
    expect(viewport.width).toBeGreaterThan(viewport.height);
  }
  if (testInfo.project.name.includes('mobile-portrait')) {
    expect(viewport.height).toBeGreaterThan(viewport.width);
  }

  await page.getByRole('button', { name: 'Candidates', exact: true }).click();
  await expect(page.locator('#candidateWorkflowHint')).toContainText(/Scan.*Why.*Chart.*Watch live/i);
  await expect(page.locator('#candidates thead th').last()).toHaveText('Actions');

  if (testInfo.project.name.includes('mobile-')) {
    const bodyOverflow = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - window.innerWidth));
    expect(bodyOverflow).toBeLessThanOrEqual(2);
  }

  const symbols = page.locator('#liveCandidateSymbols');
  await expect(symbols).toBeVisible();
  await symbols.fill('BTC/USD');
  await page.locator('#liveCandidateTimeframe').selectOption('15');
  await page.locator('#loadLiveCandidates').click();

  const status = page.locator('#liveCandidateStatus');
  await expect(status).toContainText(/LIVE PROXY\s*•\s*1\/1 loaded/i, { timeout: 45000 });
  await expect(page.locator('#candidateBody')).toContainText('BTC/USD');
  await expect(page.locator('#liveReferencePriceNotice')).toContainText('VERIFY WITH BROKER');

  const chartButton = page.getByRole('button', { name: /Chart BTC\/USD/i }).first();
  await expect(chartButton).toBeVisible({ timeout: 15000 });
  await expect(chartButton).not.toHaveClass(/secondary/);
  await chartButton.click();

  await expect(page.locator('#charts')).toHaveClass(/active/);
  await expect(page.locator('#charts h2')).toHaveText('Chart');
  await expect(page.locator('#chartWorkspaceReference')).toHaveText('REFERENCE DATA • VERIFY WITH BROKER');
  await expect(page.locator('#chartWorkspaceStatus')).toContainText('BTC/USD');
  await expect(page.locator('#chartPanel0')).toBeVisible({ timeout: 30000 });

  const tradeCoach = page.locator('#chartTradeCoach');
  await expect(tradeCoach).toBeVisible({ timeout: 15000 });
  await expect(tradeCoach).toContainText('Trade Coach');
  await expect(tradeCoach).toContainText('RULE-BASED');
  await expect(page.locator('#chartTradeCoachMessage')).toContainText('Current setup context');
  await page.locator('#chartTradeCoachWhy').click();
  await expect(page.locator('#chartTradeCoachWhyPanel')).toContainText('SETUP');
  await expect(page.locator('#chartTradeCoachWhyPanel')).toContainText('PRICE');
  await expect(page.locator('#chartTradeCoachWhyPanel')).toContainText('TRIGGER');
  await expect(page.locator('#chartTradeCoachWhyPanel')).toContainText('MAGNITUDE');

  const panelCount = page.locator('#chartPanelCount');
  await expect(panelCount).toBeVisible();
  await panelCount.selectOption('2');
  await expect(panelCount).toHaveValue('2');
  await expect(page.locator('#chartPanel0')).toBeVisible();
  await expect(page.locator('#chartPanel1')).toBeVisible();

  const spacing = page.locator('#chartBarSpacing');
  const grid = page.locator('#chartGridVisible');
  await expect(spacing).toBeVisible();
  await expect(grid).toBeVisible();
  await spacing.selectOption('WIDE');
  await grid.uncheck();
  await expect(spacing).toHaveValue('WIDE');
  await expect(grid).not.toBeChecked();

  const volume = page.locator('#chartVolumeVisible');
  const stratLabels = page.locator('#chartStratLabelsVisible');
  const setupLevels = page.locator('#chartSetupLevelsVisible');
  await expect(volume).toBeVisible({ timeout: 15000 });
  await expect(stratLabels).toBeVisible();
  await expect(setupLevels).toBeVisible();
  await expect(volume).toBeChecked();
  await expect(stratLabels).toBeChecked();
  await expect(setupLevels).toBeChecked();
  await stratLabels.uncheck();
  await expect(stratLabels).not.toBeChecked();
  await expect(panelCount).toHaveValue('2');

  await page.locator('#startChartLiveWatch').click();
  const watchStatus = page.locator('#chartLiveWatchStatus');
  await expect(watchStatus).toContainText('WATCH LIVE');
  await expect(watchStatus).toContainText(/updated/i, { timeout: 30000 });

  await expect(panelCount).toHaveValue('2');
  await expect(page.locator('#chartPanel0')).toBeVisible();
  await expect(page.locator('#chartPanel1')).toBeVisible();
  await expect(page.locator('#chartBarSpacing')).toHaveValue('WIDE');
  await expect(page.locator('#chartGridVisible')).not.toBeChecked();
  await expect(page.locator('#chartVolumeVisible')).toBeChecked();
  await expect(page.locator('#chartStratLabelsVisible')).not.toBeChecked();
  await expect(page.locator('#chartSetupLevelsVisible')).toBeChecked();
  await expect(page.locator('#chartTradeCoach')).toContainText('RULE-BASED');
  await expect(page.locator('#chartTradeCoachMessage')).not.toContainText('Waiting for chart context');

  await page.waitForTimeout(17000);
  await expect(panelCount).toHaveValue('2');
  await expect(page.locator('#chartPanel1')).toBeVisible();
  await expect(page.locator('#chartBarSpacing')).toHaveValue('WIDE');
  await expect(page.locator('#chartGridVisible')).not.toBeChecked();
  await expect(page.locator('#chartStratLabelsVisible')).not.toBeChecked();
  await expect(page.locator('#chartTradeCoachMessage')).not.toContainText('Waiting for chart context');

  if (testInfo.project.name.includes('mobile-')) {
    const bodyOverflow = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - window.innerWidth));
    expect(bodyOverflow).toBeLessThanOrEqual(2);
  }

  await page.locator('#stopChartLiveWatch').click();
  await expect(watchStatus).toContainText(/WATCH STOPPED|snapshot retained/i);

  expect(runtimeProblems, runtimeProblems.join('\n')).toEqual([]);
});

test('sample selection wins over a stale live scan response', async ({ page }) => {
  const runtimeProblems = attachRuntimeWatch(page);
  await page.route('**/time-series?*', async route => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    await route.continue();
  });

  await page.goto(`?mode-cleanup=${Date.now()}`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Candidates', exact: true }).click();
  const symbols = page.locator('#liveCandidateSymbols');
  await expect(symbols).toBeVisible();
  await symbols.fill('BTC/USD');
  await page.locator('#loadLiveCandidates').click();
  await expect(page.locator('#liveCandidateStatus')).toContainText(/Loading/i);
  await page.locator('#useSampleCandidates').click();
  await expect(page.locator('.topbar .badge')).toHaveText('SAMPLE DATA');
  await page.waitForTimeout(3000);
  await expect(page.locator('.topbar .badge')).toHaveText('SAMPLE DATA');
  expect(runtimeProblems, runtimeProblems.join('\n')).toEqual([]);
});
