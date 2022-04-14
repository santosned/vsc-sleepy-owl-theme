'strict';

const jsYaml = require('js-yaml');

const { readThemeSchema, writeThemeSchema } = require('./utils/ThemeDevUtils');

/**
 * 
 * @param {string} src Path to theme schema file
 * @returns 
 */
async function getThemeSchema(src) {
    try {
        const yamlData = await readThemeSchema(src);

        /**
         * Parses yaml file into either a plain object, a string, a number, null or
         * undefined, or throws YAMLException on error.
         */
        let jsonData = await jsYaml.load(yamlData, {
            schema: jsYaml.DEFAULT_SCHEMA,
            json: true,
        });

        return Promise.all([jsonData, yamlData]);
    } catch (err) {
        if (err && err.message) {
            console.log(`${err.message}\n`);
        }
        return Promise.reject(err);
    }
}

class Transpiler {
    constructor(args) {
        let { tabWidth } = { ...args };
        this.tabWidth = typeof tabWidth === 'number' ? tabWidth : 2;
        this.replacer = (key, value) => {
            // Exclude json entry if key is either name, author, or version.
            if (key === 'name' || key === 'author' || key === 'version') {
                return undefined;
            }
            // Exclude json entry if value is null or empty string
            if (value === null || !value) {
                return undefined;
            }
            return value;
        };
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

        getThemeSchema(src)
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
                    console.log(err);
                    callback(err);
                }
            })
            .catch((err) => {
                callback(err);
            });
    }
}

module.exports = { Transpiler };
