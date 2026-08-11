const fs = require('fs');
let mainJs = fs.readFileSync('c:/HealthSync/webapp/frontend/js/main.js', 'utf8');

const startStr = 'function renderNextAppointment(appt) {';
const startIndex = mainJs.indexOf(startStr);
if (startIndex !== -1) {
  // Find the end by looking for the next function declaration
  const endIndex = mainJs.indexOf('function fetchHealthRecords()', startIndex);
  if (endIndex !== -1) {
    const oldBlock = mainJs.substring(startIndex, endIndex);
    
    const newFn = `function renderNextAppointment(appt) {
  const container = document.getElementById('patient-dashboard-upcoming-appt');
  if (!container) return;
  if (!appt) {
    container.innerHTML = \`
      <div class="new-card upcoming-card" style="align-items: center; justify-content: center; min-height: 120px; text-align: center; border-style: dashed; padding: 24px;">
        <i class="fa-regular fa-calendar-xmark" style="font-size: 24px; color: var(--text-muted); margin-bottom: 8px;"></i>
        <p style="font-size: 14px; color: var(--text-muted); margin: 0 0 12px 0;">No upcoming appointment</p>
        <button class="btn btn-primary btn-sm" onclick="switchPatientPage('doctors')">Book Appointment</button>
      </div>\`;
    return;
  }

  const dateObj = new Date(\`\${appt.slot_date}T12:00:00\`);
  const displayDate = Number.isNaN(dateObj.getTime()) ? appt.slot_date : \`\${dateObj.getDate()} \${dateObj.toLocaleDateString('en-IN', { month: 'short' })} \${dateObj.getFullYear()}\`;
  const docName = appt.doctor_name || appt.doctorName || appt.doctor || 'HealthSync Doctor';
  const clinic = appt.clinic_name || appt.clinic || appt.hospital_name || 'City Heart Clinic';

  const statusStr = String(appt.status).toUpperCase();
  const isVideo = appt.type === 'video' || appt.appointment_type === 'video' || String(appt.mode).toLowerCase() === 'video';
  const timeStr = appt.slot_time || appt.time || '05:00 PM';
  
  let consultationBtn = '';
  if (isVideo) {
    if (['CHECKED IN', 'WAITING', 'IN PROGRESS', 'ACTIVE', 'JOINED', 'CONFIRMED'].includes(statusStr)) {
      consultationBtn = \`<button class="btn btn-primary flex-1" onclick="if(typeof joinConsultation==='function') joinConsultation('\${appt.id}'); else alert('Consultation starting soon!');"><i class="fa-solid fa-video" style="margin-right: 8px;"></i> Join Consultation</button>\`;
    } else {
      consultationBtn = \`<button class="btn btn-primary flex-1" disabled style="opacity: 0.6; cursor: not-allowed;"><i class="fa-solid fa-video" style="margin-right: 8px;"></i> Available at \${timeStr}</button>\`;
    }
  } else {
    consultationBtn = \`<button class="btn btn-primary flex-1"><i class="fa-solid fa-diamond-turn-right" style="margin-right: 8px;"></i> Get Directions</button>\`;
  }

  container.innerHTML = \`
    <div class="new-card upcoming-card">
      <div class="new-card-header">
        <div class="header-title">
          <div class="icon-box-purple"><i class="fa-regular fa-calendar-check" style="color: #7c3aed; font-size: 16px;"></i></div>
          <span class="fw-bold text-dark" style="font-size: 15px;">Upcoming Appointment</span>
        </div>
        <button class="icon-btn-small" style="color: #94a3b8; background: transparent; border: none; font-size: 16px;"><i class="fa-solid fa-ellipsis-vertical"></i></button>
      </div>
      
      <div class="upcoming-doctor-info">
        <img src="https://ui-avatars.com/api/?name=\${encodeURIComponent(docName)}&background=random" alt="Doctor" class="doc-avatar-lg">
        <div class="doc-details">
          <h4 class="fw-bold text-dark m-0" style="font-size: 16px;">\${escapeHtml(docName)}</h4>
          <div class="doc-specialty text-muted" style="font-size: 13px; margin-top: 2px;">\${appt.specialty || 'General Physician'}</div>
          <div class="doc-location text-muted mt-1" style="font-size: 12px; margin-top: 6px;"><i class="fa-solid fa-location-dot" style="margin-right: 4px;"></i> \${escapeHtml(clinic)}</div>
        </div>
      </div>
      
      <div class="upcoming-datetime">
        <div class="dt-item"><i class="fa-regular fa-calendar" style="margin-right: 6px;"></i> \${displayDate}</div>
        <div class="dt-dot" style="margin: 0 12px; font-size: 20px; line-height: 0;">&bull;</div>
        <div class="dt-item"><i class="fa-regular fa-clock" style="margin-right: 6px;"></i> \${timeStr}</div>
        <div class="status-pill green-pill ml-auto">\${escapeHtml(appt.status || 'Confirmed')}</div>
      </div>
      
      <div class="upcoming-actions">
        <button class="btn btn-outline flex-1" onclick="if(typeof viewAppointmentDetails==='function') viewAppointmentDetails('\${appt.id}')">View Details</button>
        \${consultationBtn}
      </div>
    </div>\`;
}

`;
    mainJs = mainJs.substring(0, startIndex) + newFn + mainJs.substring(endIndex);
    fs.writeFileSync('c:/HealthSync/webapp/frontend/js/main.js', mainJs);
    console.log('Successfully replaced renderNextAppointment via string slice');
  } else {
    console.log('Could not find fetchHealthRecords after renderNextAppointment');
  }
} else {
  console.log('Could not find renderNextAppointment');
}
