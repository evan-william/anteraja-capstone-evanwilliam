import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { globalKpi, filterHubs, ranked, isPriority, validateData, validateSummary } from '../src/metrics.js';

const metrics = JSON.parse(fs.readFileSync(new URL('../public/data/metrics.json', import.meta.url)));
const locations = JSON.parse(fs.readFileSync(new URL('../public/data/locations.json', import.meta.url)));
const hubs = validateData(metrics, locations);
test('joins exactly eight unique hub IDs', () => { assert.equal(hubs.length, 8); assert.equal(new Set(hubs.map(hub => hub.hub_id)).size, 8); });
test('global mean is completed-visit weighted, not average of hub means', () => {
  const kpi = globalKpi(hubs);
  assert.equal(kpi.completed_visits, 2182);
  const pairs = fs.readFileSync(new URL('../data-source/package_dwell.csv', import.meta.url), 'utf8').trim().split(/\r?\n/).slice(1);
  const oracle = pairs.reduce((sum, line) => sum + Number(line.split(',')[4]), 0) / pairs.length;
  assert(Math.abs(kpi.mean_dwell_hours - oracle) < 1e-9);
  assert.notEqual(kpi.mean_dwell_hours, hubs.reduce((sum, hub) => sum + hub.mean_dwell_hours, 0) / hubs.length);
});
test('adding open visits never changes completed mean', () => { assert.deepEqual(globalKpi(hubs), globalKpi(hubs.map(hub => ({ ...hub, open_visits: 999999 })))); });
test('ranking uses unrounded numbers and does not mutate its input', () => {
  const input = [{hub_id:'A',completed_visits:1,mean_dwell_hours:9.999}, {hub_id:'B',completed_visits:1,mean_dwell_hours:10.001}];
  assert.equal(ranked(input)[0].hub_id, 'B'); assert.equal(input[0].hub_id, 'A');
  assert.deepEqual(ranked(hubs).slice(0,3).map(hub => hub.hub_id), ['HUB_REMOTE','HUB_MKS','HUB_DPS']);
});
test('priority threshold is strictly above six hours', () => { assert(!isPriority({completed_visits:1,mean_dwell_hours:6})); assert(isPriority({completed_visits:1,mean_dwell_hours:6.001})); assert(!isPriority({completed_visits:0,mean_dwell_hours:99})); assert.equal(globalKpi(hubs).priority_hubs, 5); });
test('one search and priority filter intersect without mutation', () => { assert.equal(filterHubs(hubs, '  MAKASSAR  ', true).length, 1); assert.equal(filterHubs(hubs, 'Jakarta', true).length, 0); assert.equal(filterHubs(hubs, 'HUB_JKT', false)[0].hub_id, 'HUB_JKT'); assert.equal(filterHubs(hubs,'不存在',false).length,0); });
test('empty dataset has unavailable mean, no fake zero', () => { assert.equal(globalKpi([]).mean_dwell_hours, null); assert.equal(ranked([]).length,0); assert.deepEqual(validateData({hubs:[]},{hubs:[]}),[]); });
test('duplicate metrics and locations rejected', () => { assert.throws(() => validateData({hubs:[hubs[0],hubs[0]]},locations)); assert.throws(() => validateData(metrics,{hubs:[...locations.hubs,locations.hubs[0]]})); });
test('missing, foreign and invalid locations rejected', () => { assert.throws(() => validateData(metrics,{hubs:locations.hubs.slice(1)})); assert.throws(() => validateData(metrics,{hubs:[{hub_id:'FAKE',lat:0,lng:0}]})); const bad=structuredClone(locations);bad.hubs[0].lat=91;assert.throws(() => validateData(metrics,bad)); });
test('invalid and contradictory numeric metrics rejected', () => { for(const changes of [{completed_visits:-1},{mean_dwell_hours:'30'},{mean_dwell_hours:NaN},{min_dwell_hours:9999},{total_dwell_hours:0}]){const bad=structuredClone(metrics);Object.assign(bad.hubs[0],changes);assert.throws(()=>validateData(bad,locations));} });
test('AI summary must contain exact priority IDs, not invented hubs', () => { const valid={summary:'Ringkasan',priority_hubs:hubs.filter(isPriority).map(hub=>hub.hub_id),next_checks:[]};assert(validateSummary(valid,hubs));assert(!validateSummary({...valid,priority_hubs:['FAKE']},hubs));assert(!validateSummary({...valid,next_checks:[{}]},hubs)); });
test('all per-hub minimum and maximum reconcile against raw completed pairs', () => {
  const lines=fs.readFileSync(new URL('../data-source/package_dwell.csv',import.meta.url),'utf8').trim().split(/\r?\n/).slice(1);
  for(const hub of hubs){const values=lines.filter(line=>line.startsWith(hub.hub_id+',')).map(line=>Number(line.split(',')[4]));assert.equal(hub.min_dwell_hours,Math.min(...values));assert.equal(hub.max_dwell_hours,Math.max(...values));}
});
