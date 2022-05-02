/**
 * Licensed under the MIT License.
 * See the LICENSE file in the project root for more information. */

'strict';

const lint = require('./lib/lint');
const { cbulk, print, log } = require('./lib/console');
const { themeFiles, metadata } = require('./lib/snippet');

async function initialize(packageInfo) {
    try {
        const themesList = await themeFiles.getThemesList();

        for (const themePath of Object.values(themesList)) {
            log.test.init(themePath.slice(themePath.lastIndexOf('themes')));

            const fileData = await themeFiles.readFile(themePath);
            const themeData = await JSON.parse(fileData);

            const tests = lint.getListOfTest();

            let errors = [];

            for (const value of Object.values(tests)) {
                print(`\n${cbulk.gray(`[test] ${value.message}... `)}`);

                const testOutput = await lint.test(
                    value.id,
                    themePath,
                    themeData,
                    packageInfo,
                );

                if (testOutput) {
                    print(`${cbulk.red('FAIL')}`);
                    print(`\n${testOutput.message}`);
                    errors.push(testOutput);
                } else {
                    print(`${cbulk.green('PASS')}`);
                }
            }

            if (Object.values(errors).length == 0) {
                log.test.finished();
            } else {
                print(`\n${cbulk.red('\nFailed.\n')}\n`);
            }
        }
    } catch (err) {
        if (err && err.message) {
            console.log(err);
        }
        process.exit(1);
    }
}

metadata
    .getPackageInfo(process.env.npm_package_json)
    .then((packageInfo) => initialize(packageInfo))
    .catch((err) => {
        if (err && err.message) {
            console.log(err);
        }
        process.exit(1);
    });
