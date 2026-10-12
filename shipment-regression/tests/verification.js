import assert from 'node:assert/strict';

export function validateDataset(data) {
  assert.ok(Array.isArray(data) && data.length > 0, 'Dataset harus berupa array berisi skenario.');
  const ids = new Set();
  for (const row of data) {
    assert.match(row.id || '', /^[a-z0-9][a-z0-9-]{0,79}$/, 'ID skenario harus aman untuk nama file.');
    assert.ok(!ids.has(row.id), 'ID skenario harus unik.'); ids.add(row.id);
    assert.ok(typeof row.scenario === 'string' && row.scenario.length > 0);
    assert.equal(typeof row.tracking, 'string');
    assert.ok(Number.isFinite(row.weight) && Number.isFinite(row.distance), 'Angka dataset harus finite.');
    assert.ok(['SUCCESS', 'VALIDATION_ERROR'].includes(row.expected));
    if (row.expected === 'SUCCESS') assert.ok(Number.isFinite(row.expectedCost) && row.expectedCost >= 0, 'SUCCESS memerlukan expectedCost independen.');
    else {
      assert.ok(['browser', 'server'].includes(row.validation?.layer));
      if (row.validation.layer === 'browser') {
        assert.ok(['tracking-number', 'weight', 'distance'].includes(row.validation.field));
        assert.ok(['valueMissing', 'rangeUnderflow', 'rangeOverflow', 'badInput', 'stepMismatch', 'tooLong'].includes(row.validation.reason));
      } else assert.ok(typeof row.validation.message === 'string' && row.validation.message.length > 0);
    }
  }
  return data;
}

export function verifyResult(scenario, actual, before, after) {
  assert.equal(actual.kind, scenario.expected, 'Expected result berbeda dari actual result.');
  if (scenario.expected === 'SUCCESS') {
    assert.equal(actual.statusCode, 200);
    assert.equal(after.length, before.length + 1, 'Riwayat harus bertambah tepat satu permintaan.');
    const row = after.at(-1);
    assert.equal(row.tracking, scenario.tracking.trim(), 'Resi harus muncul pada Request History.');
    assert.equal(row.weight, scenario.weight);
    assert.equal(row.distance, scenario.distance);
    assert.equal(row.cost, scenario.expectedCost, 'Tarif berbeda dari nilai harapan pada JSON.');
    assert.ok(actual.notice.includes(scenario.tracking.trim()), 'Pesan sukses harus menyebut resi.');
  } else {
    assert.deepEqual(after, before, 'Input invalid tidak boleh menambah/mengubah Request History.');
    if (scenario.validation.layer === 'browser') {
      assert.equal(actual.layer, 'browser');
      assert.equal(actual.postCount, 0, 'Validasi native harus menghentikan POST.');
      assert.equal(actual.invalidField, scenario.validation.field);
      assert.equal(actual.validity[scenario.validation.reason], true);
      assert.ok(actual.message.length > 0);
    } else {
      assert.equal(actual.layer, 'server');
      assert.equal(actual.statusCode, 422);
      assert.ok(actual.message.includes(scenario.validation.message));
    }
  }
}
