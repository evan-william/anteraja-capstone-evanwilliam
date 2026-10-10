import fs from 'node:fs';
import crypto from 'node:crypto';

// Source files are exported by the completed Day 18 Spark analysis, not invented metrics.
const source = new URL('../data-source/', import.meta.url);
function csv(file) {
  const [header, ...lines] = fs.readFileSync(new URL(file, source), 'utf8').trim().split(/\r?\n/);
  const columns = header.split(',');
  return lines.map(line => Object.fromEntries(line.split(',').map((value, i) => [columns[i], value])));
}
const pairs = csv('package_dwell.csv');
const audit = csv('all_hubs.csv');
const cityPoints = {
  HUB_JKT: ['Hub Jakarta', 'Jakarta', -6.1754, 106.8272],
  HUB_BDG: ['Hub Bandung', 'Bandung', -6.9175, 107.6191],
  HUB_SBY: ['Hub Surabaya', 'Surabaya', -7.2575, 112.7521],
  HUB_SMG: ['Hub Semarang', 'Semarang', -6.9667, 110.4167],
  HUB_MED: ['Hub Medan', 'Medan', 3.5952, 98.6722],
  HUB_DPS: ['Hub Denpasar', 'Denpasar', -8.65, 115.2167],
  HUB_MKS: ['Hub Makassar', 'Makassar', -5.1477, 119.4327],
  HUB_REMOTE: ['Hub Remote', 'Palangka Raya (lokasi simulasi)', -2.2096, 113.9213],
};
const seen = new Set();
for (const pair of pairs) {
  const key = `${pair.hub_id}:${pair.package_id}`;
  if (seen.has(key) || !Number.isFinite(Number(pair.dwell_hours)) || Number(pair.dwell_hours) < 0) throw new Error('Invalid completed pair source.');
  seen.add(key);
}
const hubs = audit.map(row => {
  const values = pairs.filter(pair => pair.hub_id === row.hub_id).map(pair => Number(pair.dwell_hours));
  const total = values.reduce((sum, value) => sum + value, 0);
  if (!values.length || values.length !== Number(row.package_count) || Math.abs(total / values.length - Number(row.avg_dwell_hours)) > 1e-8) throw new Error('Source reconciliation failed.');
  const point = cityPoints[row.hub_id];
  if (!point) throw new Error('Missing location mapping.');
  return { hub_id: row.hub_id, hub_name: point[0], city: point[1], completed_visits: values.length,
    open_visits: Number(row.missing_departure), total_dwell_hours: total, mean_dwell_hours: total / values.length,
    min_dwell_hours: Math.min(...values), max_dwell_hours: Math.max(...values),
    valid_pair_pct: Number(row.valid_pair_pct), excluded_pairs: Number(row.candidate_pairs) - values.length };
});
const metrics = { schema_version: 1, period: 'September 2026 (UTC)', simulation: true,
  threshold_hours: 6, threshold_operator: '>', source: 'Day 18 Spark output: package_dwell.csv + all_hubs.csv',
  source_sha256: Object.fromEntries(['package_dwell.csv', 'all_hubs.csv'].map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(new URL(file, source))).digest('hex')])), hubs };
const locations = { schema_version: 1, source: 'Approximate city-centre coordinates, curated for this exercise; not verified Anteraja hub addresses or GPS.', hubs: hubs.map(hub => ({hub_id: hub.hub_id, lat: cityPoints[hub.hub_id][2], lng: cityPoints[hub.hub_id][3]})) };
fs.mkdirSync(new URL('../public/data/', import.meta.url), {recursive: true});
for (const [file, value] of [['metrics.json', metrics], ['locations.json', locations]]) fs.writeFileSync(new URL('../public/data/'+file, import.meta.url), JSON.stringify(value, null, 2)+'\n');
console.log(`Prepared ${hubs.length} hubs and ${pairs.length} completed visits; open visits excluded from mean.`);
