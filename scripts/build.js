'strict';


const { getThemeInfo } = require('./utils/ThemeDevUtils');

getThemeInfo(process.env.npm_package_json)
    .then((themeInfo) => {
        console.log(themeInfo);
    })
    .catch((err) => {
        if (err && err.message) {
            console.log(err);
        }
        process.exit(1);
    });
