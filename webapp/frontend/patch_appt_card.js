const fs = require('fs');

function patchMainJS(file) {
  if (!fs.existsSync(file)) return;
  
  let js = fs.readFileSync(file, 'utf8');
  
  // Replace the time-badge HTML in renderNextAppointment to use the black dot
  const oldTimeBadge = `<i class="fa-regular fa-clock" style="color: #64748b; margin-right: 6px;"></i> <span style="color: #334155; font-weight: 600; font-size: 14px;">\${appt.time}</span>`;
  const newTimeBadge = `<span style="font-size: 8px; color: #334155; margin-right: 12px; margin-top: 2px;">&#9679;</span>
            <i class="fa-regular fa-clock" style="color: #64748b; margin-right: 6px;"></i> <span style="color: #334155; font-weight: 600; font-size: 14px;">\${appt.time}</span>`;
            
  if (js.includes(oldTimeBadge) && !js.includes('&#9679;')) {
    js = js.replace(oldTimeBadge, newTimeBadge);
  }
  
  // Replace the ui-avatars.com URL to match the exact green color AS
  const oldAvatar = `https://ui-avatars.com/api/?name=\${encodeURIComponent(docName)}&background=random`;
  const newAvatar = `https://ui-avatars.com/api/?name=\${encodeURIComponent(docName)}&background=5a9e46&color=fff`;
  
  if (js.includes(oldAvatar)) {
    js = js.replace(oldAvatar, newAvatar);
  }
  
  fs.writeFileSync(file, js);
  console.log('Patched renderNextAppointment in', file);
}

patchMainJS('c:/HealthSync/webapp/frontend/js/main.js');
patchMainJS('c:/HealthSync/webapp/frontend/js/remote_main.js');
