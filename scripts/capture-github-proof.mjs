import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('D:/Work & Organization/Work/Maxy Academy/Modules/Day 3/Project Continuation/expense-tracker-casestudy-v2/node_modules/playwright');

const outputPath = process.argv[2];
if (!outputPath) throw new Error('Output path is required.');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
await page.goto('https://github.com/evan-william/anteraja-capstone-evanwilliam/tree/5-ui', { waitUntil: 'networkidle', timeout: 60000 });
await page.screenshot({ path: outputPath, fullPage: false });
console.log(`GitHub branch proof captured: ${await page.title()}`);
await browser.close();
