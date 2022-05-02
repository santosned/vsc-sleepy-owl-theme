/**
 * Licensed under the MIT License.
 * See the LICENSE file in the project root for more information. */

'strict';

const transpiler = require('./generate');
const { log } = require('./lib/console');
const { metadata } = require('./lib/snippet');

metadata
    .getThemeInfo(process.env.npm_package_json)
    .then((themeInfo) => {
        log.build.init(themeInfo);

        transpiler.generate(themeInfo, (err) => {
            // This will be called every time a error occurs
            if (err) {
                // Log the error message if any
                if (err.message) console.log(err.message);
                process.exit(1);
            }

            if (err === undefined) {
                log.build.ready();
                process.exit(0);
            }
        });
    })
    .catch((err) => {
        if (err && err.message) {
            console.log(err);
        }
        process.exit(1);
    });
