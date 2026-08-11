const fs = require('fs');

try {
  let html = fs.readFileSync('c:/HealthSync/webapp/frontend/remote_index.html', 'utf8');
  let indexHtml = fs.readFileSync('c:/HealthSync/webapp/frontend/index.html', 'utf8');

  const startTag = '<section id="language-screen"';
  const endTag = '<section id="demo-portal"';

  const startIdx = html.indexOf(startTag);
  const endIdx = html.indexOf(endTag);

  const sourceStartIdx = indexHtml.indexOf('<section id="onboarding-flow"');
  const sourceEndIdx = indexHtml.indexOf('<section id="demo-portal"');

  if (startIdx !== -1 && endIdx !== -1 && sourceStartIdx !== -1 && sourceEndIdx !== -1) {
    const replacement = indexHtml.substring(sourceStartIdx, sourceEndIdx);
    
    html = html.substring(0, startIdx) + replacement + html.substring(endIdx);
    
    // Add cache buster
    html = html.replace('src="js/main.js"', 'src="js/main.js?v=' + Date.now() + '"');
    
    fs.writeFileSync('c:/HealthSync/webapp/frontend/remote_index.html', html);
    console.log('remote_index.html updated successfully');
  } else {
    console.log('Could not find necessary tags.');
    console.log('remote:', startIdx, endIdx);
    console.log('index:', sourceStartIdx, sourceEndIdx);
  }
} catch (e) {
  console.error(e);
}
