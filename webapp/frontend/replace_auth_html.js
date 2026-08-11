const fs = require('fs');
let html = fs.readFileSync('c:/HealthSync/webapp/frontend/index.html', 'utf8');

// Find the start and end of the old auth screens
const startTag = '<section id="language-screen"';
const endTag = '<section id="demo-portal"';

const startIdx = html.indexOf(startTag);
const endIdx = html.indexOf(endTag);

if (startIdx !== -1 && endIdx !== -1) {
  const replacement = `
  <!-- New Onboarding Flow -->
  <section id="onboarding-flow" class="onboarding-screen" aria-labelledby="onboarding-title">
    <div class="onboarding-card">
      
      <!-- Step 1: Language -->
      <div id="step-language" class="onboarding-step active">
        <div class="language-globe-container">
          <div class="globe-art">
            <div class="globe-circle">
              <div class="globe-land g1"></div>
              <div class="globe-land g2"></div>
              <div class="globe-land g3"></div>
            </div>
            <span class="hello-pill english">Hello</span>
            <span class="hello-pill hindi">नमस्ते</span>
            <span class="hello-pill marathi">मराठी</span>
            <span class="hello-pill hello2">हॅलो</span>
          </div>
        </div>
        <div class="onboarding-header">
          <h2>Choose Your Language</h2>
          <p>Select your preferred language to continue</p>
        </div>
        <div class="language-choice-grid">
          <button type="button" class="language-choice active" onclick="selectOnboardingLanguage(this, 'English')">
            <div class="lang-icon">A</div>
            <div class="lang-text"><strong>English</strong><span>English</span></div>
            <i class="fa-solid fa-circle-check check-icon"></i>
          </button>
          <button type="button" class="language-choice" onclick="selectOnboardingLanguage(this, 'Hindi')">
            <div class="lang-icon green">हिं</div>
            <div class="lang-text"><strong>हिंदी</strong><span>Hindi</span></div>
            <i class="fa-solid fa-circle-check check-icon"></i>
          </button>
          <button type="button" class="language-choice" onclick="selectOnboardingLanguage(this, 'Marathi')">
            <div class="lang-icon orange">म</div>
            <div class="lang-text"><strong>मराठी</strong><span>Marathi</span></div>
            <i class="fa-solid fa-circle-check check-icon"></i>
          </button>
        </div>
        <button class="btn btn-primary w-full mt-4" onclick="goToStep('step-auth')">Continue <i class="fa-solid fa-arrow-right ml-2"></i></button>
      </div>

      <!-- Step 2: Auth (Login / Register) -->
      <div id="step-auth" class="onboarding-step hidden">
        <div class="onboarding-top-bar">
          <button type="button" class="back-btn" onclick="goToStep('step-language')"><i class="fa-solid fa-arrow-left"></i></button>
          <span class="help-link">Help <i class="fa-regular fa-circle-question"></i></span>
        </div>
        <div class="onboarding-brand"><i class="fa-solid fa-heart-pulse text-red"></i> HealthSync</div>
        
        <div id="auth-header-login" class="onboarding-header">
          <h2>Welcome back!</h2>
          <p>Sign in to your account</p>
        </div>
        <div id="auth-header-register" class="onboarding-header hidden">
          <h2>Create Account</h2>
          <p>Enter your details to get started</p>
        </div>

        <div class="auth-tabs">
          <button type="button" id="tab-login" class="auth-tab active" onclick="switchAuthTab('login')">Login</button>
          <button type="button" id="tab-register" class="auth-tab" onclick="switchAuthTab('register')">Register</button>
        </div>

        <form id="onboarding-auth-form" onsubmit="handleAuthSubmit(event); return false;">
          <div id="register-fields" class="hidden">
            <label class="form-label">Full Name</label>
            <div class="input-with-icon mb-3">
              <i class="fa-regular fa-user"></i>
              <input type="text" id="ob-name" class="form-control" placeholder="Enter your full name">
            </div>
          </div>
          
          <label class="form-label">Mobile Number</label>
          <div class="mobile-input-group">
            <div class="country-code-box">
              <span class="fi fi-in"></span> +91 <i class="fa-solid fa-chevron-down text-xs ml-1"></i>
            </div>
            <input type="tel" id="ob-mobile" class="form-control" placeholder="Enter mobile number" required>
          </div>
          
          <p id="register-help-text" class="auth-help-text hidden mt-2">We will send you an OTP to verify</p>
          
          <button type="submit" class="btn btn-primary w-full mt-4">Send OTP <i class="fa-regular fa-paper-plane ml-2"></i></button>
        </form>

        <div id="social-login-section">
          <div class="divider"><span>or continue with</span></div>
          <button class="btn btn-outline w-full mb-3"><img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" class="social-icon"> Continue with Google</button>
          <button class="btn btn-outline w-full"><i class="fa-brands fa-apple text-lg mr-2"></i> Continue with Apple</button>
        </div>

        <div class="secure-footer">
          <i class="fa-solid fa-shield-halved text-green"></i> Your data is safe and secure with us
        </div>
      </div>

      <!-- Step 3: OTP -->
      <div id="step-otp" class="onboarding-step hidden">
        <div class="onboarding-top-bar">
          <button type="button" class="back-btn" onclick="goToStep('step-auth')"><i class="fa-solid fa-arrow-left"></i></button>
          <span class="help-link">Help <i class="fa-regular fa-circle-question"></i></span>
        </div>
        <div class="onboarding-brand"><i class="fa-solid fa-heart-pulse text-red"></i> HealthSync</div>
        
        <div class="onboarding-header">
          <h2>Verify Your Number</h2>
          <p>Enter the OTP sent to</p>
          <div class="otp-number-display mt-2">
            <span class="fi fi-in"></span> <span id="display-otp-number">+91 98765 43210</span>
          </div>
        </div>

        <div class="otp-input-group mt-4">
          <input type="tel" class="otp-box" maxlength="1" onkeyup="moveToNext(this, event)">
          <input type="tel" class="otp-box" maxlength="1" onkeyup="moveToNext(this, event)">
          <input type="tel" class="otp-box" maxlength="1" onkeyup="moveToNext(this, event)">
          <input type="tel" class="otp-box" maxlength="1" onkeyup="moveToNext(this, event)">
          <input type="tel" class="otp-box" maxlength="1" onkeyup="moveToNext(this, event)">
          <input type="tel" class="otp-box" maxlength="1" onkeyup="moveToNext(this, event)">
        </div>

        <div class="resend-text mt-4">
          Didn't receive the OTP? <span id="resend-timer" class="text-blue fw-bold cursor-pointer">Resend in 00:45</span>
        </div>

        <button class="btn btn-primary w-full mt-4" onclick="handleOtpSubmit()">Verify OTP</button>
        
        <div class="divider"><span>or</span></div>
        
        <button class="btn btn-outline w-full" onclick="goToStep('step-auth')"><i class="fa-solid fa-pen text-sm mr-2"></i> Change Mobile Number</button>
        
        <div class="secure-footer mt-auto pt-4">
          <i class="fa-solid fa-shield-halved text-green"></i> Your data is safe and secure with us
        </div>
      </div>

      <!-- Step 4: Profile -->
      <div id="step-profile" class="onboarding-step hidden">
        <div class="onboarding-top-bar">
          <button type="button" class="back-btn" onclick="goToStep('step-auth')"><i class="fa-solid fa-arrow-left"></i></button>
          <span class="help-link">Help <i class="fa-regular fa-circle-question"></i></span>
        </div>
        <div class="onboarding-brand"><i class="fa-solid fa-heart-pulse text-red"></i> HealthSync</div>
        
        <div class="onboarding-progress mt-3">
          <div class="progress-step completed">1</div>
          <div class="progress-line completed"></div>
          <div class="progress-step active">2</div>
          <div class="progress-line"></div>
          <div class="progress-step">3</div>
        </div>
        <div class="progress-labels">
          <span>Mobile</span>
          <span class="active">Profile</span>
          <span>Done</span>
        </div>

        <div class="onboarding-header mt-4 mb-4">
          <h2>Complete Your Profile</h2>
          <p>Tell us more about yourself</p>
        </div>

        <form onsubmit="handleProfileSubmit(event); return false;">
          <label class="form-label">Email (Optional)</label>
          <div class="input-with-icon mb-3">
            <i class="fa-regular fa-envelope"></i>
            <input type="email" id="ob-email" class="form-control" placeholder="Enter your email">
          </div>
          
          <label class="form-label">Date of Birth</label>
          <div class="input-with-icon mb-3">
            <i class="fa-regular fa-calendar"></i>
            <input type="text" id="ob-dob" class="form-control" placeholder="DD / MM / YYYY">
          </div>
          
          <label class="form-label">Gender</label>
          <div class="gender-selection">
            <label class="gender-box active">
              <input type="radio" name="gender" value="Male" checked onclick="updateGenderSelection(this)">
              <i class="fa-solid fa-person text-blue mb-1" style="font-size:20px;"></i> Male
            </label>
            <label class="gender-box">
              <input type="radio" name="gender" value="Female" onclick="updateGenderSelection(this)">
              <i class="fa-solid fa-person-dress text-pink mb-1" style="font-size:20px;"></i> Female
            </label>
            <label class="gender-box">
              <input type="radio" name="gender" value="Other" onclick="updateGenderSelection(this)">
              <i class="fa-solid fa-users text-orange mb-1" style="font-size:20px;"></i> Other
            </label>
          </div>

          <button type="submit" class="btn btn-primary w-full mt-4">Create Account</button>
        </form>

        <div class="secure-footer mt-auto pt-4">
          <i class="fa-solid fa-shield-halved text-green"></i> Your data is safe and secure with us
        </div>
      </div>

      <!-- Step 5: Success -->
      <div id="step-success" class="onboarding-step hidden">
        <div class="confetti-container">
          <div class="success-checkmark">
            <i class="fa-solid fa-check"></i>
          </div>
          <div class="c1"></div><div class="c2"></div><div class=\"c3\"></div><div class=\"c4\"></div><div class=\"c5\"></div>
        </div>
        
        <div class="onboarding-header mt-4 mb-4 text-center">
          <h2>Account Created!</h2>
          <p>Welcome to HealthSync</p>
        </div>
        
        <div class="feature-list-card">
          <div class="feature-item">
            <div class="feature-icon bg-blue-light"><i class="fa-regular fa-calendar-check text-blue"></i></div>
            <span>Book doctor appointments</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon bg-green-light"><i class="fa-solid fa-file-medical text-green"></i></div>
            <span>Manage health records</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon bg-red-light"><i class="fa-solid fa-shield-halved text-red"></i></div>
            <span>Emergency SOS support</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon bg-blue-light2"><i class="fa-solid fa-file-prescription text-blue2"></i></div>
            <span>Digital prescriptions</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon text-muted" style="background:transparent; border:1px solid #e2e8f0; font-size:10px;"><i class="fa-solid fa-ellipsis"></i></div>
            <span>And much more...</span>
          </div>
        </div>
        
        <button type="button" class="btn btn-primary w-full mt-4" onclick="finishOnboarding()">Go to Dashboard <i class="fa-solid fa-arrow-right ml-2"></i></button>
      </div>

    </div>
  </section>
  
  `;
  
  html = html.substring(0, startIdx) + replacement + html.substring(endIdx);
  fs.writeFileSync('c:/HealthSync/webapp/frontend/index.html', html);
  console.log('HTML updated successfully');
} else {
  console.log('Could not find start/end tags');
}
