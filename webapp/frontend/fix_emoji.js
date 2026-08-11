const fs = require('fs');

const filesToFix = [
  'c:/HealthSync/webapp/frontend/index.html',
  'c:/HealthSync/webapp/frontend/remote_index.html',
  'c:/HealthSync/webapp/frontend/index_old.html'
];

filesToFix.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    // The broken emoji is likely dY`< or similar string
    content = content.replace(/dY`</g, '👋');
    content = content.replace(/dY\x60</g, '👋'); // backtick
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
});
