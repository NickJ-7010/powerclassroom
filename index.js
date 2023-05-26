const puppeteer = require('puppeteer');
const https = require('https');
const http = require('http');

http.createServer((req, res) => {
    if (req.url == '/ping') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end('The server is running just fine!');
        return;
    }

    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.method != 'POST') {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'text/plain');
        res.end('The server only accepts POST requests.');
        return;
    }

    var data = '';

    req.on('data', chunk => {
        data += chunk.toString();
    });

    req.on('end', async () => {
        try {
            const request = JSON.parse(data);

            const completed = {
                powerschool: undefined,
                brightspace: undefined,
            }

            function validateFinish () {
                if (typeof completed.brightspace == 'string' == request.brightspace && typeof completed.powerschool == 'string' == request.powerschool) {
                    res.statusCode = '200';
                    res.setHeader('Content-Type', 'text/plain');
                    res.end(JSON.stringify({
                        powerschool: completed.powerschool,
                        brightspace: completed.brightspace
                    }));
                }
            }

            if (request.powerschool) {
                const pReq = https.request({
                    hostname: 'powerschool.aacps.org',
                    path: '/guardian/home.html',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }, response => {
                    completed.powerschool = [response.rawHeaders.find(header => header.startsWith('JSESSIONID=')).split(';')[0], response.rawHeaders.find(header => header.startsWith('psaid=')).split(';')[0], response.rawHeaders.find(header => header.startsWith('B100Serverpoolcookie=')).split(';')[0]].join(';');
                    validateFinish();
                });

                pReq.on('error', (error) => {
                    console.error(error);
                });
                
                pReq.write(`dbpw=${request.password}&translator_username=&translator_password=&translator_ldappassword=&returnUrl=&serviceName=PS+Parent+Portal&serviceTicket=&pcasServerUrl=%2F&credentialType=User+Id+and+Password+Credential&ldappassword=${request.password}&account=${request.id}&pw=${request.password}&translatorpw=`);
                pReq.end();
            }

            if (request.brightspace) {
                const browser = await puppeteer.launch({ args: ['--disable-setuid-sandbox', '--no-sandbox', '--single-process', '--no-zygote'], executablePath: '/usr/bin/google-chrome-stable' });
                const page = await browser.newPage();

                await page.setViewport({ width: 1280, height: 800 });
                await page.goto('https://brightspace.aacps.org/d2l/lp/auth/saml/initiate-login?entityId=https://sts.windows.net/b7d27e93-356b-4ad8-8a70-89c35df207c0/', { waitUntil: ['networkidle2'] });

                setTimeout(async () => {
                    const navigationPromise = page.waitForNavigation({ waitUntil: ['networkidle2'] });
                
                    await page.waitForSelector('[name="loginfmt"]');
                    await page.type('[name="loginfmt"]', request.id + '@aacps.org');
                    await page.click('[type="submit"]');
                
                    await navigationPromise;
                    await page.waitForResponse(response => response.status() === 200);
                
                    await page.waitForSelector('input[type="password"]', { visible: true });
                    await page.type('input[type="password"]', request.password);
                    await page.click('[type="submit"]');
                
                    await navigationPromise;
                    await page.waitForResponse(response => response.headers()['set-cookie']?.includes('d2lSessionVal='));
                    
                    completed.brightspace = (await page.cookies('https://brightspace.aacps.org')).map(cookie => `${cookie.name}=${cookie.value}`).join(';');
                    
                    validateFinish();

                    await browser.close();
                }, 1000);
            }

            validateFinish();
        } catch (e) {
            console.log(e);

            res.statusCode = 400;
            res.setHeader('Content-Type', 'text/plain');
            res.end('Invalid POST body.');
        }
    });
}).listen(3000);