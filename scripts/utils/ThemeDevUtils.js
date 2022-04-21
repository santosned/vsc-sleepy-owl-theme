/**
 * Licensed under the MIT License.
 * See the LICENSE file in the project root for more information. */

'strict';

const { watchFile } = require('fs');
const fsPromises = require('fs/promises');
const { join } = require('path');

/**
 *
 * @param {string} filename Theme file name with file extension
 * @returns Full path to the theme file
 */
const getThemesUrl = (filename) => join(__dirname, '../../themes/', filename);

/**
 *
 * @param {string} url Path to theme file
 * @returns {object} { label: <string>, uiTheme: <string>, dist: <string>, src: <string> }
 */
async function getThemeInfo(url) {
    try {
        const packageInfo = await fsPromises.readFile(url, 'utf-8');
        const data = await JSON.parse(packageInfo);

        const { label, uiTheme, path } = { ...data.contributes.themes[0] };

        const schema = getThemesUrl(
            `schemas${path
                .slice(path.lastIndexOf('/'))
                .replace('-color-theme.json', '.yml')}`,
        );
        const dist = getThemesUrl(`${path.slice(path.lastIndexOf('/'))}`);

        const info = { label, uiTheme, dist: dist, src: schema };

        return info;
    } catch (err) {
        return Promise.reject(err);
    }
}

/**
 *
 * @param {string} url Path to theme schema file
 * @returns {string} Theme schema data
 */
async function readThemeSchema(url) {
    try {
        const getData = await fsPromises.readFile(url, 'utf-8');
        return getData;
    } catch (err) {
        return Promise.reject(err);
    }
}

/**
 *
 * @param {string} url Path to theme file
 * @param {string} data Theme schema data which will be write
 * @returns {undefined}
 */
async function writeThemeSchema(url, data) {
    try {
        const writeData = await fsPromises.writeFile(url, data);
        return writeData;
    } catch (err) {
        return Promise.reject(err);
    }
}

/**
 * Watch for change in the theme file and call a callback function
 * @param {string} url full path to theme file
 * @param {function} callback
 */
async function watchThemeChanges(url, callback) {
    try {
        callback(); // Initialize the callback function
        watchFile(
            url,
            {
                // Specify the use of big integers
                // in the Stats object
                bigint: false,

                // Specify if the process should
                // continue as long as file is
                // watched
                persistent: true,

                // Specify the interval between
                // each poll the file
                interval: 4000,
            },
            (curr, prev) => callback(curr, prev),
        );
    } catch (err) {
        if (err && err.message) {
            console.log(err);
            process.exit(1);
        }
    }
}

