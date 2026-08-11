const fs = require('fs');
let html = fs.readFileSync('c:/HealthSync/webapp/frontend/index.html', 'utf8');
html = html.split('<input type="text" class="otp-box"').join('<input type="text" class="otp-box" onpaste="handlePaste(event)"');
fs.writeFileSync('c:/HealthSync/webapp/frontend/index.html', html);
console.log('Fixed OTP HTML');
