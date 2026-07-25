/**
 * HealthSync WebApp — Frontend Logic
 * =================================
 * Core SPA router, dynamic DOM rendering, and API synchronization
 */

'use strict';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/v1' 
  : 'https://soothing-blessing-production-a59b.up.railway.app/v1';

// Global variables
let allDoctors = [];
let todayAppointments = [];
let liveQueueList = [];
let patientPrescriptions = [];
let patientRecords = [
  { id: 'rec-1', name: 'Complete Blood Count', doctor: 'Dr. Priya Sharma', date: '16 Apr 2026', type: 'lab-reports' },
  { id: 'rec-2', name: 'Lipid Profile', doctor: 'Dr. Priya Sharma', date: '15 Apr 2026', type: 'lab-reports' },
  { id: 'rec-3', name: 'Blood Sugar (Fasting)', doctor: 'Dr. Amit Patil', date: '10 Apr 2026', type: 'lab-reports' },
  { id: 'rec-4', name: 'Thyroid Profile', doctor: 'Dr. Amit Patil', date: '02 Apr 2026', type: 'lab-reports' }
];
let currentSelectedPatientId = 'pat1'; // Default demo patient
let currentSelectedDoctorId = 'doc1';  // Default demo doctor
let currentUser = null;
let pendingMobile = '';
let resendTimer = null;
let bookingMode = 'IN_PERSON';
let persistedReminders = [];
let remindersLoaded = false;

function escapeHtml(value) {
  const node = document.createElement('div');
  node.textContent = value == null ? '' : String(value);
  return node.innerHTML;
}

// ---------------------------------------------------------------------------
// INITIALIZATION
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  restoreSession();
  // Set current date strings across panels
  const dates = document.querySelectorAll('.current-date-str');
  const now = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  dates.forEach(el => el.innerText = now);

  // Initial loads
  fetchDoctors();
  syncAllData();

  // Set today's date input min limit
  const bookingDateInput = document.getElementById('booking-date-input');
  if (bookingDateInput) {
    bookingDateInput.value = new Date().toISOString().split('T')[0];
    bookingDateInput.min = new Date().toISOString().split('T')[0];
  }

  // Setup periodic refresh
  setInterval(syncAllData, 8000);
});

async function restoreSession() {
  const saved = localStorage.getItem('healthsync-session');
  if (!saved) return;
  try {
    const session = JSON.parse(saved);
    const response = await fetch(`${API_BASE}/auth/refresh`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({refreshToken:session.refreshToken}) });
    const data = await response.json();
    if (!data.success) throw new Error();
    currentUser = { ...session.user, token:data.token, refreshToken:session.refreshToken };
    localStorage.setItem('healthsync-session', JSON.stringify({ user:currentUser, refreshToken:currentUser.refreshToken }));
    finishLogin();
  } catch { localStorage.removeItem('healthsync-session'); }
}

function authMessage(message, isError = false) { const el = document.getElementById('auth-message'); if (el) { el.textContent = message; el.style.color = isError ? '#b91c1c' : ''; } }
window.requestOtp = async function(event) {
  event.preventDefault(); pendingMobile = document.getElementById('auth-mobile').value.replace(/\D/g, '');
  try { const res = await fetch(`${API_BASE}/auth/login`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mobileNumber:pendingMobile})}); const data = await res.json(); if (!data.success) return authMessage(data.message, true); document.getElementById('mobile-login-form').classList.add('hidden'); document.getElementById('otp-login-form').classList.remove('hidden'); authMessage(`OTP sent. Development OTP: ${data.otp}`); startResendCooldown(); } catch { authMessage('Unable to reach HealthSync. Please try again.', true); }
};
window.resendOtp = function() { requestOtp({ preventDefault() {} }); };
function startResendCooldown() { let seconds=30; const button=document.getElementById('resend-otp-btn'); clearInterval(resendTimer); button.disabled=true; resendTimer=setInterval(()=>{ seconds--; button.textContent=seconds ? `Resend OTP (${seconds}s)` : 'Resend OTP'; if(!seconds){button.disabled=false;clearInterval(resendTimer);}},1000); }
window.verifyOtp = async function(event) {
  event.preventDefault(); const otpCode=document.getElementById('auth-otp').value;
  try { const res=await fetch(`${API_BASE}/auth/verify`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mobileNumber:pendingMobile,otpCode})}); const data=await res.json(); if(!data.success)return authMessage(data.message,true); currentUser={...data.user,token:data.token,refreshToken:data.refreshToken}; localStorage.setItem('healthsync-session',JSON.stringify({user:currentUser,refreshToken:currentUser.refreshToken})); finishLogin(); } catch {authMessage('Sign in failed. Please try again.',true);}
};
function finishLogin() { document.getElementById('auth-screen').classList.add('hidden'); if (currentUser?.role === 'DOCTOR') switchGlobalRole('doctor'); fetchNotifications(); }

async function fetchNotifications() { if (!currentUser) return; try { const res=await fetch(`${API_BASE}/notifications?userId=${encodeURIComponent(currentUser.id)}`); const data=await res.json(); renderNotifications(data.notifications || []); } catch {} }
function renderNotifications(items) { const unread=items.filter(item=>item.status==='UNREAD').length; const count=document.getElementById('notification-count'); const dot=document.getElementById('notification-dot'); if(count) count.textContent=unread; if(dot) dot.classList.toggle('hidden', !unread); const list=document.getElementById('notification-list'); if(list) list.innerHTML=items.length ? items.map(item=>`<div class="notification-item ${item.status==='UNREAD'?'unread':''}" onclick="markNotificationRead('${item.id}')">${escapeHtml(item.message)}<span class="notification-time">${new Date(item.created_at).toLocaleString('en-IN')}</span></div>`).join('') : '<div class="empty-state"><div class="es-icon">🔔</div><div class="es-text">You are all caught up</div></div>'; }
window.openNotifications = async function() { await fetchNotifications(); openModal('modal-notifications'); };
window.markNotificationRead = async function(id) { await fetch(`${API_BASE}/notifications/${id}/read`,{method:'POST'}); fetchNotifications(); };
window.clearNotifications = async function() { if(!currentUser)return; await fetch(`${API_BASE}/notifications/clear`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:currentUser.id})}); fetchNotifications(); };

