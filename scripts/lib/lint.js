/**
 * Licensed under the MIT License.
 * See the LICENSE file in the project root for more information. */

'strict';

const { references } = require('./snippet');

class Lint {
    constructor() {
        this.theme = {
            keyNames: ['name', 'colors', 'tokenColors', 'type'],
            tokenColors: {
                keyNames: ['name', 'scope', 'settings'],
                settings: {
                    keyNames: ['fontStyle', 'foreground'],
                    fontStyle: `\^italic|bold|underline|strikethrough|\s$\g`,
                },
            },
            pattern: {
                hex: /^\#([A0-Z9]{6}|[A0-Z9]{8})$/,
            },
        };
    }

    /**
     * Performs specific tests in the theme json file.
     *
     * For example, search for all required keys with `missing_keys`. Test if only the required keys are being used with `unknown_keys`.
     *
     * @param {string} testName Test id or name.
     * @param {string} path The full path location to the theme file.
     * @param {object} themeData The theme data from the color-theme.json file.
     * @param {object} packageInfo The themes metadata from package.json.
     */
    test = async function (testName, path, themeData, packageInfo) {
        this.themesPath = path;
        this.themeData = themeData;
        this.packageInfo = packageInfo;

        switch (testName) {
            case 'missing_keys':
                this.result = await this.missingKeys(this.themeData);
                break;
            case 'unknown_keys':
                this.result = await this.unknownKeys(this.themeData);
                break;
            case 'invalid_values':
                this.result = await this.invalidValues(
                    this.themeData,
                    this.packageInfo,
                );
                break;
            case 'colors_keys':
                this.result = await this.colorsKeys(this.themeData);
                break;
            case 'colors_value':
                this.result = await this.colorsValues(this.themeData);
                break;
            case 'tokencolors_keys':
                this.result = await this.tokenColorsKeys(this.themeData);
                break;
            case 'tokencolors_settings_values':
                this.result = await this.tokenColorsSettingsValues(
                    this.themeData,
                );
                break;
            default:
                this.result = {
                    message: `Unknown or invalid ${testName} test name.`,
                };
                break;
        }

        if (this.result.message) return this.result;

        return;
    };
    /**
     * Get a list with all tests `id` and `message`.
     */
    getListOfTest = () => [
        {
            id: 'missing_keys',
            message: 'Check required keys',
        },
        {
            id: 'unknown_keys',
            message: 'Check for unknown keys',
        },
        {
            id: 'invalid_values',
            message: 'Check keys for invalid values',
        },
        {
            id: 'colors_keys',
            message: `Check 'colors' for unknown tokens`,
        },
        {
            id: 'colors_value',
            message: `Check 'colors' for invalid HEX RGB format`,
        },
        {
            id: 'tokencolors_keys',
            message: `Check 'tokenColors' for required keys`,
        },
        {
            id: 'tokencolors_settings_values',
            message: `Check 'settings' for invalid 'fontStyle' nor 'foreground' values`,
        },
    ];
    missingKeys = async function (themeData) {
        const res = {};
        res.test = 'missing_keys';
        for (const key of this.theme.keyNames) {
            if (!Object.keys(themeData).includes(key)) {
                res.message = `Require '${key}' key missing.`;
                break;
            }
        }
        return res;
    };

    unknownKeys = async function (themeData) {
        const res = {};
        res.test = 'unknown_keys';
        for (const key of Object.keys(themeData)) {
            if (!this.theme.keyNames.includes(key)) {
                res.message = `Unknown '${key}' key found.`;
                break;
            }
        }
        return res;
    };

    invalidValues = async function (themeData, packageInfo) {
        const res = {};
        res.test = 'invalid_values';

        for (const [key, value] of Object.entries(themeData)) {
            if (key === 'name' && !packageInfo.names.includes(value)) {
                res.message = `Undeclared name '${value}' found. Make sure your theme is declared in the package.json file.`;
                break;
            }
            if (key === 'type') {
                if (!value.match(/^(dark|light)$/)) {
                    res.message = `Unknown '${value}' value found for 'type' key. It requires either 'dark' or 'light' as value.`;
                    break;
                }
                const type = 'vs' + (value == 'dark' ? '-dark' : '');
                if (!packageInfo.types.includes(type)) {
                    res.message = `Theme '${themeData.name}' doensn't match the 'uiTheme' in package.json and 'type' in color-theme.json file.`;
                    break;
                }
            }
            if (key === 'colors' && typeof value !== 'object') {
                res.message = `The key 'colors' should be an object but received an '${typeof value}'.`;
                break;
            }
            if (key === 'tokenColors' && typeof value !== 'object') {
                res.message = `The key 'tokenColors' should be an object but received an '${typeof value}'.`;
                break;
            }
        }

        return res;
    };
    colorsKeys = async function (themeData) {
        const res = {};
        res.test = 'colors_keys';

        // Get theme colors reference
        const ref = await references.colors.get();

        for (const key of Object.keys(themeData.colors)) {
            // Check if keyname from theme is not inside theme colors reference
            if (!Object.values(ref.colors).includes(key)) {
                res.message = `Unknown colors token '${key}' found. Not found in color-theme references.`;
                break;
            }
        }

        return res;
    };
    colorsValues = async function (themeData) {
        const res = {};
        res.test = 'colors_value';

        for (const value of Object.values(themeData.colors)) {
            if (!value.match(this.theme.pattern.hex)) {
                res.message = `The keys inside 'colors' requires an #RRGGBB or #RRGGBBAA color format, but received ${value}.`;
                break;
            }
        }
        return res;
    };
    tokenColorsKeys = async function (themeData) {
        const res = {};
        res.test = 'tokencolors_keys';

        for (const value of Object.values(themeData.tokenColors)) {
            if (typeof value === 'object') {
                for (const key of Object.keys(value)) {
                    if (!this.theme.tokenColors.keyNames.includes(key)) {
                        res.message = `Unknown tokenColors token '${key}' found. Expected 'name', 'scope', or 'settings'.`;
                        break;
                    }
                }
                if (res.message) break;
            }
        }
        return res;
    };
    tokenColorsSettingsValues = async function (themeData) {
        const res = {};
        res.test = 'tokencolors_settings_values';

        for (const value of Object.values(themeData.tokenColors)) {
            if (typeof value === 'object') {
                for (const [key2, value2] of Object.entries(value)) {
                    if (key2 === 'settings') {
                        for (const [key3, value3] of Object.entries(value2)) {
                            if (key3 === 'fontStyle') {
                                if (
                                    !value3.match(
                                        this.theme.tokenColors.settings
                                            .fontStyle,
                                    ) &&
                                    value3 !== ''
                                ) {
                                    res.message = `Unknown tokenColors settings value for '${key3}' found.`;
                                    break;
                                }
                            } else if (key3 === 'foreground') {
                                if (!value3.match(this.theme.pattern.hex)) {
                                    res.message = `Unknown tokenColors settings value for '${key3}' found.`;
                                    break;
                                }
                            }
                        }
                        if (res.message) break;
                    }
                }
                if (res.message) break;
            }
        }

        return res;
    };
}

const lint = new Lint();

module.exports = lint;
