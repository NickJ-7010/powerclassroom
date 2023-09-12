const minify = import('minify');
const fs = require('fs');

minify.then(async res => {
    const file = await res.minify('main.html', {
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
    fs.writeFileSync('main.mini.html', file);
});