export const THRESHOLD_HOURS = 6;

// Keep full precision for calculations; round only when displaying a value.
export const hours = value => value === null ? 'Tidak tersedia' : `${new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} jam`;
export const count = value => new Intl.NumberFormat('id-ID').format(value);
export const isPriority = hub => hub.completed_visits > 0 && hub.mean_dwell_hours > THRESHOLD_HOURS;
export const ranked = hubs => [...hubs].filter(hub => hub.completed_visits > 0).sort((a, b) => b.mean_dwell_hours - a.mean_dwell_hours || a.hub_id.localeCompare(b.hub_id));
export function globalKpi(hubs) {
  const visits = hubs.reduce((sum, hub) => sum + hub.completed_visits, 0);
  return {
    total_hubs: hubs.length,
    completed_visits: visits,
    mean_dwell_hours: visits ? hubs.reduce((sum, hub) => sum + hub.total_dwell_hours, 0) / visits : null,
    priority_hubs: hubs.filter(isPriority).length,
  };
}
export function filterHubs(hubs, query, priorityOnly) {
  const text = query.trim().toLocaleLowerCase('id-ID');
  return ranked(hubs).concat(hubs.filter(hub => hub.completed_visits === 0)).filter(hub =>
    (!priorityOnly || isPriority(hub)) && `${hub.hub_name} ${hub.hub_id} ${hub.city}`.toLocaleLowerCase('id-ID').includes(text));
}
export function validateData(metrics, locations) {
  if (!Array.isArray(metrics?.hubs) || !Array.isArray(locations?.hubs)) throw new Error('Format data hub tidak valid.');
  const ids = new Set();
  for (const hub of metrics.hubs) {
    if (typeof hub.hub_id !== 'string' || !hub.hub_id || ids.has(hub.hub_id)) throw new Error('hub_id hilang atau duplikat.');
    ids.add(hub.hub_id);
    for (const name of ['completed_visits', 'open_visits', 'total_dwell_hours']) {
      if (!Number.isFinite(hub[name]) || hub[name] < 0) throw new Error(`Angka ${name} tidak valid.`);
    }
    if (!Number.isInteger(hub.completed_visits) || !Number.isInteger(hub.open_visits)) throw new Error('Jumlah kunjungan harus bilangan bulat.');
    if (hub.completed_visits === 0) {
      if (hub.total_dwell_hours !== 0 || ['mean_dwell_hours','min_dwell_hours','max_dwell_hours'].some(name => hub[name] !== null)) throw new Error('Hub tanpa completed visit harus memiliki mean/min/max null.');
    } else {
      if (['mean_dwell_hours','min_dwell_hours','max_dwell_hours'].some(name => !Number.isFinite(hub[name]) || hub[name] < 0)) throw new Error('Dwell time tidak valid.');
      if (hub.min_dwell_hours > hub.mean_dwell_hours || hub.mean_dwell_hours > hub.max_dwell_hours || Math.abs(hub.mean_dwell_hours - hub.total_dwell_hours / hub.completed_visits) > 1e-8) throw new Error('Mean/min/max tidak konsisten.');
    }
  }
  const points = new Map();
  for (const location of locations.hubs) {
    if (!ids.has(location.hub_id) || points.has(location.hub_id)) throw new Error('hub_id lokasi tidak konsisten.');
    if (!Number.isFinite(location.lat) || !Number.isFinite(location.lng) || Math.abs(location.lat) > 90 || Math.abs(location.lng) > 180) throw new Error('Koordinat lokasi tidak valid.');
    points.set(location.hub_id, location);
  }
  if (points.size !== ids.size) throw new Error('Ada hub tanpa koordinat.');
  return metrics.hubs.map(hub => ({ ...hub, ...points.get(hub.hub_id) }));
}
export function validateSummary(summary, hubs) {
  if (!summary || typeof summary.summary !== 'string' || !Array.isArray(summary.priority_hubs) || !Array.isArray(summary.next_checks) || summary.next_checks.some(value => typeof value !== 'string')) return false;
  const expected = hubs.filter(isPriority).map(hub => hub.hub_id).sort();
  return JSON.stringify([...summary.priority_hubs].sort()) === JSON.stringify(expected);
}
