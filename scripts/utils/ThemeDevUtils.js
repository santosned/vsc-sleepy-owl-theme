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
            if (typeof value === 'number') return value;
            return false;
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
            colorValue = this.isHex(this.color, this.alpha);
        } else if (this.machRgb) {
            colorValue = this.isRgb(this.color, this.alpha);
        } else if (this.matchRgba) {
            colorValue = this.isRgba(this.color, this.alpha);
        }

        // Handle extra options after checking color value
        if (colorValue !== null) {
            if (this.light !== false) {
                colorValue = lightAdjust(colorValue, this.light);
            }
        }

        return colorValue;
    }

    // Handle if color value follows the HEX format
    isHex(hex, percentage) {
        // Return color if no alpha channel was passed.
        if (percentage === false) return hex;

        // Check if HEX color has alpha channel already.
        if (hex.length === 9) {
            // If so return it replaced with alpha channel percentage
            hex = hex.replace(/[aA0-zZ9]{2}$/g, '');
            return hex + this.percentToHex(percentage);
        }

        // Check if HEX does not has alpha channel.
        if (hex.length === 7) {
            // If so return it with alpha channel percentage
            return hex + this.percentToHex(percentage);
        }
    }

    // Handle if color value follows the RGB format
    isRgb(rgb, percentage) {
        // Get RGB values into a list
        rgb = rgb.replace(/rgb\(|\)/g, '').split(',');

        if (percentage === false) {
            return this.rgbToHex(rgb); // Return hex color without alpha channel.
        }
        // Return HEX color with alpha channel
        return this.rgbToHex(rgb) + this.percentToHex(percentage);
    }

    // Handle if color value follows the RGBA format
    isRgba(rgba, percentage) {
        if (percentage === false) {
            // Get RGBA values into a list
            rgba = rgba.replace(/rgba\(|\)/g, '').split(',');
            return this.rgbaToHex(rgba); // Return HEX color without alpha channel.
        }
        // Remove RGB alpha channel and get RGB values into a list
        const rgb = rgba.replace(/^rgba\(|\,(.){1,3}\)$/g, '').split(',');
        // Return HEX color with alpha channel
        return this.rgbToHex(rgb) + this.percentToHex(percentage);
    }

    // Adjust hex color lightness
    lightAdjust(hex, amount) {
        let alpha = hex.length === 9 ? hex.slice(7, 9) : '';

        let r = hex.slice(1, 3);
        let g = hex.slice(3, 5);
        let b = hex.slice(5, 7);

        r = parseInt(r, 16) + amount;
        g = parseInt(g, 16) + amount;
        b = parseInt(b, 16) + amount;

        r = Math.min(255, Math.max(0, r)).toString(16).padStart(2, '0');
        g = Math.min(255, Math.max(0, g)).toString(16).padStart(2, '0');
        b = Math.min(255, Math.max(0, b)).toString(16).padStart(2, '0');

        return '#' + r + g + b + alpha;
    }

    // Convert alpha channel percentage into HEX
    percentToHex(alpha) {
        alpha = parseInt((alpha * 255) / 100).toString(16);
        alpha = alpha.padStart(2, '0');
        return alpha;
    }

    // Convert RGB color into HEX color
    rgbToHex(rgb) {
        // Get rgb(a) values into one array of strings
        const hexColor = rgb.map((color, index) => {
            return parseInt(color).toString(16).padStart(2, '0');
        });

        return '#' + hexColor.join('');
    }

    // Convert RGBA color into HEX color
    rgbaToHex(rgba) {
        // Get rgb(a) values into one array of strings
        const hexColor = rgba.map((color, index) => {
            if (index === 3) {
                // rgba(0, 1, 2, [3])
                const alpha = parseFloat(color);
                return percentToHex(alpha > 1.0 ? 100 : alpha * 100);
            }
            return parseInt(color).toString(16).padStart(2, '0');
        });

        return '#' + hexColor.join('');
    }
}

module.exports = {
    getThemeInfo,
    readThemeSchema,
    writeThemeSchema,
    ColorsTool,
    watchThemeChanges,
};
