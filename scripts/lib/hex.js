/**
 * Licensed under the MIT License.
 * See the LICENSE file in the project root for more information. */

'strict';

const { tint, minMax } = require('./snippet');
const { rgb } = require('./rgb');

class Hex {
    constructor() {
        this.removeSpace = (value) => value.replace(/\s/g, '');
    }
    get(color) {
        color = this.removeSpace(color);
        if (color.match(tint.pattern.rgb) || color.match(tint.pattern.rgba)) {
            return `${this.convert(color)}`;
        } else if (color.match(tint.pattern.hex)) {
            return `${color}`;
        }
        return null;
    }
    parse = (number) => `${number.toString(16).padStart(2, '0')}`;

    /**
     * Convert RGB to HEX.
     * @param {string} color
     */
    convert(color) {
        let r = null;
        let g = null;
        let b = null;
        let a = null;

        const ch = tint.strip.rgb(color);

        if (typeof ch !== 'object') return;

        r = parseInt(ch[0]);
        g = parseInt(ch[1]);
        b = parseInt(ch[2]);

        if (typeof ch[3] !== 'undefined') {
            a = parseFloat(ch[3]);
            a = Math.min(100, Math.max(0, a * 100));
            a = minMax(a, 0, 1) * 100;
        }

        r = this.parse(r);
        g = this.parse(g);
        b = this.parse(b);

        if (a !== null) {
            a = rgb.percentage(a);
            a = this.parse(a);
            return `#${r}${g}${b}${a}`;
        }

        return `#${r}${g}${b}`;
    }
}

const hex = new Hex();



module.exports = { hex };
