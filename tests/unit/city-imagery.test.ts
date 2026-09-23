import { describe, expect, it } from 'vitest';
import { resolveTrackingCityPhoto } from '@/lib/tracking/city-imagery';

describe('tracking city photo', () => {
  it.each([
    ['Hub Cilandak', 'Jakarta'],
    ['Hub Bekasi', 'Bekasi'],
    ['Hub Serpong', 'Tangerang Selatan'],
    ['Hub Cikokol', 'Tangerang'],
    ['Hub Malang Kota', 'Malang'],
    ['Hub Semarang', 'Semarang'],
  ])('uses the real city for %s', (location, city) => {
    expect(resolveTrackingCityPhoto(location, 'Surabaya')?.photo.city).toBe(city);
    expect(resolveTrackingCityPhoto(location, 'Surabaya')?.context).toBe('current');
  });

  it('uses the destination only when no current location is available', () => {
    expect(resolveTrackingCityPhoto(null, 'Bandung')).toMatchObject({ photo: { city: 'Bandung' }, context: 'destination' });
  });

  it('falls back to a neutral card for unknown hubs instead of showing a misleading city', () => {
    expect(resolveTrackingCityPhoto('Hub Kota Baru', 'Surabaya')).toBeNull();
    expect(resolveTrackingCityPhoto(null, 'Kota Baru')).toBeNull();
  });
});
