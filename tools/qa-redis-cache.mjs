import { request } from '@playwright/test';
import fs from 'node:fs';
import assert from 'node:assert/strict';

// Local QA only; never print credentials or customer data.
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:3000';
const line = fs.readFileSync('roles_password.txt', 'utf8').split(/\r?\n/).find(line => line.startsWith('Seller'));
const credentials = line?.match(/:\s*(\S+@\S+)\s*\/\s*(\S+)/);
if (!credentials) throw new Error('Seller demo credentials unavailable');
const context = await request.newContext({ baseURL: base });
try {
  const login = await context.post('/api/v1/auth/login', {
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
    data: { email: credentials[1], password: credentials[2] },
  });
  assert.equal(login.status(), 200);
  const first = await context.get('/api/v1/categories?status=active');
  const second = await context.get('/api/v1/categories?status=active');
  assert.equal(first.status(), 200);
  assert.equal(second.status(), 200);
  assert.deepEqual(await first.json(), await second.json());
  const id = second.headers()['x-request-id'];
  const events = fs.readdirSync('.private/logs').filter(name => name.endsWith('.jsonl'))
    .flatMap(name => fs.readFileSync('.private/logs/' + name, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line)))
    .filter(event => event.request_id === id);
  if (process.env.QA_REDIS_OFFLINE === '1') {
    assert.ok(events.some(event => event.event === 'cache.unavailable'), 'Expected Redis outage event');
    assert.ok(events.some(event => event.event === 'upstream.completed' && String(event.target).includes('categories')), 'Fallback did not read categories from DB');
    console.log('PASS: Redis offline; Seller login and identical category data still work through Supabase.');
  } else {
    assert.ok(events.some(event => event.event === 'cache.hit' && event.target === 'categories'), 'Second read did not hit Redis');
    assert.ok(!events.some(event => event.event === 'upstream.completed' && String(event.target).includes('categories')), 'Cache hit still selected categories from DB');
    console.log('PASS: Seller login, identical category data, real Redis HIT, no category SELECT on second read.');
  }
  const anonymous = await request.newContext({ baseURL: base });
  const denied = await anonymous.get('/api/v1/categories');
  assert.equal(denied.status(), 401);
  await anonymous.dispose();
  console.log('PASS: anonymous category request denied despite warm Redis cache.');
} finally {
  await context.post('/api/v1/auth/logout', { headers: { 'X-Requested-With': 'XMLHttpRequest' }, data: {} });
  await context.dispose();
}
