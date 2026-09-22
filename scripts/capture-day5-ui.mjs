import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const output = join(process.cwd(), 'docs', 'design', 'screens');
await mkdir(output, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
const screens = [
  ['dashboard', '01-dashboard-settlement.webp'],
  ['upload', '02-upload-mutasi.webp'],
  ['preview', '03-preview-rekonsiliasi.webp'],
  ['history', '04-riwayat-pembatalan.webp'],
  ['shipment', '05-rincian-shipment.webp'],
];

for (const [screen, name] of screens) {
  await page.goto(`http://127.0.0.1:3100/ui-preview?screen=${screen}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(output, name), type: 'webp', quality: 88, fullPage: true });
}

await page.setViewportSize({ width: 390, height: 844 });
await page.goto('http://127.0.0.1:3100/ui-preview?screen=preview', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await page.screenshot({ path: join(output, '06-preview-mobile.webp'), type: 'webp', quality: 88, fullPage: true });

await browser.close();
