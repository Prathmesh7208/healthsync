const fs = require('fs');

function restoreMissingPages(currentFile, backupFile) {
  let currentHtml = fs.readFileSync(currentFile, 'utf8');
  let backupHtml = fs.readFileSync(backupFile, 'utf8');

  const startMarker = '<!-- 3. Patient Doctors Page -->';
  const endMarker = '<!-- 1. Doctor Dashboard Page -->';

  const backupStart = backupHtml.indexOf(startMarker);
  const backupEnd = backupHtml.indexOf(endMarker);

  if (backupStart !== -1 && backupEnd !== -1) {
    const missingContent = backupHtml.substring(backupStart, backupEnd);
    
    // In currentHtml, we need to inject missingContent right before endMarker
    const currentEnd = currentHtml.indexOf(endMarker);
    if (currentEnd !== -1) {
      currentHtml = currentHtml.substring(0, currentEnd) + missingContent + currentHtml.substring(currentEnd);
      fs.writeFileSync(currentFile, currentHtml);
      console.log('Restored missing content in', currentFile);
    } else {
      console.error('endMarker not found in', currentFile);
    }
  } else {
    console.error('startMarker or endMarker not found in backup file', backupFile);
  }
}

restoreMissingPages('c:/HealthSync/webapp/frontend/index.html', 'c:/HealthSync/webapp/frontend/index_head1.html');
restoreMissingPages('c:/HealthSync/webapp/frontend/remote_index.html', 'c:/HealthSync/webapp/frontend/remote_index_head1.html');