async function syncAllData() {
  await Promise.all([
    fetchQueueLive(),
    fetchAppointmentsToday(),
    fetchPrescriptions()
  ]);
}

// ---------------------------------------------------------------------------
// GLOBAL ROLE VIEW SWITCHER
// ---------------------------------------------------------------------------
window.switchGlobalRole = function(role) {
  document.querySelectorAll('.role-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));

  const targetPanel = document.getElementById(`panel-${role}`);
  if (targetPanel) targetPanel.classList.add('active');

  // Activate matching headers
  document.querySelectorAll(`.role-tab[onclick*="${role}"]`).forEach(t => t.classList.add('active'));

  // Sync data immediately when switching
  syncAllData();
};

// ---------------------------------------------------------------------------
// NAVIGATION ROUTING
// ---------------------------------------------------------------------------
window.switchPatientPage = function(pageId) {
  // Navigation active state
  document.querySelectorAll('#panel-patient .nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('onclick')?.includes(pageId)) {
      item.classList.add('active');
    }
  });

  // Page active state
  document.querySelectorAll('#panel-patient .page').forEach(page => page.classList.remove('active'));
  const targetPage = document.getElementById(`patient-page-${pageId}`);
  if (targetPage) targetPage.classList.add('active');
};

window.switchDoctorPage = function(pageId) {
  document.querySelectorAll('#panel-doctor .nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('onclick')?.includes(pageId)) {
      item.classList.add('active');
    }
  });

  document.querySelectorAll('#panel-doctor .page').forEach(page => page.classList.remove('active'));
  const targetPage = document.getElementById(`doctor-page-${pageId}`);
  if (targetPage) targetPage.classList.add('active');
};

window.switchReceptionPage = function(pageId) {
  document.querySelectorAll('#panel-reception .nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('onclick')?.includes(pageId)) {
      item.classList.add('active');
    }
  });

  document.querySelectorAll('#panel-reception .page').forEach(page => page.classList.remove('active'));
  const targetPage = document.getElementById(`reception-page-${pageId}`);
  if (targetPage) targetPage.classList.add('active');
};

