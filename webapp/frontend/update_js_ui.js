const fs = require('fs');

const jsAdditions = `
// ==========================================================================
// NEW ONBOARDING UI LOGIC
// ==========================================================================

// Custom Country Dropdown Logic
const countries = [
  { name: 'India', code: '+91', flag: '🇮🇳' },
  { name: 'United States', code: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { name: 'UAE', code: '+971', flag: '🇦🇪' },
  { name: 'Canada', code: '+1', flag: '🇨🇦' },
  { name: 'Australia', code: '+61', flag: '🇦🇺' },
  { name: 'Singapore', code: '+65', flag: '🇸🇬' }
];

let selectedCountry = countries[0];

window.toggleCountryDropdown = function(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('country-dropdown-menu');
  if (menu) {
    menu.classList.toggle('hidden');
    if (!menu.classList.contains('hidden')) {
      document.getElementById('country-search-input')?.focus();
    }
  }
};

document.addEventListener('click', function(e) {
  const container = document.getElementById('country-dropdown-container');
  const menu = document.getElementById('country-dropdown-menu');
  if (container && menu && !container.contains(e.target)) {
    menu.classList.add('hidden');
  }
});

window.renderCountryList = function(listToRender) {
  const listEl = document.getElementById('country-list');
  if (!listEl) return;
  listEl.innerHTML = '';
  listToRender.forEach(c => {
    const li = document.createElement('li');
    li.className = 'country-item';
    li.innerHTML = \`<span class="country-item-flag">\${c.flag}</span><span class="country-item-name">\${c.name}</span><span class="country-item-code">\${c.code}</span>\`;
    li.onclick = function(e) {
      e.stopPropagation();
      selectedCountry = c;
      document.getElementById('selected-country-flag').textContent = c.flag;
      document.getElementById('selected-country-code').textContent = c.code;
      document.getElementById('country-dropdown-menu').classList.add('hidden');
    };
    listEl.appendChild(li);
  });
};

window.filterCountries = function() {
  const query = (document.getElementById('country-search-input')?.value || '').toLowerCase();
  const filtered = countries.filter(c => c.name.toLowerCase().includes(query) || c.code.includes(query));
  renderCountryList(filtered);
};

// Override handleAuthSubmit to include validation
window.handleAuthSubmit = async function(event) {
  event.preventDefault();
  const mobileInput = document.getElementById('ob-mobile');
  const mobile = mobileInput ? mobileInput.value.trim().replace(/\\D/g, '') : '';
  
  if (!mobile || mobile.length < 5) {
    if (typeof showToast === 'function') showToast('Please enter a valid mobile number.', 'error');
    else alert('Please enter a valid mobile number.');
    return;
  }
  
  // Format based on country code
  const fullMobile = mobile; // Backend currently assumes raw number. If we wanted, we'd prefix with selectedCountry.code
  window.pendingMobile = fullMobile;
  
  // Update UI to show the number
  const displayEl = document.getElementById('display-otp-number');
  if (displayEl) {
    displayEl.innerHTML = \`<span style="margin-right:8px">\${selectedCountry.flag}</span> \${selectedCountry.code} \${fullMobile}\`;
  }
  
  // Show sending state on button
  const btn = document.querySelector('#onboarding-auth-form button[type="submit"]');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = 'Sending OTP...';
  }
  
  try {
    const data = await requestJson('/auth/login', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ mobileNumber: window.pendingMobile }) 
    });
    
    if (data.otp) {
      // Auto-fill dev OTP
      const boxes = document.querySelectorAll('.otp-box');
      if (boxes.length === 6 && data.otp.length === 6) {
        for(let i=0; i<6; i++) {
          boxes[i].value = data.otp[i];
        }
      }
    }
    
    // Go to OTP step
    goToStep('step-otp');
    startObTimer();
    
    // Focus first box
    setTimeout(() => {
      document.querySelector('.otp-box')?.focus();
    }, 100);
    
  } catch(e) {
    if (typeof showToast === 'function') showToast(e.message || 'Failed to send OTP', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = obMode === 'register' ? 'Register and send OTP <i class="fa-regular fa-paper-plane ml-2"></i>' : 'Send OTP <i class="fa-regular fa-paper-plane ml-2"></i>';
    }
  }
};

// Override handleOtpSubmit to include Verifying state and timeout
window.handleOtpSubmit = async function() {
  const otpCode = Array.from(document.querySelectorAll('.otp-box')).map(b => b.value).join('');
  if (otpCode.length !== 6) {
    if (typeof showToast === 'function') showToast('Please enter a valid 6-digit OTP.', 'error');
    else alert('Please enter a valid 6-digit OTP.');
    return;
  }
  
  // Transition to explicitly verifying state
  goToStep('step-verifying');
  
  try {
    // Add Promise.race for explicit timeout (10 seconds)
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Network timeout. Unable to verify OTP.')), 10000));
    const verifyPromise = requestJson('/auth/verify', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ mobileNumber: window.pendingMobile, otpCode }) 
    });
    
    const data = await Promise.race([verifyPromise, timeoutPromise]);
    
    window.currentUser = { ...data.user, token: data.token, refreshToken: data.refreshToken };
    localStorage.setItem('healthsync-session', JSON.stringify({ user: window.currentUser, refreshToken: window.currentUser.refreshToken }));
    
    // Auto-login via connect socket if required
    if (typeof window.connectSocket === 'function') window.connectSocket();
    
    if (obMode === 'register') {
      goToStep('step-profile');
    } else {
      finishOnboarding(); // Skip success screen for returning user
    }
    
  } catch (error) {
    goToStep('step-otp'); // Revert back to OTP on error
    if (typeof showToast === 'function') showToast(error.message || "Invalid OTP. Please check the code and try again.", 'error');
    else alert(error.message || "Invalid OTP. Please check the code and try again.");
    
    // Clear boxes on invalid
    const boxes = document.querySelectorAll('.otp-box');
    boxes.forEach(b => b.value = '');
    if (boxes[0]) boxes[0].focus();
  }
};

// Override profile submit to actually save data
window.handleProfileSubmit = async function(event) {
  event.preventDefault();
  
  const nameInput = document.getElementById('ob-name');
  const emailInput = document.getElementById('ob-email');
  const dobInput = document.getElementById('ob-dob');
  const genderInput = document.querySelector('input[name="gender"]:checked');
  
  const name = nameInput ? nameInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim() : '';
  const dob = dobInput ? dobInput.value.trim() : '';
  const gender = genderInput ? genderInput.value : '';
  
  if (!name && obMode === 'register') {
     // Name might be entered in the previous step, fetch it
     // Wait, there's no name input on profile screen? The mock showed full name on the register tab.
  }
  
  const btn = document.querySelector('#step-profile button[type="submit"]');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = 'Creating Account...';
  }
  
  try {
    await requestJson('/auth/profile', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${window.currentUser ? window.currentUser.token : ''}\`
      },
      body: JSON.stringify({ email, dateOfBirth: dob, gender })
    });
    
    // Update local currentUser object
    if (window.currentUser) {
       window.currentUser.email = email;
       window.currentUser.dob = dob;
       window.currentUser.gender = gender;
       localStorage.setItem('healthsync-session', JSON.stringify({ user: window.currentUser, refreshToken: window.currentUser.refreshToken }));
    }
    
    goToStep('step-success');
    
  } catch(e) {
    if (typeof showToast === 'function') showToast(e.message || 'Failed to save profile', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Create Account';
    }
  }
};

// Initialize things on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  renderCountryList(countries);
});
`;

const jsPath = 'c:/HealthSync/webapp/frontend/js/main.js';
let js = fs.readFileSync(jsPath, 'utf8');

// Also update the language selection text in JS to make sure active pill text is correct
js = js.replace(/pill\.classList\.add\('active'\);/g, "pill.classList.add('active');\n    document.querySelectorAll('.language-choice').forEach(b => b.classList.remove('active'));\n    btn.classList.add('active');\n    localStorage.setItem('healthsync-language', lang);");

if (!js.includes('NEW ONBOARDING UI LOGIC')) {
  fs.writeFileSync(jsPath, js + '\n' + jsAdditions);
  console.log('main.js updated with new onboarding UI logic');
} else {
  console.log('main.js already has the new logic');
}

// Ensure cache buster is updated for index and remote_index
['c:/HealthSync/webapp/frontend/index.html', 'c:/HealthSync/webapp/frontend/remote_index.html'].forEach(htmlPath => {
  if (fs.existsSync(htmlPath)) {
    let html = fs.readFileSync(htmlPath, 'utf8');
    html = html.replace(/js\/main\.js\?v=\d+/g, 'js/main.js?v=' + Date.now());
    fs.writeFileSync(htmlPath, html);
    console.log('Cache busters updated in', htmlPath);
  }
});
