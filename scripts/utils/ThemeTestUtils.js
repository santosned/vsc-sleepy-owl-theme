/**
 * Licensed under the MIT License.
 * See the LICENSE file in the project root for more information. */

'strict';

const https = require('https');
const fsPromises = require('fs/promises');
const { readFileSync } = require('fs');
const { join } = require('path');
const { cbulk } = require('./ConsoleUtils');
const perf = require('./Metricts');

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
    constructor({ colors, count, metricts }) {
        this.reference = colors;
        this.count = count;
        this.metricts = metricts;
    }

    async initialize() {
        const metricts = this.metricts;
        const themesAvailiable = await getThemesDir();

        // Not themes found? return error.
        if (themesAvailiable.length === 0) {
            console.log(
                'No valid color theme file found. Make sure the file name ends with *-color-theme.json then test again.',
            );
            process.exit(1);
        }

        /**
         *  Loop through each theme inside 'theme/' folder
         *  @returns List with all themes that passed the tests
         */
        const themes = themesAvailiable.filter((dir) => {
            // Get shortened path url used for logs.
            const themePath = dir.slice(dir.lastIndexOf('themes'));

            // Read data from theme
            const fileData = readFileSync(dir, 'utf-8');

            // Create JSON Object
            const alt = JSON.parse(fileData);

            // Store tests results
            const result = {
                total: {
                    invalid: 0,
                },
                keys: {
                    name: {
                        invalid: 0,
                    },
                },
                type: {
                    exist: false,
                    value: {
                        invalid: 0,
                    },
                },
                colors: {
                    exist: false,
                    name: {
                        invalid: 0,
                    },
                    value: {
                        invalid: 0,
                    },
                },
                tokenColors: {
                    exist: false,
                    value: {
                        invalid: 0,
                    },
                    name: {
                        not_found: 0,
                    },
                    scope: {
                        not_found: 0,
                    },
                    settings: {
                        fontStyle: {
                            invalid: 0,
                        },
                        foreground: {
                            invalid: 0,
                        },
                    },
                },
                step: {
                    msg: (value, exist) => {
                        if (value > 0 || exist === false) {
                            return cbulk.red('FAIL');
                        } else {
                            return cbulk.green('PASS');
                        }
                    },
                },
            };

            console.log(
                `${cbulk.gray('[test]')} Target: ${cbulk.cyan(
                    `${themePath}`,
                )}...`,
            );

            console.log(`${cbulk.gray('[test]')}   # Object style:`);

            metricts.now = perf.mark();

            Object.entries(alt).forEach(([key, value]) => {
                const keynames = ['colors', 'tokenColors', 'type'];

                if (!keynames.includes(key)) {
                    result.keys.name.invalid += 1;
                } else {
                    if (key === 'type') {
                        result.type.exist = true;

                        if (value.match(/^(dark|light)$/)) {
                            result.type.value.invalid = 0;
                        } else {
                            result.type.value.invalid += 1;
                            result.total.invalid += 1;
                        }
                    } else if (key === 'colors') {
                        result.colors.exist = true;

                        if (Object.keys(value).length > 0) {
                            result.colors.value.invalid = 0;
                        } else {
                            result.colors.value.invalid += 1;
                            result.total.invalid += 1;
                        }
                    } else if (key === 'tokenColors') {
                        result.tokenColors.exist = true;

                        if (Object.keys(value).length > 0) {
                            result.tokenColors.value.invalid = 0;
                        } else {
                            result.tokenColors.value.invalid += 1;
                            result.total.invalid += 1;
                        }
                    }
                }
            });

            metricts.runtime = perf.runtime(metricts.now) + 'ms';

            /**
             * Check result, then log it.
             */
            console.log(
                `${cbulk.gray('[test]')}    - Step [1/4]: ${result.step.msg(
                    result.keys.name.invalid,
                )} ${cbulk.gray(`(${metricts.runtime})`)}`,
            );
            console.log(
                `${cbulk.gray('[test]')}    - Step [2/4]: ${result.step.msg(
                    result.type.value.invalid,
                    result.type.exist,
                )} ${cbulk.gray(`(${metricts.runtime})`)}`,
            );
            console.log(
                `${cbulk.gray('[test]')}    - Step [3/4]: ${result.step.msg(
                    result.colors.value.invalid,
                    result.colors.exist,
                )} ${cbulk.gray(`(${metricts.runtime})`)}`,
            );
            console.log(
                `${cbulk.gray('[test]')}    - Step [4/4]: ${result.step.msg(
                    result.tokenColors.value.invalid,
                    result.tokenColors.exist,
                )} ${cbulk.gray(`(${metricts.runtime})`)}`,
            );

            console.log(`${cbulk.gray('[test]')}   # Tokens:`);

            metricts.now = perf.mark();

            /**
             * TEST - colors:
             */

            Object.entries(alt.colors).forEach(([key, value]) => {
                if (key) {
                    // Check if keyname from theme is not inside color-theme reference
                    if (!this.reference.includes(key)) {
                        result.colors.name.invalid += 1;
                        result.total.invalid += 1;
                    } else {
                        // Check if value is not following the HEX color format
                        if (!value.match(/^#((\d|\w){6}|(\d|\w){8})$/)) {
                            result.colors.value.invalid += 1;
                            result.total.invalid += 1;
                        }
                    }
                }
                return value;
            });

            metricts.runtime = perf.runtime(metricts.now) + 'ms';

            /**
             * Check "colors" result, then log it.
             */
            console.log(
                `${cbulk.gray('[test]')}    - Step [1/6]: ${result.step.msg(
                    result.colors.name.invalid,
                )} ${cbulk.gray(`(${metricts.runtime})`)}`,
            );

            console.log(
                `${cbulk.gray('[test]')}    - Step [2/6]: ${result.step.msg(
                    result.colors.value.invalid,
                )} ${cbulk.gray(`(${metricts.runtime})`)}`,
            );

            metricts.now = perf.mark();

            /**
             * TEST - tokenColors:
             */
            if (!result.tokenColors.exist) {
                result.tokenColors.settings.fontStyle.invalid += 1;
                result.tokenColors.settings.foreground.invalid += 1;
                result.total.invalid += 2;
            } else {
                Object.entries(alt.tokenColors).forEach(([key0, value0]) => {
                    if (!Object.keys(value0).includes('name')) {
                        result.tokenColors.name.not_found += 1;
                        result.total.invalid += 1;
                    } else if (!Object.keys(value0).includes('scope')) {
                        result.tokenColors.scope.not_found += 1;
                        result.total.invalid += 1;
                    }

                    Object.entries(value0).forEach(([key1, value1]) => {
                        if (key1 === 'settings') {
                            Object.entries(value1).forEach(([key2, value2]) => {
                                // Tokens tests - Step [3/4] - Check fontStyle values
                                if (key2 === 'fontStyle') {
                                    const values = `\^italic|bold|underline|strikethrough|\s$\g`;
                                    if (!value2.match(values) && value2 != '') {
                                        result.tokenColors.settings.fontStyle.invalid += 1;
                                        result.total.invalid += 1;
                                    }
                                } else if (key2 === 'foreground') {
                                    // Tokens tests - Step [4/4] - Check foreground values
                                    if (
                                        !value2.match(
                                            /^#((\d|\w){6}|(\d|\w){8})$/,
                                        )
                                    ) {
                                        result.tokenColors.settings.foreground.invalid += 1;
                                        result.total.invalid += 1;
                                    }
                                }
                            });
                        }
                    });
                });
            }

            metricts.runtime = perf.runtime(metricts.now) + 'ms';

            /**
             * Check result, then log it.
             */
            console.log(
                `${cbulk.gray('[test]')}    - Step [3/6]: ${result.step.msg(
                    result.tokenColors.name.not_found,
                )} ${cbulk.gray(`(${metricts.runtime})`)}`,
            );
            console.log(
                `${cbulk.gray('[test]')}    - Step [4/6]: ${result.step.msg(
                    result.tokenColors.scope.not_found,
                )} ${cbulk.gray(`(${metricts.runtime})`)}`,
            );
            console.log(
                `${cbulk.gray('[test]')}    - Step [5/6]: ${result.step.msg(
                    result.tokenColors.settings.fontStyle.invalid,
                )} ${cbulk.gray(`(${metricts.runtime})`)}`,
            );
            console.log(
                `${cbulk.gray('[test]')}    - Step [6/6]: ${result.step.msg(
                    result.tokenColors.settings.foreground.invalid,
                )} ${cbulk.gray(`(${metricts.runtime})`)}`,
            );

            if (result.total.invalid > 0) {
                return false;
            }
            return true;
        });

        console.log(
            `${cbulk.green(
                `\nTest finished in ${perf.runtime(metricts.start)}ms\n`,
            )}`,
        );

        // If not all available themes passed the test return error
        if (themes.length !== themesAvailiable.length) {
            console.log('Result:', 'Test failed.\n');
            process.exit(1);
        }

        // Else if all available themes passed the test:
        console.log('Result:', 'Test finished successfully.\n');
        process.exit(0);
    }
}

module.exports = { ColorThemeReference, TestColorThemes };