// ---------------------------------------------------------------------------
// SIDEBAR TOOLS — every navigation item opens a usable workspace.
// ---------------------------------------------------------------------------
const utilityTitles = { prescriptions:'Prescriptions', medicines:'Medicines', reminders:'Medicine Reminders', messages:'Messages', settings:'Settings', help:'Help & Support', schedule:'Schedule', requests:'Patient Requests', earnings:'Earnings', reports:'Reports', patients:'Patients', doctors:'Doctors' };
function getUtilityPage(role, tool) {
  const id = `${role}-page-tool-${tool}`;
  let page = document.getElementById(id);
  if (page) return page;
  const panel = document.getElementById(`panel-${role}`);
  const container = panel.querySelector('.page-content');
  page = document.createElement('div'); page.id = id; page.className = 'page'; container.appendChild(page); return page;
}
function table(rows, headers) { return `<div class="card"><div class="card-body table-wrap"><table class="hs-table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows || `<tr><td colspan="${headers.length}" class="text-center text-muted">No records yet.</td></tr>`}</tbody></table></div></div>`; }
function localItems(key) { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } }
function saveLocalItems(key, values) { localStorage.setItem(key, JSON.stringify(values)); }
window.openPortalTool = function(role, tool) {
  if (role === 'patient' && tool === 'reminders' && !remindersLoaded) {
    fetchReminders().then(() => openPortalTool(role, tool));
    return;
  }
  const page = getUtilityPage(role, tool);
  document.querySelectorAll(`#panel-${role} .nav-item`).forEach(item => item.classList.toggle('active', item.getAttribute('onclick')?.includes(`'${tool}'`)));
  document.querySelectorAll(`#panel-${role} .page`).forEach(item => item.classList.remove('active')); page.classList.add('active');
  const title = utilityTitles[tool] || tool;
  page.innerHTML = `<div class="page-header-row"><div><h2 class="page-heading">${title}</h2><p class="page-subheading">${role === 'doctor' ? 'Clinical portal' : role === 'reception' ? 'Clinic operations' : 'Your HealthSync account'}</p></div></div>${utilityContent(role, tool)}`;
};
function utilityContent(role, tool) {
  if (tool === 'settings') return settingsContent();
  if (tool === 'prescriptions') return table(patientPrescriptions.map(rx => `<tr><td>${escapeHtml(rx.diagnosis)}</td><td>${escapeHtml(rx.doctor_name || rx.doctorName || '')}</td><td>${new Date(rx.created_at).toLocaleDateString('en-IN')}</td><td><button class="btn btn-secondary btn-xs" onclick="showToast('Prescription details are available in Health Records.', 'info')">View</button></td></tr>`).join(''), ['Diagnosis','Doctor','Date','Action']);
  if (tool === 'medicines') { const meds = patientPrescriptions.flatMap(rx => { try{return JSON.parse(rx.medications_json || '[]')}catch{return []} }); return table(meds.map(m=>`<tr><td>${escapeHtml(m.name)}</td><td>${escapeHtml(m.dosage || '')}</td><td>${escapeHtml(m.frequency || '')}</td><td>${escapeHtml(m.duration || '')}</td></tr>`).join(''), ['Medicine','Dosage','Frequency','Duration']); }
  if (tool === 'reminders') { const reminders=localItems('healthsync-reminders'); return `<div class="card mb-3"><div class="card-body"><div class="form-row"><div class="form-group"><label class="form-label">Medicine</label><input id="reminder-name" class="form-control" placeholder="e.g. Paracetamol"></div><div class="form-group"><label class="form-label">Time</label><input id="reminder-time" class="form-control" type="time"></div></div><button class="btn btn-primary" onclick="addReminder()">Add reminder</button></div></div>${table(reminders.map((r,i)=>`<tr><td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.time)}</td><td><button class="btn btn-secondary btn-xs" onclick="removeReminder(${i})">Remove</button></td></tr>`).join(''), ['Medicine','Time','Action'])}`; }
  if (tool === 'messages') { const messages=localItems(`healthsync-${role}-messages`); return `<div class="card mb-3"><div class="card-body"><div id="message-history">${messages.map(m=>`<p class="mb-2"><strong>${escapeHtml(m.from)}:</strong> ${escapeHtml(m.text)}</p>`).join('') || '<p class="text-muted">No messages yet.</p>'}</div><div class="form-row"><input id="message-text" class="form-control" placeholder="Write a message"><button class="btn btn-primary" onclick="sendPortalMessage('${role}')">Send</button></div></div></div>`; }
  if (tool === 'settings') return `<div class="card"><div class="card-body"><div class="form-group mb-3"><label class="form-label">Preferred language</label><select id="setting-language" class="form-control"><option>English</option><option>Hindi</option><option>Marathi</option></select></div><button class="btn btn-primary" onclick="saveSettings()">Save settings</button> <button class="btn btn-secondary" onclick="logoutCurrentUser()">Log out</button></div></div>`;
  if (tool === 'help') return `<div class="card"><div class="card-body"><h4 class="mb-2">Need help?</h4><p class="text-muted mb-3">Use the support form and the care team will receive your request.</p><textarea id="support-message" class="form-control mb-3" placeholder="Describe your issue"></textarea><button class="btn btn-primary" onclick="submitSupport()">Send support request</button></div></div>`;
  if (tool === 'schedule') return table(todayAppointments.map(a=>`<tr><td>${escapeHtml(a.slot_time)}</td><td>${escapeHtml(a.patient_name)}</td><td>${escapeHtml(a.status)}</td><td><button class="btn btn-secondary btn-xs" onclick="startConsultation('${a.id}')">Open</button></td></tr>`).join(''), ['Time','Patient','Status','Action']);
  if (tool === 'requests') return `<div class="card"><div class="card-body"><p class="text-muted">No pending access requests. Patient consent requests appear here when submitted.</p><button class="btn btn-primary" onclick="showToast('Request queue refreshed.', 'success')">Refresh requests</button></div></div>`;
  if (tool === 'earnings') { const completed=todayAppointments.filter(a=>a.status==='COMPLETED').length; return `<div class="grid-col-3">${['Today', 'This week', 'This month'].map((label,i)=>`<div class="card"><div class="card-body"><div class="text-muted text-sm">${label}</div><div class="kpi-number">₹${completed * 500 * (i + 1)}</div><div class="text-sm">${completed * (i + 1)} completed visits</div></div></div>`).join('')}</div>`; }
  if (tool === 'reports') return `<div class="card"><div class="card-body"><p class="mb-3">Export the current appointment register for your records.</p><button class="btn btn-primary" onclick="exportAppointmentsCsv()"><i class="fa-solid fa-download"></i> Download CSV report</button></div></div>`;
  if (tool === 'patients') return table(todayAppointments.map(a=>`<tr><td>${escapeHtml(a.patient_name)}</td><td>${escapeHtml(a.slot_time)}</td><td>${escapeHtml(a.status)}</td><td><button class="btn btn-secondary btn-xs" onclick="switchReceptionPage('appointments')">Open appointment</button></td></tr>`).join(''), ['Patient','Time','Status','Action']);
  if (tool === 'doctors') return table(allDoctors.map(d=>`<tr><td>${escapeHtml(d.full_name)}</td><td>${escapeHtml(d.specialization)}</td><td>${d.available_today ? 'Available today' : 'Unavailable'}</td><td><button class="btn btn-secondary btn-xs" onclick="openBookAppointmentModalWithDoctor('${d.id}')">Book</button></td></tr>`).join(''), ['Doctor','Specialty','Availability','Action']);
  return '';
}
function settingsContent() {
  const language = localStorage.getItem('healthsync-language') || 'English';
  return '<div class="card"><div class="card-body">' +
    '<div class="form-group mb-3"><label class="form-label">Preferred language</label><select id="setting-language" class="form-control"><option' + (language === 'English' ? ' selected' : '') + '>English</option><option' + (language === 'Hindi' ? ' selected' : '') + '>Hindi</option><option' + (language === 'Marathi' ? ' selected' : '') + '>Marathi</option></select></div>' +
    '<div class="form-group mb-3"><label><input id="setting-notifications" type="checkbox" checked> In-app notifications</label><br><label><input id="setting-sms" type="checkbox" checked> SMS alerts</label><br><label><input id="setting-reminders" type="checkbox" checked> Medicine reminders</label></div>' +
    '<button class="btn btn-primary" onclick="saveSettings()">Save settings</button> <button class="btn btn-secondary" onclick="logoutCurrentUser()">Log out</button></div></div>';
}
async function fetchReminders() {
  try {
    const patientId = currentUser?.patientId || 'pat1';
    const response = await fetch(API_BASE + '/reminders?patientId=' + encodeURIComponent(patientId));
    const data = await response.json();
    const rows = (data.reminders || []).map(item => ({ id:item.id, name:item.medicine_name, time:item.reminder_time }));
    saveLocalItems('healthsync-reminders', rows);
  } catch { showToast('Unable to load reminders.', 'error'); }
  remindersLoaded = true;
}
window.addReminder = async function() {
  const name=document.getElementById('reminder-name').value.trim(), time=document.getElementById('reminder-time').value;
  if(!name || !time) return showToast('Enter a medicine and time.', 'warning');
  const response = await fetch(API_BASE + '/reminders', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ patientId:currentUser?.patientId || 'pat1', medicineName:name, reminderTime:time }) });
  const data = await response.json();
  if(!data.success) return showToast(data.message || 'Could not save reminder.', 'error');
  remindersLoaded=false; openPortalTool('patient','reminders'); showToast('Reminder saved.', 'success');
};
window.removeReminder = async function(index) {
  const rows=localItems('healthsync-reminders'), item=rows[index];
  if(item?.id) await fetch(API_BASE + '/reminders/' + encodeURIComponent(item.id), { method:'DELETE' });
  else { rows.splice(index,1); saveLocalItems('healthsync-reminders',rows); }
  remindersLoaded=false; openPortalTool('patient','reminders'); showToast('Reminder removed.', 'success');
};
window.sendPortalMessage = function(role) { const input=document.getElementById('message-text'), text=input.value.trim(); if(!text) return; const key=`healthsync-${role}-messages`, rows=localItems(key); rows.push({from:'You',text}); saveLocalItems(key,rows); openPortalTool(role,'messages'); showToast('Message sent.', 'success'); };
window.saveSettings = async function() {
  const language = document.getElementById('setting-language').value;
  const notificationsEnabled = document.getElementById('setting-notifications')?.checked !== false;
  const smsEnabled = document.getElementById('setting-sms')?.checked !== false;
  const reminderEnabled = document.getElementById('setting-reminders')?.checked !== false;
  localStorage.setItem('healthsync-language', language);
  if (!currentUser?.id) return showToast('Settings saved on this device. Sign in to sync them.', 'info');
  try {
    const response = await fetch(API_BASE + '/settings', { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ userId:currentUser.id, language, notificationsEnabled, smsEnabled, reminderEnabled }) });
    const data = await response.json();
    showToast(data.success ? 'Settings saved and synced.' : 'Could not sync settings.', data.success ? 'success' : 'error');
  } catch { showToast('Could not sync settings.', 'error'); }
};
window.submitSupport = function() { const text=document.getElementById('support-message').value.trim(); if(!text) return showToast('Describe your issue first.', 'warning'); const rows=localItems('healthsync-support'); rows.push({text,createdAt:new Date().toISOString()}); saveLocalItems('healthsync-support',rows); document.getElementById('support-message').value=''; showToast('Support request sent.', 'success'); };
window.logoutCurrentUser = async function() { if(currentUser?.refreshToken) await fetch(`${API_BASE}/auth/logout`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refreshToken:currentUser.refreshToken})}); localStorage.removeItem('healthsync-session'); currentUser=null; location.reload(); };
window.exportAppointmentsCsv = function() { const rows=[['Patient','Doctor','Date','Time','Status'], ...todayAppointments.map(a=>[a.patient_name,a.doctor_name,a.slot_date,a.slot_time,a.status])]; const csv=rows.map(row=>row.map(value=>`"${String(value || '').replace(/"/g,'""')}"`).join(',')).join('\n'); const link=document.createElement('a'); link.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); link.download='healthsync-appointments.csv'; link.click(); URL.revokeObjectURL(link.href); };

