import { Link, useParams } from 'react-router-dom';
import { useShipmentContext } from '../context/ShipmentContext';
import { NotFoundPage } from './NotFoundPage';

const statusLabel = { in_transit: 'Dalam perjalanan', delivered: 'Terkirim', action_required: 'Perlu tindakan' } as const;

export function ShipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { shipments } = useShipmentContext();
  const shipment = shipments.find((item) => item.trackingNumber.toLowerCase() === id?.toLowerCase() || item.id === id);
  if (!shipment) return <NotFoundPage shipment />;

  return <main className="page-shell route-page">
    <Link className="back-link" to="/shipments">← Kembali ke daftar kiriman</Link>
    <article className="detail-sheet">
      <header className="detail-header"><div><p className="eyebrow">DETAIL KIRIMAN</p><h1>{shipment.trackingNumber}</h1><p>{shipment.origin} <span aria-hidden="true">→</span> {shipment.destination}</p></div><span className={`shipment-status status-${shipment.status}`}>{statusLabel[shipment.status]}</span></header>
      <dl className="detail-facts"><div><dt>Posisi terakhir</dt><dd>{shipment.lastLocation}</dd></div><div><dt>Estimasi tiba</dt><dd>{shipment.eta}</dd></div><div><dt>Status</dt><dd>{statusLabel[shipment.status]}</dd></div></dl>
      <p className="detail-note">Ini adalah data contoh latihan React. Untuk tracking operasional sebenarnya, gunakan aplikasi Anteraja utama.</p>
    </article>
  </main>;
}
