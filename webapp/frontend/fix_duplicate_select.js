const fs = require('fs');
const files = ['c:/HealthSync/webapp/frontend/js/main.js', 'c:/HealthSync/webapp/frontend/js/remote_main.js'];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  
  // The old selectBookingTime we want to remove
  const oldFuncRegex = /window\.selectBookingTime = function \(timeStr\) \{[\s\S]*?document\.getElementById\('btn-booking-next'\)\.disabled = false;\s*\}/g;
  
  // The good new one that has two arguments (timeStr, elId)
  const newFuncCheck = 'window.selectBookingTime = function (timeStr, elId)';
  
  if (content.includes(newFuncCheck)) {
    const originalLength = content.length;
    content = content.replace(oldFuncRegex, '');
    if (content.length !== originalLength) {
      console.log(`Removed old selectBookingTime from ${file}`);
      fs.writeFileSync(file, content);
    } else {
      console.log(`Could not find old selectBookingTime in ${file}`);
    }
  } else {
    console.log(`New selectBookingTime not found in ${file}. Be careful!`);
  }
}
