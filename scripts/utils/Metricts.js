/**
 * Licensed under the MIT License.
 * See the LICENSE file in the project root for more information. */

'strict';

const { performance } = require('perf_hooks');

const perf = {
    mark: () => performance.now(),
    runtime: (start) => Math.round(perf.mark() - start).toFixed(0),
};

module.exports = perf;
