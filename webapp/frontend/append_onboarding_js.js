const fs = require('fs');

const newLogic = `
// ==========================================================================
// NEW ONBOARDING LOGIC
// ==========================================================================

let obMode = 'login';
let obTimer = null;

window.selectOnboardingLanguage = function(btn, lang) {
  document.querySelectorAll('.language-choice').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  // Usually save this preference
}

window.goToStep = function(stepId) {
  document.querySelectorAll('.onboarding-step').forEach(s => s.classList.add('hidden'));
  document.querySelectorAll('.onboarding-step').forEach(s => s.classList.remove('active'));
  
  const step = document.getElementById(stepId);
  if (step) {
    step.classList.remove('hidden');
    step.classList.add('active');
  }
}

window.switchAuthTab = function(mode) {
  obMode = mode;
  document.getElementById('tab-login').classList.toggle('active', mode === 'login');
  document.getElementById('tab-register').classList.toggle('active', mode === 'register');
  
  document.getElementById('auth-header-login').classList.toggle('hidden', mode !== 'login');
  document.getElementById('auth-header-register').classList.toggle('hidden', mode === 'login');
  
  document.getElementById('register-fields').classList.toggle('hidden', mode !== 'register');
  document.getElementById('register-help-text').classList.toggle('hidden', mode !== 'register');
  
  const btn = document.querySelector('#onboarding-auth-form button[type="submit"]');
  btn.innerHTML = mode === 'register' ? 'Register and send OTP <i class="fa-regular fa-paper-plane ml-2"></i>' : 'Send OTP <i class="fa-regular fa-paper-plane ml-2"></i>';
}

window.handleAuthSubmit = function(event) {
  event.preventDefault();
  const mobile = document.getElementById('ob-mobile').value.trim();
  if (!mobile) return;
  
  // Update UI to show the number
  document.getElementById('display-otp-number').textContent = '+91 ' + mobile;
  
  // Go to OTP step
  goToStep('step-otp');
  startObTimer();
  
  // Focus first box
  setTimeout(() => {
    document.querySelector('.otp-box').focus();
  }, 100);
}

window.moveToNext = function(input, event) {
  if (input.value.length === 1) {
    const next = input.nextElementSibling;
    if (next) next.focus();
  }
  if (event.key === 'Backspace' && input.value.length === 0) {
    const prev = input.previousElementSibling;
    if (prev) {
      prev.focus();
      prev.value = '';
    }
  }
}

window.startObTimer = function() {
  let seconds = 45;
  const display = document.getElementById('resend-timer');
  clearInterval(obTimer);
  
  obTimer = setInterval(() => {
    seconds--;
    display.textContent = \`Resend in 00:\${seconds < 10 ? '0'+seconds : seconds}\`;
    display.classList.remove('cursor-pointer');
    
    if (seconds <= 0) {
      clearInterval(obTimer);
      display.textContent = 'Resend now';
      display.classList.add('cursor-pointer');
    }
  }, 1000);
}

window.handleOtpSubmit = function() {
  // If register, go to profile, else go to dashboard
  if (obMode === 'register') {
    goToStep('step-profile');
  } else {
    // For login, create mock user and go to dashboard
    finishOnboarding();
  }
}

window.updateGenderSelection = function(radio) {
  document.querySelectorAll('.gender-box').forEach(b => b.classList.remove('active'));
  radio.closest('.gender-box').classList.add('active');
}

window.handleProfileSubmit = function(event) {
  event.preventDefault();
  // Move to success screen
  goToStep('step-success');
}

window.finishOnboarding = function() {
  // Hide onboarding, show dashboard
  document.getElementById('onboarding-flow').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  
  // Mock login if currentUser not set
  if (!window.currentUser) {
    window.currentUser = { id: 'demo-patient', name: 'Demo Patient', role: 'PATIENT', demo: true };
    window.switchGlobalRole('patient');
    if (typeof window.renderPatientHealthProfile === 'function') window.renderPatientHealthProfile();
  }
}
`;

fs.appendFileSync('c:/HealthSync/webapp/frontend/js/main.js', '\n' + newLogic);
console.log('Main.js updated successfully');
