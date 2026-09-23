import { describe, expect, it } from 'vitest';
import { buildJourney } from '@/lib/tracking/journey';

describe('tracking journey overview', () => {
  it('maps known Indonesian cities and a scanned hub without exposing an address', () => {
    const journey = buildJourney({ origin_city: 'Jakarta', destination_city: 'Surabaya', current_location: 'Hub Bekasi' });
    expect(journey?.origin.label).toBe('Jakarta');
    expect(journey?.current?.label).toBe('Hub Bekasi');
    expect(journey?.destination.label).toBe('Surabaya');
    expect(journey?.approximate).toBe(true);
  });

  it('uses a verified scan coordinate when one is available', () => {
    const journey = buildJourney({ origin_city: 'Bandung', destination_city: 'Depok', current_location: 'Hub Bekasi', current_lat: -6.25, current_lng: 106.98 });
    expect(journey?.current).toMatchObject({ lat: -6.25, lng: 106.98 });
    expect(journey?.approximate).toBe(false);
  });

  it('ignores invalid scan coordinates and avoids duplicate waypoints', () => {
    const journey = buildJourney({ origin_city: 'Semarang', destination_city: 'Yogyakarta', current_location: 'Hub Semarang', current_lat: 300, current_lng: 106 });
    expect(journey?.current).toBeNull();
    expect(journey?.approximate).toBe(true);
  });

  it('returns no map when a city cannot be located safely', () => {
    expect(buildJourney({ origin_city: 'Lokasi tidak dikenal', destination_city: 'Jakarta', current_location: null })).toBeNull();
  });
});
