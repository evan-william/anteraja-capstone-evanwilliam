import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

// Curated Commons photographs. Rebuild only when refreshing the checked-in assets.
const photos = [
  ['jakarta', 'File:JakartaSkyline.jpg'],
  ['bekasi', 'File:Bekasi aerial view.jpg'],
  ['tangerang-selatan', 'File:CBD Alam Sutera.jpg'],
  ['tangerang', 'File:Jembatan UNIS (Jembatan Merah) di Cikokol, Tangerang.jpg'],
  ['malang', 'File:Malang city.jpg'],
  ['semarang', 'File:Simpang Lima Semarang - panoramio (cropped).jpg'],
  ['surabaya', 'File:Surabaya City Skyline in July 2025.jpg'],
  ['bandung', 'File:Bandung city centre, July 2014.jpg'],
];

const endpoint = new URL('https://commons.wikimedia.org/w/api.php');
endpoint.search = new URLSearchParams({
  action: 'query', format: 'json', prop: 'imageinfo', iiprop: 'url',
  iiurlwidth: '1920', titles: photos.map(([, title]) => title).join('|'),
}).toString();

const response = await fetch(endpoint, { headers: { 'User-Agent': 'AnterajaCapstone/1.0 (educational local city imagery)' } });
if (!response.ok) throw new Error(`Commons API returned ${response.status}`);
const pages = Object.values((await response.json()).query.pages);
const output = path.join(process.cwd(), 'public', 'tracking-cities');
await mkdir(output, { recursive: true });

for (const [city, title] of photos) {
  const page = pages.find((entry) => entry.title === title);
  const url = page?.imageinfo?.[0]?.thumburl;
  if (!url) throw new Error(`No thumbnail for ${title}`);
  const imageResponse = await fetch(url, { headers: { 'User-Agent': 'AnterajaCapstone/1.0 (educational local city imagery)' } });
  if (!imageResponse.ok) throw new Error(`${title}: HTTP ${imageResponse.status}`);
  const buffer = Buffer.from(await imageResponse.arrayBuffer());
  const optimized = await sharp(buffer).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 78, effort: 5 }).toBuffer();
  const target = path.join(output, `${city}.webp`);
  await writeFile(target, optimized);
  process.stdout.write(`${city}: ${Math.round(optimized.length / 1024)} KiB\n`);
}
