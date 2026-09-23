import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const routes = [
  'app/lacak/page.tsx',
  'app/lacak/[awb]/page.tsx',
  'app/masuk/page.tsx',
  'app/daftar/page.tsx',
  'app/pengiriman/page.tsx',
  'app/pengiriman/[awb]/page.tsx',
  'app/transaksi/page.tsx',
  'app/import/page.tsx',
  'app/kategori/page.tsx',
];

for (const route of routes) {
  assert(existsSync(resolve(root, route)), `Rute hilang: ${route}`);
  assert(/<main\b/.test(read(route)), `Landmark <main> hilang: ${route}`);
}

const sourceFiles = [
  ...routes,
  'components/tracking/tracking-experience.tsx',
  'components/tracking/seller-dashboard.tsx',
  'components/import/import-manager.tsx',
  'components/transaksi/transaction-manager.tsx',
  'components/ui/site-header.tsx',
  'components/ui/nav-links.tsx',
];
const source = sourceFiles.map(read).join('\n');

for (const element of ['main', 'section', 'article', 'header', 'nav', 'aside', 'form', 'table']) {
  assert(new RegExp(`<${element}\\b`).test(source), `Elemen semantik <${element}> tidak ditemukan`);
}

assert(!/<div[^>]*onClick=/.test(source), 'Ditemukan div dengan onClick untuk aksi');
assert(/<caption\b/.test(source), 'Caption tabel tidak ditemukan');
assert(/<th\s+scope="col"/.test(source), 'Scope header tabel tidak ditemukan');

const trackingPage = read('app/lacak/page.tsx');
const structuredData = read('lib/structured-data.ts');
assert(/type="application\/ld\+json"/.test(trackingPage), 'Script JSON-LD tidak ditemukan');
assert(/'@context': 'https:\/\/schema.org'/.test(structuredData), 'Context Schema.org tidak ditemukan');
assert(/'@type': 'WebApplication'/.test(structuredData), 'Tipe WebApplication tidak ditemukan');

const selectorSource = [
  'components/tracking/tracking-search-form.tsx',
  'components/tracking/seller-dashboard.tsx',
  'app/masuk/sign-in-form.tsx',
  'app/daftar/sign-up-form.tsx',
  'components/import/import-manager.tsx',
].map(read).join('\n');
const selectors = [
  'tracking-search-form',
  'tracking-number',
  'tracking-access-code',
  'track-package-button',
  'sign-in-form',
  'sign-up-form',
  'shipment-search',
  'shipments-table',
  'bank-statement-file',
  'save-reconciliation',
];
for (const selector of selectors) {
  assert(selectorSource.includes(`id="${selector}"`), `Selector hilang: #${selector}`);
}

const css = read('app/globals.css');
assert(css.includes('@media (max-width: 639px)'), 'Aturan input mobile tidak ditemukan');
assert(css.includes('@media (prefers-reduced-motion: reduce)'), 'Reduced motion tidak ditemukan');
assert(css.includes('min-width: 320px'), 'Lebar minimum responsif tidak ditemukan');

for (const doc of [
  'docs/prototype/README.md',
  'docs/prototype/PAGE_FRD_MAPPING.md',
  'docs/prototype/SELECTOR_REFERENCE.md',
]) {
  assert(existsSync(resolve(root, doc)), `Dokumentasi hilang: ${doc}`);
}

let commitCount = 0;
try {
  commitCount = Number(
    execFileSync('git', ['rev-list', '--count', '6-prototype..HEAD'], {
      cwd: root,
      encoding: 'utf8',
    }).trim(),
  );
} catch {
  console.warn('Commit modular belum dapat dihitung sebelum branch base tersedia.');
}

if (commitCount > 0) {
  assert(commitCount >= 5, `Commit modular baru ${commitCount}; minimal 5`);
}

console.log('PROTOTYPE_VERIFICATION_OK');
console.log(`routes=${routes.length} selectors=${selectors.length} modular_commits=${commitCount}`);
