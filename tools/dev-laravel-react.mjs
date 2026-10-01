import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import net from 'node:net';

const php = process.env.PHP_BIN || (existsSync('C:/xampp/php/php.exe') ? 'C:/xampp/php/php.exe' : 'php');
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
const children = [
  spawn(php,['-d','upload_max_filesize=11M','-d','post_max_size=12M','-d','memory_limit=512M','artisan','serve','--host=127.0.0.1',`--port=${apiPort}`],{cwd:'backend',stdio:'inherit'}),
  spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(frontPort)],{stdio:'inherit',env:{...process.env,API_PORT:String(apiPort)}}),
];
let stopped=false;
function stop() { if(stopped) return; stopped=true; for(const child of children) child.kill(); }
for(const child of children) {
  child.on('error',error=>{console.error(error.message);stop();process.exitCode=1;});
  child.on('exit',code=>{stop();process.exitCode=code||0;});
}
process.on('SIGINT',stop); process.on('SIGTERM',stop);
