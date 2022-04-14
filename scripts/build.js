/**
 * Licensed under the MIT License.
 * See the LICENSE file in the project root for more information. */

'strict';

const { getThemeInfo } = require('./utils/ThemeDevUtils');
const { Transpiler } = require('./generate');

getThemeInfo(process.env.npm_package_json)
    .then((themeInfo) => {
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
        transpiler.generate(themeInfo, (error) => {
            if (error) {
                console.log(error);
                process.exit(1);
            }
        });
    })
    .catch((err) => {
        if (err && err.message) {
            console.log(err);
        }
        process.exit(1);
    });
