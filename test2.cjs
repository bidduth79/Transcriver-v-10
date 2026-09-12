const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  await page.goto('http://localhost:3000');
  await new Promise(r => setTimeout(r, 2000));
  const html = await page.content();
  console.log('HTML Length:', html.length);
  if (html.length < 500) console.log(html);
  
  // also check if any div has children
  const hasContent = await page.evaluate(() => document.getElementById('root').innerHTML.length > 0);
  console.log('Has Content:', hasContent);
  
  await browser.close();
})();
