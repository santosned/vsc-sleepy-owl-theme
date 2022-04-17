/**
 * Licensed under the MIT License.
 * See the LICENSE file in the project root for more information. */

'strict';

const { log } = require('./utils/ConsoleUtils');
const perf = require('./utils/Metricts');

const { getThemeInfo } = require('./utils/ThemeDevUtils');
const { Transpiler } = require('./generate');

getThemeInfo(process.env.npm_package_json)
    .then((themeInfo) => {
        log.build(themeInfo);

        // process.env.VSCODE_THEME_DEV_METRICTS = '';

        themeInfo.metricts = {
            start: perf.mark(),
            now: perf.mark(),
        };

        /**
         * Create new theme transpiler
         * @param tabWidth Define the indentantion tab width for the generated json file.
         */
        const transpiler = new Transpiler({ tabWidth: 2 });

        /**
         * Generate theme inside ./themes/
         * @param object { label?: <string>, src: <string>, dist: <string> }
         * @param callback A callback function which return either an error or undefined when success.
         */
        transpiler.generate(themeInfo, (err) => {
            // This will be called every time a error occurs
            if (err) {
                // Log the error message if any
                if (err.message) console.log(err.message);
                process.exit(1);
            }

            if (err === undefined) {
                log.ready(perf.runtime(themeInfo.metricts.start));
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
