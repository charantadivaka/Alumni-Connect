const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  page.on('requestfailed', request => console.log('BROWSER REQ FAILED:', request.url(), request.failure().errorText));

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  console.log('Landed on Home Page');

  // Click the sign in button
  // "Sign In" button has class "nav-btn-signin"
  await page.waitForSelector('.nav-btn-signin');
  await page.click('.nav-btn-signin');
  console.log('Clicked Sign In');
  
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
