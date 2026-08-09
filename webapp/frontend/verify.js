const fs = require('fs');
const css = fs.readFileSync('c:/HealthSync/webapp/frontend/style.css', 'utf8');
if (css.includes('.new-sidebar.open')) {
  console.log('Mobile sidebar fix is verified present in CSS.');
} else {
  console.log('Mobile sidebar fix is MISSING!');
}

const html = fs.readFileSync('c:/HealthSync/webapp/frontend/index.html', 'utf8');
if (html.includes('onclick="toggleSidebar()"')) {
  console.log('HTML uses toggleSidebar.');
} else {
  console.log('HTML does not use toggleSidebar!');
}
if (html.includes('document.querySelector(\'#panel-patient .sidebar\').classList.add')) {
  console.log('HTML still has broken onclick!');
} else {
  console.log('HTML is clean of broken onclick.');
}
