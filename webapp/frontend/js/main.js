document.addEventListener('DOMContentLoaded', () => {
  // Inject mobile role selector into all sidebars for easy prototyping
  document.querySelectorAll('.sidebar-nav').forEach((nav) => {
    const selectorHtml = `
      <div class="mobile-role-selector-container">
        <label style="font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; margin-bottom: 4px; display: block;">Switch Interface</label>
        <select class="form-control" onchange="switchGlobalRole(this.value); toggleSidebar(true);" style="width: 100%; font-size: 13px; height: 36px; min-height: 36px;">
          <option value="patient">Patient Dashboard</option>
          <option value="doctor">Doctor Dashboard</option>
          <option value="reception">Receptionist Dashboard</option>
          <option value="ambulance">Ambulance Dashboard</option>
        </select>
      </div>
    `;
    nav.insertAdjacentHTML('afterbegin', selectorHtml);
  });

  applyLanguage(selectedLanguage);
  populateCountryCodeSelects();
  updateAppHistoryButtons();

  // Restore unauthenticated language/phone state
  if (sessionStorage.getItem('healthsync-language-confirmed') === 'true') {
    document.getElementById('language-screen')?.classList.add('hidden');
    document.getElementById('auth-screen')?.classList.remove('hidden');
  }
  const savedMobile = sessionStorage.getItem('healthsync-pending-mobile');
  if (savedMobile) {
    const authMobile = document.getElementById('auth-mobile');
    if (authMobile) {
      authMobile.value = savedMobile.replace(/^\+\d{2}/, '');
      pendingMobile = savedMobile;
    }
    document.getElementById('mobile-login-form')?.classList.add('hidden');
    document.getElementById('otp-login-form')?.classList.remove('hidden');
    startResendCooldown(); // restart cooldown display
  }

  const savedSession = localStorage.getItem('healthsync-session');
  if (!savedSession) {
    // Unauthenticated: hide app, show onboarding
    const appEl = document.getElementById('app');
    if (appEl) appEl.classList.add('hidden');
    const obFlow = document.getElementById('onboarding-flow');
    if (obFlow) obFlow.classList.remove('hidden');
    
    // Clear hash to prevent direct dashboard routing
    if (window.location.hash) {
      history.replaceState(null, '', ' ');
    }
  } else {
    // Authenticated (pending restoreSession verify)
    const obFlow = document.getElementById('onboarding-flow');
    if (obFlow) obFlow.classList.add('hidden');
    const appEl = document.getElementById('app');
    if (appEl) appEl.classList.remove('hidden');
    
    const hash = window.location.hash;
    if (hash && hash.startsWith('#')) {
      const parts = hash.substring(1).split('/');
      if (parts.length === 2) {
        history.replaceState({ healthsyncNavigation: true, role: parts[0], page: parts[1] }, '', hash);
        setTimeout(() => goToAppHistoryState({ role: parts[0], page: parts[1] }), 50);
      }
    } else {
      history.replaceState({ healthsyncNavigation: true, role: 'patient', page: 'dashboard' }, '', '#patient/dashboard');
    }
  }
  
  renderPatientHealthProfile();
  startHealthTipRotation();
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
    if(bookingDateInput) bookingDateInput.value = new Date().toISOString().split('T')[0];
    if(bookingDateInput) bookingDateInput.min = new Date().toISOString().split('T')[0];
  }

  // Setup periodic refresh
  setInterval(syncAllData, 8000);
});

function renderHealthTip() {
  const tip = curatedHealthTips[healthTipIndex];
  const title = document.getElementById('patient-health-tip-title');
  const icon = document.getElementById('patient-health-tip-icon');
  const text = document.getElementById('patient-health-tip-text');
  const source = document.getElementById('patient-health-tip-source');
  if (!tip || !title || !icon || !text || !source) return;
  title.textContent = tip.title;
  icon.innerHTML = `<i class="fa-solid ${tip.icon}"></i>`;
  text.textContent = tip.text;
  source.href = tip.url;
  source.innerHTML = `${escapeHtml(tip.source)} <i class="fa-solid fa-arrow-up-right-from-square"></i>`;
}
function startHealthTipRotation() {
  renderHealthTip();
  clearInterval(healthTipTimer);
  healthTipTimer = setInterval(() => { healthTipIndex = (healthTipIndex + 1) % curatedHealthTips.length; renderHealthTip(); }, 20000);
}

async function restoreSession() {
  const saved = localStorage.getItem('healthsync-session');
  if (!saved) return;
  try {
    const session = JSON.parse(saved);
    const response = await fetch(`${API_BASE}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: session.refreshToken }) });
    const data = await response.json();
    if (!data.success) throw new Error();
    currentUser = { ...session.user, token: data.token, refreshToken: session.refreshToken };
    localStorage.setItem('healthsync-session', JSON.stringify({ user: currentUser, refreshToken: currentUser.refreshToken }));
    finishLogin();
  } catch { 
      localStorage.removeItem('healthsync-session');
      if (typeof window.logoutCurrentUser === 'function') {
        window.logoutCurrentUser();
      } else {
        location.reload();
      }
    }
}

// Demo sessions use the same role panels as production, but their API calls are
// intercepted by demo.js and never reach the production database.
window.startDemoExperience = function (role, mobile) {
  const roleMap = { patient: 'PATIENT', doctor: 'DOCTOR', reception: 'RECEPTIONIST' };
  if (!roleMap[role]) return false;
  currentUser = { id: `demo-${role}`, patientId: 'pat1', name: role === 'doctor' ? 'Dr. Kavya Iyer' : role === 'reception' ? 'Nisha Verma' : 'Aarav Mehta', mobile, role: roleMap[role], demo: true };
  document.getElementById('auth-screen')?.classList.add('hidden'); document.getElementById('onboarding-flow')?.classList.add('hidden');
  document.getElementById('app')?.classList.remove('hidden');
  document.getElementById('in-app-demo-banner')?.classList.remove('hidden');
  switchGlobalRole(role === 'reception' ? 'reception' : role);
  renderPatientHealthProfile();
  fetchDoctors();
  syncAllData();
  return true;
};
window.exitDemoExperience = function () {
  window.__HEALTHSYNC_DEMO_MODE__ = false;
  document.getElementById('in-app-demo-banner')?.classList.add('hidden');
  location.href = location.pathname;
};

function authMessage(message, isError = false) { const el = document.getElementById('auth-message'); if (el) { el.textContent = message; el.style.color = isError ? '#b91c1c' : ''; } }
function setAuthBusy(buttonId, busy, idleLabel) { const button = document.getElementById(buttonId); if (button) { button.disabled = busy; button.textContent = busy ? 'Please wait…' : idleLabel; } }
window.requestOtp = async function (event) {
  if (event) event.preventDefault();
  if (authMode === 'register') {
    const name = document.getElementById('register-name')?.value.trim() || '';
    const role = document.getElementById('register-role')?.value || 'PATIENT';
    const specialization = document.getElementById('register-specialization')?.value.trim() || '';
    const clinic = document.getElementById('register-clinic')?.value.trim() || '';
    if (name.length < 2) return authMessage('Enter your full name to register.', true);
    if (role === 'DOCTOR' && (!specialization || !clinic)) return authMessage('Enter your specialization and clinic to register as a doctor.', true);
    pendingRegistration = { fullName: name, requestedRole: role, specialization, clinicName: clinic };
  } else pendingRegistration = null;
  pendingCountryCode = selectedCountryCode('auth-country-code');
  const localMobile = document.getElementById('auth-mobile').value.replace(/\D/g, '');
  if (pendingCountryCode === '+91' && !/^[6-9]\d{9}$/.test(localMobile)) return authMessage('Enter a valid 10-digit Indian mobile number.', true);
  pendingMobile = internationalPhone(pendingCountryCode, localMobile);
  if (!/^\+\d{7,15}$/.test(pendingMobile)) return authMessage('Enter a valid mobile number for the selected country code.', true);

  // Persist pending mobile
  sessionStorage.setItem('healthsync-pending-mobile', pendingMobile);

  setAuthBusy('send-otp-btn', true, 'Send OTP');
  try {
    const data = await requestJson('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mobileNumber: pendingMobile }) });
    document.getElementById('mobile-login-form').classList.add('hidden');
    document.getElementById('otp-login-form').classList.remove('hidden');
    document.getElementById('auth-otp').focus();
    authMessage(data.otp ? `Development OTP: ${data.otp}` : (data.message || 'OTP sent successfully.'));
    startResendCooldown();
  } catch (error) { authMessage(error.message, true); }
  finally { setAuthBusy('send-otp-btn', false, 'Send OTP'); }
};
window.resendOtp = function () { requestOtp(null); };
window.backToMobileLogin = function () {
  clearInterval(resendTimer);
  pendingMobile = '';
  sessionStorage.removeItem('healthsync-pending-mobile');
  document.getElementById('auth-otp').value = '';
  document.getElementById('otp-login-form').classList.add('hidden');
  document.getElementById('mobile-login-form').classList.remove('hidden');
  authMessage('You can edit your mobile number and request a new OTP.');
  document.getElementById('auth-mobile')?.focus();
};
function startResendCooldown() { let seconds = 30; const button = document.getElementById('resend-otp-btn'); clearInterval(resendTimer); button.disabled = true; resendTimer = setInterval(() => { seconds--; button.textContent = seconds ? `Resend OTP (${seconds}s)` : 'Resend OTP'; if (!seconds) { button.disabled = false; clearInterval(resendTimer); } }, 1000); }
window.verifyOtp = async function (event) {
  event.preventDefault();
  const otpCode = document.getElementById('auth-otp').value.replace(/\D/g, '');
  if (!pendingMobile) return authMessage('Request a new OTP first.', true);
  if (!/^\d{6}$/.test(otpCode)) return authMessage('Enter the 6-digit OTP.', true);
  setAuthBusy('verify-otp-btn', true, 'Verify and sign in');
  try {
    const data = await requestJson('/auth/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mobileNumber: pendingMobile, otpCode, ...(pendingRegistration || {}) }) });
    currentUser = { ...data.user, token: data.token, refreshToken: data.refreshToken };
    localStorage.setItem('healthsync-session', JSON.stringify({ user: currentUser, refreshToken: currentUser.refreshToken }));
    finishLogin();
  } catch (error) { authMessage(error.message, true); }
  finally { setAuthBusy('verify-otp-btn', false, 'Verify and sign in'); }
};
window.setAuthMode = function (mode) {
  authMode = mode === 'register' ? 'register' : 'login';
  document.getElementById('registration-fields')?.classList.toggle('hidden', authMode !== 'register');
  document.getElementById('auth-mode-login')?.classList.toggle('active', authMode === 'login');
  document.getElementById('auth-mode-register')?.classList.toggle('active', authMode === 'register');
  const registering = authMode === 'register';
  const title = document.getElementById('auth-title'); const subtitle = document.getElementById('auth-subtitle'); const button = document.getElementById('send-otp-btn');
  if (title) title.textContent = registering ? 'Create your account' : 'Welcome to better care';
  if (subtitle) subtitle.textContent = registering ? 'Register securely with your mobile number.' : 'Sign in securely with your mobile number.';
  if (button) button.textContent = registering ? 'Register and send OTP' : 'Send OTP';
  authMessage('');
};
window.toggleRegistrationFields = function () {
  const role = document.getElementById('register-role')?.value || 'PATIENT';
  document.getElementById('doctor-registration-fields')?.classList.toggle('hidden', role !== 'DOCTOR');
  const help = document.getElementById('registration-role-help');
  if (help) help.textContent = role === 'DOCTOR' ? 'Doctor profiles become available after OTP verification.' : role === 'RECEPTIONIST' ? 'Reception staff can manage their assigned clinic after OTP verification.' : 'Your patient account will be ready immediately after OTP verification.';
};
function finishLogin() {
  document.getElementById('language-screen')?.classList.add('hidden');
  document.getElementById('auth-screen')?.classList.add('hidden'); document.getElementById('onboarding-flow')?.classList.add('hidden');
  document.getElementById('app')?.classList.remove('hidden');
  const role = String(currentUser?.role || 'PATIENT').toUpperCase();
  switchGlobalRole(role === 'DOCTOR' ? 'doctor' : role === 'RECEPTIONIST' ? 'reception' : role === 'AMBULANCE' ? 'ambulance' : 'patient');
  renderPatientHealthProfile();
  fetchNotifications();
  if (role === 'RECEPTIONIST' || role === 'AMBULANCE' || role === 'DOCTOR') {
    fetchPendingEmergencies();
  }
  syncAllData();
  connectSocket();
}
function panelForCurrentUser() { const role = String(currentUser?.role || '').toUpperCase(); return role === 'DOCTOR' ? 'doctor' : role === 'RECEPTIONIST' ? 'reception' : role === 'AMBULANCE' ? 'ambulance' : 'patient'; }
window.toggleProfileMenu = function (role) {
    const menu = document.getElementById('profile-menu');
    if (!menu) return;
    if (!menu.classList.contains('hidden') && menu.dataset.role === role) { menu.classList.add('hidden'); return; }
    const fallback = role === 'doctor' ? 'Dr. Priya Sharma' : role === 'reception' ? 'Receptionist Desk' : 'Patient';
    const name = role === panelForCurrentUser() ? (currentUser?.name || fallback) : fallback;
    const title = role === 'doctor' ? 'Doctor account' : role === 'reception' ? 'Reception desk' : 'Patient account';
    menu.dataset.role = role;
    menu.innerHTML = `<div class="profile-menu-name">${escapeHtml(name)}</div><div class="profile-menu-role">${title}</div>
      ${role === 'patient' ? `<button type="button" role="menuitem" onclick="switchPatientPage('dashboard'); document.getElementById('profile-menu').classList.add('hidden');"><i class="fa-solid fa-user"></i> Profile</button>
      <button type="button" role="menuitem" onclick="switchPatientPage('appointments'); document.getElementById('profile-menu').classList.add('hidden');"><i class="fa-solid fa-calendar"></i> My Appointments</button>` : ''}
      <button type="button" role="menuitem" onclick="openProfileSettings('${role}')"><i class="fa-solid fa-gear"></i> Account settings</button>
      <button type="button" class="profile-logout" role="menuitem" onclick="logoutCurrentUser()"><i class="fa-solid fa-right-from-bracket"></i> Log out</button>`;
    menu.classList.remove('hidden');
};
window.openProfileSettings = function (role) { document.getElementById('profile-menu')?.classList.add('hidden'); if (role === panelForCurrentUser()) openPortalTool(role, 'settings'); else showToast('Switch to this workspace to manage its settings.', 'info'); };
document.addEventListener('click', event => { if (!event.target.closest('.profile-trigger') && !event.target.closest('#profile-menu')) document.getElementById('profile-menu')?.classList.add('hidden'); });

async function fetchNotifications() { if (!currentUser) return; try { const res = await fetch(`${API_BASE}/notifications?userId=${encodeURIComponent(currentUser.id)}`); const data = await res.json(); renderNotifications(data.notifications || []); } catch { } }

async function fetchPendingEmergencies() {
  try {
    const res = await fetch(`${API_BASE}/emergency/pending`);
    const data = await res.json();
    if (data.success && data.cases) {
      data.cases.forEach(c => renderEmergencyAlertToDOM(c));
    }
  } catch (err) {
    console.error('Failed to fetch pending emergencies', err);
  }
}

function renderEmergencyAlertToDOM(data) {
  ['rec', 'doc', 'amb'].forEach(prefix => {
    const panel = document.getElementById(`${prefix}-emergency-panel`);
    if (panel) panel.classList.remove('hidden');
    const list = document.getElementById(`${prefix}-emergency-list`);
    if (!list) return;
    if (document.getElementById(`emerg-${data.caseId}`)) return; // Prevent duplicates

    const mapsLink = `https://www.google.com/maps?q=${data.lat},${data.lng}`;
    const isDispatched = data.status === 'Ambulance Dispatched';
    const dispatchText = isDispatched ? 'Dispatched' : 'Dispatch';
    const dispatchStyle = isDispatched ? 'background: #9ca3af; cursor: not-allowed;' : 'background: #ef4444; cursor: pointer;';
    const dispatchDisabled = isDispatched ? 'disabled' : '';

    list.innerHTML += `
      <div id="emerg-${data.caseId}" class="grid-3" style="align-items: center; background: white; padding: 16px; border-radius: 8px; box-shadow: var(--shadow-sm); border: 1px solid #fecaca; margin-bottom: 12px;">
        <div style="display: flex; gap: 12px; align-items: center;">
          <div style="width: 48px; height: 48px; border-radius: 50%; overflow: hidden; background: #e2e8f0; display: flex; justify-content: center; align-items: center; font-size: 20px;">👨</div>
          <div>
            <h4 style="margin: 0; font-size: 14px; font-weight: 700; color: #0f172a;">${escapeHtml(data.patientName)}</h4>
            <p style="margin: 2px 0; font-size: 12px; color: var(--text-muted);">${escapeHtml(data.phone)}</p>
          </div>
        </div>
        <div>
          <h5 style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #0f172a;">Live Location</h5>
          <p style="margin: 0; font-size: 11px; color: var(--text-muted); line-height: 1.3;">${escapeHtml(data.address || 'Unknown')}</p>
          <div id="${prefix}-map-${data.caseId}" style="height: 100px; width: 100%; margin-top: 8px; border-radius: 4px; z-index: 1;"></div>
        </div>
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
            <div>
              <h5 style="margin: 0; font-size: 13px; font-weight: 700;">--</h5>
              <p style="margin: 2px 0 0 0; font-size: 11px; color: var(--text-muted);">Distance</p>
            </div>
            <div>
              <h5 style="margin: 0; font-size: 13px; font-weight: 700;">${new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</h5>
              <p style="margin: 2px 0 0 0; font-size: 11px; color: var(--text-muted);">Time of Request</p>
            </div>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button style="flex: 1; padding: 8px; border: none; ${dispatchStyle} color: white; border-radius: 6px; font-weight: 600; font-size: 12px; min-width: 100px;" id="btn-dispatch-${prefix}-${data.caseId}" onclick="dispatchAmbulance('${data.caseId}')" ${dispatchDisabled}>${dispatchText}</button>
            <a href="tel:${data.phone}" style="flex: 1; padding: 8px; border: 1px solid var(--border); background: #f8fafc; color: #1e293b; border-radius: 6px; font-weight: 600; font-size: 12px; text-align: center; text-decoration: none; min-width: 100px;"><i class="fa-solid fa-phone"></i> Call Patient</a>
            <a href="${mapsLink}" target="_blank" style="flex: 1; padding: 8px; border: 1px solid #16a34a; background: white; color: #16a34a; border-radius: 6px; font-weight: 600; font-size: 12px; text-align: center; text-decoration: none; min-width: 100px;" id="map-link-${prefix}-${data.caseId}"><i class="fa-solid fa-location-dot"></i> View Location</a>
            <button style="flex: 1; padding: 8px; border: 1px solid var(--border); background: #f1f5f9; color: #1e293b; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer; min-width: 100px;" onclick="resolveEmergency('${data.caseId}')"><i class="fa-solid fa-check"></i> Mark Resolved</button>
          </div>
        </div>
      </div>
    `;
    setTimeout(() => {
      mapInstances[`${prefix}_${data.caseId}`] = initMap(`${prefix}-map-${data.caseId}`, data.lat, data.lng, 'patient');
    }, 100);
  });
}

