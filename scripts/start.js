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
        transpiler.listen(themeInfo, (err) => {
            if (err) {
                // Log the error message if any
                if (err.message) console.log(err.message);

                // Uncomment the next line if the listener should stop after receiving a error message
                //process.exit(1);
            }

            if (err === undefined) {
                log.listen.ready();
            }
        });
    })
    .catch((err) => {
        if (err && err.message) {
            console.log(err);
        }
        process.exit(1);
    });
