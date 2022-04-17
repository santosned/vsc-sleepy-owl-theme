/**
 * Licensed under the MIT License.
 * See the LICENSE file in the project root for more information. */

'strict';

function formatThemesUrl(src, dist) {
    src = src.slice(src.lastIndexOf('themes'));
    dist = dist.slice(dist.lastIndexOf('themes'));
    return { src, dist };
}

const cbulk = {
    green: (v) => `\x1b[32m${v}\x1b[0m`,
    orange: (v) => `\x1b[33m${v}\x1b[0m`,
    cyan: (v) => `\x1b[36m${v}\x1b[0m`,
    gray: (v) => `\x1b[90m${v}\x1b[0m`,
    red: (v) => `\x1b[91m${v}\x1b[0m`,
    yellow: (v) => `\x1b[93m${v}\x1b[0m`,
    blue: (v) => `\x1b[94m${v}\x1b[0m`,
    white: (v) => `\x1b[97m${v}\x1b[0m`,
};

const log = {
    listen: (args) => {
        const { src, dist } = formatThemesUrl(args.src, args.dist);
        console.clear();
        console.log(
            `${cbulk.cyan(args.label)} ${cbulk.green('dev running at:')}`,
        );
        console.log();
        console.log(`   ${cbulk.white('> Build:')}    ${cbulk.cyan(dist)}`);
        console.log(`   ${cbulk.white('> Source:')}   ${cbulk.cyan(src)}`);
        console.log();
    },
    build: (args) => {
        const { src, dist } = formatThemesUrl(args.src, args.dist);
        console.log(
            `${cbulk.cyan(args.label)} ${cbulk.green('theme build at:')}`,
        );
        console.log();
        console.log(`   ${cbulk.white('> Build:')}    ${cbulk.cyan(dist)}`);
        console.log(`   ${cbulk.white('> Source:')}   ${cbulk.cyan(src)}`);
        console.log();
    },
    ready: (time) => {
        console.log();
        console.log(`${cbulk.green(`Ready in ${time}ms`)}`);
        console.log();
    },
    finished: (time) => {
        console.log();
        console.log(`${cbulk.green(`Finished in ${time}ms`)}`);
        console.log();
    },
    perf: (tag, msg, time) => {
        console.log(`${cbulk.gray(`[${tag}] ${msg.toLowerCase()} ${time}ms`)}`);
    },
};

module.exports = { log, cbulk };
