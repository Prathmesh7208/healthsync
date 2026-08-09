const fs = require('fs');
let html = fs.readFileSync('c:/HealthSync/webapp/frontend/index.html', 'utf8');

const regex = /onclick="document\.querySelector\('#panel-patient \.sidebar'\)\.classList\.add\('open'\);\s*document\.getElementById\('sidebar-overlay'\)\.classList\.add\('open'\);"/g;

html = html.replace(regex, 'onclick="toggleSidebar()"');

fs.writeFileSync('c:/HealthSync/webapp/frontend/index.html', html);
console.log('Fixed onclick');
