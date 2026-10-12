import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer';
import { startApp, root } from '../tools/server.js';
import { validateDataset, verifyResult } from './verification.js';

const selectors = {
  form: '#shipment-request-form', tracking: '#tracking-number', weight: '#weight', distance: '#distance',
  submit: '#shipment-request-form button[type="submit"]', rows: '#request-history tbody tr[data-testid="shipment-row"]',
};

function localBaseUrl(value) {
  const url = new URL(value);
  assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) && ['http:', 'https:'].includes(url.protocol), 'Tes ini hanya boleh menulis ke app latihan lokal.');
  assert.equal(url.username + url.password + url.search + url.hash, '', 'BASE_URL tidak boleh membawa credential/query.');
  return url.href.replace(/\/$/, '');
}

async function readHistory(page, baseUrl) {
  const response = await page.goto(`${baseUrl}/request-history.php`, { waitUntil: 'domcontentloaded' });
  assert.equal(response?.status(), 200, 'Request History tidak dapat dibuka.');
  await page.waitForSelector('main h1', { visible: true });
  return page.$$eval(selectors.rows, rows => rows.map(row => ({
    tracking: row.querySelector('[data-field="tracking"]').textContent.trim(),
    weight: Number.parseFloat(row.querySelector('[data-field="weight"]').textContent),
    distance: Number.parseFloat(row.querySelector('[data-field="distance"]').textContent),
    cost: Number(row.querySelector('[data-field="cost"]').textContent.replace(/[^0-9]/g, '')),
  })));
}

export async function runScenario(browser, baseUrl, scenario, evidenceDirectory) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
  page.setDefaultTimeout(10000);
  page.setDefaultNavigationTimeout(10000);
  const runtimeErrors = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  let postCount = 0;
  page.on('request', request => {
    if (request.method() === 'POST' && new URL(request.url()).pathname.endsWith('/submit-request.php')) postCount++;
  });
  const started = Date.now();
  let actual = { kind: 'NOT_RUN' };
  let before = [];
  let after = [];
  let failure = '';
  const formImage = path.join(evidenceDirectory, `${scenario.id}-form.png`);
  const resultImage = path.join(evidenceDirectory, `${scenario.id}-result.png`);
  try {
    before = await readHistory(page, baseUrl);
    assert.equal(before.length, 0, 'Context baru tidak boleh membawa riwayat sebelumnya.');
    const response = await page.goto(`${baseUrl}/shipment-form.html`, { waitUntil: 'domcontentloaded' });
    assert.equal(response?.status(), 200);
    await page.waitForSelector(selectors.form, { visible: true });
    await page.type(selectors.tracking, scenario.tracking);
    await page.type(selectors.weight, String(scenario.weight));
    await page.type(selectors.distance, String(scenario.distance));
    await page.screenshot({ path: formImage, fullPage: true });

    const nativeValid = await page.$eval(selectors.form, form => {
      window.shipmentInvalidEvents = [];
      form.addEventListener('invalid', event => window.shipmentInvalidEvents.push(event.target.id), true);
      return form.checkValidity();
    });
    // discard checkValidity's events; only the real submit click may prove rejection.
    await page.evaluate(() => { window.shipmentInvalidEvents = []; });
    if (!nativeValid) {
      await page.click(selectors.submit);
      await page.waitForFunction(() => window.shipmentInvalidEvents.length > 0);
      const detail = await page.evaluate(() => {
        const field = document.getElementById(window.shipmentInvalidEvents[0]);
        return {
          invalidField: field.id, message: field.validationMessage,
          validity: Object.fromEntries(['valueMissing', 'rangeUnderflow', 'rangeOverflow', 'badInput', 'stepMismatch', 'tooLong'].map(key => [key, field.validity[key]])),
        };
      });
      actual = { kind: 'VALIDATION_ERROR', layer: 'browser', postCount, ...detail };
      assert.equal(new URL(page.url()).pathname, '/shipment-form.html');
      await page.screenshot({ path: resultImage, fullPage: true });
      after = await readHistory(page, baseUrl);
    } else {
      // start waiting before clicking so a fast POST/303 cannot race the observer.
      const [navigation] = await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded' }), page.click(selectors.submit),
      ]);
      const statusCode = navigation?.status();
      const pathname = new URL(page.url()).pathname;
      if (statusCode === 200 && pathname === '/request-history.php') {
        await page.waitForSelector(selectors.rows, { visible: true });
        const notice = await page.$eval('[role="status"]', element => element.textContent.trim());
        actual = { kind: 'SUCCESS', statusCode, notice, postCount };
      } else if (statusCode === 422 && pathname === '/submit-request.php') {
        await page.waitForSelector('[role="alert"]', { visible: true });
        const message = await page.$eval('[role="alert"]', element => element.textContent.trim());
        actual = { kind: 'VALIDATION_ERROR', layer: 'server', statusCode, message, postCount };
      } else actual = { kind: 'UNEXPECTED_RESPONSE', statusCode, postCount };
      await page.screenshot({ path: resultImage, fullPage: true });
      after = await readHistory(page, baseUrl);
    }
    verifyResult(scenario, actual, before, after);
    assert.deepEqual(runtimeErrors, [], 'Browser memiliki error JavaScript.');
  } catch (error) {
    failure = error.message;
    if (actual.kind === 'NOT_RUN') actual = { kind: 'AUTOMATION_ERROR', postCount };
    await page.screenshot({ path: resultImage, fullPage: true }).catch(() => {});
  } finally { await context.close(); }

  return {
    id: scenario.id, scenario: scenario.scenario, input: { tracking: scenario.tracking, weight: scenario.weight, distance: scenario.distance },
    expected: scenario.expected, actual: actual.kind, status: failure ? 'FAIL' : 'PASS',
    expectedCost: scenario.expectedCost ?? null, actualCost: actual.kind === 'SUCCESS' ? after.at(-1)?.cost ?? null : null,
    verification: actual, historyBefore: before, historyAfter: after, runtimeErrors,
    error: failure || null, durationMs: Date.now() - started,
    evidence: { form: path.relative(root, formImage).replaceAll('\\', '/'), result: path.relative(root, resultImage).replaceAll('\\', '/') },
  };
}

