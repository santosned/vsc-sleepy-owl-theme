const https = require('https');
const fsPromises = require('fs/promises');
const { join } = require('path');

const getThemesUrl = (url) => join(__dirname, '../../themes/', url);

async function getThemesDir() {
    try {
        const url = join(__dirname, '../../themes/');
        let themesDir = await fsPromises.readdir(url, 'utf-8');
        themesDir = themesDir.filter((name) =>
            name.includes('-color-theme.json'),
        );
        themesDir = themesDir.map((t) => getThemesUrl(t));
        return themesDir;
    } catch (err) {
        return Promise.reject(err);
    }
}

async function readColors(url) {
    try {
        const getData = await fsPromises.readFile(url, 'utf-8');
        return getData;
    } catch (err) {
        return Promise.reject(err);
    }
}

async function parseTokenColors(htmlData) {
    // Convert html data into array
    htmlData = htmlData.split('\n');

    // Get the colors tokens from html data
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

async function getReferenceSchema(options) {
    return new Promise((resolve, reject) => {
        https
            .get(options.url, (res) => {
                let data = '';
                res.setEncoding(options.encodeType);

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
}

class ColorThemeReference {
    constructor() {
        this.src = getThemesUrl('schemas/colors.json');
        this.url = 'https://code.visualstudio.com/api/references/theme-color';
        this.encodeType = 'utf8';
    }
    async getData(options) {
        const { update } = { ...options };

        if (!update) {
            try {
                const colorsRef = await readColors(this.src);
                return colorsRef;
            } catch (err) {
                if (err.code !== 'ENOENT') {
                    console.log(err);
                    return Promise.reject(err);
                }
            }
        }

        try {
            const data = await getReferenceSchema({
                url,
                encodeType,
            });
            const writeData = await fsPromises.writeFile(this.src, data);
            return Promise.all([data, writeData]);
        } catch (err) {
            if (err && err.message) {
                console.log(err.message);
            }
            return Promise.reject(err);
        }
    }
}

class TestColorThemes {
    constructor() {
        this.src = [];
    }
    async initialize() {
        try {
            this.src = await getThemesDir();
            if (!this.src.length) {
                throw "Couldn't find any valid color theme. Please, make sure that your theme file name ends with '-color-theme.json'.";
            }
            console.log('Found themes:', this.src);
        } catch (err) {
            if (err && err.message) {
                console.log(err.message);
            }
            return Promise.reject(err);
        }
    }
}

module.exports = { ColorThemeReference, TestColorThemes };
