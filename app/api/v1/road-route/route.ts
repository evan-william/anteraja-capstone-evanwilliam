import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function parsePoint(value: string | null): [number, number] | null {
  if (!value || value.length > 40) return null;
  const parts = value.split(',');
  if (parts.length !== 2) return null;
  const lat = Number(parts[0]);
  const lng = Number(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -11 || lat > 7 || lng < 95 || lng > 142) return null;
  return [lat, lng];
}

export async function GET(request: NextRequest) {
  const from = parsePoint(request.nextUrl.searchParams.get('from'));
  const to = parsePoint(request.nextUrl.searchParams.get('to'));
  if (!from || !to) return NextResponse.json({ error: 'Titik rute tidak valid.' }, { status: 400 });

  const base = process.env.ROAD_ROUTER_URL || 'https://router.project-osrm.org';
  let baseUrl: URL;
  try {
    baseUrl = new URL(base);
    if (baseUrl.protocol !== 'https:' || baseUrl.username || baseUrl.password) throw new Error('Invalid router URL');
  } catch {
    return NextResponse.json({ error: 'Layanan rute belum dikonfigurasi.' }, { status: 503 });
  }

  const coordinates = `${from[1]},${from[0]};${to[1]},${to[0]}`;
  const url = new URL(`/route/v1/driving/${coordinates}`, baseUrl);
  url.searchParams.set('overview', 'simplified');
  url.searchParams.set('geometries', 'geojson');
  url.searchParams.set('steps', 'false');
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 86400 } });
    if (!response.ok) throw new Error('Routing service unavailable');
    const body = await response.json() as { code?: string; routes?: Array<{ geometry?: { coordinates?: number[][] } }> };
    const raw = body.code === 'Ok' ? body.routes?.[0]?.geometry?.coordinates : undefined;
    if (!raw || raw.length < 2 || raw.length > 15000) throw new Error('No usable road route');
    const path = raw.map(([lng, lat]) => [lat, lng]);
    if (path.some(([lat, lng]) => !Number.isFinite(lat) || !Number.isFinite(lng))) throw new Error('Invalid route geometry');
    return NextResponse.json({ path }, { headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' } });
  } catch {
    return NextResponse.json({ error: 'Jalur jalan belum tersedia. Titik kota tetap dapat dilihat di peta.' }, { status: 503 });
  }
}
