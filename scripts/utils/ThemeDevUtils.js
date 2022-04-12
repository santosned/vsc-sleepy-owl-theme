'use strict';

const fsPromises = require('fs/promises');
const { join } = require('path');

const getThemesUrl = (url) => join(__dirname, '../../themes/', url);

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

async function readThemeSchema(url) {
    try {
        const getData = await fsPromises.readFile(url, 'utf-8');
        return getData;
    } catch (err) {
        return Promise.reject(err);
    }
}

async function writeThemeSchema(url, data) {
    try {
        const writeData = await fsPromises.writeFile(url, data);
        return writeData;
    } catch (err) {
        return Promise.reject(err);
    }
}

module.exports = { getThemeInfo, readThemeSchema, writeThemeSchema };
