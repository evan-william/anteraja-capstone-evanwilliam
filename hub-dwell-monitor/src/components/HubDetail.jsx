import { useEffect, useRef } from 'react';
import { count, hours, isPriority } from '../metrics.js';

export default function HubDetail({ hub, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const element = dialog.current;
    element.showModal();
    return () => { element.close(); if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, []);
  return <dialog ref={dialog} className="hub-detail" aria-labelledby="detail-name" onCancel={onClose}>
    <header><p className="eyebrow">Detail hub · {hub.hub_id}</p><button type="button" onClick={onClose} aria-label="Tutup detail hub">Tutup ×</button></header>
    <h2 id="detail-name">{hub.hub_name}</h2><p>{hub.city}</p>
    <p className="detail-mean">{hours(hub.mean_dwell_hours)}</p><p>Rata-rata waktu di hub dari kunjungan selesai.</p>
    <dl className="detail-metrics">
      {Object.entries({ 'Mean dwell time': hours(hub.mean_dwell_hours), 'Min dwell time': hours(hub.min_dwell_hours), 'Max dwell time': hours(hub.max_dwell_hours), 'Completed visits': count(hub.completed_visits), 'Open visits (tidak ikut mean)': count(hub.open_visits), 'Investigation Priority': isPriority(hub) ? 'Prioritas investigasi' : 'Pantau rutin', 'Pasangan valid': `${hub.valid_pair_pct.toFixed(2)}%`, 'Pasangan dikecualikan': count(hub.excluded_pairs) }).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
    </dl>
    {hub.completed_visits < 30 && <aside className="sample-warning"><h3>Sampel kecil: audit sebelum menyimpulkan</h3><p>Hanya {hub.completed_visits} completed visits. Periksa scan arrival/departure dan kualitas data sebelum mengambil keputusan kapasitas.</p></aside>}
    <p className="footnote">Threshold &gt;6 jam adalah aturan simulasi latihan, bukan SLA resmi Anteraja.</p>
  </dialog>;
}
