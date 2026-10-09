import { count, hours, ranked } from '../metrics.js';

export default function TopHubs({ hubs, onSelect }) {
  const top = ranked(hubs).slice(0, 3);
  return <section aria-labelledby="ranking-title" className="ranking">
    <header className="section-heading"><h2 id="ranking-title">Top 3 hub</h2><p>Mean dwell tertinggi · ranking angka mentah</p></header>
    {top.length ? <ol className="top-hubs" role="list">{top.map((hub, index) => <li key={hub.hub_id}>
      <button type="button" onClick={() => onSelect(hub.hub_id)} aria-label={`Buka detail ${hub.hub_name}`}>
        <span className="rank-number">0{index + 1}</span><span className="rank-copy"><strong>{hub.hub_name}</strong><span>{count(hub.completed_visits)} kunjungan{hub.completed_visits < 30 ? ' · Sampel kecil' : ''}</span></span>
        <strong className="rank-value">{hours(hub.mean_dwell_hours)}</strong>
      </button><div className="dwell-bar" aria-hidden="true"><span style={{ '--bar-width': `${100 * hub.mean_dwell_hours / top[0].mean_dwell_hours}%` }} /></div>
    </li>)}</ol> : <p>Tidak ada completed visit untuk diranking.</p>}
  </section>;
}
