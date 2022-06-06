/**
 * Licensed under the MIT License.
 * See the LICENSE file in the project root for more information. */

'strict';

const transpiler = require('./generate');
const { log } = require('./lib/console');
const { metadata } = require('./lib/snippet');

async function build(themeInfo) {
    try {
        log.build.init(themeInfo.name);
        await transpiler.generate(themeInfo);
        log.build.ready(themeInfo);
        return;
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
}

metadata
    .getThemeInfo(process.env.npm_package_json)
    .then((themeInfo) => {
        for (const theme of Object.values(themeInfo)) {
            build(theme);
        }
    })
    .catch((err) => {
        if (err && err.message) {
            console.log(err);
        }
        process.exit(1);
    });
