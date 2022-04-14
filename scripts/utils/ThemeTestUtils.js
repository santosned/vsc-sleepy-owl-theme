'strict';

const https = require('https');
const fsPromises = require('fs/promises');
const { readFileSync } = require('fs');
const { join } = require('path');

/**
 *
 * @param {string} filename theme filename inside themes/ folder
 * @returns {string}
 */
const getThemesUrl = (filename) => join(__dirname, '../../themes/', filename);

/**
 * Read files inside 'themes/' searching for all '*-color-theme.json' files
 * @returns List with the location of all valid filenames
 */
async function getThemesDir() {
    try {
        const url = join(__dirname, '../../themes/');
        let themesDir = await fsPromises.readdir(url, 'utf-8');
        themesDir = themesDir.filter((name) =>
            name.includes('-color-theme.json'),
        );
        themesDir = themesDir.map((t) => getThemesUrl(t));
        return Promise.resolve(themesDir);
    } catch (err) {
        return Promise.reject(err);
    }
}

/**
 *
 * @param {string} url The full path of a valid color theme file
 * @returns {Object} The data inside the color theme file
 */
async function readThemeFile(url) {
    try {
        const getData = await fsPromises.readFile(url, 'utf-8');
        const data = await JSON.parse(getData);
        return Promise.all([data, getData]);
    } catch (err) {
        return Promise.reject(err);
    }
}

/**
 *
 * @param {string} htmlData The DOM data received from https://code.visualstudio.com/api/references/theme-color
 * @returns {string} Colors list with all tokens received from API
 */
async function parseTokenColors(htmlData) {
    // Convert html data into array
    htmlData = htmlData.split('\n');

    // Get all data inside a code tag
    let colors = htmlData
        .map((key) => key.slice(key.indexOf('<code>'), key.indexOf('</code>')))
        .map((key) => key.replace('<code>', ''))
        .filter((key) => key !== '');

    // Get rid of unwanted tokens
    colors = colors.filter(
        (key) =>
            !key.includes('&quot;') &&
            !key.includes(':') &&
            !key.includes('workbench.colorCustomizations') &&
            key.length > 5,
    );

    colors = { colors: [...colors] };

    colors = await JSON.stringify(colors, null, 2);

    return colors;
}

class ColorThemeReference {
    constructor() {
        this.src = getThemesUrl('schemas/colors.json');
        this.url = 'https://code.visualstudio.com/api/references/theme-color';
        this.encodeType = 'utf8';
        /**
         * Get reference tokens from theme-color api.
         * @returns {string} Theme color references
         */
        this.getThemeColorReference = async ({ url, encodeType }) => {
            return new Promise((resolve, reject) => {
                https
                    .get(url, (res) => {
                        let data = '';
                        res.setEncoding(encodeType);

                        res.on('data', (resData) => {
                            data += resData;
                        });

                        res.on('end', () => {
                            resolve(parseTokenColors(data));
                        });

                        res.on('error', (err) => {
                            reject(err);
                        });
                    })
                    .on('error', (err) => {
                        reject(err);
                    });
            });
        };
    }
    /**
     * Get theme-color references
     * @param {boolean} latest If the color theme references should be update
     * @returns {Object} { colors: [] | Object }
     */
    async get({ latest }) {
        if (!latest) {
            try {
                const [alt, res] = await readThemeFile(this.src);
                return alt;
            } catch (err) {
                if (err.code !== 'ENOENT') {
                    console.log(err);
                    return Promise.reject(err);
                }
            }
        }

        try {
            const data = await this.getThemeColorReference({
                url: this.url,
                encodeType: this.encodeType,
            });
            // Create cache of theme-color reference
            fsPromises.writeFile(this.src, data);
            // Create JSON object
            const colorRef = await JSON.parse(data);
            return colorRef;
        } catch (err) {
            if (err && err.message) {
                console.log(err.message);
            }
            return Promise.reject(err);
        }
    }
}

class TestColorThemes {
    constructor({ colors, count }) {
        this.reference = colors;
        this.count = count;
    }
    async initialize() {
        const themesAvailiable = await getThemesDir();

        // Not themes found? return error.
        if (themesAvailiable.length === 0) {
            console.log(
                'No valid color theme file found. Make sure the file name ends with *-color-theme.json then test again.',
            );
            process.exit(1);
        }

        console.log('Initialize themes colors tokens test...');

        /**
         *  Loop through each theme inside 'theme/' folder
         *  @returns List with all themes that passed the tests
         */
        const themes = themesAvailiable.filter((dir) => {
            console.log(`\n @ ${dir.slice(dir.lastIndexOf('themes'))}\n`);

            // Read data from theme
            const fileData = readFileSync(dir, 'utf-8');

            // Create JSON Object
            const alt = JSON.parse(fileData);

            // Get all key names inside { colors }
            const theme = Object.keys(alt.colors);

            const result = {
                pass: 0,
                invalid: 0,
                rate: 0,
            };

            theme.forEach((key) => {
                if (this.reference.includes(key)) {
                    result.pass = result.pass + 1;
                } else {
                    result.invalid = result.invalid + 1;
                }
            });

            result.rate = (result.pass / this.count) * 100;

            console.log(`  - Total: ${theme.length} tokens.`);
            console.log(`  - Invalid: ${result.invalid} tokens.`);
            console.log(
                `  - Utilized: ${result.rate.toFixed(2)}% of ${
                    this.count
                } tokens available in the color-theme references.`,
            );

            return result.invalid > 0 ? false : true;
        });

        console.log('\nFinished.\n');

        // If not all available themes passed the test return error
        if (themes.length !== themesAvailiable.length) {
            console.log(
                `Only ${(themes.length / themesAvailiable.length).toFixed(
                    2,
                )}% of ${
                    themesAvailiable.length
                } themes passed the test. Test failed.\n`,
            );
            process.exit(1);
        }

        // Else if all available themes passed the test:
        console.log(
            `No unknown or invalid tokens found. Test finished successfully.\n`,
        );
        process.exit(0);
    }
}

module.exports = { ColorThemeReference, TestColorThemes };
