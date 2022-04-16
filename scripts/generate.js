/**
 * Licensed under the MIT License.
 * See the LICENSE file in the project root for more information. */

'strict';

const jsYaml = require('js-yaml');

const {
    readThemeSchema,
    writeThemeSchema,
    ColorsTool,
    watchThemeChanges,
} = require('./utils/ThemeDevUtils');

/**
 *
 * @param {string} src Path to theme schema file
 * @returns
 */
async function getThemeSchema(src, customType) {
    try {
        const yamlData = await readThemeSchema(src);
        const CUSTOM_SCHEMA = jsYaml.DEFAULT_SCHEMA.extend(customType);
        /**
         * Parses yaml file into either a plain object, a string, a number, null or
         * undefined, or throws YAMLException on error.
         */

        let jsonData = await jsYaml.load(yamlData, {
            schema: CUSTOM_SCHEMA,
            json: true,
        });

        return Promise.all([jsonData, yamlData]);
    } catch (err) {
        return Promise.reject(err);
    }
}

class Transpiler {
    constructor(args) {
        let { tabWidth } = { ...args };
        this.tabWidth = typeof tabWidth === 'number' ? tabWidth : 2;
        this.replacer = (key, value) => {
            // Key names that should be exclude from the theme file *.json
            const blackList = ['name', 'author', 'version', 'base'];

            // Exclude json entry if key is in the blacklist
            if (blackList.includes(key)) {
                return undefined;
            }

            // Exclude json entry if value is null or empty string
            if (value === null || !value) {
                return undefined;
            }

            return value;
        };

        this.jsYaml_ct_cast = new jsYaml.Type('!cast', {
            kind: 'mapping',
            resolve: (args) => {
                return args || {};
            },
            construct: (args) => {
                if (!args.color) return null;
                const colorsTool = new ColorsTool(
                    args.color || false,
                    args.alpha || false,
                    args.light || false,
                );
                return colorsTool.cast();
            },
            represent: (args) => {
                return args;
            },
        });
    }
    /**
     *
     * @param {object} options {dist: <string>, src: <string>}
     * @param {function} callback
     */
    generate(options, callback) {
        // Get the required dist and src paths from options
        const { dist, src } = { ...options };

        // Throws error if src path does not contain .yml
        if (!src.includes('.yml')) {
            throw `generate(): Invalid options 'src: <string>'. Received '${src}'.`;
        }

        // Throws error if dist path does not contain *-color-theme.json
        if (!dist.includes('-color-theme.json')) {
            throw `generate(): Invalid options 'dist: <string>'. Received '${dist}'.`;
        }

        getThemeSchema(src, this.jsYaml_ct_cast)
            .then(async ([jsonData, yamlData]) => {
                try {
                    jsonData = await JSON.stringify(
                        jsonData,
                        this.replacer,
                        this.tabWidth,
                    );

                    const write = await writeThemeSchema(dist, jsonData);

                    callback(write);
                } catch (err) {
                    callback(err);
                }
            })
            .catch((err) => {
                callback(err);
            });
    }
    listen(options, callback) {
        const { src } = { ...options };

        watchThemeChanges(src, () => {
            this.generate(options, (v) => callback(v));
        });
    }
}

module.exports = { Transpiler };
