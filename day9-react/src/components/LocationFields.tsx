import { useState } from 'react';
import { useShipmentContext } from '../context/ShipmentContext';
import { useLocationData } from '../hooks/useLocationData';
import { usePostalSearch } from '../hooks/usePostalSearch';
import type { Region } from '../services/locationApi';

function comparable(value: string) {
  return value.toLowerCase().replace(/\b(kota|kabupaten|administrasi)\b/g, '').replace(/\s+/g, ' ').trim();
}

export function LocationFields() {
  const route = useShipmentContext();
  const [postalQuery, setPostalQuery] = useState('');
  const provinces = useLocationData('provinces');
  const originCities = useLocationData('regencies', route.originProvince?.id);
  const destinationCities = useLocationData('regencies', route.destinationProvince?.id);
  const postal = usePostalSearch(route.destinationRegency ? postalQuery : '');
  const visiblePlaces = postal.data.filter((place) =>
    comparable(place.province) === comparable(route.destinationProvince?.name ?? '')
    && comparable(place.regency) === comparable(route.destinationRegency?.name ?? ''),
  ).slice(0, 8);

  function chosenRegion(items: Region[], id: string) {
    return items.find((item) => item.id === id) ?? null;
  }

  return <section className="location-fields" aria-labelledby="route-title">
    <div className="location-heading"><div><p className="eyebrow">DATA WILAYAH LANGSUNG</p><h2 id="route-title">Asal dan tujuan paket</h2></div><p>Provinsi/kota diambil dari API Wilayah Indonesia. Kode pos dicari dari API Kodepos.</p></div>
    {provinces.isLoading ? <p className="async-message" role="status">Memuat daftar provinsi…</p> : null}
    {provinces.isError ? <p className="async-message error" role="alert">{provinces.error} <button type="button" onClick={provinces.retry}>Coba lagi</button></p> : null}

    <div className="location-grid">
      <div className="field"><label htmlFor="origin-province">Provinsi asal</label><select id="origin-province" value={route.originProvince?.id ?? ''} disabled={provinces.isLoading || provinces.isError} onChange={(event) => route.setOriginProvince(chosenRegion(provinces.data, event.target.value))}><option value="">Pilih provinsi</option>{provinces.data.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
      <div className="field"><label htmlFor="origin-city">Kota/kabupaten asal</label><select id="origin-city" value={route.originRegency?.id ?? ''} disabled={!route.originProvince || originCities.isLoading || originCities.isError} onChange={(event) => route.setOriginRegency(chosenRegion(originCities.data, event.target.value))}><option value="">{originCities.isLoading ? 'Memuat kota…' : 'Pilih kota/kabupaten'}</option>{originCities.data.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
      <div className="field"><label htmlFor="destination-province">Provinsi tujuan</label><select id="destination-province" value={route.destinationProvince?.id ?? ''} disabled={provinces.isLoading || provinces.isError} onChange={(event) => { route.setDestinationProvince(chosenRegion(provinces.data, event.target.value)); setPostalQuery(''); }}><option value="">Pilih provinsi</option>{provinces.data.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
      <div className="field"><label htmlFor="destination-city">Kota/kabupaten tujuan</label><select id="destination-city" value={route.destinationRegency?.id ?? ''} disabled={!route.destinationProvince || destinationCities.isLoading || destinationCities.isError} onChange={(event) => { route.setDestinationRegency(chosenRegion(destinationCities.data, event.target.value)); setPostalQuery(''); }}><option value="">{destinationCities.isLoading ? 'Memuat kota…' : 'Pilih kota/kabupaten'}</option>{destinationCities.data.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
    </div>
    {originCities.isLoading || destinationCities.isLoading ? <p className="async-message" role="status">Memuat kota/kabupaten pilihanmu…</p> : null}
    {originCities.isError ? <p className="async-message error" role="alert">Kota asal: {originCities.error} <button type="button" onClick={originCities.retry}>Coba lagi</button></p> : null}
    {destinationCities.isError ? <p className="async-message error" role="alert">Kota tujuan: {destinationCities.error} <button type="button" onClick={destinationCities.retry}>Coba lagi</button></p> : null}

    <div className="postal-search"><div className="field"><label htmlFor="postal-query">Cari kecamatan atau kelurahan tujuan</label><input id="postal-query" value={postalQuery} disabled={!route.destinationRegency} onChange={(event) => { setPostalQuery(event.target.value); route.setPostalPlace(null); }} placeholder="Contoh: Cilandak" autoComplete="off" aria-describedby="postal-help" /></div><p id="postal-help">Pilih kota tujuan dahulu, lalu ketik minimal 3 huruf untuk mencari kode pos.</p></div>
    {postal.isLoading ? <p className="async-message" role="status">Mencari kode pos…</p> : null}
    {postal.isError ? <p className="async-message error" role="alert">{postal.error} <button type="button" onClick={postal.retry}>Coba lagi</button></p> : null}
    {!postal.isLoading && !postal.isError && postalQuery.trim().length >= 3 && route.destinationRegency ? <div className="postal-results" role="group" aria-label="Hasil pencarian kode pos">{visiblePlaces.length ? visiblePlaces.map((place) => <button key={`${place.code}-${place.village}-${place.district}`} className={route.postalPlace?.code === place.code && route.postalPlace.village === place.village ? 'selected' : ''} type="button" onClick={() => route.setPostalPlace(place)}><strong>{place.code}</strong><span>{place.village}, {place.district}</span></button>) : <p role="status">Tidak ada hasil untuk kota tujuan. Coba nama kecamatan atau kelurahan lain.</p>}</div> : null}
    {route.postalPlace ? <p className="postal-picked" role="status">Kode pos terpilih: <strong>{route.postalPlace.code}</strong> — {route.postalPlace.village}, {route.postalPlace.district}</p> : null}
  </section>;
}
