const puppeteer = require('puppeteer');  
(async () = const browser = await puppeteer.launch(); const page = await browser.newPage(); page.on('console', msg =, msg.text())); page.on('pageerror', err =, err)); await page.goto('http://localhost:3000'); await new Promise(r =, 2000)); await browser.close(); })();  
