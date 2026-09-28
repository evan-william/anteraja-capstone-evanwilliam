import { TrackingHeader } from './components/TrackingHeader';
import { ShipmentList } from './components/ShipmentList';
import { demoShipments } from './data/shipments';

export function App() {
  return <><TrackingHeader /><main id="beranda" className="page-shell">
    <section className="hero"><p className="eyebrow">TRACKING & OPERATIONS</p><h1>Tahu posisi paket. Tahu langkah berikutnya.</h1><p>Pantau perjalanan kiriman dengan nomor resi dan temukan paket yang perlu perhatian.</p></section>
    <ShipmentList shipments={demoShipments} />
  </main></>;
}
