const fs = require('fs');

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
                <div class="new-card quick-actions-card" style="background: transparent; box-shadow: none; padding: 0;">
                  <div class="new-card-header mb-3" style="padding: 0 4px;">
                    <span class="text-dark" style="font-size: 16px; font-weight: 500;">Quick Actions</span>
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
                      <div class="qa-icon-box" style="background:#fae8ff;"><i class="fa-solid fa-file-lines" style="color:#d946ef;"></i></div>
                      <div class="qa-text">Health<br>Records</div>
                    </div>
                    <div class="qa-item" onmousedown="startSOSCountdown()" onmouseup="cancelSOSCountdown()">
                      <div class="qa-icon-box qa-red" style="background:#fee2e2;"><span style="font-weight: 700; font-size: 15px; color: #ef4444;">SOS</span></div>
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
                    <span class="text-dark" style="font-size: 16px; font-weight: 500;">Medicine Reminder</span>
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
            </div>`;

function inject(inputFile, outputFile) {
  let content = fs.readFileSync(inputFile, 'utf8');
  
  const startIdx = content.indexOf('<div id="patient-page-dashboard"');
  let endIdx = content.indexOf('<!-- 2. Patient Appointments Page -->');
  
  if (startIdx !== -1 && endIdx !== -1) {
    // Replace the dashboard chunk
    content = content.substring(0, startIdx) + dashboardReplacement.trim() + '\n\n              ' + content.substring(endIdx);
    
    // Fix emojis across the whole file
    content = content.replace(/dY`</g, '👋');
    content = content.replace(/dY\'>/g, '🥛');
    content = content.replace(/dY\\?/g, '💧');
    
    // Ensure header has new-top-header
    content = content.replace(/<header class="top-header">/g, '<header class="top-header new-top-header">');
    
    fs.writeFileSync(outputFile, content);
    console.log('Successfully injected perfect dashboard into', outputFile);
  } else {
    console.error('Markers not found in', inputFile);
  }
}

inject('c:/HealthSync/webapp/frontend/index_head1.html', 'c:/HealthSync/webapp/frontend/index.html');
inject('c:/HealthSync/webapp/frontend/remote_index_head1.html', 'c:/HealthSync/webapp/frontend/remote_index.html');

// Also update CSS to match screenshot perfectly
const cssPath = 'c:/HealthSync/webapp/frontend/style.css';
let css = fs.readFileSync(cssPath, 'utf8');

// The screenshot shows qa-items as white cards
css = css.replace(/\.qa-item \{[\s\S]*?\}/, `.qa-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #ffffff;
    border-radius: 16px;
    padding: 24px 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: center;
    border: 1px solid #f1f5f9;
    box-shadow: 0 2px 10px rgba(0,0,0,0.02);
  }`);

// The screenshot shows quick actions container has a very light gray background
css = css.replace(/\.quick-actions-card \{[\s\S]*?\}/, `.quick-actions-card {
    background: transparent;
    border: none;
    box-shadow: none;
    padding: 0;
  }`);
if (!css.includes('.quick-actions-card {')) {
  css += `\n.quick-actions-card { background: #fafafa; border-radius: 20px; padding: 20px; }\n`;
}

css = css.replace(/\.qa-text \{[\s\S]*?\}/, `.qa-text {
    font-size: 13px;
    font-weight: 600;
    color: #334155;
    line-height: 1.3;
  }`);
if (!css.includes('.qa-text {')) {
  css += `\n.qa-text { font-size: 13px; font-weight: 600; color: #334155; line-height: 1.3; }\n`;
}

// In screenshot, search bar has a small search icon and light text
css = css.replace(/\.new-search-input \{[\s\S]*?\}/, `.new-search-input {
    background: transparent;
    border: none;
    padding: 12px 16px;
    width: 100%;
    font-size: 14px;
    color: #334155;
    outline: none;
  }`);
  
fs.writeFileSync(cssPath, css);
console.log('Successfully updated style.css');
