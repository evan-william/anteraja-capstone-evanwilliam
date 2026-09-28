import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShipmentForm, type StatusFilter } from '../components/ShipmentForm';
import { ShipmentList } from '../components/ShipmentList';
import { useShipmentContext } from '../context/ShipmentContext';

const statuses: StatusFilter[] = ['all', 'in_transit', 'delivered', 'action_required'];

function ShipmentListContent({ query, status, onSearch, onReset }: {
  query: string;
  status: StatusFilter;
  onSearch: (draft: string, nextStatus: StatusFilter) => void;
  onReset: () => void;
}) {
  const { shipments } = useShipmentContext();
  const [draft, setDraft] = useState(query);
  const [draftStatus, setDraftStatus] = useState(status);
  const search = query.trim().toLowerCase();
  const visibleShipments = shipments.filter((shipment) =>
    (status === 'all' || shipment.status === status)
    && (!search || [shipment.trackingNumber, shipment.origin, shipment.destination].some((value) => value.toLowerCase().includes(search))),
  );

  return <>
    <ShipmentForm draft={draft} status={draftStatus} onDraftChange={setDraft} onStatusChange={setDraftStatus} onSearch={() => onSearch(draft, draftStatus)} onReset={onReset} showLocationFields={false} />
    <ShipmentList shipments={visibleShipments} />
  </>;
}

export function ShipmentListPage() {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const rawStatus = params.get('status') as StatusFilter | null;
  const status = rawStatus && statuses.includes(rawStatus) ? rawStatus : 'all';

  function search(draft: string, nextStatus: StatusFilter) {
    const next = new URLSearchParams();
    if (draft.trim()) next.set('q', draft.trim());
    if (nextStatus !== 'all') next.set('status', nextStatus);
    setParams(next);
  }

  return <main className="page-shell route-page">
    <section className="page-intro"><p className="eyebrow">DAFTAR KIRIMAN</p><h1>Cari dan pantau kiriman.</h1><p>Cari berdasarkan nomor resi atau kota, lalu buka detail kiriman yang ingin diperiksa.</p></section>
    <ShipmentListContent key={params.toString()} query={query} status={status} onSearch={search} onReset={() => setParams(new URLSearchParams())} />
  </main>;
}
