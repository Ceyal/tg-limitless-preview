// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ARTIFACTS = path.join(__dirname, '..', 'qa-artifacts', 'screenshots');

test.beforeAll(() => {
  fs.mkdirSync(ARTIFACTS, { recursive: true });
});

async function assertNoConsole404(page) {
  const errors = [];
  page.on('response', (res) => {
    const u = res.url();
    if (res.status() === 404 && u.includes('tg-limitless-preview') || u.startsWith('http://127.0.0.1')) {
      errors.push(`${res.status()} ${u}`);
    }
  });
  return errors;
}

async function assertDefaultOff(page) {
  const checks = await page.evaluate(() => {
    const cb = (id) => !!document.getElementById(id)?.checked;
    return {
      opfsMega: cb('tgMegaLaneOpfs'),
      opfsItg: cb('tgItgLaneOpfs'),
      pwaItg: cb('tgItgLanePwa'),
      wavMega: cb('tgMegaLaneWav'),
      workletMega: cb('tgMegaLaneWorklet'),
      vizMega: cb('tgMegaLaneViz'),
      spatialMega: cb('tgMegaLaneSpatial'),
      wavLive: cb('tgWavLiveLaneEnable'),
      awArm: cb('tgAwFrLaneArm'),
      swController: !!navigator.serviceWorker?.controller,
    };
  });
  expect(checks.opfsMega).toBe(false);
  expect(checks.opfsItg).toBe(false);
  expect(checks.pwaItg).toBe(false);
  expect(checks.wavMega).toBe(false);
  expect(checks.workletMega).toBe(false);
  expect(checks.vizMega).toBe(false);
  expect(checks.spatialMega).toBe(false);
  expect(checks.wavLive).toBe(false);
  expect(checks.awArm).toBe(false);
}

test.describe('preview smoke', () => {
  test('landing page loads', async ({ page }, testInfo) => {
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Chelli Tone Generator — Preview/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Daily Driver Preview/i })).toBeVisible();
    await page.screenshot({
      path: path.join(ARTIFACTS, `${testInfo.project.name}-landing.png`),
      fullPage: true,
    });
  });

  test('daily driver loads with collapsed diagnostics', async ({ page }, testInfo) => {
    await page.goto('/daily-driver.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#tgStudioPrimary')).toBeVisible();
    const openDiag = await page.locator('details.tg-preview-diag-fold[open]').count();
    expect(openDiag).toBe(0);
    await assertDefaultOff(page);
    await page.screenshot({
      path: path.join(ARTIFACTS, `${testInfo.project.name}-daily-driver.png`),
      fullPage: false,
    });
  });

  test('tech diagnostics hub loads', async ({ page }, testInfo) => {
    await page.goto('/tech-diagnostics.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#tgIntegratedTechHub')).toBeVisible();
    await assertDefaultOff(page);
    await page.screenshot({
      path: path.join(ARTIFACTS, `${testInfo.project.name}-tech-diagnostics.png`),
      fullPage: false,
    });
  });

  test('reload keeps advanced lanes off on daily driver', async ({ page }) => {
    await page.goto('/daily-driver.html', { waitUntil: 'domcontentloaded' });
    await assertDefaultOff(page);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await assertDefaultOff(page);
  });

  test('key local assets respond', async ({ request }, testInfo) => {
    const base = testInfo.project.use.baseURL;
    for (const asset of [
      '/favicon.svg',
      '/src/tg-limitless-immersive-ui.css',
      '/src/tg-integrated-technology-candidate.js',
      '/preview/preview-daily-driver.js',
    ]) {
      const res = await request.get(`${base}${asset}`);
      expect(res.status(), asset).toBeLessThan(400);
    }
  });
});