window.resolveEmergency = async function (caseId) {
  if (!confirm('Are you sure you want to mark this emergency as resolved?')) return;
  try {
    const res = await fetch(`${API_BASE}/emergency/${caseId}/resolve`, { method: 'PUT' });
    if (res.ok) {
      showToast('Emergency marked as resolved', 'success');
      ['rec', 'doc', 'amb'].forEach(prefix => {
        const el = document.getElementById(`emerg-${caseId}`);
        if (el) el.remove();
        const list = document.getElementById(`${prefix}-emergency-list`);
        const panel = document.getElementById(`${prefix}-emergency-panel`);
        if (list && list.children.length === 0 && panel) panel.classList.add('hidden');
      });
    }
  } catch (err) {
    showToast('Failed to resolve emergency', 'error');
  }
};
function renderNotifications(items) {
  const unread = items.filter(item => item.status === 'UNREAD').length;
  const count = document.getElementById('notification-count');
  const dot = document.getElementById('notification-dot');
  if (count) count.textContent = unread;
  if (dot) dot.classList.toggle('hidden', !unread);

  const list = document.getElementById('notification-list');
  if (list) {
    list.innerHTML = items.length ? items.map(item => {
      let msg = escapeHtml(item.message);
      msg = msg.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color: #ef4444; font-weight: bold; text-decoration: underline;" onclick="event.stopPropagation()">$1</a>');
      return `<div class="notification-item ${item.status === 'UNREAD' ? 'unread' : ''}" onclick="markNotificationRead('${item.id}')">${msg}<span class="notification-time">${new Date(item.created_at).toLocaleString('en-IN')}</span></div>`;
    }).join('') : '<div class="empty-state"><div class="es-icon">🔔</div><div class="es-text">You are all caught up</div></div>';
  }
}
window.openNotifications = async function () { await fetchNotifications(); openModal('modal-notifications'); };
window.markNotificationRead = async function (id) { await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'POST' }); fetchNotifications(); };
window.clearNotifications = async function () { if (!currentUser) return; await fetch(`${API_BASE}/notifications/clear`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUser.id }) }); fetchNotifications(); };


async function renderDashboardReminders() {
  const container = document.querySelector('.medicine-card .medicine-box');
  if (!container) return;
  if (!currentUser) return;
  
  container.innerHTML = '<div class="text-center p-4 text-muted"><i class="fa-solid fa-spinner fa-spin"></i> Loading reminders...</div>';
  
  try {
    const data = await requestJson('/reminders?patientId=' + encodeURIComponent(currentUser.patientId || currentUser.id));
    const reminders = data?.reminders || [];
    
    if (reminders.length === 0) {
      container.innerHTML = '<div class="card p-4 text-center text-muted empty-state"><i class="fa-solid fa-pills" style="font-size: 24px; color: #cbd5e1; margin-bottom: 8px;"></i><p style="font-size:13px; margin:0;">No medicines scheduled today</p></div>';
      return;
    }
    
    const nextRem = reminders[0];
    container.innerHTML = `
      <div class="med-info" style="flex:1;">
        <div class="med-next fw-bold text-dark" style="font-size: 14px;">Scheduled: <span class="text-orange" style="color: #f59e0b;">${escapeHtml(nextRem.reminder_time)}</span></div>
        <h4 class="fw-bold text-dark mt-2" style="font-size: 16px;">${escapeHtml(nextRem.medicine_name)}</h4>
        <div class="text-muted text-sm mt-1" style="font-size: 13px;">${escapeHtml(nextRem.dosage || 'Standard Dose')}</div>
      </div>
      <div class="med-icon-big">
        <div class="pill-illustration">
          <div style="background: #e0e7ff; width: 60px; height: 60px; border-radius: 16px; display: flex; align-items: center; justify-content: center;">
             <i class="fa-solid fa-pills" style="color: #4f46e5; font-size: 24px;"></i>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = '<div class="card p-4 text-center text-red-500 empty-state">Failed to load reminders.</div>';
  }
}


async function renderDashboardVaccinations() {
  const container = document.querySelector('h3:contains("Vaccination History")')?.nextElementSibling?.querySelector('tbody');
  // Wait, in vanilla JS :contains doesn't work. We find the container by querying elements.
  const headings = document.querySelectorAll('h3');
  let vaccContainer = null;
  headings.forEach(h => {
    if (h.textContent.includes('Vaccination History')) {
      vaccContainer = h.nextElementSibling.querySelector('tbody');
    }
  });
  if (!vaccContainer) return;
  
  vaccContainer.innerHTML = '<tr><td colspan="5" class="text-center text-muted"><i class="fa-solid fa-spinner fa-spin"></i> Loading history...</td></tr>';
  
  try {
    const data = await requestJson('/records');
    const records = (data?.records || []).filter(r => r.type === 'Vaccination');
    
    if (records.length === 0) {
      vaccContainer.innerHTML = '<tr><td colspan="5" class="text-center text-muted empty-state" style="padding: 24px;">No vaccination history found.</td></tr>';
      return;
    }
    
    vaccContainer.innerHTML = records.map(r => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 16px; font-size: 14px; font-weight: 600; color: #0f172a;">${escapeHtml(r.title)}</td>
        <td style="padding: 16px; font-size: 14px; color: #0f172a; font-weight: 500;">${escapeHtml(r.date)}</td>
        <td style="padding: 16px; font-size: 14px; color: #0f172a; font-weight: 500;">${escapeHtml(r.doctor_name || 'N/A')}</td>
        <td style="padding: 16px; font-size: 14px; color: #0f172a; font-weight: 500;">${escapeHtml(r.description || 'N/A')}</td>
        <td style="padding: 16px; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-file-pdf" style="color: #ef4444; font-size: 20px;"></i>
          <span style="font-size: 13px; font-weight: 500; color: #64748b;">Record</span>
        </td>
      </tr>
    `).join('');
  } catch(err) {
    vaccContainer.innerHTML = '<tr><td colspan="5" class="text-center text-red-500">Failed to load vaccination history.</td></tr>';
  }
}

async function syncAllData() {
  if (!currentUser) return;
  await Promise.all([
    fetchQueueLive(),
    fetchAppointmentsToday(),
    fetchPrescriptions(),
    fetchNextAppointment(),
    fetchHealthRecords(), fetchVaccinations()
  ]);
  renderDoctorPatientReports();
}

// ---------------------------------------------------------------------------
// GLOBAL ROLE VIEW SWITCHER
// ---------------------------------------------------------------------------
function recordAppNavigation(role, page) {
  const current = appHistory[appHistoryIndex];
  if (current?.role === role && current?.page === page) return;
  appHistory = appHistory.slice(0, appHistoryIndex + 1);
  appHistory.push({ role, page });
  appHistoryIndex = appHistory.length - 1;
  const newUrl = `#${role}/${page}`;
  history.pushState({ healthsyncNavigation: true, role, page }, '', newUrl);
  updateAppHistoryButtons();
}
function updateAppHistoryButtons() {
  document.querySelectorAll('[onclick="goAppBack()"]').forEach(button => button.disabled = appHistoryIndex === 0);
  document.querySelectorAll('[onclick="goAppForward()"]').forEach(button => button.disabled = appHistoryIndex >= appHistory.length - 1);
}
function goToAppHistoryState(state) {
  switchGlobalRole(state.role, false);
  if (state.page.startsWith('tool:')) {
    openPortalTool(state.role, state.page.slice(5), false);
    return;
  }
  const navigate = { patient: switchPatientPage, doctor: switchDoctorPage, reception: switchReceptionPage }[state.role];
  navigate?.(state.page, false);
}
window.goAppBack = function () { if (appHistoryIndex === 0) return; appHistoryIndex--; goToAppHistoryState(appHistory[appHistoryIndex]); updateAppHistoryButtons(); };
window.goAppForward = function () { if (appHistoryIndex >= appHistory.length - 1) return; appHistoryIndex++; goToAppHistoryState(appHistory[appHistoryIndex]); updateAppHistoryButtons(); };
window.addEventListener('popstate', event => {
  const state = event.state;
  
  // Close any open modals that don't match the new state
  document.querySelectorAll('.modal-backdrop.open').forEach(m => {
    if (!state?.modalOpen || state.modalId !== m.id) {
      m.classList.remove('open');
    }
  });

  if (state?.modalOpen) return; // If we navigated INTO a modal state, do nothing else
  
  if (!state?.healthsyncNavigation) return;
  const index = appHistory.findIndex(item => item.role === state.role && item.page === state.page);
  if (index >= 0) appHistoryIndex = index;
  else { appHistory.push({ role: state.role, page: state.page }); appHistoryIndex = appHistory.length - 1; }
  goToAppHistoryState(state);
  updateAppHistoryButtons();
});

window.switchGlobalRole = function (role, remember = true) {
  document.querySelectorAll('.role-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));

  const targetPanel = document.getElementById(`panel-${role}`);
  if (targetPanel) targetPanel.classList.add('active');

  // Activate matching headers
  document.querySelectorAll(`.role-tab[onclick*="${role}"]`).forEach(t => t.classList.add('active'));

  // Sync mobile role selectors
  document.querySelectorAll('.mobile-role-selector-container select').forEach(s => {
    s.value = role === 'reception' ? 'reception' : role;
  });

  // Sync data immediately when switching
  syncAllData();
  if (remember && targetPanel) {
    const activeId = targetPanel.querySelector('.page.active')?.id || `${role}-page-dashboard`;
    let page = activeId.replace(`${role}-page-`, '');
    if (page.startsWith('tool-')) page = `tool:${page.slice(5)}`;
    recordAppNavigation(role, page);
  }
};

window.toggleSidebar = function (forceClose = false) {
  const activeSidebar = document.querySelector('.role-panel.active .sidebar') || document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (activeSidebar) {
    if (forceClose) {
      activeSidebar.classList.remove('open');
      if (overlay) overlay.classList.remove('open');
    } else {
      activeSidebar.classList.toggle('open');
      if (overlay) overlay.classList.toggle('open');
    }
  }
};

// ---------------------------------------------------------------------------
// NAVIGATION ROUTING
// ---------------------------------------------------------------------------
window.switchPatientPage = function (pageId, remember = true) {
  toggleSidebar(true);
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
  if (pageId === 'health-profile') renderPatientHealthProfile();
  if (pageId === 'health-records') {
    const firstTab = document.querySelector('.records-menu-item');
    if (firstTab) switchRecordsSubtab(firstTab, 'timeline');
  }
  if (pageId === 'doctors') renderPatientDoctorsList();
  if (remember) recordAppNavigation('patient', pageId);
};

window.switchDoctorPage = function (pageId, remember = true) {
  toggleSidebar(true);
  document.querySelectorAll('#panel-doctor .nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('onclick')?.includes(pageId)) {
      item.classList.add('active');
    }
  });

  document.querySelectorAll('#panel-doctor .page').forEach(page => page.classList.remove('active'));
  const targetPage = document.getElementById(`doctor-page-${pageId}`);
  if (targetPage) targetPage.classList.add('active');
  if (remember) recordAppNavigation('doctor', pageId);
};

window.switchReceptionPage = function (pageId, remember = true) {
  toggleSidebar(true);
  document.querySelectorAll('#panel-reception .nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('onclick')?.includes(pageId)) {
      item.classList.add('active');
    }
  });

  document.querySelectorAll('#panel-reception .page').forEach(page => page.classList.remove('active'));
  const targetPage = document.getElementById(`reception-page-${pageId}`);
  if (targetPage) targetPage.classList.add('active');
  if (remember) recordAppNavigation('reception', pageId);
};

// ---------------------------------------------------------------------------
// SIDEBAR TOOLS — every navigation item opens a usable workspace.
// ---------------------------------------------------------------------------
const utilityTitles = { prescriptions: 'Prescriptions', medicines: 'Medicines', reminders: 'Medicine Reminders', vaccinations: 'Vaccination Reminders', family: 'Family Accounts', 'voice-search': 'AI Voice Search', availability: 'Doctor Availability', messages: 'Messages', settings: 'Settings', help: 'Help & Support', schedule: 'Schedule', requests: 'Patient Requests', earnings: 'Earnings', reports: 'Reports', patients: 'Patients', doctors: 'Doctors', 'follow-ups': 'Follow-up Reminders', priority: 'Emergency Priority Queue', billing: 'Billing Entry' };
function getUtilityPage(role, tool) {
  const id = `${role}-page-tool-${tool}`;
  let page = document.getElementById(id);
  if (page) return page;
  const panel = document.getElementById(`panel-${role}`);
  const container = panel.querySelector('.page-content');
  page = document.createElement('div'); page.id = id; page.className = 'page'; container.appendChild(page); return page;
}
function table(rows, headers) { return `<div class="card"><div class="card-body table-wrap"><table class="hs-table"><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows || `<tr><td colspan="${headers.length}" class="text-center text-muted">No records yet.</td></tr>`}</tbody></table></div></div>`; }
function localItems(key) { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } }
function saveLocalItems(key, values) { localStorage.setItem(key, JSON.stringify(values)); }

