import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// server hanya membuka file latihan dan aset publik, bukan .env atau backend.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.MAP_PORT || 3019);
const allowed = /^\/(?:shipment-map\.html|exercises\/geolocation-map\/(?:app\.mjs|data\.mjs|maps-loader\.mjs|style\.css|config\.local\.js)|public\/brand\/(?:anteraja-favicon|anteraja-mark-small)\.png|public\/fonts\/open-sans-latin\.woff2)$/;
const types = { '.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2' };
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('MAP_PORT harus 1024-65535.');
const server = http.createServer(async (req, res) => {
  try {
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }).end(); return; }
    const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
    const resource = pathname === '/' ? '/shipment-map.html' : pathname;
    if (!allowed.test(resource)) { res.writeHead(404).end('Not found'); return; }
    const file = path.join(root, resource);
    let body;
    try { body = await fs.readFile(file); }
    catch (error) {
      if (resource.endsWith('/config.local.js') && error.code === 'ENOENT') body = Buffer.from('window.SHIPMENT_MAP_CONFIG = {apiKey:"",mapId:"DEMO_MAP_ID"};');
      else { res.writeHead(404).end('Not found'); return; }
    }
    res.writeHead(200, { 'Content-Type': `${types[path.extname(file)]}; charset=utf-8`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin' });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch { res.writeHead(400).end('Bad request'); }
});
server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? `Port ${port} dipakai. Tutup server latihan lama atau ubah MAP_PORT beserta restriction key.` : error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Day 19: http://localhost:${port}/shipment-map.html\nCtrl+C untuk berhenti. File pribadi tidak disajikan.`));