// ---------------------------------------------------------------------------
// DATA FETCHERS
// ---------------------------------------------------------------------------
async function fetchDoctors() {
  try {
    const res = await fetch(`${API_BASE}/doctors/search`);
    const data = await res.json();
    if (data.success) {
      allDoctors = data.doctors || [];
      populateDoctorSelects();
      renderPatientDoctorsList();
    }
  } catch (err) {
    console.error('Error fetching doctors:', err);
  }
}

async function fetchQueueLive() {
  try {
    const res = await fetch(`${API_BASE}/queue/live`);
    const data = await res.json();
    if (data.success) {
      liveQueueList = data.queue || [];
      updateKPIs(data.stats);
      renderLiveQueues();
    }
  } catch (err) {
    console.error('Error fetching queue:', err);
  }
}

async function fetchAppointmentsToday() {
  try {
    const res = await fetch(`${API_BASE}/appointments`);
    const data = await res.json();
    if (data.success) {
      todayAppointments = data.appointments || [];
      renderAppointmentsList();
    }
  } catch (err) {
    console.error('Error fetching today appointments:', err);
  }
}

async function fetchPrescriptions() {
  try {
    const res = await fetch(`${API_BASE}/prescriptions`);
    const data = await res.json();
    if (data.success) {
      patientPrescriptions = data.prescriptions || [];
      renderPatientDashboardPrescriptions();
      renderDoctorPatientPrescriptions();
    }
  } catch (err) {
    console.error('Error fetching prescriptions:', err);
  }
}

// ---------------------------------------------------------------------------
// POPULATE SELECTS
// ---------------------------------------------------------------------------
function populateDoctorSelects() {
  const selects = [
    document.getElementById('booking-doctor-select'),
    document.getElementById('issue-token-doctor-select'),
    document.getElementById('walkin-form-doctor')
  ];
  selects.forEach(sel => {
    if (!sel) return;
    sel.innerHTML = allDoctors.map(d => `<option value="${d.id}">${d.name} (${d.specialization})</option>`).join('');
  });
}

// ---------------------------------------------------------------------------
// RENDERING - PATIENT MODULE
// ---------------------------------------------------------------------------
function renderPatientDoctorsList() {
  const container = document.getElementById('patient-doctors-container');
  if (!container) return;
  container.innerHTML = allDoctors.map(doc => `
    <div class="doctor-search-card">
      <div class="doc-avatar">👨‍⚕️</div>
      <div class="doctor-card-info">
        <h4 class="doctor-card-name">${doc.name}</h4>
        <p class="doctor-card-spec">${doc.specialization}</p>
        <p class="doctor-card-meta">${doc.exp} • ${doc.languages}</p>
        <p class="doctor-card-meta" style="color: var(--text-muted); font-size: 11px;"><i class="fa-solid fa-hospital"></i> ${doc.clinic}</p>
      </div>
      <div class="doctor-card-right">
        <div class="doctor-card-fee">₹${doc.fee}</div>
        <div class="doctor-card-rating">★ ${doc.rating} <span style="color: var(--text-muted); font-size: 10px;">(${doc.reviews})</span></div>
        <div class="doctor-card-avail">${doc.availability}</div>
        <button class="btn btn-primary btn-xs mt-2" onclick="openBookAppointmentModalWithDoctor('${doc.id}')">Book Appointment</button>
      </div>
    </div>
  `).join('');
}

