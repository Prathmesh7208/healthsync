'use strict';

const fs = require('fs');
const path = require('path');

const apiUrl = process.env.VITE_API_URL;
if (!apiUrl) {
  throw new Error('VITE_API_URL must be set for a production build.');
}

const config = `window.__HEALTHSYNC_CONFIG__ = ${JSON.stringify({ VITE_API_URL: apiUrl })};\n`;
fs.writeFileSync(path.join(__dirname, '..', 'frontend', 'runtime-config.js'), config);
