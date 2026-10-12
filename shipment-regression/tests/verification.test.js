import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateDataset, verifyResult } from './verification.js';
import { readFileSync } from 'node:fs';

const rows = JSON.parse(readFileSync(new URL('./shipment-test-data.json', import.meta.url)));
test('dataset has required positive, negative and edge cases', () => {
  validateDataset(rows);
  assert.ok(rows.some(row => row.tracking === 'ANT-001' && row.weight === 5 && row.distance === 25));
  assert.ok(rows.some(row => row.tracking === '' && row.expected === 'VALIDATION_ERROR'));
  assert.ok(rows.some(row => row.weight === -10 && row.expected === 'VALIDATION_ERROR'));
});
test('duplicate IDs and path traversal names are rejected', () => {
  assert.throws(() => validateDataset([rows[0], rows[0]]));
  assert.throws(() => validateDataset([{ ...rows[0], id: '../unsafe' }]));
});
test('unknown expectation and non-finite input are rejected', () => {
  assert.throws(() => validateDataset([{ ...rows[0], expected: 'OK' }]));
  assert.throws(() => validateDataset([{ ...rows[0], weight: Infinity }]));
});
test('wrong cost cannot pass even if submit and tracking succeed', () => {
  assert.throws(() => verifyResult(rows[0], { kind: 'SUCCESS', statusCode: 200, notice: 'ANT-001 berhasil' }, [], [{ tracking: 'ANT-001', weight: 5, distance: 25, cost: 1 }]));
});
test('server failure is not mistaken for a successful negative test', () => {
  const row = rows.find(item => item.validation?.layer === 'server');
  assert.throws(() => verifyResult(row, { kind: 'VALIDATION_ERROR', layer: 'server', statusCode: 500, message: row.validation.message }, [], []));
});
test('invalid input cannot change history even if an error message is present', () => {
  assert.throws(() => verifyResult(rows[1], { kind: 'VALIDATION_ERROR', layer: 'browser', postCount: 0, invalidField: 'tracking-number', validity: { valueMissing: true }, message: 'Required' }, [], [{ tracking: '' }]));
});