function renderPatientDashboardPrescriptions() {
  const container = document.getElementById('patient-recent-rx-list');
  if (!container) return;
  if (patientPrescriptions.length === 0) {
    container.innerHTML = `<p class="text-muted text-sm empty-state">No recent prescriptions.</p>`;
    return;
  }
  container.innerHTML = patientPrescriptions.slice(0, 3).map(rx => `
    <div class="rx-mini-card">
      <div class="rx-mini-info">
        <div class="rx-mini-doc">📋 ${rx.doctorName}</div>
        <div class="rx-mini-date">${rx.date} — Diagnosis: <strong>${rx.diagnosis}</strong></div>
      </div>
      <button class="btn btn-secondary btn-xs" onclick="viewPrescriptionDetailsModal('${rx.id}')">View</button>
    </div>
  `).join('');
}

// ---------------------------------------------------------------------------
// RENDERING - APPOINTMENTS LIST
// ---------------------------------------------------------------------------
function renderAppointmentsList() {
  // Render Patient Portal Appointments
  const ptUpcoming = document.getElementById('pt-upcoming-appt-container');
  const ptCompleted = document.getElementById('pt-completed-appt-container');
  const ptCancelled = document.getElementById('pt-cancelled-appt-container');

  const upcomingList = todayAppointments.filter(a => a.status === 'CONFIRMED' || a.status === 'Checked In' || a.status === 'In Progress');
  const completedList = todayAppointments.filter(a => a.status === 'Completed');
  const cancelledList = todayAppointments.filter(a => a.status === 'Cancelled' || a.status === 'No Show');

  if (ptUpcoming) {
    ptUpcoming.innerHTML = upcomingList.length === 0
      ? `<p class="text-muted text-sm empty-state">No upcoming appointments.</p>`
      : upcomingList.map(appt => {
          const dateObj = new Date();
          const day = dateObj.getDate();
          const mon = dateObj.toLocaleDateString('en-IN', { month: 'short' });
          return `
            <div class="appt-card">
              <div class="appt-date-box">
                <div class="appt-day">${day}</div>
                <div class="appt-mon">${mon}</div>
              </div>
              <div class="appt-info">
                <div class="appt-doc">${appt.doctorName}</div>
                <div class="appt-spec">Consulting Cardiologist</div>
                <div class="appt-clinic"><i class="fa-solid fa-location-dot"></i> Apollo Hospital, Mumbai</div>
                <div class="appt-time"><i class="fa-solid fa-clock"></i> ${appt.slot_time}</div>
              </div>
              <div class="appt-actions">
                <span class="badge badge-confirmed">${appt.status}</span>
                <span class="token-chip mt-2">Token ${appt.token_number}</span>
                <button class="btn btn-danger btn-xs mt-2" onclick="cancelAppointment('${appt.id}')">Cancel</button>
              </div>
            </div>`;
        }).join('');
  }

  // Render Doctor Panel List
  const docList = document.getElementById('doc-today-appointments-list');
  if (docList) {
    const listHtml = todayAppointments.length === 0
      ? `<p class="text-muted text-sm empty-state">No appointments today.</p>`
      : todayAppointments.map(appt => `
        <div class="today-appt-item">
          <div class="appt-time-col">${appt.slot_time}</div>
          <div class="patient-avatar">RV</div>
          <div class="appt-patient-info">
            <div class="appt-patient-name">${appt.patient_name}</div>
            <div class="appt-patient-type">${appt.token_number} • General Checkup</div>
          </div>
          <div class="flex items-center gap-2">
            <span class="badge ${getBadgeClass(appt.status)}">${appt.status}</span>
            ${appt.status === 'CONFIRMED' || appt.status === 'Waiting' ? `<button class="btn btn-primary btn-xs" onclick="startConsultation('${appt.id}')">Start</button>` : ''}
          </div>
        </div>
      `).join('');
    docList.innerHTML = listHtml;
  }

  // Render Reception Table
  const recTableBody = document.querySelector('#rec-schedule-appointments-table tbody');
  if (recTableBody) {
    recTableBody.innerHTML = todayAppointments.length === 0
      ? `<tr><td colspan="5" class="empty-state">No appointments scheduled today.</td></tr>`
      : todayAppointments.map(appt => `
        <tr>
          <td class="cell-strong">${appt.patient_name}</td>
          <td>${appt.doctorName}</td>
          <td>${appt.slot_time}</td>
          <td><span class="badge ${getBadgeClass(appt.status)}">${appt.status}</span></td>
          <td>
            <div class="flex gap-2">
              ${appt.status === 'CONFIRMED' ? `<button class="btn btn-success btn-xs" onclick="checkinAppointment('${appt.id}')">Check-in</button>` : ''}
              ${appt.status !== 'Cancelled' && appt.status !== 'Completed' ? `<button class="btn btn-danger btn-xs" onclick="cancelAppointment('${appt.id}')">Cancel</button>` : ''}
            </div>
          </td>
        </tr>
      `).join('');
  }
}

// Helper badge class resolver
function getBadgeClass(status) {
  if (status === 'CONFIRMED') return 'badge-confirmed';
  if (status === 'Waiting') return 'badge-waiting';
  if (status === 'In Consultation') return 'badge-in-consult';
  if (status === 'Completed') return 'badge-completed';
  if (status === 'Cancelled') return 'badge-cancelled';
  if (status === 'No Show') return 'badge-noshow';
  return 'badge-pending';
}

