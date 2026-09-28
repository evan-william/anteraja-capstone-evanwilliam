import { useMemo, useState } from 'react';
import { TrackingHeader } from './components/TrackingHeader';
import { ShipmentForm, type StatusFilter } from './components/ShipmentForm';
import { ShipmentList } from './components/ShipmentList';
import { ShippingCalculator } from './components/ShippingCalculator';
import { demoShipments } from './data/shipments';

export function App() {
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');

  const visibleShipments = useMemo(() => demoShipments.filter((shipment) => {
    const matchesStatus = status === 'all' || shipment.status === status;
    const search = query.trim().toLowerCase();
    const matchesSearch = !search || [shipment.trackingNumber, shipment.origin, shipment.destination].some((value) => value.toLowerCase().includes(search));
    return matchesStatus && matchesSearch;
  }), [query, status]);

  function resetSearch() { setDraft(''); setQuery(''); setStatus('all'); }

  return <><TrackingHeader /><main id="beranda" className="page-shell">
    <section className="hero"><p className="eyebrow">TRACKING & OPERATIONS</p><h1>Tahu posisi paket. Tahu langkah berikutnya.</h1><p>Pantau perjalanan kiriman dengan nomor resi dan temukan paket yang perlu perhatian.</p></section>
    <ShipmentForm draft={draft} status={status} onDraftChange={setDraft} onStatusChange={setStatus} onSearch={() => setQuery(draft)} onReset={resetSearch} />
    <ShipmentList shipments={visibleShipments} />
    <ShippingCalculator />
  </main></>;
}