function healthProfileKey() { return currentUser?.demo ? null : `healthsync-health-profile-${currentUser?.id || 'local-patient'}`; }
function getHealthProfile() {
  if (currentUser?.demo) return window.__healthsyncDemoHealthProfile || null;
  try { return JSON.parse(localStorage.getItem(healthProfileKey()) || 'null'); } catch { return null; }
}
function saveHealthProfileData(profile) {
  if (currentUser?.demo) { window.__healthsyncDemoHealthProfile = profile; return; }
  localStorage.setItem(healthProfileKey(), JSON.stringify(profile));
}
function profileInitials(name) {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean);
  return (words.slice(0, 2).map(word => word.charAt(0)).join('') || 'HS').toUpperCase();
}
function renderPatientIdentity(profile = getHealthProfile()) {
  const name = currentUser?.full_name || currentUser?.name || profile?.name || 'Patient';
  const initials = profileInitials(name);
  const firstName = String(name).trim().split(/\s+/)[0] || 'Patient';
  ['patient-sidebar-avatar', 'patient-header-avatar', 'patient-profile-photo-preview'].forEach(id => {
    const avatar = document.getElementById(id);
    if (!avatar) return;
    avatar.textContent = initials;
    avatar.classList.toggle('has-photo', Boolean(profile?.photoDataUrl));
    avatar.style.backgroundImage = profile?.photoDataUrl ? `url("${profile.photoDataUrl}")` : '';
  });
  const sidebarName = document.getElementById('patient-sidebar-name');
  const dashboardName = document.getElementById('patient-dashboard-name');
  if (sidebarName) sidebarName.textContent = name;
  if (dashboardName) dashboardName.textContent = firstName;
}
function renderDashboardHealthSummary(profile = getHealthProfile()) {
  const weight = document.getElementById('dashboard-weight');
  const bmi = document.getElementById('dashboard-bmi');
  const bmiLabel = document.getElementById('dashboard-bmi-label');
  if (weight) weight.textContent = profile?.weight ? String(profile.weight) : '—';
  if (bmi) bmi.textContent = profile?.height && profile?.weight ? healthInsight(profile).bmi.toFixed(1) : '—';
  if (bmiLabel) bmiLabel.textContent = profile?.height && profile?.weight ? 'BMI' : 'BMI · add profile';
}
function healthInsight(profile) {
  const heightM = Number(profile.height) / 100;
  const bmi = Number(profile.weight) / (heightM * heightM);
  const healthyMin = 18.5 * heightM * heightM;
  const healthyMax = 24.9 * heightM * heightM;
  let status = 'Healthy weight', tone = 'healthy', message = 'Your current weight is within the standard healthy BMI range.';
  if (bmi < 18.5) { status = 'Underweight range'; tone = 'under'; message = `A gradual gain of about ${(healthyMin - Number(profile.weight)).toFixed(1)} kg would bring you into the standard healthy range.`; }
  if (bmi >= 25 && bmi < 30) { status = 'Overweight range'; tone = 'over'; message = `A gradual reduction of about ${(Number(profile.weight) - healthyMax).toFixed(1)} kg would bring you into the standard healthy range.`; }
  if (bmi >= 30) { status = 'Higher weight range'; tone = 'over'; message = `A gradual reduction of about ${(Number(profile.weight) - healthyMax).toFixed(1)} kg would bring you into the standard healthy range. Consider discussing a plan with a clinician.`; }
  const age = Number(profile.age);
  const sleep = age <= 17 ? '8–10 hours' : age >= 65 ? '7–8 hours' : '7–9 hours';
  const activity = profile.job === 'Desk-based / mostly sitting' ? 'Break up sitting time: stand, stretch, or walk for a few minutes each hour.' : profile.job === 'Shift work' ? 'Keep a consistent sleep window where possible and protect a dark, quiet rest period.' : profile.job === 'Physically active work' ? 'Balance activity with recovery, hydration, and regular meals.' : profile.job === 'Driving / travel-based work' ? 'Plan short movement and water breaks during long travel periods.' : profile.job === 'Student' ? 'Use regular meal, movement, and screen-break times during study blocks.' : 'Aim for regular movement across the week and include strength work when suitable.';
  const activityFactors = { Student: 1.3, 'Desk-based / mostly sitting': 1.25, 'Business owner / entrepreneur': 1.35, 'Mixed activity': 1.45, 'Physically active work': 1.65, 'Healthcare / service work': 1.5, 'Driving / travel-based work': 1.3, 'Homemaker / caregiver': 1.45, 'Shift work': 1.4, Retired: 1.25, Other: 1.35 };
  const sexAdjustment = profile.gender === 'Male' ? 5 : profile.gender === 'Female' ? -161 : -78;
  const bmr = 10 * Number(profile.weight) + 6.25 * Number(profile.height) - 5 * age + sexAdjustment;
  const hourAdjustment = Math.min(1.12, Math.max(.9, 1 + ((Number(profile.workHours || 8) - 8) * .015)));
  const calories = Math.round((bmr * (activityFactors[profile.job] || 1.35) * hourAdjustment) / 50) * 50;
  const protein = Math.ceil(Math.max(Number(profile.weight) * .8, (calories * .1) / 4));
  const carbs = `${Math.round((calories * .45) / 4)}–${Math.round((calories * .65) / 4)} g`;
  const fats = `${Math.round((calories * .20) / 9)}–${Math.round((calories * .35) / 9)} g`;
  const water = profile.gender === 'Male' ? '3.7 L' : profile.gender === 'Female' ? '2.7 L' : '3.2 L';
  return { bmi, healthyMin, healthyMax, status, tone, message, sleep, activity, calories, protein, carbs, fats, water };
}
function renderProfileSafety(container, profile) {
  if (!container) return;
  const safety = document.createElement('section');
  safety.className = 'health-safety-card';
  const emergencyPhone = profile.emergencyPhone ? `${profile.emergencyCountryCode || '+91'} ${profile.emergencyPhone}` : 'No phone number added';
  safety.innerHTML = `<div class="health-safety-heading"><i class="fa-solid fa-shield-heart"></i><span>Safety information</span></div><div class="health-safety-grid"><div><span>Blood group</span><strong>${escapeHtml(profile.bloodGroup || 'Unknown')}</strong></div><div><span>Emergency contact</span><strong>${escapeHtml(profile.emergencyName || 'Not added')}</strong><small>${escapeHtml(emergencyPhone)}</small></div></div><div class="health-safety-detail"><span>Allergies</span><strong>${escapeHtml(profile.allergies || 'Not added')}</strong></div><div class="health-safety-detail"><span>Medical conditions</span><strong>${escapeHtml(profile.conditions || 'Not added')}</strong></div>`;
  container.querySelector('.health-guide-tip')?.before(safety);
}
function renderPatientHealthProfile() {
  const profile = getHealthProfile();
  renderPatientIdentity(profile);
  renderDashboardHealthSummary(profile);
  const guide = document.getElementById('patient-health-guide');
  const summary = document.getElementById('health-profile-summary');
  const form = document.getElementById('health-profile-form');
  if (form && profile) {
    ['name', 'age', 'gender', 'job', 'height', 'weight', 'workHours', 'bloodGroup', 'emergencyName', 'emergencyPhone', 'allergies', 'conditions'].forEach(field => { const elementId = `profile-${field.replace('workHours', 'work-hours').replace('bloodGroup', 'blood-group').replace('emergencyName', 'emergency-name').replace('emergencyPhone', 'emergency-phone')}`; const input = document.getElementById(elementId); if (input) input.value = profile[field] ?? ''; });
    const custom = document.getElementById('profile-custom-job'); if (custom) custom.value = profile.customJob || '';
    setCountryCodeValue('profile-emergency-country-code', profile.emergencyCountryCode || '+91');
    window.toggleCustomWorkField?.();
  }
  if (!profile) {
    const empty = `<div class="card-header"><span class="card-title">Your wellness guide</span></div><div class="card-body health-guide-empty"><div class="health-guide-icon"><i class="fa-solid fa-heart-pulse"></i></div><strong>Complete your health profile</strong><p>Add your height, weight, age, and work routine to see your personal healthy-weight and sleep guide.</p><button class="btn btn-primary btn-sm" onclick="switchPatientPage('health-profile')">Set up profile</button></div>`;
    if (guide) guide.innerHTML = empty;
    if (summary) summary.innerHTML = `<div class="card-header"><span class="card-title">Your guide preview</span></div><div class="card-body health-guide-empty"><div class="health-guide-icon"><i class="fa-solid fa-chart-line"></i></div><strong>Waiting for your details</strong><p>Save your profile to generate BMI, weight, sleep, and activity guidance.</p></div>`;
    return;
  }
  const insight = healthInsight(profile);
  const content = `<div class="card-header"><span class="card-title">Your wellness guide</span><span class="health-status ${insight.tone}">${insight.status}</span></div><div class="card-body"><div class="health-guide-name">Hi ${escapeHtml(profile.name.split(' ')[0])}, here is your current guide.</div><div class="health-guide-metrics"><div><span>BMI</span><strong>${insight.bmi.toFixed(1)}</strong><small>${insight.status}</small></div><div><span>Healthy range</span><strong>${insight.healthyMin.toFixed(1)}–${insight.healthyMax.toFixed(1)} kg</strong><small>For ${escapeHtml(profile.height)} cm</small></div><div><span>Sleep target</span><strong>${insight.sleep}</strong><small>Most nights</small></div></div><p class="health-guide-message">${insight.message}</p><div class="nutrition-guide"><div class="nutrition-guide-heading"><i class="fa-solid fa-utensils"></i><span>Daily nutrition estimate</span><small>Based on ${escapeHtml(profile.job === 'Other' ? profile.customJob || 'your routine' : profile.job)} · ${escapeHtml(profile.workHours)} hrs/day</small></div><div class="nutrition-grid"><div><span>Calories</span><strong>~${insight.calories} kcal</strong><small>Maintenance estimate</small></div><div><span>Protein</span><strong>≥${insight.protein} g</strong><small>Healthy-adult baseline</small></div><div><span>Carbohydrates</span><strong>${insight.carbs}</strong><small>Daily range</small></div><div><span>Fats</span><strong>${insight.fats}</strong><small>Daily range</small></div><div><span>Total water</span><strong>${insight.water}</strong><small>Drinks + food</small></div></div></div><p class="health-guide-tip"><i class="fa-solid fa-person-walking"></i> ${insight.activity}</p><p class="nutrition-disclaimer">General healthy-adult estimate only. Needs change with exercise, climate, pregnancy, medicines, and health conditions; consult a dietitian or clinician for a personal plan.</p><button class="btn btn-secondary btn-sm" onclick="switchPatientPage('health-profile')"><i class="fa-solid fa-pen"></i> Update profile</button></div>`;
  if (guide) { guide.innerHTML = content; renderProfileSafety(guide, profile); }
  if (summary) { summary.innerHTML = content; renderProfileSafety(summary, profile); }
}
window.saveHealthProfile = function (event) {
  event.preventDefault();
  const profile = {
    name: document.getElementById('profile-name').value.trim(), age: Number(document.getElementById('profile-age').value), gender: document.getElementById('profile-gender').value,
    job: document.getElementById('profile-job').value, customJob: document.getElementById('profile-custom-job').value.trim(), height: Number(document.getElementById('profile-height').value), weight: Number(document.getElementById('profile-weight').value), workHours: Number(document.getElementById('profile-work-hours').value), bloodGroup: document.getElementById('profile-blood-group').value, emergencyName: document.getElementById('profile-emergency-name').value.trim(), emergencyCountryCode: selectedCountryCode('profile-emergency-country-code'), emergencyPhone: document.getElementById('profile-emergency-phone').value.trim(), allergies: document.getElementById('profile-allergies').value.trim(), conditions: document.getElementById('profile-conditions').value.trim(), photoDataUrl: getHealthProfile()?.photoDataUrl || ''
  };
  const emergencyDigits = profile.emergencyPhone.replace(/\D/g, '');
  if (!profile.name || !profile.job || (profile.job === 'Other' && !profile.customJob) || profile.age < 18 || profile.age > 120 || profile.height < 80 || profile.height > 250 || profile.weight < 20 || profile.weight > 400 || profile.workHours < 0 || profile.workHours > 24 || (profile.emergencyPhone && emergencyDigits.length < 7)) return showToast('Please enter valid adult health profile details.', 'warning');
  saveHealthProfileData(profile);
  renderPatientHealthProfile();
  showToast('Your wellness guide has been updated.', 'success');
};
window.chooseProfilePhoto = function (source) {
  document.getElementById(source === 'camera' ? 'profile-photo-camera' : 'profile-photo-gallery')?.click();
};
window.saveProfilePhoto = function (file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) return showToast('Please choose an image file.', 'warning');
  if (file.size > 8 * 1024 * 1024) return showToast('Choose an image smaller than 8 MB.', 'warning');
  const current = getHealthProfile();
  if (!current?.name) return showToast('Save your profile details first, then add your photo.', 'warning');
  const reader = new FileReader();
  reader.onload = () => {
    const image = new Image();
    image.onload = () => {
      const maxSize = 360;
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      current.photoDataUrl = canvas.toDataURL('image/jpeg', .84);
      saveHealthProfileData(current);
      renderPatientHealthProfile();
      showToast('Profile photo updated.', 'success');
    };
    image.onerror = () => showToast('That image could not be opened. Please try another one.', 'error');
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
};
window.removeProfilePhoto = function () {
  const profile = getHealthProfile();
  if (!profile?.photoDataUrl) return showToast('There is no profile photo to remove.', 'warning');
  delete profile.photoDataUrl;
  saveHealthProfileData(profile);
  renderPatientHealthProfile();
  showToast('Profile photo removed.', 'success');
};
window.toggleCustomWorkField = function () {
  const isOther = document.getElementById('profile-job')?.value === 'Other';
  const group = document.getElementById('profile-custom-job-group');
  const input = document.getElementById('profile-custom-job');
  group?.classList.toggle('hidden', !isOther);
  if (input) input.required = Boolean(isOther);
};
window.openPortalTool = function (role, tool, remember = true) {
  if (role === 'patient' && tool === 'reminders' && !remindersLoaded) {
    fetchReminders().then(() => openPortalTool(role, tool));
    return;
  }
  const page = getUtilityPage(role, tool);
  document.querySelectorAll(`#panel-${role} .nav-item`).forEach(item => item.classList.toggle('active', item.getAttribute('onclick')?.includes(`'${tool}'`)));
  document.querySelectorAll(`#panel-${role} .page`).forEach(item => item.classList.remove('active')); page.classList.add('active');
  const title = utilityTitles[tool] || tool;
  page.innerHTML = `<div class="page-header-row"><div><h2 class="page-heading">${title}</h2><p class="page-subheading">${role === 'doctor' ? 'Clinical portal' : role === 'reception' ? 'Clinic operations' : 'Your HealthSync account'}</p></div></div>${utilityContent(role, tool)}`;
  if (remember) recordAppNavigation(role, `tool:${tool}`);
};
function utilityContent(role, tool) {
  if (tool === 'settings') return settingsContent();
  if (tool === 'prescriptions') return table(patientPrescriptions.map(rx => `<tr><td>${escapeHtml(rx.diagnosis)}</td><td>${escapeHtml(rx.doctor_name || rx.doctorName || '')}</td><td>${new Date(rx.created_at).toLocaleDateString('en-IN')}</td><td><button class="btn btn-secondary btn-xs" onclick="showToast('Prescription details are available in Health Records.', 'info')">View</button></td></tr>`).join(''), ['Diagnosis', 'Doctor', 'Date', 'Action']);
  if (tool === 'medicines') { const meds = patientPrescriptions.flatMap(rx => { try { return JSON.parse(rx.medications_json || '[]') } catch { return [] } }); return table(meds.map(m => `<tr><td>${escapeHtml(m.name)}</td><td>${escapeHtml(m.dosage || '')}</td><td>${escapeHtml(m.frequency || '')}</td><td>${escapeHtml(m.duration || '')}</td></tr>`).join(''), ['Medicine', 'Dosage', 'Frequency', 'Duration']); }
  if (tool === 'reminders') {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Sort logic
    const sorted = [...fetchedReminders].sort((a,b) => a.reminder_time.localeCompare(b.reminder_time));
    
    const todayHTML = sorted.map(r => {
        let taken = [];
        try { taken = JSON.parse(r.taken_dates || '[]'); } catch(e){}
        const isTaken = taken.includes(todayStr);
        return `<div class="card mb-2"><div class="card-body" style="display:flex; justify-content:space-between; align-items:center;">
           <div>
             <h5 style="margin:0; color:${isTaken ? '#94a3b8' : '#0f172a'}; text-decoration:${isTaken ? 'line-through' : 'none'}">${escapeHtml(r.medicine_name)} ${r.dosage ? '('+escapeHtml(r.dosage)+')' : ''}</h5>
             <small class="text-muted"><i class="fa-regular fa-clock"></i> ${r.reminder_time} ${r.frequency ? '| '+escapeHtml(r.frequency) : ''}</small>
           </div>
           <div style="display:flex; gap:8px;">
             ${!isTaken ? `<button class="btn btn-primary btn-sm" onclick="markMedicineTaken('${r.id}')"><i class="fa-solid fa-check"></i> Taken</button>` : `<span class="text-success"><i class="fa-solid fa-check-circle"></i></span>`}
             <button class="btn btn-danger btn-sm" onclick="deleteMedicineReminder('${r.id}')"><i class="fa-solid fa-trash"></i></button>
           </div>
        </div></div>`;
    }).join('') || '<p class="text-muted">No medicines found.</p>';

    return `<div class="container-fluid">
       <h4 class="mb-3">Medicine Reminders</h4>
       <div class="row">
          <div class="col-md-7">
             ${todayHTML}
          </div>
          <div class="col-md-5">
             <div class="card"><div class="card-body">
                <h5 class="mb-3">Add Medicine</h5>
                <input id="new-med-name" class="form-control mb-2" placeholder="Medicine Name (e.g. Paracetamol)*">
                <input id="new-med-dosage" class="form-control mb-2" placeholder="Dosage (e.g. 500mg)">
                <input id="new-med-freq" class="form-control mb-2" placeholder="Frequency (e.g. Once daily)">
                <div style="display:flex; gap:8px;" class="mb-2">
                    <input id="new-med-start" type="date" class="form-control" title="Start Date">
                    <input id="new-med-end" type="date" class="form-control" title="End Date">
                </div>
                <input id="new-med-time" type="time" class="form-control mb-3" title="Reminder Time*">
                <button class="btn btn-primary w-100" onclick="addMedicineReminder()">Save Medicine</button>
             </div></div>
          </div>
       </div>
    </div>`;
  }
    if (tool === 'messages') { const messages = localItems(`healthsync-${role}-messages`); return `<div class="card mb-3"><div class="card-body"><div id="message-history">${messages.map(m => `<p class="mb-2"><strong>${escapeHtml(m.from)}:</strong> ${escapeHtml(m.text)}</p>`).join('') || '<p class="text-muted">No messages yet.</p>'}</div><div class="form-row"><input id="message-text" class="form-control" placeholder="Write a message"><button class="btn btn-primary" onclick="sendPortalMessage('${role}')">Send</button></div></div></div>`; }
  if (tool === 'settings') return `<div class="card"><div class="card-body"><div class="form-group mb-3"><label class="form-label">Preferred language</label><select id="setting-language" class="form-control"><option>English</option><option>Hindi</option><option>Marathi</option></select></div><button class="btn btn-primary" onclick="saveSettings()">Save settings</button> <button class="btn btn-secondary" onclick="logoutCurrentUser()">Log out</button></div></div>`;
  if (tool === 'help') return `<div class="card"><div class="card-body"><h4 class="mb-2">Need help?</h4><p class="text-muted mb-3">Use the support form and the care team will receive your request.</p><textarea id="support-message" class="form-control mb-3" placeholder="Describe your issue"></textarea><button class="btn btn-primary" onclick="submitSupport()">Send support request</button></div></div>`;
  if (tool === 'schedule') return table(todayAppointments.map(a => `<tr><td>${escapeHtml(a.slot_time)}</td><td>${escapeHtml(a.patient_name)}</td><td>${escapeHtml(a.status)}</td><td><button class="btn btn-secondary btn-xs" onclick="startConsultation('${a.id}')">Open</button></td></tr>`).join(''), ['Time', 'Patient', 'Status', 'Action']);
  if (tool === 'requests') return `<div class="card"><div class="card-body"><p class="text-muted">No pending access requests. Patient consent requests appear here when submitted.</p><button class="btn btn-primary" onclick="showToast('Request queue refreshed.', 'success')">Refresh requests</button></div></div>`;
  if (tool === 'earnings') { const completed = todayAppointments.filter(a => a.status === 'COMPLETED').length; return `<div class="grid-col-3">${['Today', 'This week', 'This month'].map((label, i) => `<div class="card"><div class="card-body"><div class="text-muted text-sm">${label}</div><div class="kpi-number">₹${completed * 500 * (i + 1)}</div><div class="text-sm">${completed * (i + 1)} completed visits</div></div></div>`).join('')}</div>`; }
  if (tool === 'reports') return `<div class="card"><div class="card-body"><p class="mb-3">Export the current appointment register for your records.</p><button class="btn btn-primary" onclick="exportAppointmentsCsv()"><i class="fa-solid fa-download"></i> Download CSV report</button></div></div>`;
  if (tool === 'patients') return table(todayAppointments.map(a => `<tr><td>${escapeHtml(a.patient_name)}</td><td>${escapeHtml(a.slot_time)}</td><td>${escapeHtml(a.status)}</td><td><button class="btn btn-secondary btn-xs" onclick="switchReceptionPage('appointments')">Open appointment</button></td></tr>`).join(''), ['Patient', 'Time', 'Status', 'Action']);
  if (tool === 'doctors') return table(allDoctors.map(d => `<tr><td>${escapeHtml(d.full_name)}</td><td>${escapeHtml(d.specialization)}</td><td>${d.available_today ? 'Available today' : 'Unavailable'}</td><td><button class="btn btn-secondary btn-xs" onclick="openBookAppointmentModalWithDoctor('${d.id}')">Book</button></td></tr>`).join(''), ['Doctor', 'Specialty', 'Availability', 'Action']);
  if (tool === 'ambulance') {
    // Standard ambulance booking UI
    setTimeout(fetchAmbulanceRequests, 100);
    return `<div class="container-fluid">
       <h4 class="mb-3">Ambulance Services</h4>
       <div class="row">
          <div class="col-md-7">
             <h5 class="mb-3">Active Requests</h5>
             <div id="amb-requests-list">
                <p class="text-muted"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</p>
             </div>
          </div>
          <div class="col-md-5">
             <div class="card"><div class="card-body">
                <h5 class="mb-3">Request Ambulance</h5>
                <input id="amb-pickup" class="form-control mb-2" placeholder="Pickup Location*">
                <select id="amb-type" class="form-control mb-2">
                   <option value="Basic Life Support">Basic Life Support (BLS)</option>
                   <option value="Advanced Life Support">Advanced Life Support (ALS/ICU)</option>
                   <option value="Patient Transport">Patient Transport (Non-Emergency)</option>
                </select>
                <input id="amb-contact" class="form-control mb-3" placeholder="Contact Number*">
                <button class="btn btn-primary w-100" onclick="submitAmbulanceRequest()">Submit Request</button>
             </div></div>
          </div>
       </div>
    </div>`;
  }
  if (tool === 'vaccinations') {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Sort logic
    const sorted = [...fetchedVaccinations].sort((a,b) => new Date(b.date) - new Date(a.date));
    
    const vacHTML = sorted.map(r => {
        const isUpcoming = r.next_due_date && r.next_due_date >= todayStr;
        return `<div class="card mb-2"><div class="card-body" style="display:flex; justify-content:space-between; align-items:center; border-left: 4px solid ${isUpcoming ? '#eab308' : '#10b981'};">
           <div>
             <h5 style="margin:0; color:#0f172a;">${escapeHtml(r.vaccine_name)} ${r.dose ? '(Dose: '+escapeHtml(r.dose)+')' : ''}</h5>
             <small class="text-muted"><i class="fa-regular fa-calendar"></i> Given: ${escapeHtml(r.date)} | Clinic: ${escapeHtml(r.clinic || 'N/A')}</small>
             ${r.next_due_date ? `<div style="font-size:12px; color:${isUpcoming ? '#b45309' : '#64748b'}; margin-top:4px;"><i class="fa-solid fa-clock-rotate-left"></i> Next Due: ${r.next_due_date}</div>` : ''}
           </div>
           <div>
             <button class="btn btn-danger btn-sm" onclick="deleteVaccination('${r.id}')"><i class="fa-solid fa-trash"></i></button>
           </div>
        </div></div>`;
    }).join('') || '<p class="text-muted">No vaccinations found.</p>';

    return `<div class="container-fluid">
       <h4 class="mb-3">Vaccinations</h4>
       <div class="row">
          <div class="col-md-7">
             ${vacHTML}
          </div>
          <div class="col-md-5">
             <div class="card"><div class="card-body">
                <h5 class="mb-3">Add Vaccine</h5>
                <input id="new-vac-name" class="form-control mb-2" placeholder="Vaccine Name (e.g. COVID-19)*">
                <input id="new-vac-dose" class="form-control mb-2" placeholder="Dose (e.g. 1st Dose)">
                <input id="new-vac-clinic" class="form-control mb-2" placeholder="Clinic/Hospital">
                <label class="text-xs text-muted mb-0">Date Given*</label>
                <input id="new-vac-date" type="date" class="form-control mb-2" title="Date Given*">
                <label class="text-xs text-muted mb-0">Next Due Date (Optional)</label>
                <input id="new-vac-next" type="date" class="form-control mb-3" title="Next Due Date">
                <button class="btn btn-primary w-100" onclick="addVaccination()">Save Vaccine</button>
             </div></div>
          </div>
       </div>
    </div>`;
  }
  if (tool === 'family') return familyWorkspace();
  if (tool === 'voice-search') return `<div class="card"><div class="card-body"><p class="mb-3">Speak in English, Hindi, or Marathi to find doctors and specialties.</p><button class="btn btn-primary" onclick="startVoiceDoctorSearch()"><i class="fa-solid fa-microphone"></i> Start voice search</button><p id="voice-search-result" class="auth-message mt-3" aria-live="polite"></p></div></div>`;
  if (tool === 'availability') return `<div class="card"><div class="card-body"><p class="mb-3">Check a doctor's consultation calendar before booking.</p><button class="btn btn-primary" onclick="showAvailability()">Load availability</button><div id="availability-results" class="mt-3"></div></div></div>`;
  if (tool === 'follow-ups') return `<div class="card"><div class="card-body"><p>Completed consultations will appear here for follow-up scheduling.</p><button class="btn btn-primary" onclick="showToast('Follow-up reminder created.', 'success')">Create follow-up reminder</button></div></div>`;

  if (tool === 'priority') return `<div class="card"><div class="card-body"><p class="mb-3">Use only after clinical triage confirms an emergency.</p><button class="btn btn-danger" onclick="prioritizeQueuePatient()">Mark next patient as emergency priority</button></div></div>`;
  if (tool === 'billing') return `<div class="card"><div class="card-body"><div class="form-row"><input id="billing-patient" class="form-control" placeholder="Patient name"><input id="billing-amount" class="form-control" type="number" min="0" placeholder="Amount in rupees"></div><button class="btn btn-primary mt-3" onclick="createBillingEntry()">Record payment</button><div id="billing-history" class="mt-3"></div></div></div>`;
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
    const rows = (data.reminders || []).map(item => ({ id: item.id, name: item.medicine_name, time: item.reminder_time }));
    saveLocalItems('healthsync-reminders', rows);
  } catch { showToast('Unable to load reminders.', 'error'); }
  remindersLoaded = true;
}
window.addReminder = async function () {
  const name = document.getElementById('reminder-name').value.trim(), time = document.getElementById('reminder-time').value;
  if (!name || !time) return showToast('Enter a medicine and time.', 'warning');
  const response = await fetch(API_BASE + '/reminders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: currentUser?.patientId || 'pat1', medicineName: name, reminderTime: time }) });
  const data = await response.json();
  if (!data.success) return showToast(data.message || 'Could not save reminder.', 'error');
  remindersLoaded = false; openPortalTool('patient', 'reminders'); showToast('Reminder saved.', 'success');
};
window.removeReminder = async function (index) {
  const rows = localItems('healthsync-reminders'), item = rows[index];
  if (item?.id) await fetch(API_BASE + '/reminders/' + encodeURIComponent(item.id), { method: 'DELETE' });
  else { rows.splice(index, 1); saveLocalItems('healthsync-reminders', rows); }
  remindersLoaded = false; openPortalTool('patient', 'reminders'); showToast('Reminder removed.', 'success');
};
window.sendPortalMessage = function (role) { const input = document.getElementById('message-text'), text = input.value.trim(); if (!text) return; const key = `healthsync-${role}-messages`, rows = localItems(key); rows.push({ from: 'You', text }); saveLocalItems(key, rows); openPortalTool(role, 'messages'); showToast('Message sent.', 'success'); };
window.saveSettings = async function () {
  const language = document.getElementById('setting-language').value;
  const notificationsEnabled = document.getElementById('setting-notifications')?.checked !== false;
  const smsEnabled = document.getElementById('setting-sms')?.checked !== false;
  const reminderEnabled = document.getElementById('setting-reminders')?.checked !== false;
  applyLanguage(language);
  if (!currentUser?.id) return showToast('Settings saved on this device. Sign in to sync them.', 'info');
  try {
    const response = await fetch(API_BASE + '/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUser.id, language, notificationsEnabled, smsEnabled, reminderEnabled }) });
    const data = await response.json();
    showToast(data.success ? 'Settings saved and synced.' : 'Could not sync settings.', data.success ? 'success' : 'error');
  } catch { showToast('Could not sync settings.', 'error'); }
};
window.submitSupport = function () { const text = document.getElementById('support-message').value.trim(); if (!text) return showToast('Describe your issue first.', 'warning'); const rows = localItems('healthsync-support'); rows.push({ text, createdAt: new Date().toISOString() }); saveLocalItems('healthsync-support', rows); document.getElementById('support-message').value = ''; showToast('Support request sent.', 'success'); };
window.logoutCurrentUser = async function () {
    if (currentUser?.refreshToken) {
      try {
        await fetch(`${API_BASE}/auth/logout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: currentUser.refreshToken }) });
      } catch (e) { console.error('Logout error', e); }
    }
    localStorage.removeItem('healthsync-session');
    sessionStorage.removeItem('healthsync-language-confirmed');
    sessionStorage.removeItem('healthsync-pending-mobile');
    currentUser = null;
    disconnectSocket();
    
    // Secure logout: Use replace to prevent back button navigation to protected dashboard pages
    window.location.replace(window.location.pathname);
  };
window.exportAppointmentsCsv = function () { const rows = [['Patient', 'Doctor', 'Date', 'Time', 'Status'], ...todayAppointments.map(a => [a.patient_name, a.doctor_name, a.slot_date, a.slot_time, a.status])]; const csv = rows.map(row => row.map(value => `"${String(value || '').replace(/"/g, '""')}"`).join(',')).join('\n'); const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); link.download = 'healthsync-appointments.csv'; link.click(); URL.revokeObjectURL(link.href); };

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
    const data = await requestJson('/appointments');
    if (data && data.success) {
      todayAppointments = data.appointments || [];
      renderAppointmentsList();
    }
  } catch (err) {
    console.error('Error fetching today appointments:', err);
    todayAppointments = [];
    renderAppointmentsList(); // Render empty states if it fails
  }
}

async function fetchPrescriptions() {
  try {
    const data = await requestJson('/prescriptions');
    if (data && data.success) {
      patientPrescriptions = data.prescriptions || [];
      if (typeof renderPatientDashboardPrescriptions === 'function') renderPatientDashboardPrescriptions();
      if (typeof renderDoctorPatientPrescriptions === 'function') renderDoctorPatientPrescriptions();
    }
  } catch (err) {
    console.error('Error fetching prescriptions:', err);
  }
}

async function fetchNextAppointment() {
  if (currentUser?.role !== 'PATIENT') return;
  try {
    const data = await requestJson('/appointments/next');
    renderNextAppointment(data?.success ? data.appointment : null);
  } catch (err) {
    console.error('Error fetching next appointment:', err);
    renderNextAppointment(null);
  }
}

async function fetchHealthRecords() {
  if (currentUser?.role !== 'PATIENT') return;
  try {
    const data = await requestJson('/records');
    renderHealthRecordsList(data?.success ? data.records : []);
  } catch (err) {
    console.error('Error fetching records:', err);
    renderHealthRecordsList([]);
  }
}

function renderNextAppointment(appt) {
  const container = document.getElementById('patient-dashboard-upcoming-appt');
  if (!container) return;
  if (!appt) {
    container.innerHTML = `
      <div class="new-card upcoming-card" style="align-items: center; justify-content: center; min-height: 120px; text-align: center; border-style: dashed; padding: 24px;">
        <i class="fa-regular fa-calendar-xmark" style="font-size: 24px; color: var(--text-muted); margin-bottom: 8px;"></i>
        <p style="font-size: 14px; color: var(--text-muted); margin: 0 0 12px 0;">No upcoming appointment</p>
        <button class="btn btn-primary btn-sm" onclick="switchPatientPage('doctors')">Book Appointment</button>
      </div>`;
    return;
  }

  const dateObj = new Date(`${appt.slot_date}T12:00:00`);
  const displayDate = Number.isNaN(dateObj.getTime()) ? appt.slot_date : `${dateObj.getDate()} ${dateObj.toLocaleDateString('en-IN', { month: 'short' })} ${dateObj.getFullYear()}`;
  const docName = appt.doctor_name || appt.doctorName || appt.doctor || 'HealthSync Doctor';
  const clinic = appt.clinic_name || appt.clinic || appt.hospital_name || 'City Heart Clinic';

  const statusStr = String(appt.status).toUpperCase();
  const isVideo = appt.type === 'video' || appt.appointment_type === 'video' || String(appt.mode).toLowerCase() === 'video';
  const timeStr = appt.slot_time || appt.time || '05:00 PM';
  
  let consultationBtn = '';
  if (isVideo) {
    if (['CHECKED IN', 'WAITING', 'IN PROGRESS', 'ACTIVE', 'JOINED', 'CONFIRMED'].includes(statusStr)) {
      consultationBtn = `<button class="btn btn-primary flex-1" onclick="if(typeof joinConsultation==='function') joinConsultation('${appt.id}'); else alert('Consultation starting soon!');"><i class="fa-solid fa-video" style="margin-right: 8px;"></i> Join Consultation</button>`;
    } else {
      consultationBtn = `<button class="btn btn-primary flex-1" disabled style="opacity: 0.6; cursor: not-allowed;"><i class="fa-solid fa-video" style="margin-right: 8px;"></i> Available at ${timeStr}</button>`;
    }
  } else {
    consultationBtn = `<button class="btn btn-primary flex-1"><i class="fa-solid fa-diamond-turn-right" style="margin-right: 8px;"></i> Get Directions</button>`;
  }

  container.innerHTML = `
    <div class="new-card upcoming-card">
      <div class="new-card-header">
        <div class="header-title">
          <div class="icon-box-purple"><i class="fa-regular fa-calendar-check" style="color: #7c3aed; font-size: 16px;"></i></div>
          <span class="fw-bold text-dark" style="font-size: 15px;">Upcoming Appointment</span>
        </div>
        <button class="icon-btn-small" style="color: #94a3b8; background: transparent; border: none; font-size: 16px;"><i class="fa-solid fa-ellipsis-vertical"></i></button>
      </div>
      
      <div class="upcoming-doctor-info">
        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(docName)}&background=5a9e46&color=fff" alt="Doctor" class="doc-avatar-lg">
        <div class="doc-details">
          <h4 class="fw-bold text-dark m-0" style="font-size: 16px;">${escapeHtml(docName)}</h4>
          <div class="doc-specialty text-muted" style="font-size: 13px; margin-top: 2px;">${appt.specialty || 'General Physician'}</div>
          <div class="doc-location text-muted mt-1" style="font-size: 12px; margin-top: 6px;"><i class="fa-solid fa-location-dot" style="margin-right: 4px;"></i> ${escapeHtml(clinic)}</div>
        </div>
      </div>
      
      <div class="upcoming-datetime">
        <div class="dt-item"><i class="fa-regular fa-calendar" style="margin-right: 6px;"></i> ${displayDate}</div>
        <div class="dt-dot" style="margin: 0 12px; font-size: 20px; line-height: 0;">&bull;</div>
        <div class="dt-item"><i class="fa-regular fa-clock" style="margin-right: 6px;"></i> ${timeStr}</div>
        <div class="status-pill green-pill ml-auto">${escapeHtml(appt.status || 'Confirmed')}</div>
      </div>
      
      <div class="upcoming-actions">
        <button class="btn btn-outline flex-1" onclick="if(typeof viewAppointmentDetails==='function') viewAppointmentDetails('${appt.id}')">View Details</button>
        ${consultationBtn}
      </div>
    </div>`;
}

window.viewAppointmentDetails = function (id) {
  const appt = todayAppointments.find(a => a.id === id);
  if (!appt) return;

  const body = document.getElementById('appt-details-body');
  const actions = document.getElementById('appt-details-actions');

  const docName = appt.doctor_name || appt.doctorName || appt.doctor || 'HealthSync Doctor';
  const clinic = appt.clinic_name || appt.clinic || appt.hospital_name || 'HealthSync Partner Clinic';
  const dateObj = new Date(`${appt.slot_date}T12:00:00`);
  const displayDate = Number.isNaN(dateObj.getTime()) ? appt.slot_date : `${dateObj.getDate()} ${dateObj.toLocaleDateString('en-IN', { month: 'short' })} ${dateObj.getFullYear()}`;

  body.innerHTML = `
    <div style="background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #e2e8f0;">
      <h4 style="margin: 0; font-size: 16px; font-weight: 700; color: #0f172a;">${escapeHtml(docName)}</h4>
      <p style="margin: 2px 0 0 0; font-size: 13px; color: var(--text-muted);">${escapeHtml(clinic)}</p>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
      <div>
        <p style="margin: 0; font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Date</p>
        <p style="margin: 2px 0 0 0; font-size: 14px; font-weight: 600; color: #1e293b;">${displayDate}</p>
      </div>
      <div>
        <p style="margin: 0; font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Time</p>
        <p style="margin: 2px 0 0 0; font-size: 14px; font-weight: 600; color: #1e293b;">${escapeHtml(appt.slot_time || appt.time)}</p>
      </div>
      <div>
        <p style="margin: 0; font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Appointment ID</p>
        <p style="margin: 2px 0 0 0; font-size: 14px; font-weight: 600; color: #1e293b;">${escapeHtml(appt.id.split('-').pop().toUpperCase())}</p>
      </div>
      <div>
        <p style="margin: 0; font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Consultation Fee</p>
        <p style="margin: 2px 0 0 0; font-size: 14px; font-weight: 600; color: #1e293b;"><i class="fa-solid fa-indian-rupee-sign" style="font-size: 12px;"></i> ${appt.consultation_fee || 500}</p>
      </div>
    </div>
    <div>
      <p style="margin: 0; font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Status</p>
      <span style="display: inline-block; background: #e0e7ff; color: #4f46e5; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; margin-top: 4px;">${escapeHtml(appt.status)}</span>
      ${appt.token_number ? `<span style="display: inline-block; background: #fef3c7; color: #d97706; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; margin-top: 4px; margin-left: 8px;">Token: ${escapeHtml(appt.token_number)}</span>` : ''}
    </div>
  `;

  const mapsLink = `https://www.google.com/maps?q=${encodeURIComponent(clinic)}`;
  const canCancel = ['WAITING', 'CONFIRMED'].includes(String(appt.status).trim().toUpperCase());

  actions.innerHTML = `
    <button class="btn btn-secondary" style="flex: 1;" onclick="window.open('${mapsLink}', '_blank')"><i class="fa-solid fa-location-arrow"></i> Get Directions</button>
    ${canCancel ? `<button class="btn btn-danger" style="flex: 1;" onclick="cancelAppointment('${appt.id}'); closeModal('modal-appointment-details');">Cancel</button>` : ''}
    ${canCancel ? `<button class="btn btn-primary" style="flex: 1;" onclick="openBookAppointmentModalWithDoctor('${appt.doctor_id || ''}'); closeModal('modal-appointment-details');">Reschedule</button>` : ''}
  `;

  openModal('modal-appointment-details');
};


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
  const term = document.getElementById('pt-doc-search-input')?.value.trim().toLowerCase() || '';
  const doctors = allDoctors.filter(doc => !term || [doc.name, doc.specialization, doc.clinic, doc.languages].some(value => String(value || '').toLowerCase().includes(term)));
  container.innerHTML = doctors.length ? doctors.map(doc => `
    <div style="background: white; border-radius: 12px; padding: 16px; border: 1px solid #e5e7eb; box-shadow: 0 4px 15px rgba(0,0,0,0.05); transition: transform 0.3s ease, box-shadow 0.3s ease;" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 25px rgba(0,0,0,0.1)'" onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 4px 15px rgba(0,0,0,0.05)'">
      <div style="display: flex; gap: 16px;">
        <div style="width: 80px; height: 100px; background: #e5e7eb; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative;">
          <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(doc.name)}&background=random&color=fff&size=100" style="width: 100%; height: 100%; object-fit: cover;">
          <div style="position: absolute; bottom: 0; background: #16a34a; width: 100%; color: white; text-align: center; font-size: 10px; font-weight: bold; padding: 2px 0;">Available</div>
        </div>
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <h4 style="margin: 0; font-size: 16px; font-weight: 800; color: #0F172A; display: flex; align-items: center; gap: 6px;">
              ${escapeHtml(doc.name)}
              <i class="fa-solid fa-badge-check" style="color: #2563EB; font-size: 14px;" title="Verified Medical License"></i>
            </h4>
            <span style="background: #fef3c7; color: #d97706; font-size: 11px; padding: 2px 8px; border-radius: 20px; font-weight: bold;"><i class="fa-solid fa-star"></i> Top Rated</span>
          </div>
          
          <div style="display: flex; align-items: center; gap: 8px; margin-top: 6px; margin-bottom: 8px;">
            <span style="background: #16a34a; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;">${doc.rating} ★</span>
            <span style="color: #64748B; font-size: 13px; font-weight: 500;"><u>${doc.reviews} Verified Reviews</u></span>
          </div>
          
          <p style="color: #374151; font-size: 14px; margin: 4px 0; font-weight: 500;">
            <i class="fa-solid fa-stethoscope" style="color:#64748B; width:16px;"></i> ${escapeHtml(doc.specialization)}
          </p>
          <p style="color: #64748B; font-size: 13px; margin: 4px 0;">
            <i class="fa-solid fa-briefcase-medical" style="color:#64748B; width:16px;"></i> ${escapeHtml(doc.exp || '10+ Years Exp.')} • <i class="fa-solid fa-language" style="color:#64748B; margin-left:4px;"></i> ${escapeHtml(doc.languages || 'English, Hindi')}
          </p>
          <p style="color: #0F172A; font-size: 14px; font-weight: 700; margin: 6px 0;">
            <i class="fa-solid fa-indian-rupee-sign" style="color:#64748B; width:16px;"></i> ${doc.fee || 500} Consultation Fee
          </p>
        </div>
      </div>
      <div style="display: flex; gap: 12px; margin-top: 16px; border-top: 1px solid #f3f4f6; padding-top: 16px;">
        <button style="flex: 1; background: #0066cc; color: white; border: none; padding: 12px; border-radius: 6px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;" onclick="openBookAppointmentModalWithDoctor('${doc.id}')">Book Appointment</button>
      </div>
    </div>
  `).join('') : `<div style="padding: 40px 20px; text-align: center; color: #6b7280; background: #f9fafb; border-radius: 12px; margin-top: 12px;"><i class="fa-solid fa-user-doctor" style="font-size: 32px; margin-bottom: 12px; opacity: 0.5;"></i><p style="margin: 0;">No doctors found matching your criteria</p><button class="btn btn-secondary mt-3" onclick="clearPatientDoctorSearch()">Clear Search</button></div>`;
}
window.handlePatientDocSearch = function () { renderPatientDoctorsList(); };
window.clearPatientDoctorSearch = function () { const input = document.getElementById('pt-doc-search-input'); if (input) input.value = ''; renderPatientDoctorsList(); };

function renderHealthRecordsList(records) {
  const container = document.getElementById('records-list-container');
  if (!container) return;
  if (!records || records.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="es-icon"><i class="fa-solid fa-folder-open"></i></div>
        <div class="es-text">No health records yet</div>
        <div class="es-sub">Upload medical reports, prescriptions, and lab tests to view them here.</div>
        <button class="btn btn-primary mt-3" onclick="openUploadRecordModal()">Upload Medical Report</button>
      </div>`;
    return;
  }

  container.innerHTML = records.map(record => `
    <div style="border: 1px solid var(--border); border-radius: 8px; padding: 16px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; background: #fff;">
      <div style="display: flex; gap: 16px; align-items: center;">
        <div style="width: 40px; height: 40px; background: #f1f5f9; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #0066cc; font-size: 20px;">
          <i class="${record.type === 'Lab Report' ? 'fa-solid fa-flask' : (record.type === 'Imaging' ? 'fa-solid fa-x-ray' : 'fa-solid fa-file-medical')}"></i>
        </div>
        <div>
          <h4 style="margin: 0; font-size: 15px; font-weight: 600; color: #1e293b;">${escapeHtml(record.title)}</h4>
          <p style="margin: 2px 0 0 0; font-size: 13px; color: var(--text-muted);">${escapeHtml(record.description)}</p>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 8px; display: flex; gap: 12px;">
            <span><i class="fa-regular fa-calendar" style="margin-right: 4px;"></i>${record.date}</span>
            <span><i class="fa-solid fa-user-doctor" style="margin-right: 4px;"></i>${escapeHtml(record.doctor_name)}</span>
          </div>
        </div>
      </div>
      <div>
        <button class="btn btn-secondary btn-sm"><i class="fa-solid fa-download"></i> View</button>
      </div>
    </div>
  `).join('');
}

window.openSymptomDoctorsModal = function (symptom) {
  const container = document.getElementById('symptom-doctors-list');
  const title = document.getElementById('modal-symptom-title');
  if (!container || !title) return;

  title.innerText = `Doctors for ${symptom}`;

  const term = symptom.toLowerCase().split(' / ')[0]; // Handle "Swine Flu / Fever" etc.
  const doctors = allDoctors.filter(doc => [doc.name, doc.specialization, doc.clinic, doc.languages].some(value => String(value || '').toLowerCase().includes(term)));

  container.innerHTML = doctors.length ? doctors.map(doc => `
    <div style="background: white; border-radius: 12px; padding: 16px; border: 1px solid #e5e7eb; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
      <div style="display: flex; gap: 16px;">
        <div style="width: 80px; height: 100px; background: #e5e7eb; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative;">
          <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(doc.name)}&background=random&color=fff&size=100" style="width: 100%; height: 100%; object-fit: cover;">
          <div style="position: absolute; bottom: 0; background: #16a34a; width: 100%; color: white; text-align: center; font-size: 10px; font-weight: bold; padding: 2px 0;">Available</div>
        </div>
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <h4 style="margin: 0; font-size: 16px; font-weight: 800; color: #0F172A; display: flex; align-items: center; gap: 6px;">
              ${escapeHtml(doc.name)}
              <i class="fa-solid fa-badge-check" style="color: #2563EB; font-size: 14px;"></i>
            </h4>
            <span style="background: #fef3c7; color: #d97706; font-size: 11px; padding: 2px 8px; border-radius: 20px; font-weight: bold;"><i class="fa-solid fa-star"></i> Top Rated</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; margin-top: 6px; margin-bottom: 8px;">
            <span style="background: #16a34a; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;">${doc.rating} ★</span>
            <span style="color: #64748B; font-size: 13px; font-weight: 500;"><u>${doc.reviews} Reviews</u></span>
          </div>
          <p style="color: #374151; font-size: 14px; margin: 4px 0; font-weight: 500;">
            <i class="fa-solid fa-stethoscope" style="color:#64748B; width:16px;"></i> ${escapeHtml(doc.specialization)}
          </p>
          <p style="color: #64748B; font-size: 13px; margin: 4px 0;">
            <i class="fa-solid fa-indian-rupee-sign" style="color:#64748B; width:16px;"></i> ${doc.fee || 500} Fee
          </p>
        </div>
      </div>
      <div style="display: flex; gap: 12px; margin-top: 16px; border-top: 1px solid #f3f4f6; padding-top: 16px;">
        <button style="flex: 1; background: #0066cc; color: white; border: none; padding: 10px; border-radius: 6px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;" onclick="openBookAppointmentModalWithDoctor('${doc.id}')"><i class="fa-solid fa-calendar-check"></i> Book Now</button>
      </div>
    </div>
  `).join('') : `<div style="padding: 40px 20px; text-align: center; color: #6b7280; background: #f9fafb; border-radius: 12px;"><i class="fa-solid fa-user-doctor" style="font-size: 32px; margin-bottom: 12px; opacity: 0.5;"></i><p style="margin: 0;">No doctors found for ${symptom}</p></div>`;

  const modal = document.getElementById('modal-symptom-doctors');
  if (modal) modal.classList.add('active');
};

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
      <button class="btn btn-secondary btn-xs" style="margin-left: 4px;" onclick="downloadPrescriptionPdf('${rx.id}')">PDF</button>
    </div>
  `).join('');
}

