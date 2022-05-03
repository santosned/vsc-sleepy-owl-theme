/**
 * Licensed under the MIT License.
 * See the LICENSE file in the project root for more information. */

'strict';

const jsYaml = require('js-yaml');
const cast = require('./lib/cast');
const { log } = require('./lib/console');
const { themeFiles } = require('./lib/snippet');

class Transpiler {
    constructor() {
        this.tabWidth = 2;
        this.replacer = (key, value) => {
            // Key names that should be exclude from the theme file *.json
            const blackList = ['id', 'author', 'version', 'base', 'status'];

            // Exclude json entry if key is in the blacklist
            if (blackList.includes(key)) return undefined;

            // Exclude json entry if value is null or empty string
            if (value === null || !value) {
                const excludeList = ['fontStyle'];
                if (!excludeList.includes(key)) return undefined;
                return '';
            }

            return value;
        };
    }

    /**
     * Generate the `*-color-theme.json` file inside `/themes` folder based on the theme schema inside `/themes/schemas` folder.
     *
     * @param {object} options The theme metadata such as `dist` and `src` path locations.
     * @param {function} callback The function called either when an error occurs or when execution finished successfully.
     */
    generate(options, callback) {
        const { dist, src } = { ...options };

        getThemeSchema(src)
            .then(async (jsonData) => {
                try {
                    this.themeData = JSON.stringify(
                        jsonData,
                        this.replacer,
                        this.tabWidth,
                    );

                    const write = await themeFiles.writeFile(
                        dist,
                        this.themeData,
                    );

                    return callback(write);
                } catch (err) {
                    return callback(err);
                }
            })
            .catch((err) => {
                return callback(err);
            });
        return;
    }

    /**
     * Listen for changes in the theme `*.yml` file and generates the `*-color-theme.json` file automatically.
     *
     * @param {object} options The theme metadata such as `dist` and `src` path locations.
     * @param {function} callback The function called either when an error occurs or when execution finished successfully.
     */
    listen(options, callback) {
        const { src } = { ...options };

        themeFiles.watchFileChanges(src, () => {
            log.listen.init(options);
            this.generate(options, (err) => callback(err));
        });
    }
}

const transpiler = new Transpiler();

/**
 * Get the data from theme `*.yml` file and convert the Yaml data to JSON with the custom `js-yaml` type.
 *
 * @param {string} src The full path to theme schema file. The file should be an valid Yaml file.
 */
async function getThemeSchema(src) {
    try {
        const yamlData = await themeFiles.readFile(src);

        /**
         * Parses Yaml data into either a plain object, a string, a number, null or
         * undefined, or throws YAMLException on error.
         */
        const jsonData = await jsYaml.load(yamlData, {
            schema: cast.getCastSchema(),
            json: true,
        });

        return jsonData;
    } catch (err) {
        return Promise.reject(err);
    }
}

module.exports = transpiler;
