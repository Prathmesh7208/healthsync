const fs = require('fs');
const file = 'c:/HealthSync/webapp/frontend/index.html';
let content = fs.readFileSync(file, 'utf8');
const now = Date.now();
content = content.replace(/\.js\?v=\d+/g, '.js?v=' + now);
content = content.replace(/\.css\?v=\d+/g, '.css?v=' + now);
fs.writeFileSync(file, content);
console.log('Cache bust updated');
