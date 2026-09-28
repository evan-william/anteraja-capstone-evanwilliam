import { Link } from 'react-router-dom';
import type { Shipment } from '../data/shipments';

const statusLabel = {
  in_transit: 'Dalam perjalanan',
  delivered: 'Terkirim',
  action_required: 'Perlu tindakan',
} as const;

export function ShipmentCard({ shipment }: { shipment: Shipment }) {
  return <article className="shipment-row">
    <div className="shipment-primary"><span className="eyebrow">{shipment.trackingNumber}</span><h3><Link to={`/shipments/${encodeURIComponent(shipment.trackingNumber)}`}>{shipment.origin} <span aria-hidden="true">→</span> {shipment.destination}</Link></h3><p>Posisi terakhir: {shipment.lastLocation}</p></div>
    <div className="shipment-secondary"><span className={`shipment-status status-${shipment.status}`}>{statusLabel[shipment.status]}</span><span className="eta">Estimasi: {shipment.eta}</span></div>
  </article>;
}