class ColorsTool {
    constructor(color, alpha, light) {
        const valueIsIntenger = (value) => {
            if (!value && typeof value != 'number') {
                return false;
            }
            return value;
        };

        this.alpha = valueIsIntenger(alpha); // Check if alpha channel should be adjusted
        this.light = valueIsIntenger(light); // Check if lightness should be adjusted

        // Remove any empty space from color value
        color = color.replace(/\s/g, '');

        this.color = color; // Store color value

        // Check if color follows the HEX format
        this.matchHex = color.match(/^#((\d|\w){6}|(\d|\w){8})$/);

        // Check if color follows the RGB format
        this.machRgb = color.match(/^rgb\((\d{1,}\,){2}(\d{1,}){1}\)$/);

        // Check if color follows the RGBA format
        this.matchRgba = color.match(
            /^rgba\((\d{1,}\,){3}((\d\.\d{1,})|(\d{1}))\)$/,
        );
    }

    cast() {
        let colorValue = null;

        if (this.matchHex) {
            colorValue = this.handleHexColor(this.color, this.alpha);
        } else if (this.machRgb) {
            colorValue = this.handleRgbColor(this.color, this.alpha);
        } else if (this.matchRgba) {
            colorValue = this.handleRgbaColor(this.color, this.alpha);
        }

        // Handle extra options after checking color value
        if (colorValue !== null) {
            if (this.light !== false) {
                colorValue = this.lightAdjust(colorValue, this.light);
            }
        }

        return colorValue;
    }

    // Handle if color value follows the HEX format
    handleHexColor(hex, percentage) {
        // Return color if no alpha channel was passed.
        if (percentage === false) return hex;

        // Check if HEX color has alpha channel already.
        if (hex.length === 9) {
            // Remove old alpha channel
            hex = hex.replace(/[aA0-zZ9]{2}$/g, '');

            // Add new alpha channel
            hex = `${hex}${this.percentToHex(percentage)}`;

            return hex;
        } else if (hex.length === 7) {
            // Add new alpha channel percentage
            hex = `${hex}${this.percentToHex(percentage)}`;

            return hex;
        }
    }

    // Handle if color value follows the RGB format
    handleRgbColor(rgb, percentage) {
        let hex = '';

        // Get RGB values into a list
        rgb = rgb.replace(/rgb\(|\)/g, '').split(',');

        if (percentage === false) {
            hex = this.rgbToHex(rgb); // Get hex color without alpha channel.
            return hex;
        }

        // HEX color with alpha channel
        hex = `${this.rgbToHex(rgb)}${this.percentToHex(percentage)}`;
        return hex;
    }

    // Handle if color value follows the RGBA format
    handleRgbaColor(rgba, percentage) {
        let hex = '';

        if (percentage === false) {
            // Get RGBA values into a list
            rgba = rgba.replace(/rgba\(|\)/g, '').split(',');
            hex = this.rgbaToHex(rgba); // Return HEX color without alpha channel.
            return hex;
        }

        // Remove RGB alpha channel and get RGB values into a list
        const rgb = rgba.replace(/^rgba\(|\,(.){1,3}\)$/g, '').split(',');

        // HEX color with alpha channel
        hex = `${this.rgbToHex(rgb)}${this.percentToHex(percentage)}`;
        return hex;
    }

    // Adjust hex color lightness
    lightAdjust(hex, amount) {
        const alpha = hex.length === 9 ? hex.slice(7, 9) : '';

        let r = hex.slice(1, 3);
        let g = hex.slice(3, 5);
        let b = hex.slice(5, 7);

        r = parseInt(r, 16) + amount;
        g = parseInt(g, 16) + amount;
        b = parseInt(b, 16) + amount;

        r = Math.min(255, Math.max(0, r)).toString(16).padStart(2, '0');
        g = Math.min(255, Math.max(0, g)).toString(16).padStart(2, '0');
        b = Math.min(255, Math.max(0, b)).toString(16).padStart(2, '0');

        return `#${r}${g}${b}${alpha}`.toUpperCase();
    }

    // Convert alpha channel percentage into HEX
    percentToHex(alpha) {
        if (!alpha && typeof alpha != 'number') {
            return '';
        }
        if (alpha < 1) return '00';

        alpha = parseInt((alpha * 255) / 100).toString(16);
        alpha = alpha.padStart(2, '0');
        return alpha.toUpperCase();
    }

    // Convert RGB color into HEX color
    rgbToHex(rgb) {
        // Get rgb(a) values into one array of strings
        const hexColor = rgb.map((color, index) => {
            return parseInt(color).toString(16).padStart(2, '0');
        });

        return `#${hexColor.join('')}`.toUpperCase();
    }

    // Convert RGBA color into HEX color
    rgbaToHex(rgba) {
        // Get rgb(a) values into one array of strings
        const hexColor = rgba.map((color, index) => {
            if (index === 3) { // rgba(0, 1, 2, [3])
                const alpha = parseFloat(color);
                return percentToHex(alpha > 1.0 ? 100 : alpha * 100);
            }
            return parseInt(color).toString(16).padStart(2, '0');
        });

        return `#${hexColor.join('')}`.toUpperCase();
    }
}

module.exports = {
    getThemeInfo,
    readThemeSchema,
    writeThemeSchema,
    ColorsTool,
    watchThemeChanges,
};
