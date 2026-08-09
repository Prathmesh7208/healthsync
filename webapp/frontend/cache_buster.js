const fs = require('fs');
let html = fs.readFileSync('c:/HealthSync/webapp/frontend/index.html', 'utf8');
html = html.replace(/href="style\.css(\?v=\d+)?"/g, 'href="style.css?v=' + Date.now() + '"');
html = html.replace(/src="js\/main\.js(\?v=\d+)?"/g, 'src="js/main.js?v=' + Date.now() + '"');
fs.writeFileSync('c:/HealthSync/webapp/frontend/index.html', html);
console.log('Added cache busters to index.html');
