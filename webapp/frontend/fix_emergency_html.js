const fs = require('fs');
let html = fs.readFileSync('c:/HealthSync/webapp/frontend/index.html', 'utf8');

const quickActionsStart = html.indexOf('<div class="new-card quick-actions-card">');
const quickActionsEnd = html.indexOf('</div>\n              </div>\n\n              <!-- Row 2: Medicine Reminder -->', quickActionsStart);

if (quickActionsStart !== -1 && quickActionsEnd !== -1) {
  let qaHtml = html.substring(quickActionsStart, quickActionsEnd + 6);
  
  // Remove SOS and Ambulance from grid
  qaHtml = qaHtml.replace(/<div class=\"qa-item\" onmousedown=\"startSOSCountdown\(\)\" onmouseup=\"cancelSOSCountdown\(\)\">[\s\S]*?<\/div>\s*<div class=\"qa-item\" onclick=\"openPortalTool\('patient', 'ambulance'\)\">[\s\S]*?<\/div>/, '');
  
  // Create new Emergency card
  const emergencyHtml = `
                <!-- Emergency Actions -->
                <div class="new-card emergency-actions-card mt-3">
                  <div class="new-card-header mb-3" style="padding-bottom: 8px;">
                    <span class="fw-bold text-dark" style="font-size: 15px;">Emergency Services</span>
                  </div>
                  <div style="display: flex; gap: 12px;">
                    <button class="btn flex-1" style="background-color: #fef2f2; border: 1px solid #fecaca; color: #dc2626; font-weight: 600; min-height: 44px; padding: 0;" onmousedown="startSOSCountdown()" onmouseup="cancelSOSCountdown()">
                      <span style="font-weight: 800; margin-right: 6px; font-size: 13px;">SOS</span> Emergency
                    </button>
                    <button class="btn flex-1" style="background-color: #eff6ff; border: 1px solid #bfdbfe; color: #2563eb; font-weight: 600; min-height: 44px; padding: 0;" onclick="openPortalTool('patient', 'ambulance')">
                      <i class="fa-solid fa-truck-medical" style="margin-right: 6px;"></i> Ambulance
                    </button>
                  </div>
                </div>`;
  
  html = html.substring(0, quickActionsStart) + qaHtml + '\n' + emergencyHtml + html.substring(quickActionsEnd + 6);
  fs.writeFileSync('c:/HealthSync/webapp/frontend/index.html', html);
  console.log('Fixed Emergency Actions HTML');
} else {
  console.log('Could not find Quick Actions bounds');
}
