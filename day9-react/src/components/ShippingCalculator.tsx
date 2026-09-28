import { useState } from 'react';

const rates: Record<string, number> = { Jabodetabek: 9000, Jawa: 16000, 'Luar Jawa': 28000 };

export function ShippingCalculator() {
  const [region, setRegion] = useState('Jabodetabek');
  const [weight, setWeight] = useState('1');
  const kilograms = Number(weight);
  const valid = weight.trim() !== '' && Number.isFinite(kilograms) && kilograms > 0 && kilograms <= 50;
  const estimate = valid ? Math.ceil(kilograms) * rates[region] : null;

  return <section id="ongkir" className="calculator" aria-labelledby="calculator-title">
    <div><p className="eyebrow">SIMULASI</p><h2 id="calculator-title">Perkiraan ongkir</h2><p>Contoh perhitungan lokal untuk latihan React. Bukan tarif resmi Anteraja.</p></div>
    <div className="calculator-fields"><div className="field"><label htmlFor="region">Wilayah tujuan</label><select id="region" value={region} onChange={(event) => setRegion(event.target.value)}>{Object.keys(rates).map((item) => <option key={item} value={item}>{item}</option>)}</select></div><div className="field"><label htmlFor="weight">Berat paket (kg)</label><input id="weight" type="number" min="0.1" max="50" step="0.1" value={weight} onChange={(event) => setWeight(event.target.value)} aria-invalid={!valid} aria-describedby="estimate" /></div></div>
    <p id="estimate" className="estimate" role="status">{estimate === null ? 'Masukkan berat antara 0,1–50 kg.' : <>Perkiraan: <strong>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(estimate)}</strong></>}</p>
  </section>;
}
