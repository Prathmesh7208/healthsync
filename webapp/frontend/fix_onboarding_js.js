const fs = require('fs');

const mainFile = 'c:/HealthSync/webapp/frontend/js/main.js';
const remoteFile = 'c:/HealthSync/webapp/frontend/js/remote_main.js';

let mainContent = fs.readFileSync(mainFile, 'utf8');
let remoteContent = fs.readFileSync(remoteFile, 'utf8');

// Fix the language choice bug in both
if (mainContent.includes('.language-choice')) {
  mainContent = mainContent.replace(/\.language-choice/g, '.lang-opt');
  fs.writeFileSync(mainFile, mainContent);
  console.log('Fixed .language-choice in main.js');
}

if (remoteContent.includes('.language-choice')) {
  remoteContent = remoteContent.replace(/\.language-choice/g, '.lang-opt');
  fs.writeFileSync(remoteFile, remoteContent);
  console.log('Fixed .language-choice in remote_main.js');
}

// Extract the NEW ONBOARDING LOGIC from main.js
const marker = '// NEW ONBOARDING LOGIC';
const startIndex = mainContent.indexOf(marker);

if (startIndex !== -1) {
  // Find the exact starting comment block
  const blockStart = mainContent.lastIndexOf('// =================================', startIndex);
  const logicBlock = mainContent.substring(blockStart !== -1 ? blockStart : startIndex);
  
  if (!remoteContent.includes(marker)) {
    remoteContent += '\n\n' + logicBlock;
    fs.writeFileSync(remoteFile, remoteContent);
    console.log('Appended NEW ONBOARDING LOGIC to remote_main.js');
    
    // Also fix the bug in the appended block if it was just copied
    if (remoteContent.includes('.language-choice')) {
       remoteContent = remoteContent.replace(/\.language-choice/g, '.lang-opt');
       fs.writeFileSync(remoteFile, remoteContent);
    }
  } else {
    console.log('remote_main.js already has NEW ONBOARDING LOGIC');
  }
} else {
  console.log('Could not find NEW ONBOARDING LOGIC in main.js');
}
