const fs = require('fs');
const html = fs.readFileSync('c:/HealthSync/webapp/frontend/index.html', 'utf8');
const patientPageStart = html.indexOf('id="patient-page-dashboard"');
const patientPageEnd = html.indexOf('id="patient-page-appointments"');
const patientPage = html.substring(patientPageStart, patientPageEnd);

console.log(patientPage.substring(0, 1500));
console.log('... skipping ...');
console.log(patientPage.substring(patientPage.length - 1500));
