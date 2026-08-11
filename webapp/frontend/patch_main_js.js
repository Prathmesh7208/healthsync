const fs = require('fs');

let mainJs = fs.readFileSync('c:/HealthSync/webapp/frontend/js/main.js', 'utf8');

const replacements = [
  {
    search: `window.goToStep = function(stepId) {
  document.querySelectorAll('.onboarding-step').forEach(s => s.classList.add('hidden'));
  document.querySelectorAll('.onboarding-step').forEach(s => s.classList.remove('active'));
  
  const step = document.getElementById(stepId);
  if (step) {
    step.classList.remove('hidden');
    step.classList.add('active');
  }
}`,
    replace: `window.goToStep = function(stepId) {
  const current = document.querySelector('.onboarding-step.active');
  const next = document.getElementById(stepId);
  if (!next || current === next) return;
  
  if (current) {
    current.style.opacity = '0';
    current.style.transition = 'opacity 0.2s';
    setTimeout(() => {
      current.classList.add('hidden');
      current.classList.remove('active');
      current.style.opacity = '';
      current.style.transition = '';
      
      next.classList.remove('hidden');
      next.classList.add('active');
    }, 200);
  } else {
    next.classList.remove('hidden');
    next.classList.add('active');
  }
}`
  },
  {
    search: `window.handleAuthSubmit = async function(event) {
  event.preventDefault();
  const mobile = document.getElementById('ob-mobile').value.trim();
  if (!mobile) return;
  
  // Format the mobile
  window.pendingMobile = '+91' + mobile; // Assuming +91 for now based on UI
  
  // Update UI to show the number
  document.getElementById('display-otp-number').textContent = '+91 ' + mobile;`,
    replace: `window.handleAuthSubmit = async function(event) {
  event.preventDefault();
  const mobile = document.getElementById('ob-mobile').value.replace(/\\D/g, '');
  const countryCode = document.getElementById('ob-country-code')?.value || '+91';
  
  if (countryCode === '+91' && !/^[6-9]\\d{9}$/.test(mobile)) {
    if (typeof showToast === 'function') showToast('Enter a valid 10-digit Indian mobile number.', 'error');
    else alert('Enter a valid 10-digit Indian mobile number.');
    return;
  }
  if (!/^\\d{7,15}$/.test(mobile)) {
    if (typeof showToast === 'function') showToast('Enter a valid mobile number.', 'error');
    else alert('Enter a valid mobile number.');
    return;
  }
  
  window.pendingMobile = countryCode + mobile;
  document.getElementById('display-otp-number').textContent = window.pendingMobile;`
  },
  {
    search: `window.startObTimer = function() {`,
    replace: `window.handlePaste = function(e) {
  e.preventDefault();
  const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\\D/g, '');
  if (!text) return;
  const boxes = document.querySelectorAll('.otp-box');
  for (let i = 0; i < boxes.length && i < text.length; i++) {
    boxes[i].value = text[i];
  }
  if (text.length >= boxes.length) boxes[boxes.length - 1].focus();
  else boxes[text.length].focus();
};

window.startObTimer = function() {`
  },
  {
    search: `  if (otpCode.length !== 6) {
    if (typeof showToast === 'function') showToast("Please enter 6-digit OTP", 'error');
    else alert("Please enter 6-digit OTP");
    return;
  }`,
    replace: `  if (otpCode.length !== 6) {
    if (typeof showToast === 'function') showToast("Please enter 6-digit OTP", 'error');
    else alert("Please enter 6-digit OTP");
    return;
  }`
  },
  {
    search: `    if (obMode === 'register') {
      goToStep('step-profile');
    } else {
      goToStep('step-success'); // Show success screen for login too for visual flair
    }`,
    replace: `    if (obMode === 'register') {
      goToStep('step-profile');
    } else {
      finishOnboarding(); // Skip success screen for returning user
    }`
  },
  {
    search: `window.finishOnboarding = function() {
  // Hide onboarding, show dashboard
  document.getElementById('onboarding-flow').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  
  if (window.currentUser) {
    const role = String(window.currentUser.role || 'PATIENT').toUpperCase();
    window.switchGlobalRole(role === 'DOCTOR' ? 'doctor' : role === 'RECEPTIONIST' ? 'reception' : role === 'AMBULANCE' ? 'ambulance' : 'patient');
    if (typeof window.renderPatientHealthProfile === 'function') window.renderPatientHealthProfile();
    if (typeof window.fetchNotifications === 'function') window.fetchNotifications();
    if ((role === 'RECEPTIONIST' || role === 'AMBULANCE' || role === 'DOCTOR') && typeof window.fetchPendingEmergencies === 'function') {
      window.fetchPendingEmergencies();
    }
    if (typeof window.syncAllData === 'function') window.syncAllData();
    if (typeof window.connectSocket === 'function') window.connectSocket();
  } else {
    // Mock login fallback just in case
    window.currentUser = { id: 'demo-patient', name: 'Demo Patient', role: 'PATIENT', demo: true };
    window.switchGlobalRole('patient');
    if (typeof window.renderPatientHealthProfile === 'function') window.renderPatientHealthProfile();
  }
}`,
    replace: `window.finishOnboarding = async function() {
  document.getElementById('onboarding-flow').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  
  if (window.currentUser) {
    const role = String(window.currentUser.role || 'PATIENT').toUpperCase();
    window.switchGlobalRole(role === 'DOCTOR' ? 'doctor' : role === 'RECEPTIONIST' ? 'reception' : role === 'AMBULANCE' ? 'ambulance' : 'patient');
    
    // Set actual name
    const dashNameEl = document.getElementById('patient-dashboard-name');
    if (dashNameEl) {
       dashNameEl.textContent = window.currentUser.name ? window.currentUser.name.split(' ')[0] : 'Patient';
    }
    
    // Fetch actual profile and data
    try {
      if (typeof window.syncAllData === 'function') await window.syncAllData();
    } catch(e) {}
    
    if (typeof window.renderPatientHealthProfile === 'function') window.renderPatientHealthProfile();
    if (typeof window.fetchNotifications === 'function') window.fetchNotifications();
    if ((role === 'RECEPTIONIST' || role === 'AMBULANCE' || role === 'DOCTOR') && typeof window.fetchPendingEmergencies === 'function') {
      window.fetchPendingEmergencies();
    }
    if (typeof window.connectSocket === 'function') window.connectSocket();
  } else {
    window.currentUser = { id: 'demo-patient', name: 'Demo Patient', role: 'PATIENT', demo: true };
    window.switchGlobalRole('patient');
    if (typeof window.renderPatientHealthProfile === 'function') window.renderPatientHealthProfile();
  }
}`
  },
  {
    search: `function renderPatientHealthProfile() {
  const profile = getHealthProfile();`,
    replace: `function renderPatientHealthProfile() {
  let profile = getHealthProfile();
  // Override profile name with actual real user data from session if possible
  if (profile && window.currentUser && !window.currentUser.demo) {
     profile.name = window.currentUser.name || profile.name;
  }`
  }
];

let changed = false;
for (const r of replacements) {
  if (mainJs.includes(r.search)) {
    mainJs = mainJs.replace(r.search, r.replace);
    changed = true;
  } else {
    console.warn("Could not find:", r.search.substring(0, 50));
  }
}

if (changed) {
  fs.writeFileSync('c:/HealthSync/webapp/frontend/js/main.js', mainJs);
  console.log('Successfully updated main.js');
} else {
  console.log('No replacements made.');
}
