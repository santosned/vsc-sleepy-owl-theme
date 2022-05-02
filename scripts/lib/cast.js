/**
 * Licensed under the MIT License.
 * See the LICENSE file in the project root for more information. */

'strict';

const jsYaml = require('js-yaml');
const { log } = require('./console');
const { tint } = require('./snippet');
const tinge = require('./tinge');

const typeCast = new jsYaml.Type('!cast', {
    kind: 'mapping',
    resolve: (args) => {
        const { color, light, alpha } = { ...args };

        // Test 'color' option, if isn't a string log an error instead of continue
        // casting.
        if (typeof color != 'string') {
            log.error(
                'generate',
                `error: Option 'color' requires a string as value, but received '${typeof color}' value.`,
            );
            return null;
        }

        // Test 'alpha' option (if exist), in case it isn't a number log an error
        // instead of continue casting.
        if (alpha && typeof alpha != 'number') {
            log.error(
                'generate',
                `error: Option 'alpha' requires a number as value, but received a ${typeof alpha} as value.`,
            );

            return null;
        }

        // Test 'light' option (if exist), in case it isn't a number log an error
        // instead of continue casting.
        if (light && typeof light != 'number') {
            log.error(
                'generate',
                `error: Option 'light' requires a number as value, but received a ${typeof light} as value.`,
            );
            return null;
        }

        return { color, light, alpha };
    },
    construct: (args) => {
        const { color, light, alpha } = { ...args };

        if (!color) return '';

        if (
            color.match(tint.pattern.hex) &&
            typeof alpha != 'number' &&
            typeof light != 'number'
        ) {
            log.warning(
                'generate',
                `warning: It's not recommended to use '!cast' with only a hex color. Either adjust the color to rgb, or remove the !cast. Skipping...`,
            );
            return null;
        }

        return tinge.cast(color, light, alpha);
    },
    represent: (args) => {
        return args;
    },
});

const getCastSchema = () => jsYaml.DEFAULT_SCHEMA.extend(typeCast);

module.exports = { getCastSchema };
