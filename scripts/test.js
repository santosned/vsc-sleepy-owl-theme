'strict';
const { ColorThemeReference, TestColorThemes } = require('./utils/ThemeTestUtils');

const colorThemeReference = new ColorThemeReference();

colorThemeReference.getData({ update: false }).then((data) => {
    // console.log('callback: ', data);
    const testColorThemes = new TestColorThemes();

    testColorThemes.initialize()
});
