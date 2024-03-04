const crypto = require('crypto');
const https = require('https');
const http = require('http');

http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.url == '/save-auth') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Pre-request completed.');
    } else if (req.url == '/auth') {
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
                const username = request.id;
                const password = request.password;

                const completed = {
                    powerschool: undefined,
                    brightspace: undefined,
                }
                
                var error = 0;

                function validateFinish () {
                    if (typeof completed.brightspace == 'string' == request.brightspace && typeof completed.powerschool == 'string' == request.powerschool) {
                        res.statusCode = '200';
                        res.setHeader('Content-Type', 'text/plain');
                        res.end(JSON.stringify({
                            powerschool: completed.powerschool,
                            brightspace: completed.brightspace,
                            error: error
                        }));
                    }
                }

                if (request.powerschool) {
                    const template = '<?xml version="1.0" encoding="UTF-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" xmlns="http://publicportal.rest.powerschool.pearson.com/xsd"><soap:Header><wsse:Security soap:mustUnderstand="0" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"><wsse:UsernameToken><wsse:Username>pearson</wsse:Username><wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest">{{PASSWORD_DIGEST}}</wsse:Password><wsse:Nonce>{{NONCE}}</wsse:Nonce><wsu:Created>{{CREATED}}</wsu:Created></wsse:UsernameToken></wsse:Security></soap:Header><soap:Body><loginToPublicPortal xmlns="http://publicportal.rest.powerschool.pearson.com/xsd"><username><![CDATA[{{USERNAME}}]]></username><password><![CDATA[{{PASSWORD}}]]></password></loginToPublicPortal></soap:Body></soap:Envelope>';

                    const nonce = btoa(crypto.randomBytes(8).toString('hex'));
                    const created = new Date().toISOString();
                    const digest = generateDigest(nonce, created);

                    const payload = template.replace("{{USERNAME}}", username).replace("{{PASSWORD}}", password).replace("{{NONCE}}", nonce).replace("{{CREATED}}", created).replace("{{PASSWORD_DIGEST}}", digest);

                    const authReq = https.request({
                        hostname: "powerschool.aacps.org",
                        method: "POST",
                        path: "/pearson-rest/services/PublicPortalService"
                    }, (response) => {
                        var data = "";

                        response.on('data', d => {
                            data += d.toString();
                        });

                        response.on('end', () => {
                            try {
                                completed.powerschool = JSON.stringify(/<serviceTicket>(?<token>.*?)<\/serviceTicket><studentIDs>(?<id>[0-9]*)<\/studentIDs>.*?<userType>(?<type>.*?)<\/userType>/.exec(data).groups);
                            } catch (e) {
                                request.powerschool = false;
                                error += 1;
                            }
                            validateFinish();
                        });
                    });

                    authReq.write(payload);
                    authReq.end();
                }

                if (request.brightspace) {
                    try {
                        const initReq = await getHtml();
                        const initData = JSON.parse(/\$Config=({.*?});/s.exec(initReq.HTML)[1]);

                        const credentials = JSON.parse(await getCredentials(username + "@aacps.org", initData));
                        const saml = await getSaml(username + "@aacps.org", password, initData, credentials, initReq.cookies);

                        completed.brightspace = JSON.stringify({ saml: saml, cookies: await getTokens(saml) });
                    } catch (e) {
                        request.brightspace = false;
                        error += 2;
                    }
                }

                validateFinish();
            } catch (e) {
                console.log(e);

                res.statusCode = 400;
                res.setHeader('Content-Type', 'text/plain');
                res.end('Invalid POST body.');
            }
        });
    } else {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end('The server is running just fine!');
    }
}).listen(3000);

function getHtml() {
    return new Promise((ret, rej) => {
        https.request({
            hostname: 'brightspace.aacps.org',
            path: '/d2l/lp/auth/saml/initiate-login?entityId=https://sts.windows.net/b7d27e93-356b-4ad8-8a70-89c35df207c0/'
        }, response => {
            const url = new URL(response.headers.location);
            https.request({
                hostname: url.host,
                path: url.pathname + url.search + "&sso_reload=true"
            }, res => {
                var data = "";
                
                res.on('data', d => {
                    data += d.toString();
                });

                res.on('end', () => {
                    ret({ HTML: data, cookies: res.headers['set-cookie'].map(cookie => cookie.split(';')[0]) });
                });
            }).end();
        }).end();
    });
}

