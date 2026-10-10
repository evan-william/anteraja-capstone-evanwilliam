import { useMemo, useState } from 'react';
import { useHubData } from './useHubData.js';
import { filterHubs, globalKpi } from './metrics.js';
import KpiOverview from './components/KpiOverview.jsx';
import TopHubs from './components/TopHubs.jsx';
import HubFilters from './components/HubFilters.jsx';
import HubList from './components/HubList.jsx';
import HubMap from './components/HubMap.jsx';
import HubDetail from './components/HubDetail.jsx';

export default function App() {
  const [revision, setRevision] = useState(0);
  const [query, setQuery] = useState('');
  const [priorityOnly, setPriorityOnly] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const data = useHubData(revision);
  const kpi = useMemo(() => globalKpi(data.hubs), [data.hubs]);
  const visibleHubs = useMemo(() => filterHubs(data.hubs, query, priorityOnly), [data.hubs, query, priorityOnly]);
  const selected = data.hubs.find(hub => hub.hub_id === selectedId);
  function reset() { setQuery(''); setPriorityOnly(false); }
  function reload() { setSelectedId(null); setRevision(value => value + 1); }
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Lewati ke dashboard</a>
    <header className="app-header"><a href="./" className="brand" aria-label="Beranda Hub Dwell Monitor"><img src={`${import.meta.env.BASE_URL}brand/anteraja-mark-small.png`} width="36" height="36" alt="" /><strong>anteraja</strong></a><p>Hub Dwell Monitor</p><span className="workspace-label">Ruang kerja supervisor</span></header>
    <main id="main-content" className="dashboard">
      <header className="page-heading"><div><p className="eyebrow">Operasional hub</p><h1>Monitor waktu di hub</h1><p>Bandingkan dwell time, cek lokasi, lalu tentukan prioritas investigasi.</p></div><button type="button" onClick={reload} disabled={data.isLoading}>Muat ulang data</button></header>
      <p className="dataset-note">Data simulasi · {data.period || 'September 2026 (UTC)'} · Threshold prioritas &gt;6 jam, bukan SLA resmi.</p>
      {data.isLoading ? <section className="loading-state" role="status" aria-live="polite"><h2>Memuat metrics dan lokasi hub…</h2><p>Menyiapkan KPI, daftar, dan marker dari dataset yang sama.</p><div className="skeleton" /></section>
        : data.error ? <section className="error-state" role="alert"><h2>Data hub belum dapat ditampilkan</h2><p>{data.error}</p><button type="button" onClick={reload}>Coba lagi</button></section>
        : <><KpiOverview kpi={kpi} /><TopHubs hubs={data.hubs} onSelect={setSelectedId} />
          <section className="working-surface" aria-label="Hub list dan map">
            <HubFilters query={query} onQuery={setQuery} priorityOnly={priorityOnly} onPriority={setPriorityOnly} onReset={reset} />
            <div className="map-list-grid"><HubList hubs={visibleHubs} total={data.hubs.length} onSelect={setSelectedId} onReset={reset} /><HubMap hubs={visibleHubs} onSelect={setSelectedId} /></div>
          </section>
          <section className="summary-region" aria-labelledby="summary-title"><div><p className="eyebrow">Ringkasan terstruktur</p><h2 id="summary-title">Apa yang perlu diperiksa?</h2><p>{data.summary?.summary || 'Ringkasan belum tersedia atau tidak lolos validasi. Gunakan ranking dan metrics terverifikasi di atas.'}</p></div>
            {data.summary && <ol role="list">{data.summary.next_checks.map((check, index) => <li key={`${index}-${check}`}>{check}</li>)}</ol>}
          </section>
        </>}
    </main>
    <footer className="app-footer"><p>Completed visits saja yang dihitung dalam mean. Open visits tetap ditampilkan di detail.</p><a href="https://www.openstreetmap.org/copyright">Data peta ©OpenStreetMap</a></footer>
    {selected && !data.isLoading && <HubDetail key={selected.hub_id} hub={selected} onClose={() => setSelectedId(null)} />}
  </div>;
}
