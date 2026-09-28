export type ShipmentStatus = 'in_transit' | 'delivered' | 'action_required';

export type Shipment = {
  id: string;
  trackingNumber: string;
  origin: string;
  destination: string;
  lastLocation: string;
  eta: string;
  status: ShipmentStatus;
};

// Data lokal untuk latihan React. Tidak membaca atau mengubah Supabase.
export const demoShipments: Shipment[] = [
  { id: 's01', trackingNumber: 'ANT-100015', origin: 'Jakarta', destination: 'Jakarta Selatan', lastLocation: 'Hub Cilandak', eta: '22 Sep 2026', status: 'action_required' },
  { id: 's02', trackingNumber: 'ANT-100016', origin: 'Jakarta', destination: 'Bandung', lastLocation: 'Hub Bandung', eta: '23 Sep 2026', status: 'in_transit' },
  { id: 's03', trackingNumber: 'ANT-100017', origin: 'Surabaya', destination: 'Malang', lastLocation: 'Malang', eta: '21 Sep 2026', status: 'delivered' },
  { id: 's04', trackingNumber: 'ANT-100018', origin: 'Tangerang', destination: 'Bekasi', lastLocation: 'Hub Bekasi', eta: '24 Sep 2026', status: 'in_transit' },
  { id: 's05', trackingNumber: 'ANT-100019', origin: 'Medan', destination: 'Binjai', lastLocation: 'Hub Medan', eta: '25 Sep 2026', status: 'in_transit' },
  { id: 's06', trackingNumber: 'ANT-100020', origin: 'Yogyakarta', destination: 'Sleman', lastLocation: 'Sleman', eta: '20 Sep 2026', status: 'delivered' },
  { id: 's07', trackingNumber: 'ANT-100021', origin: 'Semarang', destination: 'Solo', lastLocation: 'Hub Solo', eta: '26 Sep 2026', status: 'action_required' },
  { id: 's08', trackingNumber: 'ANT-100022', origin: 'Denpasar', destination: 'Badung', lastLocation: 'Hub Denpasar', eta: '27 Sep 2026', status: 'in_transit' },
];