window.downloadPrescriptionPdf = function (rxId) {
  if (!currentUser?.token) return showToast('You must be logged in', 'error');
  const url = `${API_BASE}/prescriptions/pdf/${rxId}?token=${currentUser.token}`;
  window.open(url, '_blank');
};

window.searchDoctorsFromDashboard = function () {
  const term = document.getElementById('dashboard-doctor-search')?.value.trim().toLowerCase() || '';
  switchPatientPage('doctors');
  const search = document.getElementById('pt-doc-search-input');
  if (search) {
    search.value = term;
    search.dispatchEvent(new Event('input', { bubbles: true }));
  }
};
let sosProgressInterval = null;

window.startSOSCountdown = function () {
  const progressEl = document.getElementById('sos-progress');
  const textEl = document.getElementById('sos-btn-text');
  if (!progressEl || !textEl) return;

  if (textEl.textContent === 'Dispatched') return; // already dispatched

  let progress = 0;
  progressEl.style.width = '0%';

  sosProgressInterval = setInterval(() => {
    progress += 100 / 30; // 3 seconds = 30 intervals of 100ms
    progressEl.style.width = `${Math.min(progress, 100)}%`;
  }, 100);

  sosTimer = setTimeout(() => {
        clearInterval(sosProgressInterval);
        textEl.textContent = 'Triggering';
        progressEl.style.width = '100%';
        window.showEmergencyHelp();
      }, 3000);
};

