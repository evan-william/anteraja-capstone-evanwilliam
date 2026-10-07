import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:3000';
const credentials = {
  admin: [process.env.QA_ADMIN_EMAIL, process.env.QA_ADMIN_PASSWORD],
  seller: [process.env.QA_SELLER_EMAIL, process.env.QA_SELLER_PASSWORD],
  consumer: [process.env.QA_CONSUMER_EMAIL, process.env.QA_CONSUMER_PASSWORD],
};
const browser = await chromium.launch({ headless: true });
const screenshotDir = process.env.QA_SCREENSHOTS || '';
if (screenshotDir) await mkdir(screenshotDir, { recursive: true });
let failures = 0;

async function inspect(page, label, expected) {
  await page.goto(`${base}${expected.path}`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: expected.heading }).first().waitFor({ timeout: 60000 });
  await page.waitForTimeout(900);
  console.log(`PASS ${label}: ${expected.path}`);
}

try {
  const publicPage = await browser.newPage();
  const errors = [];
  publicPage.on('pageerror', (error) => errors.push(error.message));
  await inspect(publicPage, 'public tracking', { path: '/lacak', heading: /Tahu posisinya/ });
  await inspect(publicPage, 'public detail', { path: '/lacak/ANT-100015?code=260926', heading: /ANT-100015/ });
  await publicPage.getByRole('heading', { name: 'Timeline pengiriman' }).waitFor({ timeout: 20000 });
  const invalidCode = await publicPage.request.get(`${base}/api/v1/tracking/ANT-100015?code=000000`);
  if (invalidCode.status() !== 404) throw new Error(`Invalid tracking access code returned ${invalidCode.status()}, expected 404`);
  console.log('PASS tracking invalid access code');
  if (screenshotDir) await publicPage.screenshot({ path: `${screenshotDir}/tracking-desktop.png`, fullPage: true });
  await publicPage.setViewportSize({ width: 375, height: 812 });
  await publicPage.waitForTimeout(300);
  if (screenshotDir) await publicPage.screenshot({ path: `${screenshotDir}/tracking-mobile.png`, fullPage: true });
  const overflow = await publicPage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (overflow) throw new Error('Tracking detail overflows at 375px');
  await publicPage.setViewportSize({ width: 1280, height: 720 });
  await publicPage.close();

  for (const [role, [email, password]] of Object.entries(credentials)) {
    if (!email || !password) { console.log(`SKIP ${role}: credentials not configured`); continue; }
    const page = await browser.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${base}/masuk`, { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: /^Masuk$/ }).click();
    const target = role === 'admin' ? '/admin' : role === 'seller' ? '/seller' : '/akun';
    await page.waitForURL(`**${target}`, { timeout: 20000 });
    if (role === 'consumer') await page.locator('section[aria-label="Daftar paket saya"]').waitFor({ timeout: 60000 });
    if (role === 'seller') await page.getByRole('heading', { name: 'Pengiriman toko' }).waitFor({ timeout: 60000 });
    if (role === 'admin') await page.getByRole('heading', { name: 'Tangani lebih dulu' }).waitFor({ timeout: 60000 });
    await page.waitForTimeout(900);
    console.log(`PASS ${role} login`);
    if (screenshotDir) await page.screenshot({ path: `${screenshotDir}/${role}-home.png`, fullPage: true });
    if (role === 'seller') {
      await inspect(page, 'seller shipments', { path: '/pengiriman', heading: 'Operasi pengiriman' });
      const detailLink = page.locator('a[href^="/pengiriman/ANT-"]').first();
      if (await detailLink.count()) {
        await detailLink.click();
        await page.getByRole('heading', { name: /ANT-[0-9]{6}/ }).first().waitFor({ timeout: 20000 });
        console.log('PASS seller shipment detail');
      }
      await inspect(page, 'seller finance', { path: '/transaksi', heading: 'Arus dana' });
      await inspect(page, 'seller import', { path: '/import', heading: 'Rekonsiliasi bank' });
      await page.locator('#bank-statement-file').setInputFiles(path.resolve('docs/data/mutasi-bank-b.csv'));
      await page.getByRole('heading', { name: 'Tinjau hasil pencocokan' }).waitFor({ timeout: 20000 });
      console.log('PASS seller CSV preview through PHP');
      await inspect(page, 'seller categories', { path: '/kategori', heading: 'Kelola kategori' });
    }
    if (role === 'admin') {
      await inspect(page, 'admin shipments', { path: '/admin/kiriman', heading: 'Semua kiriman' });
      await page.locator('a[href^="/admin/pengiriman/"]').first().click();
      await page.getByRole('heading', { name: /ANT-[0-9]{6}/ }).first().waitFor({ timeout: 20000 });
      console.log('PASS admin shipment detail');
      await inspect(page, 'admin tickets', { path: '/admin/tiket', heading: 'Tiket pengiriman' });
      await page.getByRole('button', { name: 'Buka asisten operasi' }).click();
      await page.getByRole('button', { name: 'Apa prioritas operasi hari ini?' }).click();
      await page.getByRole('log').getByText(/(?:Gemini|Data langsung).*dicek/).waitFor({ timeout: 90000 });
      console.log('PASS admin assistant data reply');
      await page.getByRole('button', { name: 'Tutup asisten' }).click();
      await page.goto(`${base}/transaksi`);
      await page.waitForURL('**/akses-ditolak', { timeout: 10000 });
      console.log('PASS admin denied seller finance');
    }
    if (role === 'consumer') {
      await page.goto(`${base}/admin`);
      await page.waitForURL('**/akses-ditolak', { timeout: 10000 });
      console.log('PASS consumer denied admin');
    }
    await page.close();
  }
  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);
} catch (error) {
  failures++;
  console.error(error instanceof Error ? error.message : String(error));
} finally {
  await browser.close();
}
process.exitCode = failures ? 1 : 0;
