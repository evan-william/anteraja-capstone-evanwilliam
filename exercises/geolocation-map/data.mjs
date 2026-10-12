// semua nama, nomor resi, dan posisi adalah contoh pembelajaran.
export const STATUS = Object.freeze({
  in_transit: "Dalam perjalanan", out_for_delivery: "Dibawa kurir",
  delivered: "Terkirim", issue: "Perlu tindakan", scheduled: "Menunggu penjemputan",
  on_route: "Sedang mengantar", available: "Siap bertugas",
});

export const locations = Object.freeze([
  { id: "s1", kind: "shipment", trackingNumber: "ANT-190001", status: "in_transit", lat: -6.1754, lng: 106.8272, location: "Gambir, Jakarta Pusat", courier: "Kurir Andi" },
  { id: "s2", kind: "shipment", trackingNumber: "ANT-190002", status: "out_for_delivery", lat: -6.2297, lng: 106.8295, location: "Setiabudi, Jakarta Selatan", courier: "Kurir Budi" },
  { id: "s3", kind: "shipment", trackingNumber: "ANT-190003", status: "issue", lat: -6.2615, lng: 106.8106, location: "Kebayoran Baru, Jakarta Selatan", courier: "Kurir Budi", note: "Penerima belum dapat ditemui." },
  { id: "s4", kind: "shipment", trackingNumber: "ANT-190004", status: "delivered", lat: -6.1633, lng: 106.7613, location: "Kebon Jeruk, Jakarta Barat", courier: "Kurir Citra" },
  { id: "s5", kind: "shipment", trackingNumber: "ANT-190005", status: "in_transit", lat: -6.1515, lng: 106.8910, location: "Kelapa Gading, Jakarta Utara", courier: "Kurir Andi" },
  { id: "s6", kind: "shipment", trackingNumber: "ANT-190006", status: "scheduled", lat: -6.2379, lng: 106.8669, location: "Tebet, Jakarta Selatan", courier: "Kurir Budi" },
  { id: "s7", kind: "shipment", trackingNumber: "ANT-190007", status: "out_for_delivery", lat: -6.2185, lng: 106.9019, location: "Jatinegara, Jakarta Timur", courier: "Kurir Andi" },
  { id: "s8", kind: "shipment", trackingNumber: "ANT-190008", status: "in_transit", lat: -6.1352, lng: 106.8133, location: "Pademangan, Jakarta Utara", courier: "Kurir Citra" },
  // bonus: sengaja tidak punya lat/lng; koordinat harus berasal dari google geocoder.
  { id: "s9", kind: "shipment", trackingNumber: "ANT-190009", status: "scheduled", address: "Monumen Nasional, Gambir, Jakarta Pusat, Indonesia", location: "Monumen Nasional, Jakarta Pusat", courier: "Kurir Andi" },
  { id: "c1", kind: "courier", name: "Kurir Andi", status: "on_route", lat: -6.1818, lng: 106.8501, location: "Senen, Jakarta Pusat" },
  { id: "c2", kind: "courier", name: "Kurir Budi", status: "on_route", lat: -6.2782, lng: 106.8390, location: "Pasar Minggu, Jakarta Selatan" },
  { id: "c3", kind: "courier", name: "Kurir Citra", status: "available", lat: -6.1553, lng: 106.7870, location: "Grogol, Jakarta Barat" },
].map(item => Object.freeze(item)));

export function hasCoordinates(item) {
  return Number.isFinite(item.lat) && Number.isFinite(item.lng)
    && Math.abs(item.lat) <= 90 && Math.abs(item.lng) <= 180;
}

export function labelOf(item) {
  return item.kind === "shipment" ? item.trackingNumber : item.name;
}

export function filterLocations(items, query = "", kind = "all") {
  const search = query.trim().toLocaleLowerCase("id-ID");
  return items.filter(item => (kind === "all" || item.kind === kind)
    && [labelOf(item), item.location, item.courier, STATUS[item.status]]
      .filter(Boolean).join(" ").toLocaleLowerCase("id-ID").includes(search));
}
