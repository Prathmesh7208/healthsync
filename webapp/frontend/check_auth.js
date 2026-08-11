const fs = require('fs');
const html = fs.readFileSync('c:/HealthSync/webapp/frontend/index.html', 'utf8');

const authScreenStart = html.indexOf('class="auth-screen"');
if (authScreenStart !== -1) {
  const startIdx = html.lastIndexOf('<div', authScreenStart);
  const pageStart = html.indexOf('class="page-content"');
  let authHTML = html.substring(startIdx, pageStart !== -1 ? pageStart : html.length);
  console.log("--- START AUTH HTML ---");
  console.log(authHTML.substring(0, 2000));
  console.log('... skipping ...');
  console.log(authHTML.substring(authHTML.length - 2000));
} else {
  console.log('Auth screen not found');
}
