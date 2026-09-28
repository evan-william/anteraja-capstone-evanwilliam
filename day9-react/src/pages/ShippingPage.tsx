import { LocationFields } from '../components/LocationFields';
import { ShippingCalculator } from '../components/ShippingCalculator';

export function ShippingPage() {
  return <main className="page-shell route-page">
    <section className="page-intro"><p className="eyebrow">SIMULASI ONGKIR</p><h1>Hitung perkiraan biaya.</h1><p>Pilih rute dan berat paket. Angka yang tampil hanya contoh untuk latihan.</p></section>
    <section className="route-location-panel"><LocationFields /></section>
    <ShippingCalculator />
  </main>;
}
