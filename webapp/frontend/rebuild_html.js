const fs = require('fs');

const pixelPerfectHtml = `
  <!-- New Pixel-Perfect Onboarding Flow -->
  <section id="onboarding-flow" class="onboarding-screen" aria-labelledby="onboarding-title">
    <div class="onboarding-card px-container">
      
      <!-- Step 1: Language -->
      <div id="step-language" class="onboarding-step px-perfect active">
        <div class="lang-hero">
          <div class="lang-brand">
            <i class="fa-solid fa-heart-pulse text-red"></i> <span class="brand-text">HealthSync</span>
          </div>
          <div class="lang-titles">
            <h3>Welcome to</h3>
            <h1>HealthSync</h1>
            <p>Your Health, Our Priority</p>
          </div>
          <div class="lang-illustration">
             <!-- Family Illustration SVG Placeholder -->
             <svg width="200" height="150" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="75" r="70" fill="#e0f2fe" opacity="0.5"/>
                <!-- Father -->
                <circle cx="60" cy="50" r="15" fill="#1e3a8a"/>
                <path d="M40 120 Q60 80 80 120" fill="#1e3a8a"/>
                <!-- Mother -->
                <circle cx="100" cy="40" r="14" fill="#047857"/>
                <path d="M80 120 Q100 70 120 120" fill="#047857"/>
                <!-- Grandparents -->
                <circle cx="140" cy="55" r="13" fill="#64748b"/>
                <path d="M120 120 Q140 85 160 120" fill="#64748b"/>
                <!-- Child -->
                <circle cx="80" cy="80" r="10" fill="#f59e0b"/>
                <path d="M65 120 Q80 95 95 120" fill="#f59e0b"/>
                <!-- Medical Icons -->
                <circle cx="40" cy="30" r="10" fill="#fff" stroke="#3b82f6"/>
                <path d="M37 30 H43 M40 27 V33" stroke="#3b82f6" stroke-width="2"/>
                <circle cx="150" cy="25" r="8" fill="#fff" stroke="#10b981"/>
                <circle cx="170" cy="80" r="9" fill="#fff" stroke="#f43f5e"/>
             </svg>
          </div>
        </div>
        <div class="lang-card-overlay">
          <h2>Choose Your Language</h2>
          <p>Select your preferred language to continue</p>
          <div class="lang-options">
            <button type="button" class="lang-opt active" onclick="selectOnboardingLanguage(this, 'English')">
              <div class="lang-icon bg-blue">A</div>
              <div class="lang-text">
                <strong>English</strong>
                <span>Continue in English</span>
              </div>
              <div class="lang-check"><i class="fa-solid fa-check"></i></div>
            </button>
            <button type="button" class="lang-opt" onclick="selectOnboardingLanguage(this, 'Marathi')">
              <div class="lang-icon bg-orange">म</div>
              <div class="lang-text">
                <strong>मराठी</strong>
                <span>मराठीत पुढे जा</span>
              </div>
              <div class="lang-check"><i class="fa-solid fa-check"></i></div>
            </button>
            <button type="button" class="lang-opt" onclick="selectOnboardingLanguage(this, 'Hindi')">
              <div class="lang-icon bg-green">हिं</div>
              <div class="lang-text">
                <strong>हिंदी</strong>
                <span>हिंदी में जारी रखें</span>
              </div>
              <div class="lang-check"><i class="fa-solid fa-check"></i></div>
            </button>
          </div>
          <button type="button" class="btn btn-primary btn-block mt-3" onclick="goToStep('step-auth')">Continue <i class="fa-solid fa-arrow-right"></i></button>
        </div>
      </div>

      <!-- Step 2: Auth (Login / Register) -->
      <div id="step-auth" class="onboarding-step hidden px-perfect">
        <div class="px-header">
          <button type="button" class="px-back" onclick="goToStep('step-language')"><i class="fa-solid fa-arrow-left"></i></button>
          <button type="button" class="px-help">Need help? <i class="fa-regular fa-circle-question"></i></button>
        </div>
        <div class="px-brand text-center mt-2">
          <i class="fa-solid fa-heart-pulse text-red"></i> <span class="brand-text">HealthSync</span>
        </div>
        <div class="px-titles text-center mt-3">
          <h2>Welcome back</h2>
          <p>Sign in to your account</p>
        </div>
        <div class="px-illustration mt-4">
          <!-- Phone & Shield Graphic -->
          <div class="phone-graphic">
            <div class="phone-body">
              <div class="phone-screen">
                <div class="phone-avatar"><i class="fa-solid fa-user"></i></div>
                <div class="phone-line"></div>
                <div class="phone-line short"></div>
              </div>
            </div>
            <div class="shield-badge">
              <i class="fa-solid fa-shield"></i>
              <i class="fa-solid fa-check check-overlay"></i>
            </div>
          </div>
        </div>
        <div class="px-card mt-auto pt-4">
          <form id="onboarding-auth-form" onsubmit="handleAuthSubmit(event); return false;">
            <label class="px-label">Mobile Number</label>
            <div class="px-phone-input">
              <div class="custom-country-dropdown" id="country-dropdown-container">
                <button type="button" class="country-select-btn" id="country-select-btn" onclick="toggleCountryDropdown()">
                  <span id="selected-country-flag">🇮🇳</span>
                  <span id="selected-country-code" style="margin-left:4px">+91</span>
                  <i class="fa-solid fa-chevron-down" style="font-size: 10px; margin-left: 6px;"></i>
                </button>
                <div class="country-dropdown-menu hidden" id="country-dropdown-menu">
                  <div class="country-search-box">
                    <i class="fa-solid fa-search"></i>
                    <input type="text" id="country-search-input" placeholder="Search country..." onkeyup="filterCountries()">
                  </div>
                  <ul class="country-list" id="country-list"></ul>
                </div>
              </div>
              <input type="tel" id="ob-mobile" placeholder="Enter mobile number" required>
            </div>
            
            <button type="submit" class="btn btn-primary btn-block mt-4" style="height:48px; border-radius:12px; font-weight:600;">Send OTP</button>
            
            <div class="px-divider mt-4 mb-3"><span>or continue with</span></div>
            
            <button type="button" class="btn btn-outline btn-block mb-3 px-social" disabled title="Currently unavailable">
              <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google"> Continue with Google
            </button>
            <button type="button" class="btn btn-outline btn-block px-social" disabled title="Currently unavailable">
              <i class="fa-brands fa-apple" style="font-size: 20px;"></i> Continue with Apple
            </button>
            
            <div class="px-footer mt-4">
              <i class="fa-solid fa-shield-halved"></i> Your data is safe and secure with us
            </div>
          </form>
        </div>
      </div>

      <!-- Step 3: OTP -->
      <div id="step-otp" class="onboarding-step hidden px-perfect">
        <div class="px-header">
          <button type="button" class="px-back" onclick="goToStep('step-auth')"><i class="fa-solid fa-arrow-left"></i></button>
          <button type="button" class="px-help">Need help? <i class="fa-regular fa-circle-question"></i></button>
        </div>
        <div class="px-brand text-center mt-2">
          <i class="fa-solid fa-heart-pulse text-red"></i> <span class="brand-text">HealthSync</span>
        </div>
        <div class="px-titles text-center mt-3">
          <h2>Verify OTP</h2>
          <p>Enter the 6-digit code sent to</p>
        </div>
        
        <div class="px-number-pill mt-3">
          <span class="px-num-text" id="display-otp-number">+91 98765 43210</span>
          <span class="px-num-change" onclick="goToStep('step-auth')">Change</span>
        </div>
        
        <div class="px-otp-group mt-4 pt-2">
          <input type="tel" class="otp-box" maxlength="1" onkeyup="moveToNext(this, event)" onpaste="handlePaste(event)">
          <input type="tel" class="otp-box" maxlength="1" onkeyup="moveToNext(this, event)" onpaste="handlePaste(event)">
          <input type="tel" class="otp-box" maxlength="1" onkeyup="moveToNext(this, event)" onpaste="handlePaste(event)">
          <input type="tel" class="otp-box" maxlength="1" onkeyup="moveToNext(this, event)" onpaste="handlePaste(event)">
          <input type="tel" class="otp-box" maxlength="1" onkeyup="moveToNext(this, event)" onpaste="handlePaste(event)">
          <input type="tel" class="otp-box" maxlength="1" onkeyup="moveToNext(this, event)" onpaste="handlePaste(event)">
        </div>
        
        <div class="px-resend text-center mt-4 pt-2">
          Didn't receive code? <span id="resend-timer" class="text-blue fw-bold cursor-pointer">Resend in 00:45</span>
        </div>
        
        <button type="button" class="btn btn-primary btn-block mt-4" style="height:48px; border-radius:12px; font-weight:600;" onclick="handleOtpSubmit()">Verify OTP</button>
        
        <div class="px-divider mt-4 mb-4"><span>or</span></div>
        
        <button type="button" class="btn btn-outline btn-block px-change-btn" style="border-radius:12px; height:48px;" onclick="goToStep('step-auth')">
          <i class="fa-solid fa-pen" style="margin-right:8px;"></i> Change Mobile Number
        </button>
        
        <div class="px-footer mt-auto pt-4 pb-2">
          <i class="fa-solid fa-shield-halved"></i> Your data is safe and secure with us
        </div>
      </div>
      
      <!-- Step 3.5: Verifying -->
      <div id="step-verifying" class="onboarding-step hidden px-perfect">
        <div class="px-header">
          <button type="button" class="px-back" onclick="goToStep('step-otp')"><i class="fa-solid fa-arrow-left"></i></button>
        </div>
        <div class="px-brand text-center mt-2">
          <i class="fa-solid fa-heart-pulse text-red"></i> <span class="brand-text">HealthSync</span>
        </div>
        
        <div class="verifying-container text-center mt-5 pt-4">
          <div class="verifying-graphic">
            <div class="v-circle-light">
              <i class="fa-solid fa-lock v-lock"></i>
            </div>
            <div class="v-badge-green">
              <i class="fa-solid fa-check"></i>
            </div>
          </div>
          <h2 class="mt-4 pt-2" style="font-size: 24px; font-weight: 700; color: #1e293b;">Verifying...</h2>
          <p class="mt-2" style="color: #64748b; font-size: 15px; line-height: 1.5; max-width: 260px; margin: 0 auto;">
            Please wait while we verify your mobile number
          </p>
          <div class="bouncing-dots mt-4">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
        </div>
        
        <div class="px-footer mt-auto pt-4 pb-2">
          <i class="fa-solid fa-shield-halved"></i> Your data is safe and secure with us
        </div>
      </div>

      <!-- Step 4: Profile -->
      <div id="step-profile" class="onboarding-step hidden px-perfect">
        <div class="px-header">
          <button type="button" class="px-back" onclick="goToStep('step-auth')"><i class="fa-solid fa-arrow-left"></i></button>
          <button type="button" class="px-help" style="font-weight:600; color:#3b82f6;">Skip</button>
        </div>
        <div class="px-brand text-center mt-2 mb-4">
          <i class="fa-solid fa-heart-pulse text-red"></i> <span class="brand-text">HealthSync</span>
        </div>
        
        <div class="px-progress">
          <div class="prog-item completed">
            <div class="prog-circle">1</div>
            <span>Mobile</span>
          </div>
          <div class="prog-line completed"></div>
          <div class="prog-item active">
            <div class="prog-circle">2</div>
            <span>Profile</span>
          </div>
          <div class="prog-line"></div>
          <div class="prog-item">
            <div class="prog-circle">3</div>
            <span>Done</span>
          </div>
        </div>

        <div class="px-titles text-center mt-4 pt-2 mb-4">
          <h2>Complete Your Profile</h2>
          <p>Tell us more about yourself</p>
        </div>

        <form onsubmit="handleProfileSubmit(event); return false;" style="flex:1; display:flex; flex-direction:column;">
          <div class="px-form-group">
            <label>Full Name</label>
            <div class="px-input-icon">
              <i class="fa-regular fa-user"></i>
              <input type="text" id="ob-name" placeholder="Enter your full name">
            </div>
          </div>
          
          <div class="px-form-group">
            <label>Email (Optional)</label>
            <div class="px-input-icon">
              <i class="fa-regular fa-envelope"></i>
              <input type="email" id="ob-email" placeholder="Enter your email">
            </div>
          </div>
          
          <div class="px-form-group">
            <label>Date of Birth</label>
            <div class="px-input-icon">
              <i class="fa-regular fa-calendar"></i>
              <input type="text" id="ob-dob" placeholder="DD / MM / YYYY">
            </div>
          </div>
          
          <div class="px-form-group">
            <label>Gender</label>
            <div class="px-gender-grid">
              <label class="px-gender-pill active">
                <input type="radio" name="gender" value="Male" checked onclick="updateGenderSelection(this)">
                <i class="fa-regular fa-user" style="color:#3b82f6"></i> Male
              </label>
              <label class="px-gender-pill">
                <input type="radio" name="gender" value="Female" onclick="updateGenderSelection(this)">
                <i class="fa-solid fa-person-dress" style="color:#ec4899"></i> Female
              </label>
              <label class="px-gender-pill">
                <input type="radio" name="gender" value="Other" onclick="updateGenderSelection(this)">
                <i class="fa-regular fa-user" style="color:#f59e0b"></i> Other
              </label>
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-block mt-auto" style="height:48px; border-radius:12px; font-weight:600;">Continue <i class="fa-solid fa-arrow-right ml-2"></i></button>
          
          <div class="px-footer mt-4 pb-2">
            <i class="fa-solid fa-shield-halved"></i> Your data is safe and secure with us
          </div>
        </form>
      </div>

      <!-- Step 5: Success -->
      <div id="step-success" class="onboarding-step hidden px-perfect">
        <div class="success-graphic mt-5 pt-4">
          <div class="confetti-bg"></div>
          <div class="success-circle-large">
            <i class="fa-solid fa-check"></i>
          </div>
        </div>
        
        <div class="px-titles text-center mt-4 pt-2 mb-4">
          <h2>Welcome to HealthSync!</h2>
          <p>Your account has been<br>successfully created.</p>
        </div>
        
        <div class="px-feature-card">
          <div class="px-feat-row">
            <div class="px-feat-icon bg-blue-light"><i class="fa-regular fa-calendar" style="color:#3b82f6"></i></div>
            <span>Book doctor appointments</span>
          </div>
          <div class="px-feat-row">
            <div class="px-feat-icon bg-green-light"><i class="fa-regular fa-folder-open" style="color:#10b981"></i></div>
            <span>Manage health records</span>
          </div>
          <div class="px-feat-row">
            <div class="px-feat-icon bg-red-light"><i class="fa-solid fa-shield-halved" style="color:#ef4444"></i></div>
            <span>Emergency SOS support</span>
          </div>
          <div class="px-feat-row">
            <div class="px-feat-icon bg-blue-light2"><i class="fa-solid fa-file-prescription" style="color:#3b82f6"></i></div>
            <span>Digital prescriptions</span>
          </div>
          <div class="px-feat-row">
            <div class="px-feat-icon" style="background:transparent; color:#94a3b8;"><i class="fa-solid fa-ellipsis"></i></div>
            <span style="color:#64748b;">And much more...</span>
          </div>
        </div>
        
        <button type="button" class="btn btn-primary btn-block mt-auto mb-3" style="height:48px; border-radius:12px; font-weight:600;" onclick="finishOnboarding()">Go to Dashboard <i class="fa-solid fa-arrow-right ml-2"></i></button>
      </div>

    </div>
  </section>
`;

function replaceHtml(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  const startTag = '<section id="onboarding-flow"';
  const endTag = '<section id="demo-portal"';
  const startIdx = html.indexOf(startTag);
  const endIdx = html.indexOf(endTag);
  
  if (startIdx !== -1 && endIdx !== -1) {
    html = html.substring(0, startIdx) + pixelPerfectHtml + html.substring(endIdx);
    fs.writeFileSync(filePath, html);
    console.log('Replaced onboarding-flow in', filePath);
  } else {
    console.log('Could not find tags in', filePath);
  }
}

replaceHtml('c:/HealthSync/webapp/frontend/index.html');
replaceHtml('c:/HealthSync/webapp/frontend/remote_index.html');
