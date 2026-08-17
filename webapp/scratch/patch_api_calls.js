const fs = require('fs');
const files = [
  'c:/HealthSync/webapp/frontend/js/main.js',
  'c:/HealthSync/webapp/frontend/js/remote_main.js'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(
    /const data = await requestJson\('\/appointments'\);/,
    `let url = '/appointments';\n      if (currentUser?.role === 'PATIENT') url += '?patientId=' + encodeURIComponent(currentUser.id);\n      else if (currentUser?.role === 'DOCTOR') url += '?doctorId=' + encodeURIComponent(currentUser.id);\n      const data = await requestJson(url);`
  );
  
  content = content.replace(
    /const data = await requestJson\('\/appointments\/next'\);/,
    `const data = await requestJson('/appointments/next?patientId=' + encodeURIComponent(currentUser.id));`
  );

  fs.writeFileSync(file, content);
}
console.log("Patched fetching API calls in JS files.");
