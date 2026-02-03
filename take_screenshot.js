import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();

console.log('Navigating to URL...');
await page.goto('http://localhost:6006/iframe.html?args=&id=common-ui-features-cards-card--helm&viewMode=story', {
  waitUntil: 'networkidle'
});

console.log('Waiting for page to render...');
await page.waitForTimeout(3000);

console.log('Taking screenshot...');
await page.screenshot({ path: 'card-screenshot.png' });

console.log('Screenshot saved to card-screenshot.png');
await browser.close();
