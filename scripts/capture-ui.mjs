import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';

const require = createRequire(import.meta.url);
const { chromium } = require('D:/Work & Organization/Work/Maxy Academy/Modules/Day 3/Project Continuation/expense-tracker-casestudy-v2/node_modules/playwright');

const outputDirectory = process.argv[2];
if (!outputDirectory) throw new Error('Output directory is required.');

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });

const captures = [
  { name: '01-pencarian-resi-desktop.png', screen: 'search', viewport: { width: 1440, height: 1000 } },
  { name: '02-detail-pengiriman-desktop.png', screen: 'tracking', viewport: { width: 1440, height: 1080 } },
  { name: '03-resolusi-alamat-desktop.png', screen: 'exception', viewport: { width: 1440, height: 1100 } },
  { name: '04-dashboard-seller-desktop.png', screen: 'seller', viewport: { width: 1440, height: 1000 } },
  { name: '05-detail-pengiriman-mobile.png', screen: 'tracking', viewport: { width: 390, height: 844 } },
];

for (const capture of captures) {
  const page = await browser.newPage({ viewport: capture.viewport, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`http://127.0.0.1:8080/?screen=${capture.screen}`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${outputDirectory}/${capture.name}`, fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  console.log(`${capture.name}: ${capture.viewport.width}px, overflow=${overflow}, consoleErrors=${errors.length}`);
  if (errors.length) console.log(errors.join('\n'));
  await page.close();
}

await browser.close();
