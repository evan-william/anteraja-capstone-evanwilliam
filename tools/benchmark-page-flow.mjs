import { chromium } from '@playwright/test';
import fs from 'node:fs';
import { performance } from 'node:perf_hooks';

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:3002';
const phase = process.env.QA_PHASE || 'after';
if (!['before', 'after'].includes(phase)) throw new Error('QA_PHASE must be before or after');
const credentials = fs.readFileSync('roles_password.txt', 'utf8').split(/\r?\n/);
const browser = await chromium.launch();
const results = [];
try {
  for (const [label, role, route] of [['Admin', 'admin', '/admin'], ['Seller', 'seller', '/seller'], ['Konsumen', 'consumer', '/akun']]) {
    const match = credentials.find(line => line.startsWith(label))?.match(/:\s*(\S+@\S+)\s*\/\s*(\S+)/);
    if (!match) throw new Error('missing local demo account');
    const context = await browser.newContext();
    const login = await context.request.post(base + '/api/v1/auth/login', { headers: { 'X-Requested-With': 'XMLHttpRequest' }, data: { email: match[1], password: match[2] } });
    if (login.status() !== 200) throw new Error('demo login failed');
    const page = await context.newPage();
    for (let sample = 0; sample < 3; sample++) {
      await page.goto('about:blank');
      const calls = [];
      const apiStarts = [];
      const apiEnds = [];
      const errors = [];
      const record = request => { if (new URL(request.url()).pathname.startsWith('/api/')) { calls.push(new URL(request.url()).pathname); apiStarts.push(performance.now()); } };
      const recordEnd = request => { if (new URL(request.url()).pathname.startsWith('/api/')) apiEnds.push(performance.now()); };
      const recordError = error => errors.push(error.message);
      page.on('request', record);
      page.on('requestfinished', recordEnd);
      page.on('pageerror', recordError);
      const started = performance.now();
      await page.goto(base + route);
      await page.getByRole('heading', { level: 1 }).first().waitFor();
      await page.waitForFunction(() => !document.body.textContent.includes('Memuat data…') && document.querySelector('main section'));
      results.push({ role, sample, totalMilliseconds: Math.round(performance.now() - started), apiSystemMilliseconds: apiStarts.length && apiEnds.length ? Math.round(Math.max(...apiEnds) - Math.min(...apiStarts)) : null, apiCalls: calls });
      console.log(JSON.stringify(results.at(-1)));
      page.off('request', record);
      page.off('requestfinished', recordEnd);
      page.off('pageerror', recordError);
      if (errors.length) throw new Error('browser errors during flow');
    }
    await context.close();
  }
} finally {
  fs.mkdirSync('output/laravel-qa', { recursive: true });
  fs.writeFileSync(`output/laravel-qa/page-flow-${phase}.json`, JSON.stringify({ measuredAt: new Date().toISOString(), base, results }, null, 2));
  await browser.close();
}
