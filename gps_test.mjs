import { chromium } from 'playwright-core';
import fs from 'fs';

const token = fs.readFileSync('/tmp/token.txt', 'utf-8').trim();

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

const logs = [];
page.on('console', (msg) => logs.push(`[console:${msg.type()}] ${msg.text()}`));
page.on('pageerror', (err) => logs.push(`[pageerror] ${err.message}`));
page.on('requestfailed', (req) => logs.push(`[requestfailed] ${req.method()} ${req.url()} -> ${req.failure()?.errorText}`));
page.on('response', async (res) => {
  const url = res.url();
  if (url.includes('monitoring') || url.includes('/manager/trips')) {
    let bodyPreview = '';
    try {
      const text = await res.text();
      bodyPreview = text.slice(0, 500);
    } catch {}
    logs.push(`[response] ${res.status()} ${url} :: ${bodyPreview}`);
  }
});

try {
  await page.goto('http://127.0.0.1:3005', { waitUntil: 'domcontentloaded' });
  await page.evaluate((t) => { window.localStorage.setItem('token', t); }, token);
  await page.goto('http://127.0.0.1:3005/monitoring', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(5000);
} catch (e) {
  logs.push(`[nav-error] ${e.message}`);
}

try {
  await page.screenshot({ path: '/tmp/gps-01-monitoring.png', animations: 'disabled', timeout: 15000 });
} catch (e) {
  logs.push(`[screenshot-error] ${e.message}`);
}

const bodyText = await page.textContent('body').catch(() => '');
logs.push(`[body-snippet] ${bodyText?.slice(0, 500)}`);

fs.writeFileSync('/tmp/gps-console.log', logs.join('\n'));
console.log('DONE');
await browser.close();
