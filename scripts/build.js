'strict';

const { getThemeInfo } = require('./utils/ThemeDevUtils');
const { Transpiler } = require('./generate');

getThemeInfo(process.env.npm_package_json)
    .then((themeInfo) => {
        /*
         * Create new theme transpiler @param 'tabWidth' - Define the indentantion tab
         * width for the generated *-color-theme.json
         */
        const transpiler = new Transpiler();

        /*
         * Generate theme inside ./themes/
         * @param 'object' - { label:string, src:string, dist:string } which dist and
         * src are required options.
         * @param 'callback' - Receives a callback function which return either an
         * error or undefined when success.
         */
        transpiler.generate(themeInfo, (error) => {
            console.log(error);
        });
    })
    .catch((err) => {
        if (err && err.message) {
            console.log(err);
        }
        process.exit(1);
    });
