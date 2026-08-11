const fs = require('fs');

function updateHtml(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');

  // 1. Update Language Selection buttons text
  html = html.replace(
    /<div class="lang-text"><strong>English<\/strong><span>English<\/span><\/div>/,
    '<div class="lang-text"><strong>English</strong><span>Continue in English</span></div>'
  );
  html = html.replace(
    /<div class="lang-text"><strong>हिंदी<\/strong><span>Hindi<\/span><\/div>/,
    '<div class="lang-text"><strong>हिंदी</strong><span>हिंदी में जारी रखें</span></div>'
  );
  html = html.replace(
    /<div class="lang-text"><strong>मराठी<\/strong><span>Marathi<\/span><\/div>/,
    '<div class="lang-text"><strong>मराठी</strong><span>मराठीत पुढे जा</span></div>'
  );

  // 2. Add custom Country Dropdown structure
  // Replace the simple <select> with a custom dropdown structure
  const oldCountrySelect = '<select id="ob-country-code" class="country-code-select" aria-label="Country Code"></select>';
  const newCountryDropdown = `
              <div class="custom-country-dropdown" id="country-dropdown-container">
                <button type="button" class="country-select-btn" id="country-select-btn" onclick="toggleCountryDropdown()">
                  <span id="selected-country-flag">🇮🇳</span>
                  <span id="selected-country-code">+91</span>
                  <i class="fa-solid fa-chevron-down" style="font-size: 10px; margin-left: 4px;"></i>
                </button>
                <div class="country-dropdown-menu hidden" id="country-dropdown-menu">
                  <div class="country-search-box">
                    <i class="fa-solid fa-search"></i>
                    <input type="text" id="country-search-input" placeholder="Search country or code..." onkeyup="filterCountries()">
                  </div>
                  <ul class="country-list" id="country-list">
                    <!-- Populated by JS -->
                  </ul>
                </div>
              </div>
  `;
  html = html.replace(oldCountrySelect, newCountryDropdown);

  // 3. Hide/disable social login buttons
  // Add "Unavailable" styling
  html = html.replace(
    /<button class="btn btn-outline w-full mb-3">/g,
    '<button type="button" class="btn btn-outline w-full mb-3" disabled style="opacity: 0.5; cursor: not-allowed;" title="Currently unavailable">'
  );
  html = html.replace(
    /<button class="btn btn-outline w-full"><i class="fa-brands fa-apple/g,
    '<button type="button" class="btn btn-outline w-full" disabled style="opacity: 0.5; cursor: not-allowed;" title="Currently unavailable"><i class="fa-brands fa-apple'
  );

  // 4. Implement dedicated step-verifying screen
  const stepVerifyingHtml = `
      <!-- Step 3.5: Verifying -->
      <div id="step-verifying" class="onboarding-step hidden">
        <div class="onboarding-brand mt-4"><i class="fa-solid fa-heart-pulse text-red"></i> HealthSync</div>
        
        <div class="verifying-container text-center" style="margin-top: 60px;">
          <div class="verifying-icon" style="font-size: 48px; color: #3b82f6; margin-bottom: 24px;">
            <i class="fa-solid fa-lock"></i>
          </div>
          <h2 style="font-size: 24px; font-weight: 700; color: #1e293b; margin-bottom: 12px;">Verifying...</h2>
          <p style="color: #64748b; font-size: 15px; line-height: 1.5; max-width: 280px; margin: 0 auto;">
            Please wait while we securely verify your mobile number.
          </p>
          <div class="loading-spinner mt-4" style="display: inline-block; width: 30px; height: 30px; border: 3px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        </div>
      </div>
  `;
  
  // Insert before step-profile
  html = html.replace('<!-- Step 4: Profile -->', stepVerifyingHtml + '\n      <!-- Step 4: Profile -->');

  fs.writeFileSync(filePath, html);
  console.log('Updated', filePath);
}

updateHtml('c:/HealthSync/webapp/frontend/index.html');
updateHtml('c:/HealthSync/webapp/frontend/remote_index.html');