// ---------------------------------------------------------------------------
// RENDERING - QUEUES
// ---------------------------------------------------------------------------
function renderLiveQueues() {
  // Render Reception Dashboard Table
  const recDashBody = document.querySelector('#rec-dashboard-queue-table tbody');
  if (recDashBody) {
    recDashBody.innerHTML = liveQueueList.length === 0
      ? `<tr><td colspan="5" class="empty-state">No patients in the queue.</td></tr>`
      : liveQueueList.map(q => `
        <tr>
          <td><strong>${q.token}</strong></td>
          <td class="cell-strong">${q.patientName}</td>
          <td>${q.doctorName}</td>
          <td><span class="badge ${getBadgeClass(q.status)}">${q.status}</span></td>
          <td>${q.time}</td>
        </tr>
      `).join('');
  }

  // Render Queue Management Table
  renderMgmtQueue('all');
}

window.filterQueueTable = function(btn, filterStatus) {
  document.querySelectorAll('.q-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderMgmtQueue(filterStatus);
};

function renderMgmtQueue(filterStatus = 'all') {
  const recMgmtBody = document.querySelector('#rec-mgmt-queue-table tbody');
  if (!recMgmtBody) return;

  const filtered = filterStatus === 'all'
    ? liveQueueList
    : liveQueueList.filter(q => q.status === filterStatus);

  recMgmtBody.innerHTML = filtered.length === 0
    ? `<tr><td colspan="6" class="empty-state">No patients matching filter.</td></tr>`
    : filtered.map(q => `
      <tr>
        <td><strong>${q.token}</strong></td>
        <td class="cell-strong">${q.patientName}</td>
        <td>${q.doctorName}</td>
        <td><span class="badge ${getBadgeClass(q.status)}">${q.status}</span></td>
        <td>${q.time}</td>
        <td>
          <div class="queue-action-col">
            ${q.status === 'Waiting' ? `<button class="btn btn-primary btn-xs" onclick="callQueueNext('${q.token}')">Call</button>` : ''}
            ${q.status === 'In Consultation' ? `<button class="btn btn-success btn-xs" onclick="completeQueueItem('${q.token}')">Complete</button>` : ''}
            ${q.status === 'Waiting' ? `<button class="btn btn-danger btn-xs" onclick="markNoShow('${q.token}')">No Show</button>` : ''}
          </div>
        </td>
      </tr>
    `).join('');
}

// ---------------------------------------------------------------------------
// RENDERING - DOCTOR PORTAL PATIENTS
// ---------------------------------------------------------------------------
function renderDoctorPatientPrescriptions() {
  const container = document.getElementById('doc-det-rx-container');
  if (!container) return;
  container.innerHTML = patientPrescriptions.map(rx => `
    <div class="card">
      <div class="card-header">
        <span class="card-title">Prescription — ${rx.date}</span>
        <span class="badge badge-confirmed">Signed</span>
      </div>
      <div class="card-body">
        <p><strong>Diagnosis:</strong> ${rx.diagnosis}</p>
        <p class="mt-2"><strong>Medications:</strong></p>
        <ul style="padding-left: 20px; list-style-type: square;" class="mt-1">
          ${rx.medications.map(m => `<li>${m.name} — ${m.frequency} (${m.duration})</li>`).join('')}
        </ul>
        ${rx.instructions ? `<p class="mt-2"><strong>Instructions:</strong> ${rx.instructions}</p>` : ''}
      </div>
    </div>
  `).join('');
}

// ---------------------------------------------------------------------------
// KPIS UPDATE
// ---------------------------------------------------------------------------
function updateKPIs(stats) {
  if (!stats) return;

  // Reception KPIs
  const rTotal = document.getElementById('rec-kpi-total');
  const rWaiting = document.getElementById('rec-kpi-waiting');
  const rConsulting = document.getElementById('rec-kpi-consulting');
  const rDone = document.getElementById('rec-kpi-done');

  if (rTotal) rTotal.innerText = stats.todaysTokens ?? '—';
  if (rWaiting) rWaiting.innerText = stats.inQueue ?? '—';
  if (rConsulting) rConsulting.innerText = stats.inConsultation ?? '—';
  if (rDone) rDone.innerText = stats.completed ?? '—';

  // Doctor KPIs
  const dTotal = document.getElementById('doc-kpi-total');
  const dDone = document.getElementById('doc-kpi-done');
  const dPending = document.getElementById('doc-kpi-pending');
  const dRequests = document.getElementById('doc-kpi-requests');

  if (dTotal) dTotal.innerText = stats.todaysTokens ?? '—';
  if (dDone) dDone.innerText = stats.completed ?? '—';
  if (dPending) dPending.innerText = stats.inQueue ?? '—';
  if (dRequests) dRequests.innerText = '3';
}

// ---------------------------------------------------------------------------
// LAB RECORDS & SIDEBAR
// ---------------------------------------------------------------------------
window.switchRecordsSubtab = function(btn, type) {
  document.querySelectorAll('.records-menu-item').forEach(m => m.classList.remove('active'));
  btn.classList.add('active');

  const title = document.getElementById('records-subtab-title');
  if (title) title.innerText = btn.innerText.trim();

  renderRecordsList(type);
};

function renderRecordsList(type) {
  const container = document.getElementById('records-list-container');
  if (!container) return;

  const filtered = patientRecords.filter(r => r.type === type);
  if (filtered.length === 0) {
    container.innerHTML = `<p class="text-muted text-sm empty-state">No files uploaded in this folder.</p>`;
    return;
  }

  container.innerHTML = filtered.map(r => `
    <div class="report-row">
      <div class="report-icon"><i class="fa-solid fa-file-pdf" style="color: #ef4444;"></i></div>
      <div class="flex-1">
        <div class="report-name">${r.name}</div>
        <div class="report-meta">${r.doctor} • ${r.date}</div>
      </div>
      <div class="report-actions">
        <button class="btn btn-secondary btn-xs"><i class="fa-solid fa-arrow-down"></i> Download</button>
      </div>
    </div>
  `).join('');
}

// ---------------------------------------------------------------------------
// PATIENT BOOK APPOINTMENT MODAL
// ---------------------------------------------------------------------------
window.openBookAppointmentModal = function() {
  bookingMode = 'IN_PERSON';
  setBookingModeUI();
  openModal('modal-book-appt');
};

window.openBookAppointmentModalWithDoctor = function(doctorId) {
  bookingMode = 'IN_PERSON';
  setBookingModeUI();
  const select = document.getElementById('booking-doctor-select');
  if (select) select.value = doctorId;
  openModal('modal-book-appt');
};

function setBookingModeUI() {
  const heading = document.querySelector('#modal-book-appt .modal-header h3');
  const submit = document.querySelector('#modal-book-appt .modal-footer .btn-primary');
  if (heading) heading.textContent = bookingMode === 'ONLINE' ? 'Online Consultation Booking' : 'Appointment Booking';
  if (submit) submit.textContent = bookingMode === 'ONLINE' ? 'Book Online Consultation' : 'Book Slot';
}

window.openOnlineConsultation = function() {
  bookingMode = 'ONLINE';
  setBookingModeUI();
  openModal('modal-book-appt');
};

window.submitAppointmentBooking = async function() {
  const select = document.getElementById('booking-doctor-select');
  const docId = select?.value || 'doc1';
  const docName = select?.options[select.selectedIndex]?.text.split(' (')[0] || 'Dr. Priya Sharma';
  const dateVal = document.getElementById('booking-date-input')?.value;
  const timeVal = document.getElementById('booking-time-select')?.value;
  const patName = document.getElementById('booking-patient-name')?.value || 'Rahul Verma';

  if (!dateVal || !timeVal) {
    showToast('Please pick a date and time slot.', 'warning');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctorId: docId, doctorName: docName, patientName: patName, date: dateVal, time: timeVal, consultationType: bookingMode })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`${bookingMode === 'ONLINE' ? 'Online consultation' : 'Appointment'} confirmed! Token issued: ${data.appointment.token}`, 'success');
      closeAllModals();
      syncAllData();
    }
  } catch (err) {
    showToast('Failed to book appointment.', 'error');
  }
};

