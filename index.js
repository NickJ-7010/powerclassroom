const minify = import('minify');
const http = require('http');
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
}

const server = http.createServer((req, res) => {
    if (req.url == '/favicon.ico') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'image/x-icon');
        res.setHeader('Cache-Control', 'max-age=31536000');
        res.end(fs.readFileSync('assets/static/favicon.ico'));
    } else if (req.url == '/manifest.json') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'max-age=31536000');
        res.end(fs.readFileSync('assets/static/manifest.json'));
    } else if (req.url == '/robots.txt') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end('');
    } else if (req.url.startsWith('/assets/') && fs.existsSync(decodeURI(req.url.slice(1)))) {
        res.statusCode = 200;
        if (req.url.startsWith('/assets/static/')) res.setHeader('Cache-Control', 'max-age=31536000');
        res.setHeader('Content-Type', mimeTypes[decodeURI(req.url.slice(1)).split('.').pop()] ?? 'text/plain');
        res.end(fs.readFileSync(decodeURI(req.url.slice(1))));
    } else if (req.url == '/ping') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end('The server is running just fine!');
    } else {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html');
        res.end(fs.readFileSync(`main.mini.html`));
    }
});

server.listen(port, () => {
    console.log(`Server running at http://127.0.0.1:${port}/`);
});

minify.then(async res => {
    const minified = await res.minify('main.html', {
        js: {
            mangleClassNames: true,
            removeUnusedVariables: true,
            removeConsole: false,
            removeUselessSpread: true
        },
        html: {
            removeComments: true,
            removeCommentsFromCDATA: true,
            removeCDATASectionsFromCDATA: true,
            collapseWhitespace: true,
            collapseBooleanAttributes: true,
            removeAttributeQuotes: true,
            removeRedundantAttributes: true,
            useShortDoctype: true,
            removeEmptyAttributes: true,
            removeEmptyElements: false,
            removeOptionalTags: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            minifyJS: true,
            minifyCSS: true
        },
        css: {
            compatibility: '*'
        }
    });
    fs.writeFileSync(`main.mini.html`, minified);
});