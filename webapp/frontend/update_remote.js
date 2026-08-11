const fs = require('fs');

const mainJsPath = 'c:/HealthSync/webapp/frontend/js/main.js';
const remoteJsPath = 'c:/HealthSync/webapp/frontend/js/remote_main.js';

let mainJs = fs.readFileSync(mainJsPath, 'utf8');
let remoteJs = fs.readFileSync(remoteJsPath, 'utf8');

const getBlock = (str, startRegex, endRegex) => {
    const matchStart = str.match(startRegex);
    if (!matchStart) return null;
    const matchEnd = str.substring(matchStart.index).match(endRegex);
    if (!matchEnd) return null;
    return str.substring(matchStart.index, matchStart.index + matchEnd.index + matchEnd[0].length);
};

const fn1 = getBlock(mainJs, /window\.openBookAppointmentModalWithDoctor = async function/, /\};\s*window\.selectBookingDate/);
const fn2 = getBlock(mainJs, /window\.selectBookingDate = async function/, /\};\s*function getNextDateStr/);
const fn3 = getBlock(mainJs, /function getNextDateStr/, /\};\s*window\.bookingNextStep/);

if(fn1 && fn2 && fn3) {
    const remoteFn1Regex = /window\.openBookAppointmentModalWithDoctor = function\s*\([^)]*\)\s*\{[\s\S]*?openModal\('modal-book-appt'\);\s*\};/;
    const remoteFn2Regex = /window\.selectBookingDate = async function\s*\([^)]*\)\s*\{[\s\S]*?\}\s*\};\s*window\.selectBookingTime/;
    const remoteFn3Regex = /window\.selectBookingTime = function\s*\([^)]*\)\s*\{[\s\S]*?disabled = false;\s*\};/;
    
    remoteJs = remoteJs.replace(remoteFn1Regex, fn1.replace(/\s*window\.selectBookingDate$/, ''));
    remoteJs = remoteJs.replace(remoteFn2Regex, fn2.replace(/\s*function getNextDateStr$/, '') + '\n\n  window.selectBookingTime');
    remoteJs = remoteJs.replace(remoteFn3Regex, fn3.replace(/\s*window\.bookingNextStep$/, ''));
    
    fs.writeFileSync(remoteJsPath, remoteJs);
    console.log("Updated remote_main.js");
} else {
    console.log("Failed to extract from main.js");
}
