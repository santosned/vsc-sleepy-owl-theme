/**
 * Licensed under the MIT License.
 * See the LICENSE file in the project root for more information. */

'strict';

const { performance } = require('perf_hooks');
const { getPath } = require('./snippet');

const print = (message, ...optionalParams) => {
    if (optionalParams.length > 0) {
        for (const value of optionalParams) {
            message += ` ${value}`;
        }
    }
    if (typeof message == 'undefined') {
        process.stdout.write('\n');
        return;
    }
    process.stdout.write(`${message}`);
    return;
};

const colors = {
    clear: '\x1b[0m',
    green: '\x1b[32m',
    orange: '\x1b[33m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
    red: '\x1b[91m',
    yellow: '\x1b[93m',
    blue: '\x1b[94m',
    white: '\x1b[97m',
};

const cbulk = {
    green: (message) => `${colors.green + message + colors.clear}`,
    orange: (message) => `${colors.orange + message + colors.clear}`,
    cyan: (message) => `${colors.cyan + message + colors.clear}`,
    gray: (message) => `${colors.gray + message + colors.clear}`,
    red: (message) => `${colors.red + message + colors.clear}`,
    yellow: (message) => `${colors.yellow + message + colors.clear}`,
    blue: (message) => `${colors.blue + message + colors.clear}`,
    white: (message) => `${colors.white + message + colors.clear}`,
};

const log = {
    listen: {
        init: (args) => {
            const { src, dist } = getPath.strip.resourcesFolder(
                args.src,
                args.dist,
            );
            console.clear();
            print(
                `${cbulk.cyan(args.name)} ${cbulk.green(
                    'dev running at:',
                )}\n\n`,
            );
            print(`   ${cbulk.white('> Build:')}    ${cbulk.cyan(dist)}\n`);
            print(`   ${cbulk.white('> Source:')}   ${cbulk.cyan(src)}\n`);
            performance.mark('listen-start');
        },
        ready: () => {
            performance.mark('listen-end');
            let runtime = performance.measure(
                'listen-runtime',
                'listen-start',
                'listen-end',
            );
            runtime = parseInt(runtime.duration);
            print(`\n${cbulk.green(`Ready in ${runtime}ms`)}\n\n`);
            performance.clearMarks();
            performance.clearMeasures();
        },
    },
    build: {
        init: (args) => {
            const { src, dist } = getPath.strip.resourcesFolder(
                args.src,
                args.dist,
            );
            print(
                `${cbulk.cyan(args.name)} ${cbulk.green(
                    'theme build at:',
                )}\n\n`,
            );
            print(`   ${cbulk.white('> Build:')}    ${cbulk.cyan(dist)}\n`);
            print(`   ${cbulk.white('> Source:')}   ${cbulk.cyan(src)}\n`);
            performance.mark('build-start');
        },
        ready: () => {
            performance.mark('build-end');
            let runtime = performance.measure(
                'build-runtime',
                'build-start',
                'build-end',
            );
            runtime = parseInt(runtime.duration);
            print(`\n${cbulk.green(`Ready in ${runtime}ms`)}\n\n`);
            performance.clearMarks();
            performance.clearMeasures();
        },
    },
    error: (tag, msg) => {
        print(`${cbulk.gray(`[${tag}]`)} ${cbulk.red(msg.toLowerCase())}\n`);
    },
    warning: (tag, msg) => {
        print(`${cbulk.gray(`[${tag}]`)} ${cbulk.orange(msg.toLowerCase())}\n`);
    },
    test: {
        init: (path) => {
            print(`      > Target: ${cbulk.cyan(`${path}`)}\n`);
            performance.mark('test-start');
        },
        finished: () => {
            performance.mark('test-end');
            let runtime = performance.measure(
                'test-runtime',
                'test-start',
                'test-end',
            );
            runtime = parseInt(runtime.duration);
            print(`\n\n${cbulk.green(`Finished in ${runtime}ms`)}\n\n`);
        },
    },
};

module.exports = { print, cbulk, log };
