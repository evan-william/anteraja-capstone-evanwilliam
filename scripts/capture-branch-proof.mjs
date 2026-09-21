import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const output = join(process.cwd(), 'docs', 'day5-ui', 'evidence');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await page.goto('https://github.com/evan-william/expense-tracker-casestudy/tree/5-ui', {
  waitUntil: 'domcontentloaded',
  timeout: 60000,
});
await page.locator('text=5-ui').first().waitFor({ timeout: 30000 });
await page.waitForTimeout(2500);
await page.screenshot({
  path: join(output, 'branch-5-ui.webp'),
  type: 'webp',
  quality: 88,
  fullPage: false,
});
await page.goto('https://github.com/evan-william/expense-tracker-casestudy/tree/5-ui/docs/day5-ui/designs', {
  waitUntil: 'domcontentloaded',
  timeout: 60000,
});
await page.locator('text=01-dashboard-settlement.webp').first().waitFor({ timeout: 30000 });
await page.waitForTimeout(1500);
await page.screenshot({
  path: join(output, 'design-files-5-ui.webp'),
  type: 'webp',
  quality: 88,
  fullPage: false,
});
await browser.close();
