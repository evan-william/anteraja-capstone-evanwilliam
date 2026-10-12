import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const php = process.env.PHP_BIN || (existsSync('C:/xampp/php/php.exe') ? 'C:/xampp/php/php.exe' : 'php');

export async function startApp(port = 3121) {
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('APP_PORT harus 1024–65535.');
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(php, ['-S', `127.0.0.1:${port}`, '-t', path.join(root, 'app')], { cwd: root, stdio: ['ignore', 'ignore', 'pipe'] });
  let failure = '';
  let stderr = '';
  child.on('error', error => { failure = error.message; });
  child.stderr.on('data', chunk => { stderr = (stderr + chunk).slice(-4000); });
  const deadline = Date.now() + 10000;
  try {
    while (Date.now() < deadline) {
      if (failure || child.exitCode !== null) throw new Error(failure || `PHP tidak berjalan: ${stderr}`);
      try {
        const response = await fetch(`${baseUrl}/shipment-form.html`, { signal: AbortSignal.timeout(500) });
        if (response.ok && (await response.text()).includes('shipment-request-form')) {
          // a bound process stays alive; do not silently use a server occupying this port.
          await new Promise(resolve => setImmediate(resolve));
          if (child.exitCode !== null || failure) throw new Error(`Port ${port} sudah dipakai atau PHP gagal.`);
          return { baseUrl, child, stop: () => child.kill() };
        }
      } catch (error) { if (child.exitCode !== null || failure) throw error; }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`PHP belum siap dalam 10 detik. Periksa PHP_BIN dan port ${port}.`);
  } catch (error) { child.kill(); throw error; }
}
