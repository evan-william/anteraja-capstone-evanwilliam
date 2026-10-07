import { spawn } from 'node:child_process';
import net from 'node:net';
import { waitForLauncher } from './launcher-gate.mjs';
import { phpServer } from './php-server.mjs';
import { localRedis } from './redis-local.mjs';

// the Windows launcher attaches this process to its job before starting servers.
await waitForLauncher();

const frontPort = Number(process.env.PORT || 3000);
const apiPort = Number(process.env.API_PORT || 8089);
async function available(port) {
  return new Promise((resolve,reject)=>{
    const server=net.createServer();
    server.once('error',()=>reject(new Error(`Port ${port} dipakai. Tutup server lama atau gunakan PORT/API_PORT berbeda.`)));
    server.listen(port,'127.0.0.1',()=>server.close(resolve));
  });
}
try { await available(frontPort); await available(apiPort); }
catch(error) { console.error(error.message); process.exit(1); }
const redis = await localRedis();
const children = [
  (() => { const server = phpServer(apiPort); return spawn(server.binary, server.args, server.options); })(),
  spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(frontPort)],{stdio:'inherit',env:{...process.env,API_PORT:String(apiPort)}}),
];
let stopped=false;
function stop() { if(stopped) return; stopped=true; for(const child of children) child.kill(); redis?.kill(); }
for(const child of children) {
  child.on('error',error=>{console.error(error.message);stop();process.exitCode=1;});
  child.on('exit',code=>{stop();process.exitCode=code||0;});
}
process.on('SIGINT',stop); process.on('SIGTERM',stop);
