/**
 * Licensed under the MIT License.
 * See the LICENSE file in the project root for more information. */

'strict';

const { tint, minMax } = require('./snippet');
const { hex } = require('./hex');
const { rgb } = require('./rgb');

class Tinge {
    constructor() {
        this.adjust = {
            alpha: (color, amount) => {
                let rgbValues,
                    a = null;

                const ch = tint.strip.hex(color);

                if (typeof ch !== 'object') return '';

                rgbValues = ch.slice(0, 6).join('');

                a = Math.min(100, Math.max(0, amount));
                a = rgb.percentage(a);
                a = hex.parse(a);
                return `#${rgbValues}${a}`;
            },
            light: (color, amount) => {
                if (color.match(tint.pattern.hex)) {
                    color = rgb.convert(color);
                } else if (
                    !color.match(tint.pattern.rgb) |
                    !color.match(tint.pattern.rgba)
                ) {
                    return null;
                }

                let r,
                    g,
                    b = null;

                const ch = tint.strip.rgb(color);

                if (typeof ch !== 'object') return '';

                r = parseInt(ch[0]) + amount;
                g = parseInt(ch[1]) + amount;
                b = parseInt(ch[2]) + amount;

                r = minMax(r, 0, 255);
                g = minMax(g, 0, 255);
                b = minMax(b, 0, 255);

                if (typeof ch[3] != 'undefined') {
                    return `rgba(${r},${g},${b},${ch[3]})`;
                }

                return `rgb(${r},${g},${b})`;
            },
        };
    }
    cast(color, light, alpha) {
        // Remove any empty spaces from color
        this.color = color.replace(/\s/g, '');

        if (
            !this.color.match(tint.pattern.rgb) &&
            !this.color.match(tint.pattern.rgba) &&
            !this.color.match(tint.pattern.hex)
        ) {
            return null;
        }

        this.color = hex.get(this.color);

        if (typeof light == 'number') {
            this.color = this.adjust.light(this.color, light);
            this.color = hex.convert(this.color);
        }
        if (typeof alpha == 'number') {
            this.color = this.adjust.alpha(this.color, alpha);
        }
        return `${this.color}`.toUpperCase();
    }
}

const tinge = new Tinge();

module.exports = tinge;
