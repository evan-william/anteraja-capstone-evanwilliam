import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const evidence = (name) => fileURLToPath(new URL(`../evidence/${name}`, import.meta.url));

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true });

try {
  // This first flow uses both real public APIs, not mocked fixtures.
  const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
  const errors = [];
  let apiRequests = 0;
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => { if (/emsifa\.com|kodepos\.vercel\.app/.test(request.url())) apiRequests += 1; });
  await page.goto(base);
  await page.locator('#origin-province option').nth(1).waitFor({ state: 'attached', timeout: 25000 });
  await page.locator('#origin-province').selectOption('31');
  await page.locator('#destination-province').selectOption('31');
  await page.locator('#origin-city option[value="31.71"]').waitFor({ state: 'attached', timeout: 25000 });
  await page.locator('#destination-city option[value="31.74"]').waitFor({ state: 'attached', timeout: 25000 });
  await page.locator('#origin-city').selectOption('31.71');
  await page.locator('#destination-city').selectOption('31.74');
  await page.locator('#postal-query').fill('Cilandak');
  await page.getByRole('button', { name: /12430.*Cilandak Barat/ }).waitFor({ timeout: 25000 });
  await page.getByRole('button', { name: /12430.*Cilandak Barat/ }).click();
  assert.match(await page.locator('.postal-picked').innerText(), /12430/);
  assert.match(await page.locator('.calculator-route').innerText(), /Jakarta Pusat.*Jakarta Selatan.*12430/);
  await page.locator('#weight').fill('2.5');
  assert.match(await page.locator('#estimate').innerText(), /Rp\s*27\.000/);
  assert.deepEqual(errors, []);
  assert.ok(apiRequests < 20, `Unexpected request loop: ${apiRequests} API requests`);
  await page.screenshot({ path: evidence('day10-live-data.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'Mobile horizontal overflow');
  await page.screenshot({ path: evidence('day10-mobile.png'), fullPage: true });
  await page.close();

  // Deterministic loading state: hold the province response until the screenshot is taken.
  const loadingPage = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  await loadingPage.route('**/provinces.json', async (route) => {
    await gate;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [{ id: '31', name: 'Daerah Khusus Ibukota Jakarta' }] }) });
  });
  await loadingPage.goto(base);
  await loadingPage.getByText('Memuat daftar provinsi…').waitFor();
  await loadingPage.screenshot({ path: evidence('day10-loading.png'), fullPage: true });
  release();
  await loadingPage.locator('#origin-province option').nth(1).waitFor({ state: 'attached' });
  await loadingPage.close();

  // Network failure is visible and the retry action recovers.
  const errorPage = await browser.newPage();
  let calls = 0;
  let recover = false;
  await errorPage.route('**/provinces.json', async (route) => {
    calls += 1;
    if (!recover) await route.abort('failed');
    else await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [{ id: '31', name: 'Daerah Khusus Ibukota Jakarta' }] }) });
  });
  await errorPage.goto(base);
  await errorPage.locator('.async-message.error').waitFor();
  await errorPage.screenshot({ path: evidence('day10-error.png'), fullPage: true });
  recover = true;
  await errorPage.getByRole('button', { name: 'Coba lagi' }).first().click();
  await errorPage.locator('#origin-province option').nth(1).waitFor({ state: 'attached' });
  assert.ok(calls >= 2);
  await errorPage.close();

  // Slow old-city response must not replace the city list for a newer province.
  const stalePage = await browser.newPage();
  await stalePage.route('**/provinces.json', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [{ id: '31', name: 'Daerah Khusus Ibukota Jakarta' }, { id: '32', name: 'Jawa Barat' }] }) }));
  await stalePage.route('**/regencies/31.json', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [{ id: '31.74', name: 'Jakarta Selatan' }] }) }).catch(() => {});
  });
  await stalePage.route('**/regencies/32.json', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [{ id: '32.73', name: 'Kota Bandung' }] }) }));
  await stalePage.goto(base);
  await stalePage.locator('#origin-province option[value="31"]').waitFor({ state: 'attached' });
  await stalePage.locator('#origin-province').selectOption('31');
  await stalePage.locator('#origin-province').selectOption('32');
  await stalePage.locator('#origin-city option[value="32.73"]').waitFor({ state: 'attached' });
  await stalePage.waitForTimeout(750);
  assert.equal(await stalePage.locator('#origin-city option[value="31.74"]').count(), 0);
  await stalePage.close();

  console.log(`PASS: two live APIs, Context propagation, loading, error/retry, stale-request cleanup, calculator, no page errors (${apiRequests} live API requests)`);
} finally {
  await browser.close();
}
