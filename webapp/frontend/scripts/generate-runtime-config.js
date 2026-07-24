'use strict';

const fs = require('fs');
const path = require('path');

const config = `window.__HEALTHSYNC_CONFIG__ = ${JSON.stringify({
  VITE_API_URL: process.env.VITE_API_URL || ''
})};\n`;

fs.writeFileSync(path.join(__dirname, '..', 'runtime-config.js'), config);
