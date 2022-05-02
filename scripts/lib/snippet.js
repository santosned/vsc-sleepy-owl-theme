/**
 * Licensed under the MIT License.
 * See the LICENSE file in the project root for more information. */

'strict';

const https = require('https');
const { watchFile } = require('fs');
const fsPromises = require('fs/promises');
const { join } = require('path');

const metadata = {
    /**
     * Get theme package info, such as themes label and uiTheme.
     *
     * @param {string} url Full path to the package.json file.
     */
    getPackageInfo: async (url) => {
        try {
            const fileData = await fsPromises.readFile(url, 'utf-8');
            const data = await JSON.parse(fileData);
            const packageInfo = {
                names: [],
                types: [],
                paths: [],
            };
            data.contributes.themes.map((t) => {
                Object.entries(t).map(([key, val]) => {
                    if (key === 'label') {
                        packageInfo.names.push(val);
                    } else if (key === 'uiTheme') {
                        if (!packageInfo.types.includes(val)) {
                            packageInfo.types.push(val);
                        }
                    } else if (key === 'path') {
                        packageInfo.paths.push(val);
                    }
                });
            });
            return packageInfo;
        } catch (err) {
            return Promise.reject(err);
        }
    },
    /**
     * Get theme info, such as theme `dist`, and `src` path.
     *
     * @param {string} url Full path to the package.json file.
     */
    getThemeInfo: async (url) => {
        try {
            const fileData = await fsPromises.readFile(url, 'utf-8');
            const data = await JSON.parse(fileData);
            const { label, uiTheme, path } = { ...data.contributes.themes[0] };
            const themeInfo = {
                name: label,
                type: uiTheme,
                dist: getPath.themesFolder(
                    `${path.slice(path.lastIndexOf('/'))}`,
                ),
                src: getPath.schemasFolder(
                    `${path
                        .slice(path.lastIndexOf('/'))
                        .replace('-color-theme.json', '.yml')}`,
                ),
            };
            return themeInfo;
        } catch (err) {
            return Promise.reject(err);
        }
    },
};

/**
 * Snippet to get path url, such as the full path to `themes/` folder.
 */
const getPath = {
    /**
     * Get the full path to the files inside `project_root/themes` folder.
     *
     * @param {string} filename A file name or path inside `project_root/themes` folder
     */
    themesFolder: (filename) => join(__dirname, '../../themes/', filename),
    /**
     * Get the full path to the files inside `project_root/themes/schemas/` folder.
     *
     * @param {string} filename A file name or path inside `project_root/themes/schemas/` folder.
     */
    schemasFolder: (filename) =>
        join(__dirname, '../../themes/schemas/', filename),
    strip: {
        resourcesFolder(src, dist) {
            src = src.slice(src.lastIndexOf('themes'));
            dist = dist.slice(dist.lastIndexOf('themes'));
            return { src, dist };
        },
    },
};

/**
 * Snippet to handle theme files actions, such as `read` nor `write` theme files.
 */
const themeFiles = {
    /**
     * Get all available *-color-theme.json themes inside `project_root/themes/`
     */
    getThemesList: async () => {
        try {
            const url = join(__dirname, '../../themes/');
            let themesDir = await fsPromises.readdir(url, 'utf-8');
            themesDir = themesDir.filter((name) =>
                name.includes('-color-theme.json'),
            );
            themesDir = themesDir.map((t) => getPath.themesFolder(t));
            return Promise.resolve(themesDir);
        } catch (err) {
            return Promise.reject(err);
        }
    },
    /**
     * Get the data inside the theme files.
     *
     * @param {string} path The full path to the theme file.
     */
    readFile: async (path) => {
        try {
            const getData = await fsPromises.readFile(path, 'utf-8');
            return getData;
        } catch (err) {
            return Promise.reject(err);
        }
    },
    /**
     * Write the theme data into the `*-color-theme.json` file.
     *
     * @param {string} path The path to the json file, which saves the theme schema data.
     * @param {string} data An valid JSON object as a string containing the theme schema.
     */
    writeFile: async (path, data) => {
        try {
            const writeData = await fsPromises.writeFile(path, data);
            return writeData;
        } catch (err) {
            return Promise.reject(err);
        }
    },
    /**
     * Watch for changes in the theme file.
     *
     * @param {string} url Full path to the theme file that will be watched.
     * @param {function} callback An callback function called every time a change is made in the theme file.
     */
    watchFileChanges: async (url, callback) => {
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
                console.log(err.message);
                process.exit(1);
            }
        }
    },
};

