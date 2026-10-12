import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { root } from './server.js';

// an intentionally wrong oracle must fail without overwriting the real report.
const output = path.join(root, 'docs/runner-checks');
await fs.mkdir(output, { recursive: true });
const data = JSON.parse(await fs.readFile(path.join(root, 'tests/shipment-test-data.json'), 'utf8'));
const dataset = path.join(output, 'wrong-expectation.json');
await fs.writeFile(dataset, JSON.stringify([{ ...data[0], id: 'wrong-cost', expectedCost: 1 }], null, 2));
const run = spawnSync(process.execPath, ['tests/shipment-regression.js', '--dataset', dataset, '--output', output], { cwd: root, encoding: 'utf8', timeout: 60000 });
assert.equal(run.status, 1, run.stderr || run.stdout);
const results = JSON.parse(await fs.readFile(path.join(output, 'test-results.json'), 'utf8'));
assert.equal(results.length, 1);
assert.equal(results[0].status, 'FAIL');
assert.equal(results[0].actual, 'SUCCESS');
assert.equal(results[0].actualCost, 43750);
assert.match(results[0].error, /Tarif berbeda/);
console.log('PASS: wrong expected cost produces FAIL and exit code 1; real report preserved.');
