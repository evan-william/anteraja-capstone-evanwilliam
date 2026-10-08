import { locations, STATUS, hasCoordinates, labelOf, filterLocations } from './data.mjs';
import { loadGoogleMaps, geocodeAddress, readableError } from './maps-loader.mjs';

const byId = id => document.getElementById(id);
// salin data agar koordinat hasil geocoding tidak memutasi dataset asli.
const items = locations.map(item => ({ ...item }));
const markers = new Map();
let map, maps, infoWindow, geocoder, markerClass, pinClass;
let selectedId = null;
let geocodingBusy = false;
let mapFailed = false;

function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
}

function markerColor(item) {
  if (item.kind === 'courier') return '#2c2429';
  if (item.status === 'issue') return '#ae5100';
  if (item.status === 'delivered') return '#19734c';
  return '#d90074';
}

function showMessage(title, body, { setup = false, retry = false } = {}) {
  byId('message-title').textContent = title;
  byId('message-body').textContent = body;
  byId('map-message').hidden = false;
  byId('setup-link').hidden = !setup;
  byId('retry-map').hidden = !retry;
  byId('map').setAttribute('aria-busy', 'false');
}

function mapError(error) {
  mapFailed = true;
  infoWindow?.close();
  byId('fit-map').disabled = true;
  byId('retry-geocode').disabled = true;
  byId('mapped-count').textContent = '0';
  byId('map-status').textContent = 'Peta belum tersedia. Daftar data tetap dapat dibaca.';
  byId('geocode-status').textContent = 'Geocoding belum dijalankan: Google Maps belum siap.';
  const missing = error.message === 'MISSING_KEY';
  showMessage(missing ? 'Google Maps menunggu key-mu.' : 'Google Maps belum dapat dimuat.', readableError(error), { setup: missing, retry: !missing });
}

function visibleItems() {
  return filterLocations(items, byId('search').value, byId('kind').value);
}

function renderList() {
  const filtered = visibleItems();
  byId('locations').replaceChildren(...filtered.map(item => {
    const li = node('li');
    const button = node('button', undefined, 'location-button');
    button.type = 'button';
    button.dataset.id = item.id;
    button.setAttribute('aria-pressed', String(selectedId === item.id));
    button.append(node('strong', labelOf(item)), node('p', item.location));
    const status = node('p', undefined, 'status-line');
    const dot = node('i', undefined, `dot ${item.kind} ${item.status}`);
    dot.setAttribute('aria-hidden', 'true');
    status.append(dot, node('span', STATUS[item.status] || item.status));
    button.append(status);
    if (!hasCoordinates(item)) button.append(node('p', 'Alamat belum terpetakan', 'muted'));
    button.addEventListener('click', () => selectItem(item));
    li.append(button);
    return li;
  }));
  byId('visible-count').textContent = `${filtered.length} lokasi`;
  byId('empty').hidden = filtered.length > 0;
  const ids = new Set(filtered.map(item => item.id));
  for (const [id, marker] of markers) marker.map = ids.has(id) && !mapFailed ? map : null;
  if (selectedId && !ids.has(selectedId)) { selectedId = null; infoWindow?.close(); }
}

// textContent menjaga nama/alamat yang masuk ke info window tidak menjadi html executable.
function infoContent(item) {
  const content = node('article', undefined, 'info-window');
  content.append(node('h3', labelOf(item)), node('p', `${item.kind === 'shipment' ? 'Kiriman' : 'Kurir'} · ${STATUS[item.status]}`));
  content.append(node('p', item.location));
  if (item.courier) content.append(node('p', `Ditangani: ${item.courier}`));
  if (item.note) content.append(node('p', item.note));
  if (item.geocoded) content.append(node('p', 'Koordinat dari Google Geocoding'));
  if (hasCoordinates(item)) content.append(node('p', `${item.lat.toFixed(5)}, ${item.lng.toFixed(5)}`));
  return content;
}

function selectItem(item) {
  selectedId = item.id;
  // ubah state tombol saja, jangan rebuild list yang sedang mendapat fokus keyboard.
  for (const button of byId('locations').querySelectorAll('button')) button.setAttribute('aria-pressed', String(button.dataset.id === selectedId));
  if (!map || mapFailed) { byId('map-status').textContent = `${labelOf(item)} · ${STATUS[item.status]} · ${item.location}. Peta belum siap.`; return; }
  if (!hasCoordinates(item)) { byId('geocode-status').textContent = 'Alamat ini belum mendapat koordinat. Gunakan tombol cari koordinat di bawah peta.'; return; }
  map.panTo({ lat: item.lat, lng: item.lng });
  map.setZoom(Math.max(map.getZoom() || 12, 14));
  infoWindow.setContent(infoContent(item));
  infoWindow.open({ map, anchor: markers.get(item.id), shouldFocus: true });
  byId('map-status').textContent = `${labelOf(item)} · ${STATUS[item.status]} · ${item.location}`;
}