window.cancelSOSCountdown = function () {
  const progressEl = document.getElementById('sos-progress');
  const textEl = document.getElementById('sos-btn-text');
  if (textEl && textEl.textContent === 'Dispatched') return;

  if (sosTimer) clearTimeout(sosTimer);
  if (sosProgressInterval) clearInterval(sosProgressInterval);
  if (progressEl) progressEl.style.width = '0%';
};

window.showEmergencyHelp = function () {
  showToast('Gathering exact live coordinates for Emergency SOS...', 'info');
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        await triggerEmergencySOS(lat, lng);
      },
      async (error) => {
        console.warn('Geolocation failed or denied. Using default Pune location.', error);
        // Fallback to default Pune coordinates
        await triggerEmergencySOS(18.5204, 73.8567);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  } else {
    // Geolocation not supported
    triggerEmergencySOS(18.5204, 73.8567);
  }
};

async function triggerEmergencySOS(lat, lng) {
    if (typeof appSocket !== 'undefined' && appSocket && appSocket.connected) {
      appSocket.emit('sos_trigger', {
        patientId: currentUser?.patientId || 'pat1',
        patientName: currentUser?.name || 'Emergency Patient',
        phone: currentUser?.mobile || '9999999999',
        lat: lat,
        lng: lng,
        address: 'Current Location'
      });
      showToast('Emergency SOS triggered!', 'success');
      showSOSActiveModal();
    } else {
      showToast('Cannot connect to emergency services. Please call an ambulance directly.', 'error');
    }
  }
  
  function showSOSActiveModal() {
      let m = document.getElementById('sos-active-modal');
      if (!m) {
          m = document.createElement('div');
          m.id = 'sos-active-modal';
          m.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
          document.body.appendChild(m);
      }
      m.innerHTML = `<div class="card" style="width:100%;max-width:400px;">
        <div class="card-body text-center" style="padding: 30px 20px;">
          <div class="mb-3">
             <i class="fa-solid fa-truck-medical fa-beat" style="font-size:40px;color:#ef4444;"></i>
          </div>
          <h3 class="mb-2 text-danger">Emergency SOS Active</h3>
          <p class="text-muted mb-4" id="sos-modal-status">Pending: Waiting for nearby hospital to assign an ambulance...</p>
          <div id="sos-modal-driver-info" class="mb-4" style="display:none; background:#f8fafc; padding:15px; border-radius:8px; border:1px solid #e2e8f0;">
             <h5 class="mb-1" style="color:#0f172a; font-weight:600;"><i class="fa-solid fa-user"></i> <span id="sos-driver-name"></span></h5>
             <div class="text-muted mb-2"><i class="fa-solid fa-truck"></i> <span id="sos-driver-vehicle"></span></div>
             <a id="sos-driver-call" href="#" class="btn btn-success btn-sm w-100"><i class="fa-solid fa-phone"></i> Call Driver</a>
          </div>
          <button class="btn btn-outline w-100" onclick="document.getElementById('sos-active-modal').remove()">Close Window</button>
        </div>
      </div>`;
  }