function getCredentials(username, initData) {
    return new Promise((ret, rej) => {
        const payload = {
            "username": username,
            "isOtherIdpSupported": true,
            "checkPhones": true,
            "isRemoteNGCSupported": true,
            "isCookieBannerShown": false,
            "isFidoSupported": true,
            "originalRequest": initData.sCtx,
            "country": "US",
            "forceotclogin": false,
            "isExternalFederationDisallowed": false,
            "isRemoteConnectSupported": false,
            "federationFlags": 0,
            "isSignup": false,
            "flowToken": initData.sFT,
            "isAccessPassSupported": true
        }

        const req = https.request({
            hostname: 'login.microsoftonline.com',
            path: '/common/GetCredentialType?mkt=en-US',
            method: 'POST'
        }, res => {
            var data = "";

            res.on('data', d => {
                data += d.toString();
            });

            res.on('end', () => {
                ret(data);
            });
        });
        
        req.write(JSON.stringify(payload));
        req.end();
    });
}

function getSaml(username, password, initData, credentials, cookies) {
    return new Promise((ret, rej) => {
        const payload = `
            i13=0
            &login=${encodeURIComponent(username)}
            &loginfmt=${encodeURIComponent(username)}
            &type=11
            &LoginOptions=3
            &lrt=
            &lrtPartition=
            &hisRegion=
            &hisScaleUnit=
            &passwd=${encodeURIComponent(password)}
            &ps=2
            &psRNGCDefaultType=
            &psRNGCEntropy=
            &psRNGCSLK=
            &canary=${encodeURIComponent(initData.canary)}
            &ctx=${encodeURIComponent(initData.sCtx)}
            &hpgrequestid=${encodeURIComponent(initData.sessionId)}
            &flowToken=${encodeURIComponent(credentials.FlowToken)}
            &PPSX=
            &NewUser=1
            &FoundMSAs=
            &fspost=0
            &i21=0
            &CookieDisclosure=0
            &IsFidoSupported=1
            &isSignupPost=0
            &i19=126777
        `.replace(/\n/g, '').replace(/\s/g, '');

        const req = https.request({
            hostname: 'login.microsoftonline.com',
            path: '/b7d27e93-356b-4ad8-8a70-89c35df207c0/login',
            method: 'POST',
            headers: {
                'Host': 'login.microsoftonline.com',
                'Origin': 'https://login.microsoftonline.com',
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cookie': [...cookies, 'x-ms-gateway-slice=estsfd; stsservicecookie=estsfd; AADSSO=NA|NoExtension; SSOCOOKIEPULLED=1; brcap=0; wlidperf=FR=L&ST=' + Date.now()].join('; ')
            }
        }, response => {
            var data = "";
            
            response.on('data', d => {
                data = d.toString();
            });

            response.on('end', () => {
                try {
                    ret(data);
                } catch (e) {
                    rej();
                }
            });
        });

        req.write(payload);
        req.end();
    });
}

function getTokens(data) {
    return new Promise((ret, rej) => {
        const saml = /action="(?<url>.*?)".*?name="(?<key>[A-z]*)" value="(?<value>.*?)"/.exec(data).groups;
        const url = new URL(saml.url);

        const req = https.request({
            hostname: url.host,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }, res => {
            ret(res.headers['set-cookie'].map(cookie => cookie.split(';')[0]).join(';'));
        });

        req.write(`${saml.key}=${encodeURIComponent(saml.value)}`);
        req.end();
    });
}

function generateDigest(nonce, createdString) { // base64(sha-1(nonce + created + password))
    const nonceBytes = Buffer.from(nonce, 'base64');
    const time = Buffer.from(createdString);
    const pwd = Buffer.from("m0bApP5");

    return crypto.createHash('sha1').update(Buffer.concat([nonceBytes, time, pwd])).digest('base64');
}