function addMarker(item) {
  if (!hasCoordinates(item) || markers.has(item.id)) return;
  const color = markerColor(item);
  const pin = new pinClass({ background: color, borderColor: '#ffffff', glyphColor: '#ffffff', scale: 1.05, glyphText: item.kind === 'courier' ? 'K' : 'P' });
  const marker = new markerClass({ map, position: { lat: item.lat, lng: item.lng }, title: `${labelOf(item)} · ${STATUS[item.status]}`, gmpClickable: true });
  marker.append(pin);
  marker.addEventListener('gmp-click', () => selectItem(item));
  markers.set(item.id, marker);
  byId('mapped-count').textContent = String(markers.size);
}

function fitMap() {
  if (!map || mapFailed) return;
  const points = visibleItems().filter(hasCoordinates);
  if (!points.length) { byId('map-status').textContent = 'Tidak ada titik terpetakan pada filter ini.'; return; }
  const bounds = new maps.LatLngBounds();
  for (const item of points) bounds.extend({ lat: item.lat, lng: item.lng });
  map.fitBounds(bounds, 48);
  if (points.length === 1) map.setZoom(14);
}

async function resolveAddress() {
  if (!geocoder || geocodingBusy || mapFailed) return;
  const item = items.find(entry => entry.address && !entry.geocoded);
  if (!item) return;
  geocodingBusy = true;
  byId('retry-geocode').disabled = true;
  byId('geocode-status').textContent = 'Mencari koordinat alamat melalui Google Geocoding…';
  try {
    const position = await geocodeAddress(geocoder, item.address);
    if (mapFailed) return; // jangan menampilkan sukses jika key ditolak saat request berlangsung.
    Object.assign(item, position, { geocoded: true });
    addMarker(item);
    renderList();
    fitMap();
    byId('geocode-status').textContent = `Berhasil: ${position.formattedAddress} (${item.lat.toFixed(5)}, ${item.lng.toFixed(5)}). Marker ${item.trackingNumber} ditambahkan.`;
    byId('retry-geocode').textContent = 'Alamat sudah terpetakan';
  } catch (error) {
    if (!mapFailed) byId('geocode-status').textContent = readableError(error) + ' Sebelas titik berkoordinat tetap tersedia.';
  } finally {
    geocodingBusy = false;
    byId('retry-geocode').disabled = mapFailed || Boolean(item.geocoded);
  }
}

async function start() {
  byId('shipment-count').textContent = String(items.filter(item => item.kind === 'shipment').length);
  byId('courier-count').textContent = String(items.filter(item => item.kind === 'courier').length);
  renderList();
  try {
    maps = await loadGoogleMaps(window.SHIPMENT_MAP_CONFIG, { onAuthFailure: () => mapError(new Error('AUTH_FAILURE')) });
    const [mapLibrary, markerLibrary, geocodingLibrary] = await Promise.all([
      maps.importLibrary('maps'), maps.importLibrary('marker'), maps.importLibrary('geocoding'),
    ]);
    if (mapFailed) return;
    markerClass = markerLibrary.AdvancedMarkerElement;
    pinClass = markerLibrary.PinElement;
    map = new mapLibrary.Map(byId('map'), { center: { lat: -6.2088, lng: 106.8456 }, zoom: 12, mapId: window.SHIPMENT_MAP_CONFIG.mapId || 'DEMO_MAP_ID', gestureHandling: 'cooperative', streetViewControl: false, mapTypeControl: false });
    infoWindow = new mapLibrary.InfoWindow();
    geocoder = new geocodingLibrary.Geocoder();
    // satu marker per data yang memiliki koordinat; alamat-only ditambahkan setelah geocoding.
    for (const item of items) addMarker(item);
    byId('map-message').hidden = true;
    byId('map').setAttribute('aria-busy', 'false');
    byId('map-status').textContent = '11 titik siap. Mencari satu alamat tambahan…';
    byId('fit-map').disabled = false;
    fitMap();
    await resolveAddress();
    if (!mapFailed && !selectedId) byId('map-status').textContent = `${markers.size} dari ${items.length} titik terpetakan · data simulasi`;
  } catch (error) { mapError(error); }
}

byId('filters').addEventListener('submit', event => event.preventDefault());
byId('search').addEventListener('input', renderList);
byId('kind').addEventListener('change', renderList);
byId('fit-map').addEventListener('click', fitMap);
byId('retry-map').addEventListener('click', () => window.location.reload());
byId('retry-geocode').addEventListener('click', resolveAddress);
start();
