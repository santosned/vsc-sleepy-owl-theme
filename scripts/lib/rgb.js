/**
 * Licensed under the MIT License.
 * See the LICENSE file in the project root for more information. */

'strict';

const { tint } = require('./snippet');

// const parseDecimal = (hex) => parseInt(hex, 16);

class Rgb {
    constructor() {}
    parse = (hex) => parseInt(hex, 16);
    alpha = (number) => ((number / 255) * 1.0).toFixed(2);
    percentage = (number) => parseInt(`${(number * 255) / 100}`);
    convert(hex) {
        let r = null;
        let g = null;
        let b = null;
        let a = null;

        const ch = tint.strip.hex(hex);

        if (typeof ch !== 'object') return '';

        r = ch.slice(0, 2).join('');
        g = ch.slice(2, 4).join('');
        b = ch.slice(4, 6).join('');

        if (typeof ch[6] !== 'undefined') {
            a = ch.slice(6, 8).join('');
        }

        r = this.parse(r);
        g = this.parse(g);
        b = this.parse(b);

        if (a != null) {
            a = this.parse(a);
            a = this.alpha(a);
            return `rgba(${r},${g},${b},${a})`;
        }

        return `rgb(${r},${g},${b})`;
    }
}

const rgb = new Rgb();

module.exports = { rgb };
