const fs = require('fs');
const html = fs.readFileSync('c:/HealthSync/webapp/frontend/index.html', 'utf8');
const btnIndex = html.indexOf('<button class="icon-btn mobile-menu-btn"');
const appIndex = html.indexOf('<div id="app"');
console.log('btnIndex:', btnIndex);
console.log('appIndex:', appIndex);
if (btnIndex !== -1 && btnIndex < appIndex) {
  console.log('Mobile menu button is present BEFORE #app! (i.e. on language/auth screens)');
} else {
  console.log('Mobile menu button is only inside #app.');
}
