/**
 * Licensed under the MIT License.
 * See the LICENSE file in the project root for more information. */

'strict';

const { mkdirSync, existsSync } = require('fs');
const { join } = require('path');
const releaseDir = join(__dirname, '../themes/release');

if (!existsSync(releaseDir)) mkdirSync(releaseDir);
