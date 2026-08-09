const fs = require('fs');
let html = fs.readFileSync('c:/HealthSync/webapp/frontend/index.html', 'utf8');

const oldStr = `onclick="document.querySelector('#panel-patient .sidebar').classList.add('open'); 
document.getElementById('sidebar-overlay').classList.add('open');"`;

const newStr = `onclick="toggleSidebar()"`;

html = html.split(oldStr).join(newStr);
fs.writeFileSync('c:/HealthSync/webapp/frontend/index.html', html);
console.log('Done');
