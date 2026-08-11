const fs = require('fs');

const path = 'c:/HealthSync/webapp/frontend/js/main.js';
let code = fs.readFileSync(path, 'utf8');

// We will use regex to replace the functions handleAuthSubmit, moveToNext, startObTimer, handleOtpSubmit, finishOnboarding

const replacements = {
  'window.handleAuthSubmit = function(event) {': `window.handleAuthSubmit = async function(event) {
  event.preventDefault();
  const mobile = document.getElementById('ob-mobile').value.trim();
  if (!mobile) return;
  
  // Format the mobile
  window.pendingMobile = '+91' + mobile; // Assuming +91 for now based on UI
  
  // Update UI to show the number
  document.getElementById('display-otp-number').textContent = '+91 ' + mobile;
  
  const btn = document.querySelector('#onboarding-auth-form button[type="submit"]');
  const originalText = btn.innerHTML;
  btn.innerHTML = 'Sending...';
  btn.disabled = true;
  
  // API Call
  try {
    const data = await requestJson('/auth/login', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ mobileNumber: window.pendingMobile }) 
    });
    
    // Show dev OTP
    if (data.otp) {
      if (typeof showToast === 'function') showToast('Development OTP: ' + data.otp, 'info');
      else alert('Development OTP: ' + data.otp);
    }
    
    // Go to OTP step
    goToStep('step-otp');
    startObTimer();
    
    // Focus first box
    setTimeout(() => {
      const firstBox = document.querySelector('.otp-box');
      if (firstBox) firstBox.focus();
    }, 100);
  } catch (error) {
    if (typeof showToast === 'function') showToast(error.message || "Failed to send OTP", 'error');
    else alert(error.message || "Failed to send OTP");
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}`,

  'window.startObTimer = function() {': `window.startObTimer = function() {
  let seconds = 45;
  const display = document.getElementById('resend-timer');
  clearInterval(obTimer);
  
  display.onclick = null;
  display.classList.remove('cursor-pointer');
  display.style.color = '#64748b'; // Gray out
  display.textContent = 'Resend in 00:45';
  
  obTimer = setInterval(() => {
    seconds--;
    const secStr = seconds < 10 ? '0' + seconds : seconds;
    display.textContent = 'Resend in 00:' + secStr;
    
    if (seconds <= 0) {
      clearInterval(obTimer);
      display.textContent = 'Resend now';
      display.classList.add('cursor-pointer');
      display.style.color = '#2563eb'; // Blue
      display.onclick = async () => {
         display.textContent = 'Sending...';
         try {
           const data = await requestJson('/auth/login', { 
              method: 'POST', 
              headers: { 'Content-Type': 'application/json' }, 
              body: JSON.stringify({ mobileNumber: window.pendingMobile }) 
           });
           if (data.otp) {
             if (typeof showToast === 'function') showToast('Development OTP: ' + data.otp, 'info');
             else alert('Development OTP: ' + data.otp);
           }
           startObTimer(); // Restart timer
         } catch (err) {
           if (typeof showToast === 'function') showToast(err.message, 'error');
           display.textContent = 'Resend now'; // Revert
         }
      };
    }
  }, 1000);
}`,

  'window.handleOtpSubmit = function() {': `window.handleOtpSubmit = async function() {
  const otpBoxes = document.querySelectorAll('.otp-box');
  let otpCode = '';
  otpBoxes.forEach(box => otpCode += box.value);
  
  if (otpCode.length !== 6) {
    if (typeof showToast === 'function') showToast("Please enter 6-digit OTP", 'error');
    else alert("Please enter 6-digit OTP");
    return;
  }
  
  const btn = document.querySelector('#step-otp .btn-primary');
  const originalText = btn.innerHTML;
  btn.innerHTML = 'Verifying...';
  btn.disabled = true;
  
  try {
    let registrationData = {};
    if (obMode === 'register') {
      const name = document.getElementById('ob-name').value.trim();
      registrationData = { fullName: name, requestedRole: 'PATIENT' };
    }
    
    const data = await requestJson('/auth/verify', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ mobileNumber: window.pendingMobile, otpCode, ...registrationData }) 
    });
    
    window.currentUser = { ...data.user, token: data.token, refreshToken: data.refreshToken };
    localStorage.setItem('healthsync-session', JSON.stringify({ user: window.currentUser, refreshToken: window.currentUser.refreshToken }));
    
    if (obMode === 'register') {
      goToStep('step-profile');
    } else {
      goToStep('step-success'); // Show success screen for login too for visual flair
    }
  } catch (error) {
    if (typeof showToast === 'function') showToast(error.message || "OTP Verification failed", 'error');
    else alert(error.message || "OTP Verification failed");
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}`,

  'window.finishOnboarding = function() {': `window.finishOnboarding = function() {
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
}`
};

for (const [search, replace] of Object.entries(replacements)) {
  const startIdx = code.indexOf(search);
  if (startIdx !== -1) {
    // find end of function
    const endIdx = code.indexOf('}\n\nwindow.', startIdx);
    if (endIdx !== -1) {
       code = code.substring(0, startIdx) + replace + code.substring(endIdx + 1);
    } else {
       // if it's the last function
       const endIdx2 = code.indexOf('}\n', startIdx);
       if (endIdx2 !== -1) {
         // Let's just find the next window. or end of file
         let e = code.indexOf('window.', startIdx + 10);
         if (e === -1) e = code.length;
         code = code.substring(0, startIdx) + replace + '\n' + code.substring(e);
       }
    }
  }
}

fs.writeFileSync(path, code);
console.log('Successfully updated main.js logic for OTP and backend integration');
