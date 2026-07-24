'use strict';

const fs = require('fs');
const path = require('path');

// Railway also runs this root build for the API service. It does not need a
// browser API URL, while Vercel supplies VITE_API_URL for the static frontend.
const apiUrl = process.env.VITE_API_URL || '';
const config = `window.__HEALTHSYNC_CONFIG__ = ${JSON.stringify({ VITE_API_URL: apiUrl })};\n`;
fs.writeFileSync(path.join(__dirname, '..', 'frontend', 'runtime-config.js'), config);
