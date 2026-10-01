import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const php = process.env.PHP_BIN || (existsSync('C:\\xampp\\php\\php.exe') ? 'C:\\xampp\\php\\php.exe' : 'php');
const available = spawnSync(php, ['-v'], { encoding: 'utf8' }).status === 0;

describe.skipIf(!available)('PHP structured logging', () => {
  it('masks dynamic route values and query strings', () => {
    const code = "require 'backend/app/Domain/Log.php'; echo app_log_route('/api/v1/tracking/ANT-123456/resolution');";
    const result = spawnSync(php, ['-r', code], { cwd: root, encoding: 'utf8' });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toBe('/api/v1/tracking/:id/resolution');
  });

  it('correlates entries without writing unknown or sensitive fields', () => {
    const code = "function base_path(){return getcwd().'/backend';} require 'backend/app/Domain/Log.php'; app_log_start('POST', '/api/v1/auth/login'); app_log('test.event', ['password' => 'NEVER_LOG_THIS', 'error_code' => 'VALIDATION_ERROR']); app_log_finish(); echo app_log_state()['request_id'];";
    const result = spawnSync(php, ['-r', code], { cwd: root, encoding: 'utf8' });
    expect(result.status, result.stderr).toBe(0);
    const file = path.join(root, '.private/logs', `events-${new Date().toISOString().slice(0, 10)}.jsonl`);
    const entries = readFileSync(file, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line));
    const matched = entries.filter((entry) => entry.request_id === result.stdout);
    expect(matched.map((entry) => entry.event)).toEqual(['request.started', 'test.event', 'request.completed']);
    expect(JSON.stringify(matched)).not.toContain('NEVER_LOG_THIS');
    expect(matched[1].error_code).toBe('VALIDATION_ERROR');
  });
});
