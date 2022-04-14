/**
 * Licensed under the MIT License.
 * See the LICENSE file in the project root for more information. */

'strict';

const {
    ColorThemeReference,
    TestColorThemes,
} = require('./utils/ThemeTestUtils');

const colorThemeReference = new ColorThemeReference();

/**
 * Get color theme references from 'themes/schemas/colors.json' in the root folder
 * or from 'https://code.visualstudio.com/api/references/theme-color' 
 * @param {boolean} latest Update theme references or use cache
 * 
 * Note:
 * Only set { latest: false } to true if cached data is outdated otherwise keep it false.
 */
colorThemeReference.get({ latest: false }).then((data) => {
    const colorsReference = data.colors;
    const colorsAvailable = data.colors.length;

    const testColorThemes = new TestColorThemes({
        colors: colorsReference,
        count: colorsAvailable,
    });
    
    // Test the colors tokens of all color-theme inside 'themes/' directory.
    testColorThemes.initialize();
});
