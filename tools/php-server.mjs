import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

export function phpServer(port) {
  const binary = process.env.PHP_BIN || (existsSync('C:/xampp/php/php.exe') ? 'C:/xampp/php/php.exe' : 'php');
  const flags = ['-d', 'upload_max_filesize=11M', '-d', 'post_max_size=12M', '-d', 'memory_limit=512M'];
  const modules = execFileSync(binary, ['-m'], { encoding: 'utf8' });
  const localOpcache = path.join(path.dirname(binary), 'ext', 'php_opcache.dll');
  if (!modules.includes('Zend OPcache') && process.platform === 'win32' && existsSync(localOpcache)) flags.push('-d', `zend_extension=${localOpcache}`);
  // cache compiled PHP, not business data; local edits remain immediately visible.
  flags.push('-d', 'opcache.enable_cli=1', '-d', 'opcache.validate_timestamps=1', '-d', 'opcache.revalidate_freq=0');
  return {
    binary,
    args: [...flags, '-S', `127.0.0.1:${port}`, '-t', '.', path.resolve('backend/vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php')],
    options: { cwd: path.resolve('backend/public'), stdio: 'inherit' },
  };
}
