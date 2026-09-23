import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/v1/road-route/route';

afterEach(() => vi.unstubAllGlobals());

describe('road route endpoint', () => {
  it('rejects coordinates outside Indonesia before calling a router', async () => {
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    const response = await GET(new NextRequest('http://localhost/api/v1/road-route?from=40,106&to=-7,112'));
    expect(response.status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('returns road geometry in latitude-longitude order', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ code: 'Ok', routes: [{ geometry: { coordinates: [[106.8456, -6.2088], [112.7521, -7.2575]] } }] }) }));
    const response = await GET(new NextRequest('http://localhost/api/v1/road-route?from=-6.2088,106.8456&to=-7.2575,112.7521'));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ path: [[-6.2088, 106.8456], [-7.2575, 112.7521]] });
  });

  it('fails explicitly when the road provider is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const response = await GET(new NextRequest('http://localhost/api/v1/road-route?from=-6.2088,106.8456&to=-7.2575,112.7521'));
    expect(response.status).toBe(503);
    expect((await response.json()).error).toContain('Jalur jalan belum tersedia');
  });
});
