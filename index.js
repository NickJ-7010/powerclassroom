const http = require('http');
const https = require('https');
const fs = require('fs');

const port = 2060;
const mimeTypes = {
    "html": "text/html",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "png": "image/png",
    "svg": "image/svg+xml",
    "json": "application/json",
    "js": "text/javascript",
    "css": "text/css"
};

const server = http.createServer((req, res) => {
    if (req.url == '/favicon.ico') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'image/x-icon');
        res.end(fs.readFileSync('assets/favicon.ico'));
    } else if (req.url.startsWith('/assets/') && fs.existsSync(decodeURI(req.url.slice(1)))) {
        res.statusCode = 200;
        res.setHeader('Content-Type', mimeTypes[decodeURI(req.url.slice(1)).split('.').pop()] ?? 'text/plain');
        res.end(fs.readFileSync(decodeURI(req.url.slice(1))));
    } else if (req.url == '/ping') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end('The server is running just fine!');
    } else {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html');
        res.end(fs.readFileSync('main.html'));
    };
});

server.listen(port, () => {
    console.log(`Server running at http://127.0.0.1:${port}/`);
});