function options(args) {
  const config = { headed: false, dataset: path.join(root, 'tests/shipment-test-data.json'), output: root };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--headed') config.headed = true;
    else if (args[i] === '--dataset' || args[i] === '--output') {
      const option = args[i].slice(2);
      assert.ok(args[i + 1], `Nilai ${args[i]} belum diisi.`);
      config[option] = path.resolve(root, args[++i]);
    } else throw new Error(`Opsi tidak dikenali: ${args[i]}`);
  }
  const relative = path.relative(root, config.output);
  assert.ok(!relative.startsWith('..') && !path.isAbsolute(relative), 'Output harus berada dalam folder tugas.');
  return config;
}

export async function main(args = process.argv.slice(2)) {
  const config = options(args);
  const dataset = validateDataset(JSON.parse(await fs.readFile(config.dataset, 'utf8')));
  const evidenceDirectory = path.join(config.output, 'docs/automation-run');
  await fs.mkdir(evidenceDirectory, { recursive: true });
  const results = [];
  let browser;
  let app;
  const startedAt = new Date().toISOString();
  try {
    const baseUrl = process.env.BASE_URL ? localBaseUrl(process.env.BASE_URL) : (app = await startApp(Number(process.env.APP_PORT || 3122))).baseUrl;
    browser = await puppeteer.launch({ headless: !config.headed, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' }) });
    for (const scenario of dataset) {
      console.log(`Testing: ${scenario.scenario}`);
      const result = await runScenario(browser, baseUrl, scenario, evidenceDirectory);
      results.push(result);
      console.log(`Expected: ${result.expected}\nActual: ${result.actual}\nStatus: ${result.status}`);
      if (result.error) console.log(`Reason: ${result.error}`);
      // save progress after every scenario, not just when the whole suite finishes.
      await fs.writeFile(path.join(config.output, 'test-results.json'), JSON.stringify(results, null, 2) + '\n');
    }
  } catch (error) {
    results.push({ scenario: 'Runner setup', expected: 'READY', actual: 'SETUP_ERROR', status: 'FAIL', error: error.message });
    console.error(error.message);
  } finally {
    await browser?.close(); app?.stop();
    await fs.writeFile(path.join(config.output, 'test-results.json'), JSON.stringify(results, null, 2) + '\n');
    const summary = { startedAt, finishedAt: new Date().toISOString(), node: process.version, dataset: path.relative(root, config.dataset),
      total: results.length, pass: results.filter(row => row.status === 'PASS').length, fail: results.filter(row => row.status === 'FAIL').length };
    await fs.writeFile(path.join(config.output, 'run-summary.json'), JSON.stringify(summary, null, 2) + '\n');
    console.log(`Regression result: ${summary.pass} PASS / ${summary.fail} FAIL`);
    process.exitCode = summary.fail ? 1 : 0;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