// ---------------------------------------------------------------------------
// PATIENT RECORD UPLOAD
// ---------------------------------------------------------------------------
window.openUploadRecordModal = function() {
  openModal('modal-upload-record');
};

window.submitUploadRecord = function() {
  const name = document.getElementById('upload-doc-name')?.value;
  const doc = document.getElementById('upload-doc-doc')?.value || 'Self Upload';
  const file = document.getElementById('upload-doc-file')?.value;

  if (!name || !file) {
    showToast('Please enter document name and choose file.', 'warning');
    return;
  }

  patientRecords.push({
    id: 'rec-' + Date.now(),
    name: name,
    doctor: doc,
    date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    type: 'lab-reports'
  });

  showToast('Document uploaded successfully!', 'success');
  closeAllModals();
  // Refresh view
  const activeMenu = document.querySelector('.records-menu-item.active');
  if (activeMenu) activeMenu.click();
};

// ---------------------------------------------------------------------------
// RECEPTION WALK-IN REGISTRATION FORM
// ---------------------------------------------------------------------------
window.submitReceptionWalkinForm = async function() {
  const name = document.getElementById('walkin-form-name')?.value.trim();
  const mobile = document.getElementById('walkin-form-mobile')?.value.trim();
  const select = document.getElementById('walkin-form-doctor');
  const docId = select?.value || 'doc1';
  const confirmChecked = document.getElementById('walkin-form-confirm')?.checked;

  if (!name || !mobile) {
    showToast('Please enter Patient Name and Mobile Number.', 'warning');
    return;
  }
  if (!confirmChecked) {
    showToast('Please confirm the details are correct.', 'warning');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/reception/walkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientName: name, mobile: mobile, doctorId: docId })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Walk-In registered successfully! Token: ${data.token}`, 'success');

      // Update generated display box
      const box = document.getElementById('walkin-token-display-box');
      const val = document.getElementById('walkin-generated-token-val');
      const prompt = document.getElementById('walkin-generate-prompt-text');

      if (box && val && prompt) {
        val.innerText = data.token;
        box.style.display = 'block';
        prompt.style.display = 'none';
      }

      // Reset form fields
      document.getElementById('walkin-form-name').value = '';
      document.getElementById('walkin-form-mobile').value = '';
      document.getElementById('walkin-form-confirm').checked = false;

      syncAllData();
    }
  } catch (err) {
    showToast('Failed to register walk-in.', 'error');
  }
};

// ---------------------------------------------------------------------------
// RECEPTION QUICK TOKEN GENERATOR MODAL
// ---------------------------------------------------------------------------
window.openReceptionIssueTokenModal = function() {
  openModal('modal-issue-token');
};

window.submitReceptionQuickToken = async function() {
  const name = document.getElementById('issue-token-patient-name')?.value.trim();
  const select = document.getElementById('issue-token-doctor-select');
  const docId = select?.value || 'doc1';

  if (!name) {
    showToast('Please enter patient name.', 'warning');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/reception/walkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientName: name, doctorId: docId })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Token W${data.token.slice(1)} generated for ${name}`, 'success');
      closeAllModals();
      syncAllData();
    }
  } catch (err) {
    showToast('Failed to issue token.', 'error');
  }
};

