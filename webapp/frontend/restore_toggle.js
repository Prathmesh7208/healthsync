const fs = require('fs');
let js = fs.readFileSync('c:/HealthSync/webapp/frontend/js/main.js', 'utf8');

const newToggle = `window.toggleSidebar = function(forceClose = false) {
    const activeSidebar = document.querySelector('.role-panel.active .sidebar') || document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (activeSidebar) {
      if (forceClose) {
        activeSidebar.classList.remove('open');
        if(overlay) overlay.classList.remove('open');
      } else {
        activeSidebar.classList.toggle('open');
        if(overlay) overlay.classList.toggle('open');
      }
    }
  };`;

js = js.replace(/window\.toggleSidebar\s*=\s*function[\s\S]*?\};\n/, newToggle + '\n');

// Also update cache buster
let html = fs.readFileSync('c:/HealthSync/webapp/frontend/index.html', 'utf8');
html = html.replace(/src="js\/main\.js(\?v=\d+)?"/g, 'src="js/main.js?v=' + Date.now() + '"');
html = html.replace(/href="style\.css(\?v=\d+)?"/g, 'href="style.css?v=' + Date.now() + '"');
fs.writeFileSync('c:/HealthSync/webapp/frontend/index.html', html);

fs.writeFileSync('c:/HealthSync/webapp/frontend/js/main.js', js);
console.log('Restored toggleSidebar for global drawer');
