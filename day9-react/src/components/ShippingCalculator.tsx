import { useState } from 'react';
import { useShipmentContext } from '../context/ShipmentContext';

export function ShippingCalculator() {
  const route = useShipmentContext();
  const [weight, setWeight] = useState('1');
  const kilograms = Number(weight);
  const valid = weight.trim() !== '' && Number.isFinite(kilograms) && kilograms > 0 && kilograms <= 50;
  const completeRoute = Boolean(route.originRegency && route.destinationRegency);
  const sampleRate = route.originProvince?.id === route.destinationProvince?.id ? 9000 : 16000;
  const estimate = valid && completeRoute ? Math.ceil(kilograms) * sampleRate : null;

  return <section id="ongkir" className="calculator" aria-labelledby="calculator-title">
    <div><p className="eyebrow">SIMULASI</p><h2 id="calculator-title">Perkiraan ongkir</h2><p>Rute ini dibaca dari ShipmentContext. Angka di bawah adalah contoh latihan, bukan tarif resmi Anteraja.</p><p className="calculator-route">{completeRoute ? `${route.originRegency?.name} → ${route.destinationRegency?.name}` : 'Pilih kota asal dan tujuan di formulir.'}{route.postalPlace ? ` · Kode pos ${route.postalPlace.code}` : ''}</p></div>
    <div className="calculator-fields"><div className="field"><label htmlFor="weight">Berat paket (kg)</label><input id="weight" type="number" min="0.1" max="50" step="0.1" value={weight} onChange={(event) => setWeight(event.target.value)} aria-invalid={!valid} aria-describedby="estimate" /></div></div>
    <p id="estimate" className="estimate" role="status">{!completeRoute ? 'Pilih kota asal dan tujuan untuk melihat simulasi.' : estimate === null ? 'Masukkan berat antara 0,1–50 kg.' : <>Perkiraan: <strong>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(estimate)}</strong></>}</p>
  </section>;
}
