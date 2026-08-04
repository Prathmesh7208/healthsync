const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, 'frontend', 'app.js');
let appJsContent = fs.readFileSync(appJsPath, 'utf8');

// The strategy: we won't use ES6 modules to avoid breaking inline HTML onclicks.
// Instead, we will split the file into logical parts and load them synchronously.
// We just need to change let/const globals to var so they are shared across files,
// or attach them to window.

// Change global lets/consts to var so they share across multiple script files
appJsContent = appJsContent.replace(/^const API_BASE/m, 'var API_BASE');
appJsContent = appJsContent.replace(/^let allDoctors/m, 'var allDoctors');
appJsContent = appJsContent.replace(/^let todayAppointments/m, 'var todayAppointments');
appJsContent = appJsContent.replace(/^let liveQueueList/m, 'var liveQueueList');
appJsContent = appJsContent.replace(/^let patientPrescriptions/m, 'var patientPrescriptions');
appJsContent = appJsContent.replace(/^let patientRecords/m, 'var patientRecords');
appJsContent = appJsContent.replace(/^const doctorPatientReports/m, 'var doctorPatientReports');
appJsContent = appJsContent.replace(/^let currentSelectedPatientId/m, 'var currentSelectedPatientId');
appJsContent = appJsContent.replace(/^let currentSelectedDoctorId/m, 'var currentSelectedDoctorId');
appJsContent = appJsContent.replace(/^let currentUser/m, 'var currentUser');
appJsContent = appJsContent.replace(/^let pendingMobile/m, 'var pendingMobile');
appJsContent = appJsContent.replace(/^let pendingCountryCode/m, 'var pendingCountryCode');
appJsContent = appJsContent.replace(/^let authMode/m, 'var authMode');
appJsContent = appJsContent.replace(/^let pendingRegistration/m, 'var pendingRegistration');
appJsContent = appJsContent.replace(/^let resendTimer/m, 'var resendTimer');
appJsContent = appJsContent.replace(/^let bookingMode/m, 'var bookingMode');
appJsContent = appJsContent.replace(/^let persistedReminders/m, 'var persistedReminders');
appJsContent = appJsContent.replace(/^let remindersLoaded/m, 'var remindersLoaded');
appJsContent = appJsContent.replace(/^let appHistory/m, 'var appHistory');
appJsContent = appJsContent.replace(/^let appHistoryIndex/m, 'var appHistoryIndex');
appJsContent = appJsContent.replace(/^let healthTipIndex/m, 'var healthTipIndex');
appJsContent = appJsContent.replace(/^let healthTipTimer/m, 'var healthTipTimer');
appJsContent = appJsContent.replace(/^const isMobileAppNavigation/m, 'var isMobileAppNavigation');
appJsContent = appJsContent.replace(/^const curatedHealthTips/m, 'var curatedHealthTips');
appJsContent = appJsContent.replace(/^const languageStrings/m, 'var languageStrings');
appJsContent = appJsContent.replace(/^let currentLang/m, 'var currentLang');
appJsContent = appJsContent.replace(/^let appSocket/m, 'var appSocket');
appJsContent = appJsContent.replace(/^let currentEmergencyCaseId/m, 'var currentEmergencyCaseId');
appJsContent = appJsContent.replace(/^let mapInstances/m, 'var mapInstances');
appJsContent = appJsContent.replace(/^let ambulanceLiveInterval/m, 'var ambulanceLiveInterval');
appJsContent = appJsContent.replace(/^let fakeAmbLat/m, 'var fakeAmbLat');
appJsContent = appJsContent.replace(/^let fakeAmbLng/m, 'var fakeAmbLng');
appJsContent = appJsContent.replace(/^const API_LAT/m, 'var API_LAT');
appJsContent = appJsContent.replace(/^const API_LNG/m, 'var API_LNG');


// Now we carve it up based on standard comments.
// We can use regex to find sections.
// E.g. // ─── Utilities ───
// We will simply split it by lines and push to different files.

const lines = appJsContent.split('\n');
const files = {
    'globals.js': [],
    'api.js': [],
    'ui.js': [],
    'auth.js': [],
    'socket.js': [],
    'patient.js': [],
    'doctor.js': [],
    'main.js': []
};

let currentFile = 'globals.js';

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect section headers to switch files
    if (line.includes('async function requestJson')) currentFile = 'api.js';
    if (line.includes('function showToast')) currentFile = 'ui.js';
    if (line.includes('function connectSocket')) currentFile = 'socket.js';
    if (line.includes('function sendOtp')) currentFile = 'auth.js';
    if (line.includes('window.renderPatientDashboard')) currentFile = 'patient.js';
    if (line.includes('window.renderDoctorDashboard')) currentFile = 'doctor.js';
    if (line.includes('document.addEventListener(\'DOMContentLoaded\'')) currentFile = 'main.js';
    
    files[currentFile].push(line);
}

const jsDir = path.join(__dirname, 'frontend', 'js');
if (!fs.existsSync(jsDir)) {
    fs.mkdirSync(jsDir);
}

for (const [filename, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(jsDir, filename), content.join('\n'));
}

console.log('Successfully split app.js into ' + Object.keys(files).length + ' files in frontend/js/');
