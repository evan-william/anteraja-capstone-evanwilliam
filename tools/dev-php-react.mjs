import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const php = process.env.PHP_BIN || (existsSync('C:\\xampp\\php\\php.exe') ? 'C:\\xampp\\php\\php.exe' : 'php');
const uploadTemp = path.resolve('.private/php-uploads').replaceAll('\\', '/');
mkdirSync(uploadTemp, { recursive: true });
const children = [
  spawn(php, ['-d', `upload_tmp_dir="${uploadTemp}"`, '-d', 'display_errors=0', '-d', 'upload_max_filesize=11M', '-d', 'post_max_size=12M', '-d', 'memory_limit=512M', '-S', '127.0.0.1:8089', 'server/router.php'], { stdio: 'inherit' }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '3000'], { stdio: 'inherit' }),
];
function stop() { for (const child of children) child.kill(); }
for (const child of children) child.on('exit', (code) => { if (code && code !== 0) { stop(); process.exitCode = code; } });
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
