import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Compare against the local backup without reading or printing credentials.
const backup = path.resolve(process.argv[2] || '../Backups/React-Laravel-before-organization-2026-10-07');
if (!fs.existsSync(path.join(backup, 'frontend'))) throw new Error('Pass the full backup folder as the first argument.');
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
const hash = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const failures = [];
const checked = { frontend: 0, backend: 0, sql: 0, requirements: 0, assets: 0, archivedAssets: 0 };
for (const current of walk('frontend').filter(file => /\.(?:tsx?|css)$/.test(file))) {
  const previous = current.replace(/^frontend[\\/]components[\\/]/, 'components/').replace(/^frontend[\\/]lib[\\/]/, 'lib/');
  const expected = fs.readFileSync(path.join(backup, previous), 'utf8').replaceAll('@/frontend/', '@/');
  let actual = fs.readFileSync(current, 'utf8');
  if (current.replaceAll(path.sep, '/') === 'frontend/components/tracking/seller-dashboard.tsx') {
    // The only intentional UI change contains screen-reader elements in the table scroller.
    actual = actual.replace('className="relative max-w-full overflow-x-auto"', 'className="max-w-full overflow-x-auto"');
  }
  if (expected.replaceAll('\r\n', '\n') !== actual.replaceAll('\r\n', '\n')) failures.push(current);
  checked.frontend++;
}
for (const [kind, directories] of [['backend', ['backend/app', 'backend/routes', 'backend/config', 'backend/tests']], ['sql', ['database', 'supabase']]]) {
  for (const directory of directories) for (const current of walk(directory)) {
    if (kind === 'sql' && !current.endsWith('.sql')) continue;
    if (hash(current) !== hash(path.join(backup, current))) failures.push(current);
    checked[kind]++;
  }
}
for (const current of ['docs/product/prd.md', 'docs/product/frd.md']) {
  if (hash(current) !== hash(path.join(backup, current))) failures.push(current);
  checked.requirements++;
}
for (const current of walk('public')) {
  if (hash(current) !== hash(path.join(backup, current))) failures.push(current);
  checked.assets++;
}
for (const current of walk('docs/design/source-assets').filter(file => file.endsWith('.png'))) {
  const previous = current.replace(/^docs[\\/]design[\\/]source-assets[\\/]/, 'public/');
  if (hash(current) !== hash(path.join(backup, previous))) failures.push(current);
  checked.archivedAssets++;
}
const report = {
  checked, failures, backupFolder: path.basename(backup),
  allowedFrontendDifferences: ['Import prefix @/frontend/ normalized to @/.', 'One relative class on seller table scroller fixes mobile overflow.'],
};
fs.mkdirSync('output/organization-qa', { recursive: true });
fs.writeFileSync('output/organization-qa/preservation.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify({ checked, failures }));
if (failures.length) process.exitCode = 1;
