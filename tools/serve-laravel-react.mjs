import { spawn } from 'node:child_process';
import { existsSync, cpSync, readdirSync } from 'node:fs';
import { waitForLauncher } from './launcher-gate.mjs';
import { phpServer } from './php-server.mjs';
import { localRedis } from './redis-local.mjs';
await waitForLauncher();
if (!existsSync('dist/index.html')) { console.error('Jalankan npm run build dulu.'); process.exit(1); }
// public contains only built frontend assets, never application code or env files.
for (const asset of readdirSync('dist')) if(asset !== 'index.html') cpSync(`dist/${asset}`,`backend/public/${asset}`,{recursive:true});
const server = phpServer(Number(process.env.PORT || 3000));
const redis = await localRedis();
const child=spawn(server.binary, server.args, server.options);
child.on('exit',code=>{redis?.kill(); process.exitCode=code||0;});
process.on('SIGINT',()=>child.kill()); process.on('SIGTERM',()=>child.kill());
