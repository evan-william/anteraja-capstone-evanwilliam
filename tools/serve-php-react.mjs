import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

if (!existsSync('dist/index.html')) {
  console.error('Build belum ada. Jalankan npm run build terlebih dahulu.');
  process.exit(1);
}
const php = process.env.PHP_BIN || (existsSync('C:\\xampp\\php\\php.exe') ? 'C:\\xampp\\php\\php.exe' : 'php');
const uploadTemp = path.resolve('.private/php-uploads').replaceAll('\\', '/');
mkdirSync(uploadTemp, { recursive: true });
const child = spawn(php, ['-d', `upload_tmp_dir="${uploadTemp}"`, '-d', 'display_errors=0', '-d', 'upload_max_filesize=11M', '-d', 'post_max_size=12M', '-d', 'memory_limit=512M', '-S', '127.0.0.1:3000', '-t', 'dist', 'server/router.php'], { stdio: 'inherit' });
child.on('exit', (code) => { process.exitCode = code || 0; });
process.on('SIGINT', () => child.kill());
process.on('SIGTERM', () => child.kill());
