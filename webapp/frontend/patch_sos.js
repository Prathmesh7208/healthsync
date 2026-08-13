const fs = require('fs');

let jsFile = 'c:/HealthSync/webapp/frontend/js/remote_main.js';
let jsContent = fs.readFileSync(jsFile, 'utf8');

// 1. Update startSOSCountdown and cancelSOSCountdown
jsContent = jsContent.replace(
  `window.startSOSCountdown = function() {`,
  `window.startSOSCountdown = function(e) {\n      if (e && e.cancelable) e.preventDefault();`
);

jsContent = jsContent.replace(
  `window.cancelSOSCountdown = function() {`,
  `window.cancelSOSCountdown = function(e) {\n      if (e && e.cancelable) e.preventDefault();`
);

// 2. Add socket listeners
const socketListeners = `
  // ── SOS Socket Listeners ──────────────────────────────────────────────────
  if (typeof appSocket !== 'undefined' && appSocket) {
    appSocket.on('sos_alert', (data) => {
      // Show on Reception Dashboard
      const recPanel = document.getElementById('rec-emergency-panel');
      const recList = document.getElementById('rec-emergency-list');
      if (recPanel && recList) {
        recPanel.classList.remove('hidden');
        const alertHtml = \`
          <div id="alert-\${data.caseId}" class="grid-3" style="gap: 24px; align-items: center; background: white; padding: 16px; border-radius: 8px; box-shadow: var(--shadow-sm); border: 1px solid #fecaca; margin-bottom: 12px;">
            <div>
              <div style="font-size: 16px; font-weight: 700; color: #1e293b;">\${data.patientName || 'Patient'}</div>
              <div style="font-size: 13px; color: var(--text-muted);"><i class="fa-solid fa-phone"></i> \${data.phone || 'N/A'}</div>
            </div>
            <div>
              <div style="font-size: 13px; color: #ef4444; font-weight: 600;"><i class="fa-solid fa-location-dot"></i> Live Location Received</div>
              <a href="https://www.google.com/maps/search/?api=1&query=\${data.lat},\${data.lng}" target="_blank" style="font-size: 12px; color: #3b82f6; text-decoration: underline;">View on Maps</a>
            </div>
            <div style="text-align: right;">
              <button class="btn btn-primary" onclick="dispatchAmbulance('\${data.caseId}')" style="background: #dc2626; border-color: #dc2626; color: white;">Dispatch Ambulance</button>
            </div>
          </div>
        \`;
        recList.insertAdjacentHTML('afterbegin', alertHtml);
      }

      // Show on Ambulance Dashboard
      const ambPanel = document.getElementById('amb-emergency-panel');
      const ambList = document.getElementById('amb-emergency-list');
      if (ambPanel && ambList) {
        ambPanel.classList.remove('hidden');
        const ambAlertHtml = \`
          <div id="amb-alert-\${data.caseId}" style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #fecaca;">
            <div style="font-size: 16px; font-weight: 700;">\${data.patientName || 'Patient'}</div>
            <div style="font-size: 13px; color: #64748b; margin-bottom: 8px;"><i class="fa-solid fa-phone"></i> \${data.phone || 'N/A'}</div>
            <a href="https://www.google.com/maps/search/?api=1&query=\${data.lat},\${data.lng}" target="_blank" class="btn btn-outline btn-block mb-2"><i class="fa-solid fa-map-location-dot"></i> View on Maps</a>
            <div style="font-size: 12px; font-weight: bold; color: #b91c1c;" id="amb-status-\${data.caseId}">Status: Pending Dispatch</div>
          </div>
        \`;
        ambList.insertAdjacentHTML('afterbegin', ambAlertHtml);
      }
    });

    appSocket.on('emergency_location_update', (data) => {
      console.log('Location updated for case', data.caseId);
      // Optional: update coordinates in UI if needed
    });

    appSocket.on('sos_status_update', (data) => {
      const ambStatus = document.getElementById(\`amb-status-\${data.caseId}\`);
      if (ambStatus) {
        ambStatus.textContent = \`Status: \${data.status}\`;
      }
      if (data.status === 'Resolved') {
        const recAlert = document.getElementById(\`alert-\${data.caseId}\`);
        if (recAlert) recAlert.remove();
        const ambAlert = document.getElementById(\`amb-alert-\${data.caseId}\`);
        if (ambAlert) ambAlert.remove();
      }
    });
    
    appSocket.on('ambulance_dispatched', (data) => {
       const ambStatus = document.getElementById(\`amb-status-\${data.caseId}\`);
       if (ambStatus) {
         ambStatus.textContent = 'Status: Ambulance Dispatched (Assigned to you)';
       }
       if (typeof showToast === 'function') showToast('You have been dispatched to an emergency!', 'success');
    });
  }

  // Global dispatch function for receptionist
  window.dispatchAmbulance = function(caseId) {
    if (typeof appSocket !== 'undefined' && appSocket) {
      appSocket.emit('dispatch_ambulance', { caseId, hospitalId: 'hosp1' });
      if (typeof showToast === 'function') showToast('Ambulance dispatched!', 'success');
      const btn = document.querySelector(\`#alert-\${caseId} button\`);
      if (btn) {
        btn.textContent = 'Dispatched';
        btn.disabled = true;
        btn.style.background = '#64748b';
        btn.style.borderColor = '#64748b';
      }
    }
  };
`;

if (!jsContent.includes('sos_alert')) {
  // Insert at the end of the file
  jsContent += '\n' + socketListeners;
  fs.writeFileSync(jsFile, jsContent);
  console.log("Updated remote_main.js with touch events and socket listeners.");
} else {
  console.log("Already updated.");
}
