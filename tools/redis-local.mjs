import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';

// This runtime is extracted locally, never committed or installed as a system service.
export async function localRedis() {
  if (process.env.LOCAL_REDIS === '0') return null;
  const binary = path.resolve('.private/redis/runtime/Memurai/memurai.exe');
  if (!existsSync(binary)) {
    console.warn('Redis lokal belum dipasang. Cache memakai fallback; lihat docs/runtime/REDIS.md.');
    return null;
  }
  const port = Number(process.env.REDIS_PORT || 6379);
  const alreadyListening = await new Promise(resolve => {
    const socket = net.connect({ host: '127.0.0.1', port });
    socket.setTimeout(200);
    const finish = value => { socket.destroy(); resolve(value); };
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
    socket.once('timeout', () => finish(false));
  });
  // Never stop someone else's Redis process.
  if (alreadyListening) return null;
  const cwd = path.resolve('.private/redis/data');
  mkdirSync(cwd, { recursive: true });
  const child = spawn(binary, ['--bind', '127.0.0.1', '--port', String(port),
    '--maxmemory', '64mb', '--maxmemory-policy', 'allkeys-lru',
    '--save', '', '--appendonly', 'no'], { cwd, stdio: 'inherit', windowsHide: true });
  child.on('error', error => console.warn(`Redis lokal: ${error.message}. Cache memakai fallback.`));
  return child;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve('tools/redis-local.mjs')) {
  const child = await localRedis();
  process.on('SIGINT', () => child?.kill());
  process.on('SIGTERM', () => child?.kill());
}
