import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { hours, isPriority } from '../metrics.js';

// Both map and list receive the exact same filtered hubs array from App.
export default function HubMap({ hubs, onSelect }) {
  const host = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);
  const onSelectRef = useRef(onSelect);
  const [tileError, setTileError] = useState(false);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);
  useEffect(() => {
    const instance = L.map(host.current, { scrollWheelZoom: false }).setView([-2.5, 114], 4);
    map.current = instance;
    layer.current = L.layerGroup().addTo(instance);
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(instance);
    tiles.on('tileerror', () => setTileError(true));
    const observer = new ResizeObserver(() => instance.invalidateSize({ pan: false }));
    observer.observe(host.current);
    return () => { observer.disconnect(); tiles.off(); instance.remove(); map.current = null; layer.current = null; };
  }, []);
  useEffect(() => {
    if (!map.current || !layer.current) return;
    layer.current.clearLayers();
    for (const hub of hubs) {
      const icon = L.divIcon({ className: 'hub-marker-shell', html: `<span class="hub-marker ${isPriority(hub) ? 'is-priority' : ''}"></span>`, iconSize: [32, 32], iconAnchor: [16, 16] });
      const marker = L.marker([hub.lat, hub.lng], { icon, title: hub.hub_name, alt: `Hub ${hub.hub_name}`, keyboard: true }).addTo(layer.current);
      const popup = document.createElement('article');
      popup.className = 'map-popup';
      const title = document.createElement('h3'); title.textContent = hub.hub_name; popup.append(title);
      for (const [label, value] of [['Mean', hours(hub.mean_dwell_hours)], ['Min', hours(hub.min_dwell_hours)], ['Max', hours(hub.max_dwell_hours)], ['Completed visits', hub.completed_visits], ['Prioritas', isPriority(hub) ? 'Investigasi' : 'Pantau rutin']]) {
        const text = document.createElement('p'); text.textContent = `${label}: ${value}`; popup.append(text);
      }
      const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Buka detail hub';
      button.addEventListener('click', () => onSelectRef.current(hub.hub_id)); popup.append(button);
      marker.bindPopup(popup, { maxWidth: 260 });
    }
    if (hubs.length) map.current.fitBounds(L.latLngBounds(hubs.map(hub => [hub.lat, hub.lng])), { padding: [36, 36], maxZoom: 9, animate: false });
  }, [hubs]);
  return <section aria-labelledby="map-title" className="map-region">
    <header className="section-heading"><h2 id="map-title">Peta hub</h2><p><span className="legend-priority">●</span> Prioritas <span className="legend-normal">●</span> Pantau rutin</p></header>
    <div className="map-frame"><div ref={host} className="leaflet-host" role="region" aria-label="Peta interaktif lokasi hub" data-marker-count={hubs.length} />
      {!hubs.length && <p className="map-empty" role="status">Tidak ada marker yang cocok dengan filter.</p>}
    </div>
    {tileError && <p className="map-warning" role="status">Sebagian tile peta gagal dimuat. Marker dan detail tetap tersedia; coba muat ulang saat koneksi pulih.</p>}
    <p className="map-note">Koordinat titik kota simulasi, bukan alamat hub resmi atau GPS paket.</p>
  </section>;
}
