import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

// local demo credentials are read privately; output contains only timings and counts.
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:3002';
const lines = fs.readFileSync('roles_password.txt', 'utf8').split(/\r?\n/);
const browser = await chromium.launch({ headless: true });
const results = [];
async function measure(context, label, route, expected = 200, options) {
  const start = performance.now();
  const response = options
    ? await context.request.post(base + route, { ...options, timeout: 90000 })
    : await context.request.get(base + route, { timeout: 90000 });
  const body = await response.json();
  const entry = { label, status: response.status(), milliseconds: Math.round(performance.now() - start) };
  results.push(entry);
  console.log(JSON.stringify(entry));
  if (response.status() !== expected) throw new Error(label + ': unexpected status');
  return body;
}
try {
  const publicContext = await browser.newContext();
  await measure(publicContext, 'health', '/api/health');
  for (let i = 0; i < 3; i++) await measure(publicContext, 'public tracking', '/api/v1/tracking/ANT-100015?code=260926');
  await measure(publicContext, 'invalid tracking code', '/api/v1/tracking/ANT-100015?code=000000', 404);
  const road = '/api/v1/road-route?from=-6.2088,106.8456&to=-6.2615,106.8106';
  await measure(publicContext, 'road initial', road);
  await measure(publicContext, 'road cached', road);
  await publicContext.close();
  for (const [label, role, area] of [['Admin', 'admin', 'admin-shipments'], ['Seller', 'seller', 'seller'], ['Konsumen', 'consumer', 'consumer']]) {
    const match = lines.find(line => line.startsWith(label))?.match(/:\s*(\S+@\S+)\s*\/\s*(\S+)/);
    if (!match) throw new Error('missing local demo credentials for ' + role);
    const context = await browser.newContext();
    const login = await measure(context, role + ' login', '/api/v1/auth/login', 200, {
      headers: { 'X-Requested-With': 'XMLHttpRequest' }, data: { email: match[1], password: match[2] },
    });
    if (login.data?.role !== role) throw new Error('incorrect authenticated role');
    for (let i = 0; i < 3; i++) {
      const body = await measure(context, role + ' data', '/api/v1/view/' + area);
      if (!Array.isArray(body.data?.shipments)) throw new Error('missing shipments');
      if (role === 'admin' && (!Number.isInteger(body.data.count) || body.data.count < body.data.shipments.length)) throw new Error('invalid count');
    }
    if (role !== 'admin') await measure(context, role + ' denied admin', '/api/v1/view/admin', 403);
    if (role === 'admin') await measure(context, 'admin denied finance', '/api/v1/categories', 403);
    await measure(context, role + ' logout', '/api/v1/auth/logout', 200, {
      headers: { 'X-Requested-With': 'XMLHttpRequest' }, data: {},
    });
    const after = await measure(context, role + ' logged out', '/api/v1/auth/me');
    if (after.data !== null) throw new Error('session survived logout');
    await context.close();
  }
} finally {
  const folder = path.resolve('output/laravel-qa');
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(path.join(folder, 'performance.json'), JSON.stringify({ measuredAt: new Date().toISOString(), base, results }, null, 2));
  await browser.close();
}
