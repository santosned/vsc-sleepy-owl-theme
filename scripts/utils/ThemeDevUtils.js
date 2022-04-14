'use strict';

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

module.exports = { getThemeInfo, readThemeSchema, writeThemeSchema };
