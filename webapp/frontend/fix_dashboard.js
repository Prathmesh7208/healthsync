const fs = require('fs');
const path = require('path');

const cssPath = 'c:/HealthSync/webapp/frontend/style.css';
let css = fs.readFileSync(cssPath, 'utf8');

// Fix search bar centering in CSS
css = css.replace(/\.new-top-header \{[\s\S]*?\}/, `.new-top-header {
    display: flex;
    align-items: center;
    background: #ffffff;
    border-bottom: none;
    padding: 0 32px;
    justify-content: space-between;
    position: relative;
  }`);

css = css.replace(/\.new-search-bar \{[\s\S]*?\}/, `.new-search-bar {
    display: flex;
    align-items: center;
    background: #f1f5f9;
    border-radius: 100px;
    width: 460px;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }`);

// Make sure hamburger menu button matches screenshot (round light gray)
css = css.replace(/\.mobile-menu-btn \{[\s\S]*?\}/, `.mobile-menu-btn {
    background: #f8fafc;
    border: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #475569;
    cursor: pointer;
    transition: all 0.2s;
  }
  .mobile-menu-btn:hover { background: #f1f5f9; }`);

fs.writeFileSync(cssPath, css);


const files = [
  'c:/HealthSync/webapp/frontend/index.html',
  'c:/HealthSync/webapp/frontend/remote_index.html'
];

const dashboardReplacement = `
            <!-- 1. Patient Dashboard Page -->
            <div id="patient-page-dashboard" class="page active" style="padding-top: 16px;">
              <div class="new-dashboard-header" style="margin-bottom: 24px;">
                <h2 class="page-heading" style="font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">Hello, <span id="patient-dashboard-name">New</span> 👋</h2>
                <p class="page-subheading" style="color: #64748b; font-size: 15px;">How can we help you today?</p>
              </div>

              <!-- Top Row: Upcoming & Quick Actions -->
              <div class="new-dash-row-1">
                <!-- Upcoming Appointment Card -->
                <div id="patient-dashboard-upcoming-appt"></div>
                
                <!-- Quick Actions Card -->
                <div class="new-card quick-actions-card">
                  <div class="new-card-header mb-3" style="padding-bottom: 8px;">
                    <span class="fw-bold text-dark" style="font-size: 15px;">Quick Actions</span>
                  </div>
                  <div class="quick-actions-grid">
                    <div class="qa-item" onclick="switchPatientPage('doctors')">
                      <div class="qa-icon-box qa-purple"><i class="fa-solid fa-calendar-plus text-purple"></i></div>
                      <div class="qa-text">Book<br>Appointment</div>
                    </div>
                    <div class="qa-item" onclick="switchPatientPage('appointments')">
                      <div class="qa-icon-box qa-green"><i class="fa-solid fa-calendar-check text-green"></i></div>
                      <div class="qa-text">My<br>Appointments</div>
                    </div>
                    <div class="qa-item" onclick="switchPatientPage('health-records')">
                      <div class="qa-icon-box" style="background:#fce7f3;"><i class="fa-solid fa-file-lines" style="color:#d946ef;"></i></div>
                      <div class="qa-text">Health<br>Records</div>
                    </div>
                    <div class="qa-item" onmousedown="startSOSCountdown()" onmouseup="cancelSOSCountdown()">
                      <div class="qa-icon-box qa-red"><span style="font-weight: 800; font-size: 16px; color: #ef4444;">SOS</span></div>
                      <div class="qa-text">Emergency<br>SOS</div>
                    </div>
                    <div class="qa-item" onclick="openPortalTool('patient', 'ambulance')">
                      <div class="qa-icon-box" style="background:#e0f2fe;"><i class="fa-solid fa-truck-medical" style="color:#0284c7;"></i></div>
                      <div class="qa-text">Book<br>Ambulance</div>
                    </div>
                    <div class="qa-item" onclick="openPortalTool('patient', 'upload')">
                      <div class="qa-icon-box qa-orange"><i class="fa-solid fa-cloud-arrow-up text-orange"></i></div>
                      <div class="qa-text">Upload<br>Report</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Row 2: Medicine Reminder -->
              <div class="new-card medicine-card mt-4">
                <div class="new-card-header">
                  <div class="header-title">
                    <div class="icon-box-purple" style="background: #f3e8ff;"><i class="fa-solid fa-capsules" style="color: #9333ea;"></i></div>
                    <span class="fw-bold text-dark" style="font-size: 15px;">Medicine Reminder</span>
                  </div>
                  <a href="#" class="text-blue text-sm fw-bold" style="text-decoration: none;">View All</a>
                </div>
                
                <div class="medicine-box mt-3">
                  <div class="med-info">
                    <div class="med-next fw-bold text-dark" style="font-size: 14px;">Next Dose in <span class="text-orange" style="color: #f59e0b;">1h 30m</span></div>
                    <h4 class="fw-bold text-dark mt-2" style="font-size: 16px;">Amlodipine 5mg</h4>
                    <div class="text-muted text-sm mt-1" style="font-size: 13px;">1 Tablet &bull; After Breakfast</div>
                    <div class="text-blue fw-bold text-sm mt-3" style="color: #4f46e5;"><i class="fa-regular fa-clock" style="margin-right: 4px;"></i> 08:00 AM</div>
                  </div>
                  <div class="med-icon-big">
                    <div class="pill-illustration">
                      <div style="background: #e0e7ff; width: 60px; height: 60px; border-radius: 16px; display: flex; align-items: center; justify-content: center; position: relative;">
                         <i class="fa-solid fa-pills" style="color: #f43f5e; font-size: 28px; transform: rotate(-30deg);"></i>
                      </div>
                    </div>
                  </div>
                  <button class="btn btn-primary med-btn" style="border-radius: 8px; padding: 0 24px; font-weight: 600;">Mark as Taken</button>
                </div>
              </div>

              <!-- Health Insights Banner -->
              <div class="new-card tip-banner mt-4" style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);">
                <div class="tip-content">
                  <div class="tip-text-col">
                    <h4 class="fw-bold text-dark" style="font-size: 16px; margin-bottom: 8px;">Stay Hydrated! 💧</h4>
                    <p class="tip-text text-muted m-0" style="font-size: 14px;">Drinking water helps maintain the balance of body fluids. Your body is composed of about 60% water.</p>
                  </div>
                  <div class="tip-glass-illustration">
                    <div style="font-size: 48px;">🥛</div>
                  </div>
                </div>
              </div>

            </div>`;

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Find the patient-page-dashboard block and replace it
    const startIdx = content.indexOf('<div id="patient-page-dashboard"');
    if (startIdx !== -1) {
      // Find the end of this div, it ends where the next page begins: <!-- 2. Doctors Directory --> or <!-- 1. Doctor Dashboard Page -->
      let endIdx = content.indexOf('<!-- 2. Doctors Directory Page -->', startIdx);
      if (endIdx === -1) endIdx = content.indexOf('<!-- 2. Doctors Page -->', startIdx);
      if (endIdx === -1) endIdx = content.indexOf('<!-- 1. Doctor Dashboard Page -->', startIdx);
      
      if (endIdx !== -1) {
        content = content.substring(0, startIdx) + dashboardReplacement.trim() + '\n\n            ' + content.substring(endIdx);
        
        // Also ensure the header has new-top-header in it
        content = content.replace(/<header class="top-header">/g, '<header class="top-header new-top-header">');
        
        fs.writeFileSync(file, content);
        console.log('Successfully updated dashboard in', file);
      }
    }
  }
});