const references = {
    colors: {
        path: join(__dirname, '../../themes/schemas/references-colors.cache.json'),
        api: {
            url: 'https://code.visualstudio.com/api/references/theme-color',
            request: async () => {
                return new Promise((resolve, reject) => {
                    https
                        .get(references.colors.api.url, (res) => {
                            let data = '';
                            res.setEncoding('utf-8');
                            res.on('data', (res) => (data += res));
                            res.on('end', () => resolve(data));
                            res.on('error', (err) => reject(err));
                        })
                        .on('error', (err) => reject(err));
                });
            },
        },
        /**
         * Get color theme references from 'themes/schemas/colors.json' in the root folder
         * or request new reference from https://code.visualstudio.com/api/references/theme-color
         *
         * @returns {Promise<string>|Promise<object>}
         */
        get: async () => {
            try {
                const fileData = await fsPromises.readFile(
                    references.colors.path,
                    'utf-8',
                );
                const jsonData = await JSON.parse(fileData);

                return jsonData;
            } catch (err) {
                if (err.code !== 'ENOENT') {
                    console.log(err.message);
                    return Promise.reject(err);
                }
            }

            try {
                // Get latest theme color references
                const htmlData = await references.colors.api.request();

                // Get all strings inside of a <code></code> tag
                let tokensList = htmlData
                    .split('\n')
                    .map((key) =>
                        key.slice(
                            key.indexOf('<code>'),
                            key.indexOf('</code>'),
                        ),
                    )
                    .map((key) => key.replace('<code>', ''))
                    .filter((key) => key !== '');

                // Get rid of unwanted tokens
                tokensList = tokensList.filter(
                    (key) =>
                        !key.includes('&quot;') &&
                        !key.includes(':') &&
                        !key.includes('workbench.colorCustomizations') &&
                        key.length > 5,
                );

                const tokensColors = { colors: [...tokensList] };

                const tokens = JSON.stringify(tokensColors, null, 2);

                await fsPromises.writeFile(references.colors.path, tokens);

                return tokensColors;
            } catch (err) {
                console.log(err.message);
                process.exit(1);
            }
        },
    },
};

const pattern = {
    hex: /^#((\d|\w){6}|(\d|\w){8})$/,
    rgb: /^rgb\((\d){1,3},(\d){1,3},(\d){1,3}\)$/,
    rgba: /^rgba\((\d){1,3},(\d){1,3},(\d){1,3},(\d|\d\.(\d){1,5}){1}\)$/,
};

const strip = {
    hex: (color) => {
        if (color.match(pattern.hex)) {
            return color.replace('#', '').split('');
        }
        return null;
    },
    rgb: (color) => {
        // Remove any empty spaces
        color = color.replace(/\s/g, '');

        if (color.match(pattern.rgb)) {
            return color.replace(/rgb|\(|\)/g, '').split(',');
        }

        if (color.match(pattern.rgba)) {
            return color.replace(/rgba|\(|\)/g, '').split(',');
        }

        return;
    },
};

const tint = {
    pattern,
    strip,
};

function minMax(value, min, max) {
    if (value > max) return max;
    else if (value < min) return min;
    else return value;
}

module.exports = {
    themeFiles,
    getPath,
    metadata,
    references,
    tint,
    minMax,
};
