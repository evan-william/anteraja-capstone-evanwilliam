import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const php = process.env.PHP_BIN || (existsSync('C:\\xampp\\php\\php.exe') ? 'C:\\xampp\\php\\php.exe' : 'php');
const available = spawnSync(php, ['-v'], { encoding: 'utf8' }).status === 0;

function point(value: string) {
  const result = spawnSync(php, ['-r', "require 'backend/app/Domain/RoadRoute.php'; echo json_encode(road_point($argv[1]));", '--', value], { cwd: root, encoding: 'utf8' });
  expect(result.status, result.stderr).toBe(0);
  return JSON.parse(result.stdout);
}

describe.skipIf(!available)('PHP road route validation', () => {
  it('accepts Indonesian latitude-longitude coordinates', () => {
    expect(point('-6.2088,106.8456')).toEqual([-6.2088, 106.8456]);
  });

  it('rejects locations outside Indonesia and malformed coordinates', () => {
    expect(point('40,106')).toBeNull();
    expect(point('Jakarta,Surabaya')).toBeNull();
    expect(point('-6.2,106.8,0')).toBeNull();
  });

  it('returns an error before contacting a route provider for invalid coordinates', () => {
    const code = "require 'backend/vendor/autoload.php'; $app=require 'backend/bootstrap/app.php'; $app->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap(); $_GET=['from'=>'40,106','to'=>'-7,112']; try { road_route(); } catch (Illuminate\\Http\\Exceptions\\HttpResponseException $e) { echo $e->getResponse()->getContent(); }";
    const result = spawnSync(php, ['-r', code], { cwd: root, encoding: 'utf8' });
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ error: 'Titik rute tidak valid.' });
  });
});
