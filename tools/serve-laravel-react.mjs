import { spawn } from 'node:child_process';
import { existsSync, cpSync, readdirSync } from 'node:fs';
if (!existsSync('dist/index.html')) { console.error('Jalankan npm run build dulu.'); process.exit(1); }
// public contains only built frontend assets, never application code or env files.
for (const asset of readdirSync('dist')) if(asset !== 'index.html') cpSync(`dist/${asset}`,`backend/public/${asset}`,{recursive:true});
const php=process.env.PHP_BIN || (existsSync('C:/xampp/php/php.exe')?'C:/xampp/php/php.exe':'php');
const child=spawn(php,['artisan','serve','--host=127.0.0.1',`--port=${process.env.PORT||3000}`],{cwd:'backend',stdio:'inherit'});
child.on('exit',code=>{process.exitCode=code||0;});
process.on('SIGINT',()=>child.kill()); process.on('SIGTERM',()=>child.kill());
