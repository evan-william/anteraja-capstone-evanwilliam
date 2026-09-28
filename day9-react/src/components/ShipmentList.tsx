import type { Shipment } from '../data/shipments';
import { ShipmentCard } from './ShipmentCard';

export function ShipmentList({ shipments }: { shipments: readonly Shipment[] }) {
  return <section id="daftar" className="list-section" aria-labelledby="list-title">
    <div className="section-heading"><div><p className="eyebrow">DAFTAR KIRIMAN</p><h2 id="list-title">Riwayat pengiriman</h2></div><p>{shipments.length} kiriman ditemukan</p></div>
    {shipments.length > 0
      ? <div className="shipment-list">{shipments.map((shipment) => <ShipmentCard key={shipment.id} shipment={shipment} />)}</div>
      : <div className="empty-state" role="status"><strong>Tidak ada kiriman yang cocok.</strong><p>Periksa nomor resi atau ubah pilihan status.</p></div>}
  </section>;
}
