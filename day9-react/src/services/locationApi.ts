// External data stays behind this module; components never parse API responses.
const REGION_API = 'https://www.emsifa.com/api-wilayah-indonesia/v2';
const POSTAL_API = 'https://kodepos.vercel.app';

export type Region = { id: string; name: string };
export type PostalPlace = {
  code: string;
  village: string;
  district: string;
  regency: string;
  province: string;
};

async function fetchJson(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Layanan wilayah merespons HTTP ${response.status}.`);
  return response.json() as Promise<unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseRegions(payload: unknown): Region[] {
  if (!isRecord(payload) || !Array.isArray(payload.data)) throw new Error('Format data wilayah tidak sesuai.');
  return payload.data.map((item: unknown) => {
    if (!isRecord(item) || typeof item.id !== 'string' || typeof item.name !== 'string') {
      throw new Error('Ada data wilayah yang tidak lengkap.');
    }
    return { id: item.id, name: item.name };
  });
}

export async function getProvinces(signal: AbortSignal): Promise<Region[]> {
  return parseRegions(await fetchJson(`${REGION_API}/provinces.json`, signal));
}

export async function getRegencies(provinceId: string, signal: AbortSignal): Promise<Region[]> {
  if (!/^\d{2}$/.test(provinceId)) throw new Error('Kode provinsi tidak valid.');
  return parseRegions(await fetchJson(`${REGION_API}/regencies/${provinceId}.json`, signal));
}

export async function searchPostalPlaces(query: string, signal: AbortSignal): Promise<PostalPlace[]> {
  const keyword = query.trim().slice(0, 60);
  if (keyword.length < 3) return [];
  const payload = await fetchJson(`${POSTAL_API}/search/?q=${encodeURIComponent(keyword)}`, signal);
  if (!isRecord(payload) || payload.statusCode !== 200 || !Array.isArray(payload.data)) {
    throw new Error('Format data kode pos tidak sesuai.');
  }
  return payload.data.map((item: unknown) => {
    if (!isRecord(item) || !['string', 'number'].includes(typeof item.code)
      || !['village', 'district', 'regency', 'province'].every((key) => typeof item[key] === 'string')) {
      throw new Error('Ada data kode pos yang tidak lengkap.');
    }
    return {
      code: String(item.code).padStart(5, '0'),
      village: String(item.village),
      district: String(item.district),
      regency: String(item.regency),
      province: String(item.province),
    };
  });
}