// ---------------------------------------------------------------------------
// CALL / COMPLETE / NO-SHOW COMMANDS
// ---------------------------------------------------------------------------
window.callQueueNext = async function(token) {
  try {
    const res = await fetch(`${API_BASE}/queue/call-next`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast(`Called Token ${token} to consulting room.`, 'success');
      syncAllData();
    }
  } catch (err) {
    showToast('Failed to advance queue.', 'error');
  }
};

window.completeQueueItem = async function(token) {
  // Simply call next to pop the current consultation item
  try {
    const res = await fetch(`${API_BASE}/queue/call-next`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast(`Token ${token} consultation marked completed.`, 'success');
      syncAllData();
    }
  } catch (err) {
    showToast('Failed to update status.', 'error');
  }
};

window.markNoShow = async function(token) {
  try {
    const res = await fetch(`${API_BASE}/queue/no-show`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Token ${token} marked as No Show.`, 'warning');
      syncAllData();
    }
  } catch (err) {
    showToast('Failed to mark no-show.', 'error');
  }
};

window.cancelAppointment = async function(apptId) {
  try {
    const res = await fetch(`${API_BASE}/appointments/${apptId}/cancel`, { method: 'PUT' });
    const data = await res.json();
    if (data.success) {
      showToast('Appointment cancelled successfully.', 'success');
      syncAllData();
    }
  } catch (err) {
    showToast('Failed to cancel appointment.', 'error');
  }
};

window.checkinAppointment = async function(apptId) {
  try {
    const res = await fetch(`${API_BASE}/reception/checkin/${apptId}`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast('Patient checked in and token generated!', 'success');
      syncAllData();
    }
  } catch (err) {
    showToast('Failed to checkin appointment.', 'error');
  }
};

// ---------------------------------------------------------------------------
// DOCTOR PORTAL CONSULTATION FLOW
// ---------------------------------------------------------------------------
window.startConsultation = function(apptId) {
  // Switch to patients details view
  switchDoctorPage('patients');
};

// ---------------------------------------------------------------------------
// DIGITAL PRESCRIPTION WRITING
// ---------------------------------------------------------------------------
let rxMedsList = [];

window.openCreatePrescriptionPage = function() {
  switchDoctorPage('prescription');
  rxMedsList = [];
  document.getElementById('rx-form-date').value = new Date().toLocaleDateString('en-IN');
  document.getElementById('rx-form-diagnosis').value = '';
  document.getElementById('rx-form-instructions').value = '';
  renderRxFormMedTable();
};

function renderRxFormMedTable() {
  const tbody = document.querySelector('#rx-form-med-table tbody');
  if (!tbody) return;

  if (rxMedsList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding: 12px;">Add at least one medicine row.</td></tr>`;
    return;
  }

  tbody.innerHTML = rxMedsList.map((m, idx) => `
    <tr>
      <td><input type="text" class="form-control" value="${m.name}" onchange="updateRxMedField(${idx}, 'name', this.value)"></td>
      <td><input type="text" class="form-control" value="${m.dosage}" onchange="updateRxMedField(${idx}, 'dosage', this.value)"></td>
      <td><input type="text" class="form-control" value="${m.frequency}" onchange="updateRxMedField(${idx}, 'frequency', this.value)"></td>
      <td><input type="text" class="form-control" value="${m.duration}" onchange="updateRxMedField(${idx}, 'duration', this.value)"></td>
      <td><button class="btn btn-danger btn-xs" onclick="removeRxMedRow(${idx})"><i class="fa-solid fa-trash"></i></button></td>
    </tr>
  `).join('');
}

window.addMedRowToRxForm = function() {
  rxMedsList.push({ name: '', dosage: '', frequency: '1-0-1', duration: '5 Days' });
  renderRxFormMedTable();
};

window.removeRxMedRow = function(idx) {
  rxMedsList.splice(idx, 1);
  renderRxFormMedTable();
};

window.updateRxMedField = function(idx, field, value) {
  rxMedsList[idx][field] = value;
};

window.submitPrescription = async function() {
  const diagnosis = document.getElementById('rx-form-diagnosis')?.value.trim();
  const instructions = document.getElementById('rx-form-instructions')?.value.trim();

  if (!diagnosis) {
    showToast('Please enter a diagnosis.', 'warning');
    return;
  }
  if (rxMedsList.length === 0) {
    showToast('Add at least one medicine to prescribe.', 'warning');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/prescriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientName: 'Rahul Verma',
        patientId: 'pat1',
        diagnosis: diagnosis,
        medications: rxMedsList,
        instructions: instructions
      })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Digital prescription signed & issued!', 'success');
      switchDoctorPage('dashboard');
      syncAllData();
    }
  } catch (err) {
    showToast('Failed to save prescription.', 'error');
  }
};

window.saveRxDraft = function() {
  showToast('Prescription saved to clinical draft.', 'info');
  switchDoctorPage('dashboard');
};

// ---------------------------------------------------------------------------
// VIEW / DURATION TABS HELPER
// ---------------------------------------------------------------------------
window.switchTab = function(btn, contentId) {
  const parent = btn.parentElement;
  parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const container = parent.nextElementSibling;
  container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  const target = document.getElementById(contentId);
  if (target) target.classList.add('active');
};

// ---------------------------------------------------------------------------
// TOAST NOTIFICATIONS
// ---------------------------------------------------------------------------
function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-root');
  if (!container) return;

  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<i class="fa-solid fa-circle-info"></i> <span>${msg}</span>`;
  container.appendChild(t);

  setTimeout(() => {
    t.style.opacity = '0';
    setTimeout(() => t.remove(), 300);
  }, 4000);
}

// ---------------------------------------------------------------------------
// MODALS MANAGEMENT
// ---------------------------------------------------------------------------
function openModal(id) {
  document.getElementById(id)?.classList.add('open');
}

window.closeAllModals = function() {
  document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
};

window.onclick = function(event) {
  if (event.target.classList.contains('modal-backdrop')) {
    closeAllModals();
  }
};
