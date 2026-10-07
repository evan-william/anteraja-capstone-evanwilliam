import type { PublicTracking } from './types';

export type JourneyPoint = { label: string; lat: number; lng: number };
export type Journey = {
  origin: JourneyPoint;
  current: JourneyPoint | null;
  destination: JourneyPoint;
  approximate: boolean;
};

// City and hub centres are only used for a geographic overview, never as a
// substitute for a courier's live location or a recipient's street address.
const places: Array<[string, number, number]> = [
  ['jakarta selatan', -6.2615, 106.8106],
  ['jakarta', -6.2088, 106.8456],
  ['surabaya', -7.2575, 112.7521],
  ['bandung', -6.9175, 107.6191],
  ['semarang', -6.9667, 110.4167],
  ['yogyakarta', -7.7956, 110.3695],
  ['tangerang selatan', -6.2886, 106.7179],
  ['depok', -6.4025, 106.7942],
  ['bekasi', -6.2383, 106.9756],
  ['malang', -7.9797, 112.6304],
  ['cilandak', -6.2891, 106.7952],
  ['serpong', -6.3007, 106.6698],
];

function lookup(label: string | null | undefined): JourneyPoint | null {
  if (!label) return null;
  const normalized = label.toLocaleLowerCase('id-ID').trim();
  const place = places.find(([name]) => normalized.includes(name));
  return place ? { label, lat: place[1], lng: place[2] } : null;
}

function validCoordinate(lat: unknown, lng: unknown): lat is number {
  return typeof lat === 'number' && typeof lng === 'number' &&
    Number.isFinite(lat) && Number.isFinite(lng) && lat >= -11 && lat <= 7 && lng >= 95 && lng <= 142;
}

function samePlace(a: JourneyPoint, b: JourneyPoint): boolean {
  return Math.abs(a.lat - b.lat) < 0.008 && Math.abs(a.lng - b.lng) < 0.008;
}

export function buildJourney(input: Pick<PublicTracking, 'origin_city' | 'destination_city' | 'current_location'> & { current_lat?: number | null; current_lng?: number | null }): Journey | null {
  const origin = lookup(input.origin_city);
  const destination = lookup(input.destination_city);
  if (!origin || !destination) return null;
  const mappedCurrent = lookup(input.current_location);
  const exactCurrent = validCoordinate(input.current_lat, input.current_lng)
    ? { label: input.current_location || 'Lokasi pemindaian terakhir', lat: input.current_lat, lng: input.current_lng as number }
    : null;
  const candidate = exactCurrent ?? mappedCurrent;
  const current = candidate && !samePlace(candidate, origin) && !samePlace(candidate, destination) ? candidate : null;
  return { origin, current, destination, approximate: !exactCurrent };
}
