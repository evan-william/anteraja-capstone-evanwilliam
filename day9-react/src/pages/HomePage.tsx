import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShipmentForm, type StatusFilter } from '../components/ShipmentForm';
import { ShipmentList } from '../components/ShipmentList';
import { ShippingCalculator } from '../components/ShippingCalculator';
import { useShipmentContext } from '../context/ShipmentContext';

export function HomePage() {
  const navigate = useNavigate();
  const { shipments } = useShipmentContext();
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');

  function search() {
    const params = new URLSearchParams();
    if (draft.trim()) params.set('q', draft.trim());
    if (status !== 'all') params.set('status', status);
    navigate(`/shipments${params.size ? `?${params}` : ''}`);
  }

  return <main id="beranda" className="page-shell">
    <section className="hero"><p className="eyebrow">TRACKING & OPERATIONS</p><h1>Tahu posisi paket. Tahu langkah berikutnya.</h1><p>Pantau perjalanan kiriman dengan nomor resi dan temukan paket yang perlu perhatian.</p></section>
    <ShipmentForm draft={draft} status={status} onDraftChange={setDraft} onStatusChange={setStatus} onSearch={search} onReset={() => { setDraft(''); setStatus('all'); }} />
    <ShipmentList shipments={shipments} />
    <ShippingCalculator />
  </main>;
}
