import { count, hours, isPriority } from '../metrics.js';

export default function HubList({ hubs, total, onSelect, onReset }) {
  return <section aria-labelledby="list-title" className="hub-list">
    <header className="section-heading"><h2 id="list-title">Daftar hub</h2><p aria-live="polite">{hubs.length} dari {total} hub</p></header>
    {hubs.length ? <ul role="list">{hubs.map(hub => <li key={hub.hub_id} data-hub-id={hub.hub_id}>
      <button type="button" className="hub-row" onClick={() => onSelect(hub.hub_id)} aria-label={`Detail ${hub.hub_name}`}>
        <span className="hub-row-heading"><strong>{hub.hub_name}</strong><strong>{hours(hub.mean_dwell_hours)}</strong></span>
        <span className="hub-row-meta"><span>{hub.hub_id} · {count(hub.completed_visits)} visits</span><span className={isPriority(hub) ? 'priority-label' : 'normal-label'}>{isPriority(hub) ? '● Prioritas' : '✓ Pantau rutin'}</span></span>
      </button>
    </li>)}</ul> : <div className="empty-state" role="status"><h3>Hub tidak ditemukan</h3><p>Coba nama kota lain atau tampilkan semua hub.</p><button type="button" onClick={onReset}>Hapus filter</button></div>}
  </section>;
}