// ---------------------------------------------------------------------------
// RENDERING - APPOINTMENTS LIST
// ---------------------------------------------------------------------------
function renderAppointmentsList() {
  // Render Patient Portal Appointments
  const ptUpcoming = document.getElementById('pt-upcoming-appt-container');
  const ptCompleted = document.getElementById('pt-completed-appt-container');
  const ptCancelled = document.getElementById('pt-cancelled-appt-container');

  const status = appt => String(appt.status || '').trim().toUpperCase();
  const upcomingList = todayAppointments.filter(a => ['CONFIRMED', 'CHECKED IN', 'IN PROGRESS', 'WAITING', 'IN CONSULTATION'].includes(status(a)));
  const completedList = todayAppointments.filter(a => status(a) === 'COMPLETED');
  const cancelledList = todayAppointments.filter(a => ['CANCELLED', 'NO SHOW'].includes(status(a)));

  const emptyAppointments = (type) => {
    const content = {
      upcoming: ['No upcoming appointments', 'Book an appointment to see your confirmed visits and queue details here.', 'Book an appointment'],
      completed: ['No completed appointments yet', 'After a consultation is completed, its visit summary will appear here.', 'Book an appointment'],
      cancelled: ['No cancelled appointments', 'Cancelled visits are kept here so your upcoming appointments stay uncluttered.', 'View upcoming appointments']
    }[type];
    const action = type === 'cancelled'
      ? "showPatientAppointmentTab('pt-appt-upcoming')"
      : "switchPatientPage('doctors')";
    return `<div class="empty-state appointment-empty-state"><div class="es-icon"><i class="fa-regular fa-calendar"></i></div><div class="es-text">${content[0]}</div><div class="es-sub">${content[1]}</div><button class="btn btn-primary btn-sm mt-3" onclick="${action}"><i class="fa-solid fa-calendar-plus"></i> ${content[2]}</button></div>`;
  };

  const patientCard = (appt, category) => {
    const rawDate = appt.slot_date || appt.date || appt.appointment_date;
    const dateObj = rawDate ? new Date(`${String(rawDate).slice(0, 10)}T12:00:00`) : new Date();
    const validDate = Number.isNaN(dateObj.getTime()) ? new Date() : dateObj;
    const doctorName = appt.doctor_name || appt.doctorName || appt.doctor || 'HealthSync care team';
    const specialty = appt.specialization || appt.specialty || appt.reason || 'Consultation';
    const clinic = appt.clinic_name || appt.clinic || appt.hospital_name || 'HealthSync Partner Clinic';
    const token = appt.token_number || appt.token;
    const normalizedStatus = status(appt);
    const displayStatus = normalizedStatus === 'CHECKED IN' ? 'Checked in' : normalizedStatus === 'IN PROGRESS' ? 'In consultation' : normalizedStatus.replace(/\b\w/g, char => char.toUpperCase());
    const action = category === 'upcoming'
      ? `<button class="btn btn-danger btn-xs mt-2" onclick="cancelAppointment('${appt.id}')">Cancel</button>`
      : category === 'completed'
        ? `<button class="btn btn-secondary btn-xs mt-2" onclick="openBookAppointmentModalWithDoctor('${appt.doctor_id || ''}')">Book follow-up</button>`
        : `<button class="btn btn-primary btn-xs mt-2" onclick="openBookAppointmentModalWithDoctor('${appt.doctor_id || ''}')">Book again</button>`;
    return `<div class="appt-card">
      <div class="appt-date-box"><div class="appt-day">${validDate.getDate()}</div><div class="appt-mon">${validDate.toLocaleDateString('en-IN', { month: 'short' })}</div></div>
      <div class="appt-info">
        <div class="appt-doc">${escapeHtml(doctorName)}</div>
        <div class="appt-spec">${escapeHtml(specialty)}</div>
        <div class="appt-clinic"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(clinic)}</div>
        <div class="appt-time"><i class="fa-solid fa-clock"></i> ${escapeHtml(appt.slot_time || appt.time || 'Time to be confirmed')}</div>
      </div>
      <div class="appt-actions">
        <span class="badge ${getBadgeClass(normalizedStatus)}">${escapeHtml(displayStatus)}</span>
        ${token ? `<span class="token-chip mt-2">Token ${escapeHtml(token)}</span>` : ''}
        ${action}
      </div>
    </div>`;
  };

  if (ptUpcoming) ptUpcoming.innerHTML = upcomingList.length ? upcomingList.map(appt => patientCard(appt, 'upcoming')).join('') : emptyAppointments('upcoming');
  if (ptCompleted) ptCompleted.innerHTML = completedList.length ? completedList.map(appt => patientCard(appt, 'completed')).join('') : emptyAppointments('completed');
  if (ptCancelled) ptCancelled.innerHTML = cancelledList.length ? cancelledList.map(appt => patientCard(appt, 'cancelled')).join('') : emptyAppointments('cancelled');

  // Render Doctor Panel List
  const docList = document.getElementById('doc-today-appointments-list');
  if (docList) {
    const listHtml = todayAppointments.length === 0
      ? `<p class="text-muted text-sm empty-state" style="padding: 20px;">No appointments today.</p>`
      : todayAppointments.map(appt => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'" onclick="selectDoctorAppointment('${appt.id}')">
          <div style="font-size: 13px; font-weight: 600; color: #1e293b; width: 90px;">${appt.slot_time}</div>
          <div style="flex: 1;">
            <h4 style="font-size: 13px; font-weight: 700; color: #0f172a; margin: 0; text-transform: uppercase;">${appt.patient_name}</h4>
            <p style="font-size: 11px; color: var(--text-muted); margin: 2px 0 0 0; text-transform: uppercase;">Consultation</p>
          </div>
          <div>
            <span style="background: ${appt.status === 'CONFIRMED' || appt.status === 'Waiting' ? '#e0e7ff' : (appt.status === 'COMPLETED' ? '#dcfce7' : '#fef3c7')}; color: ${appt.status === 'CONFIRMED' || appt.status === 'Waiting' ? '#4f46e5' : (appt.status === 'COMPLETED' ? '#16a34a' : '#d97706')}; font-size: 11px; padding: 4px 10px; border-radius: 100px; font-weight: 600;">${appt.status === 'CONFIRMED' || appt.status === 'Waiting' ? 'Upcoming' : appt.status}</span>
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
          <td>${escapeHtml(appt.doctor_name || appt.doctorName || appt.doctor || 'HealthSync care team')}</td>
          <td>${appt.slot_time}</td>
          <td><span class="badge ${getBadgeClass(appt.status)}">${appt.status}</span></td>
          <td>
            <div class="flex gap-2">
              ${appt.status === 'CONFIRMED' ? `<button class="btn btn-success btn-xs" onclick="updateAppointmentStatus('${appt.id}', 'Checked In')">Check-in</button>` : ''}
              ${appt.status === 'Checked In' ? `<button class="btn btn-primary btn-xs" onclick="updateAppointmentStatus('${appt.id}', 'Waiting')">Gen Token & Queue</button>` : ''}
              <button class="btn btn-secondary btn-xs" onclick="alert('View Patient Profile: ${appt.patient_name}')">View</button>
              ${!['CANCELLED', 'COMPLETED'].includes(String(appt.status || '').toUpperCase()) ? `<button class="btn btn-danger btn-xs" onclick="cancelAppointment('${appt.id}')">Cancel</button>` : ''}
            </div>
          </td>
        </tr>
      `).join('');
  }
}

// Helper badge class resolver
function getBadgeClass(status) {
  const value = String(status || '').trim().toUpperCase();
  if (value === 'COMPLETED') return 'badge-success';
  if (value === 'CONFIRMED') return 'badge-primary';
  if (value === 'WAITING' || value === 'CHECKED IN') return 'badge-warning';
  if (value === 'CANCELLED' || value === 'REJECTED') return 'badge-danger';
  return 'badge-secondary';
}

window.selectDoctorAppointment = function (id) {
  const appt = todayAppointments.find(a => a.id === id);
  if (!appt) return;

  const body = document.getElementById('doc-appt-body');
  const actions = document.getElementById('doc-appt-actions');

  body.innerHTML = `
    <div style="background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #e2e8f0;">
      <h4 style="margin: 0; font-size: 16px; font-weight: 700; color: #0f172a;">${escapeHtml(appt.patient_name)}</h4>
      <p style="margin: 2px 0 0 0; font-size: 13px; color: var(--text-muted);">Appointment ID: ${appt.id.split('-').pop().toUpperCase()}</p>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
      <div>
        <p style="margin: 0; font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Date</p>
        <p style="margin: 2px 0 0 0; font-size: 14px; font-weight: 600; color: #1e293b;">${appt.slot_date}</p>
      </div>
      <div>
        <p style="margin: 0; font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Time</p>
        <p style="margin: 2px 0 0 0; font-size: 14px; font-weight: 600; color: #1e293b;">${appt.slot_time}</p>
      </div>
    </div>
    <div>
      <p style="margin: 0; font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Status</p>
      <span class="badge ${getBadgeClass(appt.status)} mt-1">${escapeHtml(appt.status)}</span>
    </div>
  `;

  const s = String(appt.status || '').toUpperCase();
  actions.innerHTML = `
    <button class="btn btn-secondary" style="flex: 1 1 45%;" onclick="alert('Viewing patient history for ${appt.patient_name}')"><i class="fa-solid fa-file-medical"></i> View Patient</button>
    ${['PENDING', 'CONFIRMED'].includes(s) ? `<button class="btn btn-danger" style="flex: 1 1 45%;" onclick="updateAppointmentStatus('${appt.id}', 'Rejected'); closeModal('modal-doctor-appointment');">Reject</button>` : ''}
    ${['WAITING', 'CHECKED IN', 'CONFIRMED'].includes(s) ? `<button class="btn btn-primary" style="flex: 1 1 45%;" onclick="updateAppointmentStatus('${appt.id}', 'In Progress'); closeModal('modal-doctor-appointment');">Start Consultation</button>` : ''}
    ${s === 'IN PROGRESS' ? `<button class="btn btn-success" style="flex: 1 1 100%;" onclick="updateAppointmentStatus('${appt.id}', 'Completed'); closeModal('modal-doctor-appointment');">Complete Appointment</button>` : ''}
  `;

  openModal('modal-doctor-appointment');
};

window.updateAppointmentStatus = async function (id, newStatus) {
  try {
    const res = await fetch(`${API_BASE}/appointments/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': currentUser?.token ? `Bearer ${currentUser.token}` : ''
      },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) {
      showToast(`Appointment marked as ${newStatus}`, 'success');
      syncAllData(); // Refresh UI
    } else {
      showToast('Failed to update status', 'error');
    }
  } catch (err) {
    showToast('Network error updating status', 'error');
  }
};
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

