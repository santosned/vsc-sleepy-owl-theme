/**
 * Licensed under the MIT License.
 * See the LICENSE file in the project root for more information. */

'strict';

const { getThemeInfo, perfSense } = require('./utils/ThemeDevUtils');
const { Transpiler } = require('./generate');

getThemeInfo(process.env.npm_package_json)
    .then((themeInfo) => {
        /**
         * Create new theme transpiler
         * @param tabWidth Define the indentantion tab width for the generated json file.
         */
        const transpiler = new Transpiler({ tabWidth: 2 });

        /**
         * Listen for changes in the theme file inside './themes/schemas/' and automatically
         * generate a new *-color-theme.json file.
         * @param object { label?: <string>, src: <string>, dist: <string> }
         * @param callback A callback function which return either an error or undefined when success.
         */
        transpiler.listen(themeInfo, (err) => {
            // This will be called every time a error occurs
            if (err) {
                // Log the error message if any
                if (err.message) console.log(err.message);

                // Uncomment the next line if the listener should stop after receiving a error message
                //process.exit(1);
            }

            if (err === undefined) {
                console.log(' Theme generated successfully!');
            }
        });
    })
    .catch((err) => {
        if (err && err.message) {
            console.log(err);
        }
        process.exit(1);
    });