window.filterQueueTable = function (btn, filterStatus) {
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
        <div>
          <button class="btn btn-secondary btn-xs" onclick="downloadPrescriptionPdf('${rx.id}')" style="margin-right: 8px;">PDF</button>
          <span class="badge badge-confirmed">Signed</span>
        </div>
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

function renderDoctorPatientReports() {
  const container = document.getElementById('doc-det-reports');
  if (!container) return;
  container.innerHTML = `<div class="flex flex-col gap-3">${doctorPatientReports.map(report => `
    <article class="report-row doctor-report-row">
      <div class="report-icon"><i class="fa-solid fa-file-medical" style="color:#2563eb;"></i></div>
      <div class="flex-1">
        <div class="report-name">${escapeHtml(report.name)}</div>
        <div class="report-meta">${escapeHtml(report.facility)} &bull; ${escapeHtml(report.date)}</div>
        <div class="text-sm mt-1">${escapeHtml(report.summary)}</div>
      </div>
      <div class="report-actions">
        <span class="badge ${report.status === 'Action needed' ? 'badge-pending' : 'badge-completed'}">${escapeHtml(report.status)}</span>
        <button class="btn btn-secondary btn-xs" onclick="showToast('Opening ${escapeHtml(report.name)} for clinical review.', 'info')"><i class="fa-solid fa-eye"></i> Review</button>
      </div>
    </article>`).join('')}</div>`;
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
window.switchRecordsSubtab = function (btn, type) {
  document.querySelectorAll('.records-menu-item').forEach(m => m.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const title = document.getElementById('records-subtab-title');
  if (title) title.innerText = type === 'timeline' ? 'Medical Timeline' : btn ? btn.innerText.trim() : 'Records';

  renderRecordsList(type);
};

function renderRecordsList(type) {
  const container = document.getElementById('records-list-container');
  if (!container) return;

  if (type === 'timeline') {
    // Collect timeline events
    const events = [];

    // 1. Appointments (Past)
    todayAppointments.forEach(appt => {
      const isPast = ['COMPLETED', 'CANCELLED'].includes(String(appt.status).toUpperCase());
      if (isPast) {
        events.push({
          date: new Date(appt.slot_date || appt.date),
          type: 'visit',
          title: `Doctor Visit - ${appt.doctor_name || appt.doctor}`,
          desc: `Consultation at ${appt.clinic_name || 'Clinic'} (${appt.status})`,
          icon: 'fa-user-doctor',
          color: '#3b82f6'
        });
      }
    });

    // 2. Records
    patientRecords.forEach(r => {
      events.push({
        date: new Date(r.date),
        type: 'record',
        title: `Uploaded Record: ${r.name}`,
        desc: `Added by ${r.doctor}`,
        icon: 'fa-file-medical',
        color: '#10b981'
      });
    });

    // Sort descending
    events.sort((a, b) => b.date - a.date);

    if (events.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="es-icon"><i class="fa-solid fa-clock-rotate-left"></i></div><div class="es-text">No health records yet.</div><div class="es-sub">Your medical timeline will appear here.</div></div>`;
      return;
    }

    let html = '<div class="timeline" style="position: relative; padding-left: 20px; border-left: 2px solid #e2e8f0; margin-top: 16px;">';
    events.forEach(e => {
      const dateStr = Number.isNaN(e.date.getTime()) ? 'Unknown Date' : e.date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
      html += `
        <div style="position: relative; margin-bottom: 24px; padding-left: 16px;">
          <div style="position: absolute; left: -30px; top: 0; width: 18px; height: 18px; border-radius: 50%; background: ${e.color}; border: 3px solid white; box-shadow: 0 0 0 1px #e2e8f0;"></div>
          <div style="font-size: 12px; font-weight: 700; color: #64748b; margin-bottom: 4px;">${dateStr}</div>
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
            <div style="font-weight: 700; font-size: 14px; color: #0f172a; margin-bottom: 4px;"><i class="fa-solid ${e.icon}" style="color: ${e.color}; margin-right: 6px;"></i>${escapeHtml(e.title)}</div>
            <div style="font-size: 13px; color: #64748b;">${escapeHtml(e.desc)}</div>
          </div>
        </div>
      `;
    });
    html += '</div>';
    container.innerHTML = html;
    return;
  }

  
        // Map UI subtabs to database types
        let dbType = 'Documents';
        if (type === 'documents') dbType = 'Documents';
        else if (type === 'lab-reports') dbType = 'Lab Report';
        else if (type === 'immunization') dbType = 'Immunization';
        else if (type === 'prescriptions') dbType = 'Prescription';
        else if (type === 'vitals') dbType = 'Vitals';
        
        const filtered = fetchedHealthRecords.filter(r => type === 'all' || r.type === dbType);
    
  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="es-icon"><i class="fa-regular fa-folder-open"></i></div><div class="es-text">No health records yet.</div><div class="es-sub">Upload reports to see them here.</div></div>`;
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
let bookingDoctor = null;
let bookingDate = null;
let bookingTime = null;
let bookingStep = 1;

window.openBookAppointmentModalWithDoctor = async function (doctorId) {
    bookingDoctor = allDoctors.find(d => String(d.id) === String(doctorId));
    if (!bookingDoctor) return;
    bookingDate = null;
    bookingTime = null;
    bookingStep = 1;
    bookingMode = 'IN_PERSON';
  
    // Render doc info
    document.getElementById('booking-doc-info').innerHTML = `
      <div style="width: 48px; height: 48px; border-radius: 50%; background: #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; color: #64748b;">
        ${(bookingDoctor.name || bookingDoctor.full_name || 'Dr. Doctor').substring(4, 6)}
      </div>
      <div>
        <h4 style="margin: 0; font-size: 15px; color: #1e293b;">${escapeHtml(bookingDoctor.name || bookingDoctor.full_name || 'Doctor')}</h4>
        <p style="margin: 2px 0 0; font-size: 12px; color: #64748b;">${escapeHtml(bookingDoctor.specialization)} • ₹${bookingDoctor.fee || bookingDoctor.consultation_fee || 500}</p>
      </div>
    `;
  
    // Pre-calculate 7 days
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push(d.toISOString().split('T')[0]);
    }
    
    // Render Date List skeleton
    let dateHtml = '';
    days.forEach((dateStr, i) => {
      const d = new Date(dateStr);
      const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      dateHtml += `
        <div class="booking-date-card" id="date-card-${dateStr}" onclick="selectBookingDate('${dateStr}')" style="min-width: 76px; padding: 10px; border: 1px solid var(--border); border-radius: 12px; text-align: center; cursor: pointer; transition: 0.2s;">
          <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">${dayName}</div>
          <div style="font-size: 16px; font-weight: bold; color: var(--text-dark); margin-bottom: 4px;">${dayNum}</div>
          <div id="date-indicator-${dateStr}" style="font-size: 10px; color: #94a3b8;"><i class="fa-solid fa-spinner fa-spin"></i></div>
        </div>
      `;
    });
    
    document.getElementById('booking-date-container').innerHTML = dateHtml;
    document.getElementById('booking-time-container').innerHTML = '<p class="text-muted text-sm" style="text-align:center; padding: 20px;">Please select a date to view available time slots.</p>';
    document.getElementById('btn-booking-next').disabled = true;
    document.getElementById('btn-booking-next').textContent = 'Continue';
    document.getElementById('btn-booking-next').onclick = bookingNextStep;
  
    showBookingStep(1);
    openModal('modal-book-appt');
    
    // Fetch Summary asynchronously
    try {
      const res = await fetch(`${API_BASE}/doctors/${bookingDoctor.id}/slots/summary?dates=${days.join(',')}`);
      const data = await res.json();
      if (data.success && data.summary) {
        days.forEach(dateStr => {
          const indicator = document.getElementById(`date-indicator-${dateStr}`);
          if (indicator) {
            const sum = data.summary[dateStr];
            if (!sum || sum.available === 0) {
               indicator.innerHTML = '<span style="color:#ef4444;">🔴 Full</span>';
            } else {
               indicator.innerHTML = `<span style="color:#10b981;">🟢 ${sum.available} slots</span>`;
            }
          }
        });
      }
    } catch(e) {
      console.error('Failed to load slot summary');
    }
  };

window.selectBookingDate = async function (dateStr) {
    bookingDate = dateStr;
    bookingTime = null;
    document.getElementById('btn-booking-next').disabled = true;
  
    // Highlight selected date
    document.querySelectorAll('.booking-date-card').forEach(el => {
      el.style.background = 'transparent';
      el.style.borderColor = 'var(--border)';
    });
    const selectedEl = document.getElementById(`date-card-${dateStr}`);
    if (selectedEl) {
      selectedEl.style.background = '#eff6ff';
      selectedEl.style.borderColor = 'var(--blue-primary)';
    }
  
    const container = document.getElementById('booking-time-container');
    container.innerHTML = '<div style="text-align:center; padding:40px 20px; color:#64748b;"><i class="fa-solid fa-spinner fa-spin" style="font-size:24px; margin-bottom:12px; color:var(--blue-primary);"></i><br>Loading available slots...</div>';
  
    try {
      const res = await fetch(`${API_BASE}/doctors/${bookingDoctor.id}/slots?date=${dateStr}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      
      if (!data.slots || data.slots.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:30px 20px;"><p style="color:#ef4444; font-weight:600; margin-bottom:12px;">No appointments available on this date.</p><button class="btn btn-outline btn-sm" onclick="selectBookingDate(\'' + getNextDateStr(dateStr) + '\')">View Next Available Date</button></div>';
        return;
      }
      
      const allBooked = data.slots.every(s => !s.available);
      if (allBooked) {
        container.innerHTML = '<div style="text-align:center; padding:30px 20px;"><p style="color:#ef4444; font-weight:600; margin-bottom:12px;">All appointments are booked for this date.</p><button class="btn btn-outline btn-sm" onclick="selectBookingDate(\'' + getNextDateStr(dateStr) + '\')">View Next Available Date</button></div>';
        return;
      }
  
      // Group slots
      const morning = [], afternoon = [], evening = [];
      data.slots.forEach(s => {
        let hour = parseInt(s.time.split(':')[0]);
        if (s.time.includes('PM') && hour !== 12) hour += 12;
        if (s.time.includes('AM') && hour === 12) hour = 0;
  
        if (hour < 12) morning.push(s);
        else if (hour < 17) afternoon.push(s);
        else evening.push(s);
      });
  
      let html = '';
      const renderGroup = (title, slots) => {
        if (!slots.length) return '';
        let groupHtml = `<h5 style="margin: 16px 0 12px; font-size: 14px; color: #1e293b; font-weight:600;">${title}</h5><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 8px;">`;
        slots.forEach(s => {
          const id = `time-slot-${s.time.replace(/[: ]/g, '-')}`;
          if (s.available) {
            groupHtml += `<div id="${id}" class="time-slot-box available" onclick="selectBookingTime('${s.time}', '${id}')" style="padding: 10px; border: 1px solid var(--blue-primary); border-radius: 8px; cursor: pointer; display:flex; flex-direction:column; align-items:center; transition:0.2s;">
              <span style="font-weight:600; font-size:14px; color:#1e293b; margin-bottom:4px;">${s.time}</span>
              <span style="font-size:11px; color:#10b981; display:flex; align-items:center; gap:4px;"><i class="fa-solid fa-circle" style="font-size:8px;"></i> Available</span>
            </div>`;
          } else {
            groupHtml += `<div class="time-slot-box booked" style="padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; cursor: not-allowed; background:#f8fafc; opacity:0.7; display:flex; flex-direction:column; align-items:center;">
              <span style="font-weight:600; font-size:14px; color:#94a3b8; margin-bottom:4px; text-decoration:line-through;">${s.time}</span>
              <span style="font-size:11px; color:#ef4444; display:flex; align-items:center; gap:4px;"><i class="fa-solid fa-circle" style="font-size:8px;"></i> Booked</span>
            </div>`;
          }
        });
        groupHtml += `</div>`;
        return groupHtml;
      };
  
      html += renderGroup('Morning', morning);
      html += renderGroup('Afternoon', afternoon);
      html += renderGroup('Evening', evening);
      
      html += `<div style="display:flex; justify-content:center; gap:16px; margin-top:24px; padding-top:16px; border-top:1px solid #f1f5f9; font-size:11px; color:#64748b;">
        <span><i class="fa-solid fa-circle" style="color:#10b981;"></i> Available</span>
        <span><i class="fa-solid fa-circle" style="color:#ef4444;"></i> Booked</span>
        <span><i class="fa-solid fa-circle" style="color:#3b82f6;"></i> Selected</span>
      </div>`;
  
      container.innerHTML = html;
    } catch (err) {
      container.innerHTML = '<div style="text-align:center; padding:30px 20px;"><p style="color:#ef4444; font-weight:600; margin-bottom:12px;">Unable to load appointment availability.</p><button class="btn btn-outline btn-sm" onclick="selectBookingDate(\'' + dateStr + '\')">Try Again</button></div>';
    }
  };
  
  function getNextDateStr(currentStr) {
    const d = new Date(currentStr);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }
  
  window.selectBookingTime = function (timeStr, elId) {
    bookingTime = timeStr;
    document.querySelectorAll('.time-slot-box.available').forEach(el => {
      el.style.background = 'transparent';
      el.style.borderColor = 'var(--blue-primary)';
      const statusSpan = el.querySelector('span:nth-child(2)');
      statusSpan.innerHTML = '<i class="fa-solid fa-circle" style="font-size:8px;"></i> Available';
      statusSpan.style.color = '#10b981';
      el.querySelector('span:nth-child(1)').style.color = '#1e293b';
    });
    
    const selectedEl = document.getElementById(elId);
    if (selectedEl) {
      selectedEl.style.background = '#eff6ff';
      selectedEl.style.borderColor = '#2563eb';
      const statusSpan = selectedEl.querySelector('span:nth-child(2)');
      statusSpan.innerHTML = '<i class="fa-solid fa-check" style="font-size:10px;"></i> Selected';
      statusSpan.style.color = '#2563eb';
      selectedEl.querySelector('span:nth-child(1)').style.color = '#1d4ed8';
    }
    document.getElementById('btn-booking-next').disabled = false;
  };

  ;

window.bookingNextStep = function () {
  if (bookingStep === 1) {
    // Show summary
    document.getElementById('summary-doc-name').textContent = bookingDoctor.name || bookingDoctor.full_name || 'Doctor';
    document.getElementById('summary-doc-spec').textContent = bookingDoctor.specialization;
    document.getElementById('summary-date').textContent = new Date(bookingDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('summary-time').textContent = bookingTime;
    document.getElementById('summary-fee').textContent = `₹${bookingDoctor.fee || bookingDoctor.consultation_fee || 500}`;

    const patNameEl = document.getElementById('summary-pat-name');
    if (patNameEl) patNameEl.textContent = currentUser?.full_name || 'Patient';

    document.getElementById('btn-booking-next').textContent = 'Confirm Appointment';
    showBookingStep(2);
  } else if (bookingStep === 2) {
    // Submit
    submitAppointmentBooking();
  }
};

function showBookingStep(step) {
  bookingStep = step;
  document.getElementById('booking-step-datetime').classList.add('hidden');
  document.getElementById('booking-step-summary').classList.add('hidden');
  document.getElementById('booking-step-success').classList.add('hidden');
  document.getElementById('booking-footer').classList.remove('hidden');

  if (step === 1) document.getElementById('booking-step-datetime').classList.remove('hidden');
  if (step === 2) document.getElementById('booking-step-summary').classList.remove('hidden');
  if (step === 3) {
    document.getElementById('booking-step-success').classList.remove('hidden');
    document.getElementById('booking-footer').classList.add('hidden'); // Hide footer on success
  }
}

window.submitAppointmentBooking = async function () {
  document.getElementById('btn-booking-next').disabled = true;
  document.getElementById('btn-booking-next').textContent = 'Confirming...';

  try {
    const res = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctorId: bookingDoctor.id,
        doctorName: bookingDoctor.name || bookingDoctor.full_name || 'Doctor',
        patientId: currentUser?.id || 'pat1',
        patientName: currentUser?.full_name || 'Patient',
        date: bookingDate,
        time: bookingTime,
        consultationType: 'IN_PERSON'
      })
    });

    const data = await res.json();

    if (res.status === 409) {
      showToast(data.message || 'Sorry, this slot was just booked.', 'error');
      // Go back to step 1 and refresh slots
      document.getElementById('btn-booking-next').disabled = false;
      document.getElementById('btn-booking-next').textContent = 'Continue';
      showBookingStep(1);
      selectBookingDate(bookingDate); // Refresh slots
      return;
    }

    if (data.success) {
      // Show success screen
      document.getElementById('success-doc-name').textContent = bookingDoctor.name || 'Doctor';
      document.getElementById('success-date').textContent = new Date(bookingDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      document.getElementById('success-time').textContent = bookingTime;
      document.getElementById('success-appt-id').textContent = data.appointment.id;

      showBookingStep(3);
      syncAllData(); // Refresh dashboards
    } else {
      throw new Error(data.message);
    }
  } catch (err) {
    showToast('Failed to book appointment.', 'error');
    document.getElementById('btn-booking-next').disabled = false;
    document.getElementById('btn-booking-next').textContent = 'Confirm Appointment';
  }
};

// ---------------------------------------------------------------------------
// PATIENT RECORD UPLOAD
// ---------------------------------------------------------------------------
window.openUploadRecordModal = function () {
  openModal('modal-upload-record');
};

window.submitUploadRecord = function () {
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
window.submitReceptionWalkinForm = async function () {
  const name = document.getElementById('walkin-form-name')?.value.trim();
  const mobile = document.getElementById('walkin-form-mobile')?.value.trim();
  const mobileNumber = internationalPhone(selectedCountryCode('walkin-country-code'), mobile);
  const select = document.getElementById('walkin-form-doctor');
  const docId = select?.value || 'doc1';
  const confirmChecked = document.getElementById('walkin-form-confirm')?.checked;

  if (!name || !mobile || !/^\+\d{7,15}$/.test(mobileNumber)) {
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
      body: JSON.stringify({ patientName: name, mobile: mobileNumber, doctorId: docId })
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
window.openReceptionIssueTokenModal = function () {
  openModal('modal-issue-token');
};

window.submitReceptionQuickToken = async function () {
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
window.callQueueNext = async function (token) {
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

window.completeQueueItem = async function (token) {
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

window.markNoShow = async function (token) {
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

window.cancelAppointment = async function (apptId) {
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

window.checkinAppointment = async function (apptId) {
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
window.startConsultation = function (apptId) {
  // Switch to patients details view
  switchDoctorPage('patients');
};

// ---------------------------------------------------------------------------
// DIGITAL PRESCRIPTION WRITING
// ---------------------------------------------------------------------------
let rxMedsList = [];

window.openCreatePrescriptionPage = function () {
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

window.addMedRowToRxForm = function () {
  rxMedsList.push({ name: '', dosage: '', frequency: '1-0-1', duration: '5 Days' });
  renderRxFormMedTable();
};

window.removeRxMedRow = function (idx) {
  rxMedsList.splice(idx, 1);
  renderRxFormMedTable();
};

window.updateRxMedField = function (idx, field, value) {
  rxMedsList[idx][field] = value;
};

window.submitPrescription = async function () {
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

window.saveRxDraft = function () {
  showToast('Prescription saved to clinical draft.', 'info');
  switchDoctorPage('dashboard');
};

// ---------------------------------------------------------------------------
// VIEW / DURATION TABS HELPER
// ---------------------------------------------------------------------------
window.switchTab = function (btn, contentId) {
  const parent = btn.parentElement;
  parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  // Tab panels are sibling sections under the page, not children of the first
  // panel. Searching the shared page wrapper ensures exactly one panel is shown.
  const container = parent.parentElement;
  container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  const target = document.getElementById(contentId);
  if (target) target.classList.add('active');
};

// Used by the appointment empty states without relying on fragile inline DOM selectors.
window.showPatientAppointmentTab = function (contentId) {
  const target = document.getElementById(contentId);
  if (!target) return;
  const page = document.getElementById('patient-page-appointments');
  page?.querySelectorAll('.tab-btn').forEach(button => {
    const isTarget = button.getAttribute('onclick')?.includes(contentId);
    button.classList.toggle('active', Boolean(isTarget));
  });
  page?.querySelectorAll('.tab-content').forEach(section => section.classList.toggle('active', section.id === contentId));
};

// ---------------------------------------------------------------------------
// TOAST NOTIFICATIONS
// ---------------------------------------------------------------------------

// --- Vaccination Modal Logic ---
window.openAddVaccinationModal = function() {
  const modal = document.getElementById('modal-add-vaccination');
  if (modal) modal.classList.add('open');
};

document.addEventListener('DOMContentLoaded', function() {
  const vacForm = document.getElementById('form-add-vaccination');
  if (vacForm) {
    vacForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const name = document.getElementById('vaccine-name').value;
      const dose = document.getElementById('vaccine-dose').value;
      
      const rawDate = document.getElementById('vaccine-date').value;
      const dateObj = new Date(rawDate);
      const dateOpts = { day: 'numeric', month: 'short', year: 'numeric' };
      const formattedDate = dateObj.toLocaleDateString('en-GB', dateOpts);
      
      const provider = document.getElementById('vaccine-provider').value;
      const certInput = document.getElementById('vaccine-certificate');
      const hasCert = certInput && certInput.files.length > 0;
      
      let providerSplit = provider.split('/');
      let hospital = providerSplit[0] ? providerSplit[0].trim() : '';
      let doctor = providerSplit.length > 1 ? providerSplit[1].trim() : hospital;
      
      const tableBody = document.querySelector('#patient-page-vaccinations table tbody');
      if (tableBody) {
        const newRow = document.createElement('tr');
        newRow.style.borderBottom = '1px solid #f1f5f9';
        
        let certHtml = '';
        if (hasCert) {
          certHtml = `<button style="background-color: #22c55e; color: white; border: none; padding: 6px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;">View Certificate</button>
                      <i class="fa-solid fa-file-pdf" style="color: #ef4444; font-size: 24px;"></i>`;
        } else {
          certHtml = `<span style="font-size: 13px; color: #94a3b8;">No document</span>`;
        }
        
        newRow.innerHTML = `
          <td style="padding: 16px; font-size: 14px; font-weight: 600; color: #0f172a;">${name}</td>
          <td style="padding: 16px; font-size: 14px; color: #0f172a; font-weight: 500;">${dose}<br><span style="font-weight: 400; font-size: 13px; color: #64748b;">${formattedDate}</span></td>
          <td style="padding: 16px; font-size: 14px; color: #0f172a; font-weight: 500;">${hospital}</td>
          <td style="padding: 16px; font-size: 14px; color: #0f172a; font-weight: 500;">${doctor}</td>
          <td style="padding: 16px; display: flex; align-items: center; gap: 12px;">
            ${certHtml}
          </td>
        `;
        
        tableBody.insertBefore(newRow, tableBody.firstChild);
      }
      
      if (typeof showToast === 'function') showToast('Vaccination record added successfully!', 'success');
      if (typeof closeAllModals === 'function') closeAllModals();
      vacForm.reset();
    });
  }
});


// ==========================================================================
// NEW ONBOARDING LOGIC
// ==========================================================================

let obMode = 'login';
let obTimer = null;

window.selectOnboardingLanguage = function(btn, lang) {
  document.querySelectorAll('.lang-opt').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  setTimeout(() => {
    goToStep('step-auth');
  }, 400);
}

window.goToStep = function(stepId) {
  const current = document.querySelector('.onboarding-step.active');
  const next = document.getElementById(stepId);
  if (!next || current === next) return;
  
  if (current) {
    current.style.opacity = '0';
    current.style.transition = 'opacity 0.2s';
    setTimeout(() => {
      current.classList.add('hidden');
      current.classList.remove('active');
      current.style.opacity = '';
      current.style.transition = '';
      
      next.classList.remove('hidden');
      next.classList.add('active');
    }, 200);
  } else {
    next.classList.remove('hidden');
    next.classList.add('active');
  }
}

window.switchAuthTab = function(mode) {
  obMode = mode;
  document.getElementById('tab-login').classList.toggle('active', mode === 'login');
  document.getElementById('tab-register').classList.toggle('active', mode === 'register');
  
  document.getElementById('auth-header-login').classList.toggle('hidden', mode !== 'login');
  document.getElementById('auth-header-register').classList.toggle('hidden', mode === 'login');
  
  document.getElementById('register-fields').classList.toggle('hidden', mode !== 'register');
  document.getElementById('register-help-text').classList.toggle('hidden', mode !== 'register');
  
  const btn = document.querySelector('#onboarding-auth-form button[type="submit"]');
  btn.innerHTML = mode === 'register' ? 'Register and send OTP <i class="fa-regular fa-paper-plane ml-2"></i>' : 'Send OTP <i class="fa-regular fa-paper-plane ml-2"></i>';
}

window.handleAuthSubmit = async function(event) {
    event.preventDefault();
    const mobileInput = document.getElementById('ob-mobile');
    const mobile = mobileInput ? mobileInput.value.trim().replace(/\D/g, '') : '';
    
    if (!mobile || mobile.length < 5) {
      if (typeof showToast === 'function') showToast('Please enter a valid mobile number.', 'error');
      else alert('Please enter a valid mobile number.');
      return;
    }
    
    const fullMobile = selectedCountry.code + mobile;
    window.pendingMobile = fullMobile;
    
    const displayEl = document.getElementById('display-otp-number');
    if (displayEl) {
      displayEl.innerHTML = `<span style="margin-right:8px">${selectedCountry.flag}</span> ${selectedCountry.code} ${mobile}`;
    }
    
    const btn = document.querySelector('#onboarding-auth-form button[type="submit"]');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = 'Sending OTP...';
    }
    
    try {
      const data = await requestJson('/auth/login', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ mobileNumber: window.pendingMobile }) 
      });
      
      if (data.otp) {
        const boxes = document.querySelectorAll('.otp-box');
        if (boxes.length === 6 && data.otp.length === 6) {
          for(let i=0; i<6; i++) {
            boxes[i].value = data.otp[i];
          }
        }
      }
      
      goToStep('step-otp');
      startObTimer();
      
      setTimeout(() => {
        document.querySelector('.otp-box')?.focus();
      }, 100);
      
    } catch(e) {
      if (typeof showToast === 'function') showToast(e.message || 'Failed to send OTP', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = obMode === 'register' ? 'Register and send OTP <i class="fa-regular fa-paper-plane ml-2"></i>' : 'Send OTP <i class="fa-regular fa-paper-plane ml-2"></i>';
      }
    }
};

// Override handleOtpSubmit to include Verifying state and timeout
window.handleOtpSubmit = async function() {
  const otpBoxes = document.querySelectorAll('.otp-box');
  let otpCode = '';
  otpBoxes.forEach(box => otpCode += box.value);
  
  if (otpCode.length !== 6) {
    if (typeof showToast === 'function') showToast("Please enter 6-digit OTP", 'error');
    else alert("Please enter 6-digit OTP");
    return;
  }
  
  const btn = document.querySelector('#step-otp .btn-primary');
  const originalText = btn.innerHTML;
  btn.innerHTML = 'Verifying...';
  btn.disabled = true;
  
  try {
    let registrationData = {};
    if (obMode === 'register') {
      const name = document.getElementById('ob-name').value.trim();
      registrationData = { fullName: name, requestedRole: 'PATIENT' };
    }
    
    const data = await requestJson('/auth/verify', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ mobileNumber: window.pendingMobile, otpCode, ...registrationData }) 
    });
    
    window.currentUser = { ...data.user, token: data.token, refreshToken: data.refreshToken };
      if (typeof window.connectSocket === 'function') window.connectSocket();
      localStorage.setItem('healthsync-session', JSON.stringify({ user: window.currentUser, refreshToken: window.currentUser.refreshToken }));
    
    if (obMode === 'register') {
      goToStep('step-profile');
    } else {
      finishOnboarding(); // Skip success screen for returning user
    }
  } catch (error) {
    if (typeof showToast === 'function') showToast(error.message || "OTP Verification failed", 'error');
    else alert(error.message || "OTP Verification failed");
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

window.updateGenderSelection = function(radio) {
  document.querySelectorAll('.gender-box').forEach(b => b.classList.remove('active'));
  radio.closest('.gender-box').classList.add('active');
}

window.handleProfileSubmit = function(event) {
  event.preventDefault();
  // Move to success screen
  goToStep('step-success');
}

window.finishOnboarding = async function() {
  document.getElementById('onboarding-flow').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  
  if (window.currentUser) {
    const role = String(window.currentUser.role || 'PATIENT').toUpperCase();
    window.switchGlobalRole(role === 'DOCTOR' ? 'doctor' : role === 'RECEPTIONIST' ? 'reception' : role === 'AMBULANCE' ? 'ambulance' : 'patient');
    
    // Set actual name
    const dashNameEl = document.getElementById('patient-dashboard-name');
    if (dashNameEl) {
       dashNameEl.textContent = window.currentUser.name ? window.currentUser.name.split(' ')[0] : 'Patient';
    }
    
    // Fetch actual profile and data
    try {
      if (typeof window.syncAllData === 'function') await window.syncAllData();
    } catch(e) {}
    
    if (typeof window.renderPatientHealthProfile === 'function') window.renderPatientHealthProfile();
    if (typeof window.fetchNotifications === 'function') window.fetchNotifications();
    if ((role === 'RECEPTIONIST' || role === 'AMBULANCE' || role === 'DOCTOR') && typeof window.fetchPendingEmergencies === 'function') {
      window.fetchPendingEmergencies();
    }
    if (typeof window.connectSocket === 'function') window.connectSocket();
  } else {
    window.currentUser = { id: 'demo-patient', name: 'Demo Patient', role: 'PATIENT', demo: true };
    window.switchGlobalRole('patient');
    if (typeof window.renderPatientHealthProfile === 'function') window.renderPatientHealthProfile();
  }
}


// ==========================================================================
// NEW ONBOARDING UI LOGIC
// ==========================================================================

// Custom Country Dropdown Logic
const countries = [
  { name: 'India', code: '+91', flag: '🇮🇳' },
  { name: 'United States', code: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { name: 'UAE', code: '+971', flag: '🇦🇪' },
  { name: 'Canada', code: '+1', flag: '🇨🇦' },
  { name: 'Australia', code: '+61', flag: '🇦🇺' },
  { name: 'Singapore', code: '+65', flag: '🇸🇬' }
];

let selectedCountry = countries[0];

window.toggleCountryDropdown = function(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('country-dropdown-menu');
  if (menu) {
    menu.classList.toggle('hidden');
    if (!menu.classList.contains('hidden')) {
      document.getElementById('country-search-input')?.focus();
    }
  }
};

document.addEventListener('click', function(e) {
  const container = document.getElementById('country-dropdown-container');
  const menu = document.getElementById('country-dropdown-menu');
  if (container && menu && !container.contains(e.target)) {
    menu.classList.add('hidden');
  }
});

window.renderCountryList = function(listToRender) {
  const listEl = document.getElementById('country-list');
  if (!listEl) return;
  listEl.innerHTML = '';
  listToRender.forEach(c => {
    const li = document.createElement('li');
    li.className = 'country-item';
    li.innerHTML = `<span class="country-item-flag">${c.flag}</span><span class="country-item-name">${c.name}</span><span class="country-item-code">${c.code}</span>`;
    li.onclick = function(e) {
      e.stopPropagation();
      selectedCountry = c;
      document.getElementById('selected-country-flag').textContent = c.flag;
      document.getElementById('selected-country-code').textContent = c.code;
      document.getElementById('country-dropdown-menu').classList.add('hidden');
    };
    listEl.appendChild(li);
  });
};

window.filterCountries = function() {
  const query = (document.getElementById('country-search-input')?.value || '').toLowerCase();
  const filtered = countries.filter(c => c.name.toLowerCase().includes(query) || c.code.includes(query));
  renderCountryList(filtered);
};

// Override handleAuthSubmit to include validation
window.handleAuthSubmit = async function(event) {
    event.preventDefault();
    const mobileInput = document.getElementById('ob-mobile');
    const mobile = mobileInput ? mobileInput.value.trim().replace(/\D/g, '') : '';
    
    if (!mobile || mobile.length < 5) {
      if (typeof showToast === 'function') showToast('Please enter a valid mobile number.', 'error');
      else alert('Please enter a valid mobile number.');
      return;
    }
    
    const fullMobile = selectedCountry.code + mobile;
    window.pendingMobile = fullMobile;
    
    const displayEl = document.getElementById('display-otp-number');
    if (displayEl) {
      displayEl.innerHTML = `<span style="margin-right:8px">${selectedCountry.flag}</span> ${selectedCountry.code} ${mobile}`;
    }
    
    const btn = document.querySelector('#onboarding-auth-form button[type="submit"]');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = 'Sending OTP...';
    }
    
    try {
      const data = await requestJson('/auth/login', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ mobileNumber: window.pendingMobile }) 
      });
      
      if (data.otp) {
        const boxes = document.querySelectorAll('.otp-box');
        if (boxes.length === 6 && data.otp.length === 6) {
          for(let i=0; i<6; i++) {
            boxes[i].value = data.otp[i];
          }
        }
      }
      
      goToStep('step-otp');
      startObTimer();
      
      setTimeout(() => {
        document.querySelector('.otp-box')?.focus();
      }, 100);
      
    } catch(e) {
      if (typeof showToast === 'function') showToast(e.message || 'Failed to send OTP', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = obMode === 'register' ? 'Register and send OTP <i class="fa-regular fa-paper-plane ml-2"></i>' : 'Send OTP <i class="fa-regular fa-paper-plane ml-2"></i>';
      }
    }
};

// Override handleOtpSubmit to include Verifying state and timeout
window.handleOtpSubmit = async function() {
  const otpBoxes = document.querySelectorAll('.otp-box');
  let otpCode = '';
  otpBoxes.forEach(box => otpCode += box.value);
  
  if (otpCode.length !== 6) {
    if (typeof showToast === 'function') showToast("Please enter 6-digit OTP", 'error');
    else alert("Please enter 6-digit OTP");
    return;
  }
  
  const btn = document.querySelector('#step-otp .btn-primary');
  const originalText = btn.innerHTML;
  btn.innerHTML = 'Verifying...';
  btn.disabled = true;
  
  try {
    let registrationData = {};
    if (obMode === 'register') {
      const name = document.getElementById('ob-name').value.trim();
      registrationData = { fullName: name, requestedRole: 'PATIENT' };
    }
    
    const data = await requestJson('/auth/verify', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ mobileNumber: window.pendingMobile, otpCode, ...registrationData }) 
    });
    
    window.currentUser = { ...data.user, token: data.token, refreshToken: data.refreshToken };
      if (typeof window.connectSocket === 'function') window.connectSocket();
      localStorage.setItem('healthsync-session', JSON.stringify({ user: window.currentUser, refreshToken: window.currentUser.refreshToken }));
    
    if (obMode === 'register') {
      goToStep('step-profile');
    } else {
      finishOnboarding(); // Skip success screen for returning user
    }
  } catch (error) {
    if (typeof showToast === 'function') showToast(error.message || "OTP Verification failed", 'error');
    else alert(error.message || "OTP Verification failed");
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

window.updateGenderSelection = function(radio) {
  document.querySelectorAll('.gender-box').forEach(b => b.classList.remove('active'));
  radio.closest('.gender-box').classList.add('active');
}

window.handleProfileSubmit = function(event) {
  event.preventDefault();
  // Move to success screen
  goToStep('step-success');
}

window.finishOnboarding = async function() {
  document.getElementById('onboarding-flow').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  
  if (window.currentUser) {
    const role = String(window.currentUser.role || 'PATIENT').toUpperCase();
    window.switchGlobalRole(role === 'DOCTOR' ? 'doctor' : role === 'RECEPTIONIST' ? 'reception' : role === 'AMBULANCE' ? 'ambulance' : 'patient');
    
    // Set actual name
    const dashNameEl = document.getElementById('patient-dashboard-name');
    if (dashNameEl) {
       dashNameEl.textContent = window.currentUser.name ? window.currentUser.name.split(' ')[0] : 'Patient';
    }
    
    // Fetch actual profile and data
    try {
      if (typeof window.syncAllData === 'function') await window.syncAllData();
    } catch(e) {}
    
    if (typeof window.renderPatientHealthProfile === 'function') window.renderPatientHealthProfile();
    if (typeof window.fetchNotifications === 'function') window.fetchNotifications();
    if ((role === 'RECEPTIONIST' || role === 'AMBULANCE' || role === 'DOCTOR') && typeof window.fetchPendingEmergencies === 'function') {
      window.fetchPendingEmergencies();
    }
    if (typeof window.connectSocket === 'function') window.connectSocket();
  } else {
    window.currentUser = { id: 'demo-patient', name: 'Demo Patient', role: 'PATIENT', demo: true };
    window.switchGlobalRole('patient');
    if (typeof window.renderPatientHealthProfile === 'function') window.renderPatientHealthProfile();
  }
}


