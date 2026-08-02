/**
 * HealthSync WebApp — Frontend Logic
 * =================================
 * Core SPA router, dynamic DOM rendering, and API synchronization
 */

'use strict';

// Render serves the website and API from the same service.
const API_BASE = `${window.location.origin}/v1`;

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
const doctorPatientReports = [
  { id:'dr-1', name:'Complete Blood Count', date:'16 Apr 2026', facility:'HealthSync Diagnostics', status:'Reviewed', summary:'Haemoglobin and white-cell counts are within the expected range.' },
  { id:'dr-2', name:'Lipid Profile', date:'15 Apr 2026', facility:'Apollo Diagnostics', status:'Action needed', summary:'LDL is mildly elevated; review diet, activity and follow-up treatment.' },
  { id:'dr-3', name:'ECG Report', date:'10 Apr 2026', facility:'Cardiology Unit', status:'Reviewed', summary:'Normal sinus rhythm recorded. No acute abnormality noted.' },
  { id:'dr-4', name:'HbA1c Report', date:'02 Apr 2026', facility:'HealthSync Diagnostics', status:'Reviewed', summary:'Glycaemic control is stable compared with the previous result.' }
];
let currentSelectedPatientId = 'pat1'; // Default demo patient
let currentSelectedDoctorId = 'doc1';  // Default demo doctor
let currentUser = null;
let pendingMobile = '';
let pendingCountryCode = '+91';
let authMode = 'login';
let pendingRegistration = null;
let resendTimer = null;
let bookingMode = 'IN_PERSON';
let persistedReminders = [];
let remindersLoaded = false;
let appHistory = [{ role:'patient', page:'dashboard' }];
let appHistoryIndex = 0;
let healthTipIndex = 0;
let healthTipTimer = null;
const isMobileAppNavigation = () => window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;
const curatedHealthTips = [
  { icon:'fa-person-walking', title:'Move regularly', text:'Adults can aim for 150–300 minutes of moderate physical activity each week. If you are starting out, begin with manageable movement and build gradually.', source:'World Health Organization', url:'https://www.who.int/europe/news-room/fact-sheets/item/physical-activity' },
  { icon:'fa-bed', title:'Protect your sleep', text:'Most adults need at least 7 hours of sleep each day. A consistent sleep and wake time can support better sleep habits.', source:'CDC Sleep', url:'https://www.cdc.gov/sleep/about/index.html' },
  { icon:'fa-glass-water', title:'Choose water often', text:'Water supports normal body function and can help prevent dehydration. Your needs can increase with heat, fever, and physical activity.', source:'CDC Healthy Drinks', url:'https://www.cdc.gov/healthy-weight-growth/water-healthy-drinks/index.html' },
  { icon:'fa-heart-pulse', title:'Make time to unwind', text:'Brief calming practices such as slow breathing, stretching, or a short outdoor break can be part of a healthy stress-management routine.', source:'CDC Mental Health', url:'https://www.cdc.gov/mental-health/living-with/index.html' }
];

async function requestJson(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, options);
  } catch {
    throw new Error('Cannot connect to HealthSync. Check your internet connection and try again.');
  }

  const contentType = response.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await response.json().catch(() => null);
  }
  if (!response.ok || !data?.success) {
    throw new Error(data?.message || `HealthSync returned an error (${response.status}).`);
  }
  return data;
}

function escapeHtml(value) {
  const node = document.createElement('div');
  node.textContent = value == null ? '' : String(value);
  return node.innerHTML;
}

function populateCountryCodeSelects() {
  const countries = window.HEALTHSYNC_COUNTRY_CODES || [['IN', 'India', '+91']];
  document.querySelectorAll('.country-code-select').forEach(select => {
    if (select.options.length) return;
    select.innerHTML = countries.map(([iso, name, code]) => `<option value="${code}" data-iso="${iso}" ${iso === 'IN' ? 'selected' : ''}>${name} (${code})</option>`).join('');
    createCountryPicker(select);
  });
}
function countryFlagUrl(iso) { return `https://flagcdn.com/w40/${String(iso || 'in').toLowerCase()}.png`; }
function syncCountryPicker(select) {
  const picker = select?.previousElementSibling;
  if (!picker?.classList.contains('country-picker')) return;
  const selected = select.options[select.selectedIndex];
  const image = picker.querySelector('.country-picker-trigger img');
  const label = picker.querySelector('.country-picker-label');
  if (image) { image.src = countryFlagUrl(selected?.dataset.iso); image.alt = selected?.dataset.iso || ''; }
  if (label) label.textContent = selected?.textContent || 'Select country';
}
function createCountryPicker(select) {
  if (select.dataset.enhanced === 'true') return;
  select.dataset.enhanced = 'true';
  const picker = document.createElement('div');
  picker.className = 'country-picker';
  picker.innerHTML = `<button type="button" class="country-picker-trigger" aria-haspopup="listbox" aria-expanded="false"><img alt=""><span class="country-picker-label"></span><i class="fa-solid fa-chevron-down"></i></button><div class="country-picker-menu hidden"><div class="country-picker-search"><i class="fa-solid fa-magnifying-glass"></i><input type="search" placeholder="Search country or code" aria-label="Search country code"></div><div class="country-picker-options" role="listbox"></div></div>`;
  select.before(picker);
  select.classList.add('native-country-code-select');
  const optionsRoot = picker.querySelector('.country-picker-options');
  const renderOptions = (query = '') => {
    const term = query.trim().toLowerCase();
    optionsRoot.innerHTML = [...select.options].filter(option => option.textContent.toLowerCase().includes(term) || option.value.includes(term)).map(option => `<button type="button" class="country-picker-option ${option.selected ? 'selected' : ''}" data-value="${option.value}"><img src="${countryFlagUrl(option.dataset.iso)}" alt="${option.dataset.iso} flag"><span>${option.textContent}</span></button>`).join('');
  };
  const menu = picker.querySelector('.country-picker-menu');
  const trigger = picker.querySelector('.country-picker-trigger');
  const search = picker.querySelector('input');
  trigger.addEventListener('click', () => { const isOpen = !menu.classList.contains('hidden'); document.querySelectorAll('.country-picker-menu').forEach(item => item.classList.add('hidden')); menu.classList.toggle('hidden', isOpen); trigger.setAttribute('aria-expanded', String(!isOpen)); if (!isOpen) { search.value = ''; renderOptions(); search.focus(); } });
  search.addEventListener('input', () => renderOptions(search.value));
  optionsRoot.addEventListener('click', event => { const option = event.target.closest('.country-picker-option'); if (!option) return; select.value = option.dataset.value; select.dispatchEvent(new Event('change', { bubbles:true })); renderOptions(search.value); syncCountryPicker(select); menu.classList.add('hidden'); trigger.setAttribute('aria-expanded', 'false'); });
  syncCountryPicker(select); renderOptions();
}
document.addEventListener('click', event => {
  if (event.target.closest('.country-picker')) return;
  document.querySelectorAll('.country-picker-menu').forEach(menu => menu.classList.add('hidden'));
  document.querySelectorAll('.country-picker-trigger').forEach(button => button.setAttribute('aria-expanded', 'false'));
});
function selectedCountryCode(id) { return document.getElementById(id)?.value || '+91'; }
function internationalPhone(countryCode, value) {
  const code = `+${String(countryCode || '+91').replace(/\D/g, '')}`;
  const number = String(value || '').replace(/\D/g, '');
  return `${code}${number}`;
}
function setCountryCodeValue(id, value) {
  const select = document.getElementById(id);
  if (select && value && [...select.options].some(option => option.value === value)) { select.value = value; syncCountryPicker(select); }
}

// Language is selected before authentication and saved only in this browser.
// The source phrase is kept on each text node, so a user can change languages
// repeatedly without a page reload or corrupting the original text.
let selectedLanguage = localStorage.getItem('healthsync-language') || 'English';
const translations = {
  Hindi: {
    'Welcome to better care':'बेहतर देखभाल में आपका स्वागत है', 'Sign in securely with your Indian mobile number.':'अपने भारतीय मोबाइल नंबर से सुरक्षित साइन इन करें।', 'Mobile number':'मोबाइल नंबर', 'Send OTP':'ओटीपी भेजें', 'Enter the 6-digit OTP':'6 अंकों का ओटीपी दर्ज करें', 'Verify and sign in':'सत्यापित करें और साइन इन करें', 'Resend OTP (30s)':'ओटीपी दोबारा भेजें (30 सेकंड)', 'Open Demo Portal':'डेमो पोर्टल खोलें', 'Patient Portal':'रोगी पोर्टल', 'Dashboard':'डैशबोर्ड', 'Appointments':'अपॉइंटमेंट', 'Doctors':'डॉक्टर', 'Health Records':'स्वास्थ्य रिकॉर्ड', 'Prescriptions':'पर्चे', 'Medicines':'दवाइयाँ', 'Reminders':'रिमाइंडर', 'Messages':'संदेश', 'Notifications':'सूचनाएँ', 'Settings':'सेटिंग्स', 'Help & Support':'सहायता और समर्थन', 'Book Appointment':'अपॉइंटमेंट बुक करें', 'Upcoming':'आगामी', 'Completed':'पूर्ण', 'Cancelled':'रद्द', 'Reports':'रिपोर्ट', 'Patient View':'रोगी दृश्य', 'Doctor View':'डॉक्टर दृश्य', 'Receptionist View':'रिसेप्शन दृश्य', 'Choose your language':'अपनी भाषा चुनें', 'You can change this later from Settings.':'इसे बाद में सेटिंग्स से बदला जा सकता है।', 'Continue':'जारी रखें'
  },
  Marathi: {
    'Welcome to better care':'उत्तम आरोग्यसेवेत आपले स्वागत आहे', 'Sign in securely with your Indian mobile number.':'तुमच्या भारतीय मोबाईल क्रमांकाने सुरक्षित साइन इन करा.', 'Mobile number':'मोबाईल क्रमांक', 'Send OTP':'ओटीपी पाठवा', 'Enter the 6-digit OTP':'6 अंकी ओटीपी टाका', 'Verify and sign in':'पडताळा आणि साइन इन करा', 'Resend OTP (30s)':'ओटीपी पुन्हा पाठवा (30 से.)', 'Open Demo Portal':'डेमो पोर्टल उघडा', 'Patient Portal':'रुग्ण पोर्टल', 'Dashboard':'डॅशबोर्ड', 'Appointments':'अपॉइंटमेंट्स', 'Doctors':'डॉक्टर्स', 'Health Records':'आरोग्य नोंदी', 'Prescriptions':'प्रिस्क्रिप्शन', 'Medicines':'औषधे', 'Reminders':'स्मरणपत्रे', 'Messages':'संदेश', 'Notifications':'सूचना', 'Settings':'सेटिंग्ज', 'Help & Support':'मदत आणि सहाय्य', 'Book Appointment':'अपॉइंटमेंट बुक करा', 'Upcoming':'आगामी', 'Completed':'पूर्ण झालेले', 'Cancelled':'रद्द झालेले', 'Reports':'अहवाल', 'Patient View':'रुग्ण दृश्य', 'Doctor View':'डॉक्टर दृश्य', 'Receptionist View':'रिसेप्शन दृश्य', 'Choose your language':'तुमची भाषा निवडा', 'You can change this later from Settings.':'हे नंतर सेटिंग्जमधून बदलता येईल.', 'Continue':'पुढे जा'
  }
};

function applyLanguage(language = selectedLanguage) {
  selectedLanguage = language;
  localStorage.setItem('healthsync-language', language);
  document.documentElement.lang = language === 'Hindi' ? 'hi' : language === 'Marathi' ? 'mr' : 'en';
  const dictionary = translations[language] || {};
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    const original = node.__healthsyncEnglish ?? node.nodeValue;
    node.__healthsyncEnglish = original;
    const trimmed = original.trim();
    if (!trimmed || !dictionary[trimmed]) { node.nodeValue = original; return; }
    const prefix = original.slice(0, original.indexOf(trimmed));
    const suffix = original.slice(original.indexOf(trimmed) + trimmed.length);
    node.nodeValue = `${prefix}${dictionary[trimmed]}${suffix}`;
  });
  document.querySelectorAll('.language-choice').forEach(button => button.classList.toggle('active', button.dataset.language === language));
}

window.toggleCheckin = function(queueId, action) {
  // Simplified for phase 1 frontend logic
  showToast(action === 'checkin' ? 'Patient checked in successfully' : 'Patient marked as no-show');
  syncAllData();
};

// ---------------------------------------------------------------------------
// SOS & SOCKET.IO REAL-TIME LOGIC
// ---------------------------------------------------------------------------
let appSocket = null;
let sosTimer = null;
let sosWatchId = null;
let currentEmergencyCaseId = null;
const mapInstances = {};

function initMap(containerId, lat, lng, type) {
  if (typeof L === 'undefined') return null;
  const container = document.getElementById(containerId);
  if (!container) return null;
  
  const map = L.map(containerId).setView([lat, lng], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(map);

  const isAmb = type === 'ambulance';
  const color = isAmb ? '#3b82f6' : '#ef4444'; // blue for ambulance, red for patient
  
  // Custom SVG marker for better visibility without needing external image assets
  const svgIcon = L.divIcon({
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });

  const marker = L.marker([lat, lng], {icon: svgIcon}).addTo(map)
    .bindPopup(isAmb ? 'Ambulance' : 'Patient');
    
  setTimeout(() => { map.invalidateSize(); }, 200);
  return { map, marker, svgIcon, ambMarker: null };
}

function updateMapMarker(mapData, lat, lng, type) {
  if (!mapData || !mapData.map) return;
  if (type === 'patient' && mapData.marker) {
    mapData.marker.setLatLng([lat, lng]);
  } else if (type === 'ambulance') {
    if (!mapData.ambMarker) {
      const svgIcon = L.divIcon({
        html: `<div style="background-color: #3b82f6; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
        className: '',
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });
      mapData.ambMarker = L.marker([lat, lng], {icon: svgIcon}).addTo(mapData.map)
        .bindPopup('Ambulance');
    } else {
      mapData.ambMarker.setLatLng([lat, lng]);
    }
  }
}

window.connectSocket = function() {
  if (appSocket) { appSocket.disconnect(); }
  if (currentUser && (currentUser.token || currentUser.demo) && typeof io !== 'undefined') {
    const tokenStr = currentUser.demo ? `DEMO_${currentUser.role}` : currentUser.token;
    appSocket = io({ auth: { token: tokenStr } });
    
    appSocket.on('connect', () => console.log('Socket connected'));
    
    appSocket.on('sos_acknowledged', (data) => {
      currentEmergencyCaseId = data.caseId;
      document.getElementById('sos-status-panel')?.classList.remove('hidden');
      const textEl = document.getElementById('sos-status-text');
      if (textEl) textEl.innerText = 'SOS Sent... Pending Assignment';
      const linkEl = document.getElementById('sos-maps-link');
      if (linkEl) { linkEl.innerText = 'View Live Location'; linkEl.href = `https://www.google.com/maps?q=${data.lat},${data.lng}`; }
      startLocationTracking(currentEmergencyCaseId);
    });

    appSocket.on('sos_status_update', (data) => {
      if (data.status === 'Ambulance Dispatched') {
        const p = document.getElementById('sos-status-text');
        if (p) p.innerText = 'Ambulance Dispatched! ETA: 5-10 mins';
      } else if (data.status === 'Resolved') {
        const p = document.getElementById('sos-status-text');
        if (p) p.innerText = 'Emergency Resolved';
        stopLocationTracking();
        setTimeout(() => document.getElementById('sos-status-panel')?.classList.add('hidden'), 5000);
        const btn = document.getElementById('patient-sos-btn');
        if (btn) btn.disabled = false;
      }
    });

    appSocket.on('sos_alert', (data) => {
      if (currentUser.role === 'RECEPTIONIST' || currentUser.role === 'DOCTOR') {
        const prefix = currentUser.role === 'RECEPTIONIST' ? 'rec' : 'doc';
        document.getElementById(`${prefix}-emergency-panel`)?.classList.remove('hidden');
        const list = document.getElementById(`${prefix}-emergency-list`);
        if (!list) return;
        const mapsLink = `https://www.google.com/maps?q=${data.lat},${data.lng}`;
        list.innerHTML += `
          <div id="emerg-${data.caseId}" style="background: white; border: 1px solid #f87171; padding: 12px; border-radius: 8px;">
            <div style="display:flex; justify-content:space-between;">
              <strong>${escapeHtml(data.patientName)} (${escapeHtml(data.phone)})</strong>
              <span style="font-size:12px; color:#b91c1c;">${new Date(data.timestamp).toLocaleTimeString()}</span>
            </div>
            <p style="font-size:13px; margin: 4px 0;">Live Address: ${escapeHtml(data.address || 'Unknown')}</p>
            <div style="display:flex; gap: 8px; margin-top: 8px;">
              <a href="${mapsLink}" target="_blank" class="btn btn-secondary btn-sm" id="map-link-${data.caseId}">View on Google Maps</a>
              <button class="btn btn-primary btn-sm" id="btn-dispatch-${data.caseId}" onclick="dispatchAmbulance('${data.caseId}')">Dispatch Ambulance</button>
              <button class="btn btn-secondary btn-sm" onclick="resolveEmergency('${data.caseId}')">Resolve</button>
            </div>
            <div id="${prefix}-map-${data.caseId}" style="height: 180px; width: 100%; margin-top: 12px; border-radius: 6px; z-index: 1;"></div>
          </div>
        `;
        setTimeout(() => {
          mapInstances[data.caseId] = initMap(`${prefix}-map-${data.caseId}`, data.lat, data.lng, 'patient');
        }, 100);
      }
    });

    appSocket.on('emergency_location_update', (data) => {
      // Update google maps link on receptionist / doctor / ambulance side dynamically
      const link = document.getElementById(`map-link-${data.caseId}`);
      if (link) link.href = `https://www.google.com/maps?q=${data.lat},${data.lng}`;
      updateMapMarker(mapInstances[data.caseId], data.lat, data.lng, 'patient');
    });

    appSocket.on('ambulance_location_update', (data) => {
      if (currentUser.role === 'PATIENT' && data.caseId === currentEmergencyCaseId) {
        const linkEl = document.getElementById('sos-maps-link');
        if (linkEl) {
          linkEl.innerText = 'Track Ambulance Live';
          linkEl.href = `https://www.google.com/maps?q=${data.lat},${data.lng}`;
        }
        const mapEl = document.getElementById('patient-tracking-map');
        if (mapEl) {
          mapEl.style.display = 'block';
          if (!mapInstances['patient_tracking']) {
            mapInstances['patient_tracking'] = initMap('patient-tracking-map', data.lat, data.lng, 'ambulance');
          } else {
            updateMapMarker(mapInstances['patient_tracking'], data.lat, data.lng, 'ambulance');
          }
        }
      } else {
        updateMapMarker(mapInstances[data.caseId], data.lat, data.lng, 'ambulance');
      }
    });

    appSocket.on('ambulance_dispatched', (data) => {
      if (currentUser.role === 'AMBULANCE') {
        const list = document.getElementById('amb-dispatch-list');
        if (!list) return;
        const mapsLink = `https://www.google.com/maps?q=${data.lat},${data.lng}`;
        if (list.querySelector('.empty-state')) list.innerHTML = '';
        list.innerHTML += `
          <div id="amb-disp-${data.id}" class="card p-4" style="border: 2px solid #ef4444;">
            <h3 style="color: #b91c1c; margin-top:0;"><i class="fa-solid fa-truck-medical"></i> Dispatch Assigned</h3>
            <p style="margin: 4px 0;"><strong>Patient:</strong> ${escapeHtml(data.patient_name)}</p>
            <p style="margin: 4px 0;"><strong>Phone:</strong> ${escapeHtml(data.phone_number)}</p>
            <p style="margin: 4px 0;"><strong>Address:</strong> ${escapeHtml(data.address)}</p>
            <a href="${mapsLink}" id="map-link-${data.id}" target="_blank" class="btn btn-primary w-full mt-3"><i class="fa-solid fa-location-arrow"></i> Google Maps Navigation</a>
            <button class="btn btn-secondary w-full mt-2" onclick="resolveEmergency('${data.id}')">Mark as Completed</button>
            <div id="amb-map-${data.id}" style="height: 180px; width: 100%; margin-top: 12px; border-radius: 6px; z-index: 1;"></div>
          </div>
        `;
        setTimeout(() => {
          mapInstances[data.id] = initMap(`amb-map-${data.id}`, data.lat, data.lng, 'patient');
        }, 100);
        startAmbulanceLocationTracking(data.id);
      }
    });
  }
};

window.dispatchAmbulance = function(caseId) {
  if (appSocket) {
    appSocket.emit('dispatch_ambulance', { caseId, hospitalId: 'local_hospital' });
    const btn = document.getElementById(`btn-dispatch-${caseId}`);
    if (btn) { btn.disabled = true; btn.innerText = 'Dispatched'; }
    showToast('Ambulance Dispatched Successfully');
  }
};

window.resolveEmergency = function(caseId) {
  if (appSocket) {
    appSocket.emit('resolve_emergency', { caseId });
    document.getElementById(`emerg-${caseId}`)?.remove();
    document.getElementById(`amb-disp-${caseId}`)?.remove();
    
    // Check if panels should be hidden
    const recList = document.getElementById('rec-emergency-list');
    if (recList && recList.children.length === 0) {
      document.getElementById('rec-emergency-panel')?.classList.add('hidden');
    }
    const docList = document.getElementById('doc-emergency-list');
    if (docList && docList.children.length === 0) {
      document.getElementById('doc-emergency-panel')?.classList.add('hidden');
    }
    const ambList = document.getElementById('amb-dispatch-list');
    if (ambList && ambList.children.length === 0) {
      ambList.innerHTML = '<div class="card p-4 text-center text-muted empty-state"><i class="fa-solid fa-check-circle" style="font-size: 32px; color: #10b981; margin-bottom: 8px;"></i><p>No active dispatches. You are available.</p></div>';
      stopLocationTracking();
    }
    showToast('Emergency resolved');
  }
};

window.startSOSCountdown = function() {
  const bar = document.getElementById('sos-progress');
  if (!bar) return;
  bar.style.width = '0%';
  setTimeout(() => { bar.style.width = '100%'; bar.style.transition = 'width 3s linear'; }, 50);
  
  const textEl = document.getElementById('sos-btn-text');
  if (textEl) textEl.innerText = 'Keep holding...';

  sosTimer = setTimeout(async () => {
    if (textEl) textEl.innerText = 'Triggering SOS...';
    // Get live location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        let address = 'Live coordinates acquired';
        try {
          // Use OpenStreetMap Nominatim for Reverse Geocoding
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          if (data && data.display_name) address = data.display_name;
        } catch (e) {
          console.error("Geocoding failed", e);
        }

        if (appSocket) {
          appSocket.emit('sos_trigger', {
            patientId: currentUser.id,
            patientName: currentUser.name,
            phone: currentUser.mobile || 'Unknown',
            lat,
            lng,
            address
          });
          const btn = document.getElementById('patient-sos-btn');
          if (btn) btn.disabled = true;
          if (textEl) textEl.innerText = 'SOS Sent';
          if (bar) bar.style.width = '100%';
        } else {
          showToast('Real-time connection not available.');
        }
      }, (err) => {
        showToast('Location access required for SOS.');
        cancelSOSCountdown();
      });
    } else {
      showToast('Geolocation not supported by this browser.');
      cancelSOSCountdown();
    }
  }, 3000);
};

window.cancelSOSCountdown = function() {
  const btn = document.getElementById('patient-sos-btn');
  if (btn && btn.disabled) return; // already sent
  const bar = document.getElementById('sos-progress');
  if (bar) { bar.style.transition = 'none'; bar.style.width = '0%'; }
  const textEl = document.getElementById('sos-btn-text');
  if (textEl) textEl.innerText = 'Hold 3s for SOS';
  if (sosTimer) clearTimeout(sosTimer);
};

function startLocationTracking(caseId) {
  if (navigator.geolocation) {
    sosWatchId = navigator.geolocation.watchPosition((pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      if (appSocket) {
        appSocket.emit('location_update', { caseId, lat, lng });
      }
    }, null, { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 });
  }
}

function stopLocationTracking() {
  if (sosWatchId !== null) {
    navigator.geolocation.clearWatch(sosWatchId);
    sosWatchId = null;
  }
}

window.startAmbulanceLocationTracking = function(caseId) {
  if (navigator.geolocation) {
    sosWatchId = navigator.geolocation.watchPosition((pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      if (appSocket) {
        appSocket.emit('ambulance_location_update', { caseId, lat, lng });
      }
    }, null, { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 });
  }
};

window.selectAppLanguage = function(language) { applyLanguage(language); };
window.continueToLogin = function() {
  applyLanguage(selectedLanguage);
  document.getElementById('language-screen')?.classList.add('hidden');
  document.getElementById('auth-screen')?.classList.remove('hidden');
};
window.backToLanguageSelection = function() {
  document.getElementById('auth-screen')?.classList.add('hidden');
  document.getElementById('language-screen')?.classList.remove('hidden');
};

// ---------------------------------------------------------------------------
// INITIALIZATION
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  applyLanguage(selectedLanguage);
  populateCountryCodeSelects();
  updateAppHistoryButtons();
  if (isMobileAppNavigation()) history.replaceState({ healthsyncNavigation: true, role: 'patient', page: 'dashboard' }, '', window.location.href);
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
    bookingDateInput.value = new Date().toISOString().split('T')[0];
    bookingDateInput.min = new Date().toISOString().split('T')[0];
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
    const response = await fetch(`${API_BASE}/auth/refresh`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({refreshToken:session.refreshToken}) });
    const data = await response.json();
    if (!data.success) throw new Error();
    currentUser = { ...session.user, token:data.token, refreshToken:session.refreshToken };
    localStorage.setItem('healthsync-session', JSON.stringify({ user:currentUser, refreshToken:currentUser.refreshToken }));
    finishLogin();
  } catch { localStorage.removeItem('healthsync-session'); }
}

// Demo sessions use the same role panels as production, but their API calls are
// intercepted by demo.js and never reach the production database.
window.startDemoExperience = function(role, mobile) {
  const roleMap = { patient:'PATIENT', doctor:'DOCTOR', reception:'RECEPTIONIST' };
  if (!roleMap[role]) return false;
  currentUser = { id:`demo-${role}`, patientId:'pat1', name: role === 'doctor' ? 'Dr. Kavya Iyer' : role === 'reception' ? 'Nisha Verma' : 'Aarav Mehta', mobile, role:roleMap[role], demo:true };
  document.getElementById('auth-screen')?.classList.add('hidden');
  document.getElementById('app')?.classList.remove('hidden');
  document.getElementById('in-app-demo-banner')?.classList.remove('hidden');
  switchGlobalRole(role === 'reception' ? 'reception' : role);
  renderPatientHealthProfile();
  fetchDoctors();
  syncAllData();
  return true;
};
window.exitDemoExperience = function() {
  window.__HEALTHSYNC_DEMO_MODE__ = false;
  document.getElementById('in-app-demo-banner')?.classList.add('hidden');
  location.href = location.pathname;
};

function authMessage(message, isError = false) { const el = document.getElementById('auth-message'); if (el) { el.textContent = message; el.style.color = isError ? '#b91c1c' : ''; } }
function setAuthBusy(buttonId, busy, idleLabel) { const button = document.getElementById(buttonId); if (button) { button.disabled = busy; button.textContent = busy ? 'Please wait…' : idleLabel; } }
window.requestOtp = async function(event) {
  event.preventDefault();
  if (authMode === 'register') {
    const name = document.getElementById('register-name')?.value.trim() || '';
    const role = document.getElementById('register-role')?.value || 'PATIENT';
    const specialization = document.getElementById('register-specialization')?.value.trim() || '';
    const clinic = document.getElementById('register-clinic')?.value.trim() || '';
    if (name.length < 2) return authMessage('Enter your full name to register.', true);
    if (role === 'DOCTOR' && (!specialization || !clinic)) return authMessage('Enter your specialization and clinic to register as a doctor.', true);
    pendingRegistration = { fullName:name, requestedRole:role, specialization, clinicName:clinic };
  } else pendingRegistration = null;
  pendingCountryCode = selectedCountryCode('auth-country-code');
  const localMobile = document.getElementById('auth-mobile').value.replace(/\D/g, '');
  if (pendingCountryCode === '+91' && !/^[6-9]\d{9}$/.test(localMobile)) return authMessage('Enter a valid 10-digit Indian mobile number.', true);
  pendingMobile = internationalPhone(pendingCountryCode, localMobile);
  if (!/^\+\d{7,15}$/.test(pendingMobile)) return authMessage('Enter a valid mobile number for the selected country code.', true);
  setAuthBusy('send-otp-btn', true, 'Send OTP');
  try {
    const data = await requestJson('/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({mobileNumber:pendingMobile}) });
    document.getElementById('mobile-login-form').classList.add('hidden');
    document.getElementById('otp-login-form').classList.remove('hidden');
    document.getElementById('auth-otp').focus();
    authMessage(data.otp ? `Development OTP: ${data.otp}` : (data.message || 'OTP sent successfully.'));
    startResendCooldown();
  } catch (error) { authMessage(error.message, true); }
  finally { setAuthBusy('send-otp-btn', false, 'Send OTP'); }
};
window.resendOtp = function() { requestOtp({ preventDefault() {} }); };
window.backToMobileLogin = function() {
  clearInterval(resendTimer);
  pendingMobile = '';
  document.getElementById('auth-otp').value = '';
  document.getElementById('otp-login-form').classList.add('hidden');
  document.getElementById('mobile-login-form').classList.remove('hidden');
  authMessage('You can edit your mobile number and request a new OTP.');
  document.getElementById('auth-mobile')?.focus();
};
function startResendCooldown() { let seconds=30; const button=document.getElementById('resend-otp-btn'); clearInterval(resendTimer); button.disabled=true; resendTimer=setInterval(()=>{ seconds--; button.textContent=seconds ? `Resend OTP (${seconds}s)` : 'Resend OTP'; if(!seconds){button.disabled=false;clearInterval(resendTimer);}},1000); }
window.verifyOtp = async function(event) {
  event.preventDefault();
  const otpCode = document.getElementById('auth-otp').value.replace(/\D/g, '');
  if (!pendingMobile) return authMessage('Request a new OTP first.', true);
  if (!/^\d{6}$/.test(otpCode)) return authMessage('Enter the 6-digit OTP.', true);
  setAuthBusy('verify-otp-btn', true, 'Verify and sign in');
  try {
    const data = await requestJson('/auth/verify', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({mobileNumber:pendingMobile,otpCode,...(pendingRegistration || {})}) });
    currentUser = {...data.user, token:data.token, refreshToken:data.refreshToken};
    localStorage.setItem('healthsync-session', JSON.stringify({user:currentUser, refreshToken:currentUser.refreshToken}));
    finishLogin();
  } catch (error) { authMessage(error.message, true); }
  finally { setAuthBusy('verify-otp-btn', false, 'Verify and sign in'); }
};
window.setAuthMode = function(mode) {
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
window.toggleRegistrationFields = function() {
  const role = document.getElementById('register-role')?.value || 'PATIENT';
  document.getElementById('doctor-registration-fields')?.classList.toggle('hidden', role !== 'DOCTOR');
  const help = document.getElementById('registration-role-help');
  if (help) help.textContent = role === 'DOCTOR' ? 'Doctor profiles become available after OTP verification.' : role === 'RECEPTIONIST' ? 'Reception staff can manage their assigned clinic after OTP verification.' : 'Your patient account will be ready immediately after OTP verification.';
};
function finishLogin() {
  document.getElementById('language-screen')?.classList.add('hidden');
  document.getElementById('auth-screen')?.classList.add('hidden');
  document.getElementById('app')?.classList.remove('hidden');
  const role = String(currentUser?.role || 'PATIENT').toUpperCase();
  switchGlobalRole(role === 'DOCTOR' ? 'doctor' : role === 'RECEPTIONIST' ? 'reception' : role === 'AMBULANCE' ? 'ambulance' : 'patient');
  renderPatientHealthProfile();
  fetchNotifications();
  syncAllData();
  connectSocket();
}
function panelForCurrentUser() { const role = String(currentUser?.role || '').toUpperCase(); return role === 'DOCTOR' ? 'doctor' : role === 'RECEPTIONIST' ? 'reception' : role === 'AMBULANCE' ? 'ambulance' : 'patient'; }
window.toggleProfileMenu = function(role) {
  const menu = document.getElementById('profile-menu');
  if (!menu) return;
  if (!menu.classList.contains('hidden') && menu.dataset.role === role) { menu.classList.add('hidden'); return; }
  const fallback = role === 'doctor' ? 'Dr. Priya Sharma' : role === 'reception' ? 'Receptionist Desk' : 'Patient';
  const name = role === panelForCurrentUser() ? (currentUser?.name || fallback) : fallback;
  const title = role === 'doctor' ? 'Doctor account' : role === 'reception' ? 'Reception desk' : 'Patient account';
  menu.dataset.role = role;
  menu.innerHTML = `<div class="profile-menu-name">${escapeHtml(name)}</div><div class="profile-menu-role">${title}</div><button type="button" role="menuitem" onclick="openProfileSettings('${role}')"><i class="fa-solid fa-gear"></i> Account settings</button><button type="button" class="profile-logout" role="menuitem" onclick="logoutCurrentUser()"><i class="fa-solid fa-right-from-bracket"></i> Log out</button>`;
  menu.classList.remove('hidden');
};
window.openProfileSettings = function(role) { document.getElementById('profile-menu')?.classList.add('hidden'); if (role === panelForCurrentUser()) openPortalTool(role, 'settings'); else showToast('Switch to this workspace to manage its settings.', 'info'); };
document.addEventListener('click', event => { if (!event.target.closest('.profile-trigger') && !event.target.closest('#profile-menu')) document.getElementById('profile-menu')?.classList.add('hidden'); });

async function fetchNotifications() { if (!currentUser) return; try { const res=await fetch(`${API_BASE}/notifications?userId=${encodeURIComponent(currentUser.id)}`); const data=await res.json(); renderNotifications(data.notifications || []); } catch {} }
function renderNotifications(items) { const unread=items.filter(item=>item.status==='UNREAD').length; const count=document.getElementById('notification-count'); const dot=document.getElementById('notification-dot'); if(count) count.textContent=unread; if(dot) dot.classList.toggle('hidden', !unread); const list=document.getElementById('notification-list'); if(list) list.innerHTML=items.length ? items.map(item=>{ let msg=escapeHtml(item.message); msg=msg.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color: #ef4444; font-weight: bold; text-decoration: underline;" onclick="event.stopPropagation()">$1</a>'); return `<div class="notification-item ${item.status==='UNREAD'?'unread':''}" onclick="markNotificationRead('${item.id}')">${msg}<span class="notification-time">${new Date(item.created_at).toLocaleString('en-IN')}</span></div>`; }).join('') : '<div class="empty-state"><div class="es-icon">🔔</div><div class="es-text">You are all caught up</div></div>'; }
window.openNotifications = async function() { await fetchNotifications(); openModal('modal-notifications'); };
window.markNotificationRead = async function(id) { await fetch(`${API_BASE}/notifications/${id}/read`,{method:'POST'}); fetchNotifications(); };
window.clearNotifications = async function() { if(!currentUser)return; await fetch(`${API_BASE}/notifications/clear`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:currentUser.id})}); fetchNotifications(); };

async function syncAllData() {
  await Promise.all([
    fetchQueueLive(),
    fetchAppointmentsToday(),
    fetchPrescriptions()
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
  if (isMobileAppNavigation()) history.pushState({ healthsyncNavigation: true, role, page }, '', window.location.href);
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
window.goAppBack = function() { if (appHistoryIndex === 0) return; appHistoryIndex--; goToAppHistoryState(appHistory[appHistoryIndex]); updateAppHistoryButtons(); };
window.goAppForward = function() { if (appHistoryIndex >= appHistory.length - 1) return; appHistoryIndex++; goToAppHistoryState(appHistory[appHistoryIndex]); updateAppHistoryButtons(); };
window.addEventListener('popstate', event => {
  const state = event.state;
  if (!isMobileAppNavigation() || !state?.healthsyncNavigation) return;
  const index = appHistory.findIndex(item => item.role === state.role && item.page === state.page);
  if (index >= 0) appHistoryIndex = index;
  else { appHistory.push({ role: state.role, page: state.page }); appHistoryIndex = appHistory.length - 1; }
  goToAppHistoryState(state);
  updateAppHistoryButtons();
});

window.switchGlobalRole = function(role, remember = true) {
  document.querySelectorAll('.role-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));

  const targetPanel = document.getElementById(`panel-${role}`);
  if (targetPanel) targetPanel.classList.add('active');

  // Activate matching headers
  document.querySelectorAll(`.role-tab[onclick*="${role}"]`).forEach(t => t.classList.add('active'));

  // Sync data immediately when switching
  syncAllData();
  if (remember && targetPanel) {
    const activeId = targetPanel.querySelector('.page.active')?.id || `${role}-page-dashboard`;
    let page = activeId.replace(`${role}-page-`, '');
    if (page.startsWith('tool-')) page = `tool:${page.slice(5)}`;
    recordAppNavigation(role, page);
  }
};

window.toggleSidebar = function(forceClose = false) {
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
window.switchPatientPage = function(pageId, remember = true) {
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
  if (remember) recordAppNavigation('patient', pageId);
};

window.switchDoctorPage = function(pageId, remember = true) {
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

window.switchReceptionPage = function(pageId, remember = true) {
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
const utilityTitles = { prescriptions:'Prescriptions', medicines:'Medicines', reminders:'Medicine Reminders', vaccinations:'Vaccination Reminders', family:'Family Accounts', 'voice-search':'AI Voice Search', availability:'Doctor Availability', messages:'Messages', settings:'Settings', help:'Help & Support', schedule:'Schedule', requests:'Patient Requests', earnings:'Earnings', reports:'Reports', patients:'Patients', doctors:'Doctors', 'follow-ups':'Follow-up Reminders', 'ai-summary':'AI Patient Summary', priority:'Emergency Priority Queue', billing:'Billing Entry' };
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
  const name = profile?.name || currentUser?.name || 'Rahul Verma';
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
  const activityFactors = { Student:1.3, 'Desk-based / mostly sitting':1.25, 'Business owner / entrepreneur':1.35, 'Mixed activity':1.45, 'Physically active work':1.65, 'Healthcare / service work':1.5, 'Driving / travel-based work':1.3, 'Homemaker / caregiver':1.45, 'Shift work':1.4, Retired:1.25, Other:1.35 };
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
    ['name','age','gender','job','height','weight','workHours','bloodGroup','emergencyName','emergencyPhone','allergies','conditions'].forEach(field => { const elementId = `profile-${field.replace('workHours', 'work-hours').replace('bloodGroup', 'blood-group').replace('emergencyName', 'emergency-name').replace('emergencyPhone', 'emergency-phone')}`; const input = document.getElementById(elementId); if (input) input.value = profile[field] ?? ''; });
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
window.saveHealthProfile = function(event) {
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
window.chooseProfilePhoto = function(source) {
  document.getElementById(source === 'camera' ? 'profile-photo-camera' : 'profile-photo-gallery')?.click();
};
window.saveProfilePhoto = function(file) {
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
window.removeProfilePhoto = function() {
  const profile = getHealthProfile();
  if (!profile?.photoDataUrl) return showToast('There is no profile photo to remove.', 'warning');
  delete profile.photoDataUrl;
  saveHealthProfileData(profile);
  renderPatientHealthProfile();
  showToast('Profile photo removed.', 'success');
};
window.toggleCustomWorkField = function() {
  const isOther = document.getElementById('profile-job')?.value === 'Other';
  const group = document.getElementById('profile-custom-job-group');
  const input = document.getElementById('profile-custom-job');
  group?.classList.toggle('hidden', !isOther);
  if (input) input.required = Boolean(isOther);
};
window.openPortalTool = function(role, tool, remember = true) {
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
  if (tool === 'vaccinations') return reminderWorkspace('Vaccination', 'vaccine', 'healthsync-vaccinations');
  if (tool === 'family') return familyWorkspace();
  if (tool === 'voice-search') return `<div class="card"><div class="card-body"><p class="mb-3">Speak in English, Hindi, or Marathi to find doctors and specialties.</p><button class="btn btn-primary" onclick="startVoiceDoctorSearch()"><i class="fa-solid fa-microphone"></i> Start voice search</button><p id="voice-search-result" class="auth-message mt-3" aria-live="polite"></p></div></div>`;
  if (tool === 'availability') return `<div class="card"><div class="card-body"><p class="mb-3">Check a doctor's consultation calendar before booking.</p><button class="btn btn-primary" onclick="showAvailability()">Load availability</button><div id="availability-results" class="mt-3"></div></div></div>`;
  if (tool === 'follow-ups') return `<div class="card"><div class="card-body"><p>Completed consultations will appear here for follow-up scheduling.</p><button class="btn btn-primary" onclick="showToast('Follow-up reminder created.', 'success')">Create follow-up reminder</button></div></div>`;
  if (tool === 'ai-summary') return `<div class="card"><div class="card-body"><p class="mb-3">AI summaries are clinical decision support only and must be checked against the full patient record.</p><button class="btn btn-primary" onclick="renderAiSummary()">Generate patient summary</button><div id="ai-summary-output" class="mt-3"></div></div></div>`;
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
  applyLanguage(language);
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
  const term = document.getElementById('pt-doc-search-input')?.value.trim().toLowerCase() || '';
  const doctors = allDoctors.filter(doc => !term || [doc.name, doc.specialization, doc.clinic, doc.languages].some(value => String(value || '').toLowerCase().includes(term)));
  container.innerHTML = doctors.length ? doctors.map(doc => `
    <div style="background: white; border-radius: 12px; padding: 16px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <div style="display: flex; gap: 16px;">
        <div style="width: 80px; height: 100px; background: #e5e7eb; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; overflow: hidden;">
          <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(doc.name)}&background=random&color=fff&size=100" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <h4 style="margin: 0; font-size: 16px; font-weight: bold; color: #111827;">
              <i class="fa-solid fa-thumbs-up" style="color: #4b5563; font-size: 14px; margin-right: 4px;"></i> ${escapeHtml(doc.name)}
            </h4>
            <span style="background: #fef3c7; color: #d97706; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: bold;"><i class="fa-solid fa-shield-check"></i> Top rated</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px; margin-bottom: 8px;">
            <span style="background: #16a34a; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 13px;">${doc.rating} ★</span>
            <span style="color: #6b7280; font-size: 13px;">${doc.reviews} Ratings</span>
          </div>
          <p style="color: #6b7280; font-size: 13px; margin: 4px 0;">${escapeHtml(doc.clinic)} • ${escapeHtml(doc.specialization)}</p>
          <p style="color: #16a34a; font-size: 13px; font-weight: 500; margin: 4px 0;"><i class="fa-regular fa-clock"></i> Open 24 Hrs</p>
        </div>
      </div>
      <div style="display: flex; gap: 12px; margin-top: 16px; border-top: 1px solid #f3f4f6; padding-top: 16px;">
        <button style="flex: 1; background: #0066cc; color: white; border: none; padding: 10px; border-radius: 6px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;" onclick="openBookAppointmentModalWithDoctor('${doc.id}')"><i class="fa-solid fa-phone"></i> Call to Book</button>
        <button style="flex: 1; background: white; color: #0066cc; border: 1px solid #0066cc; padding: 10px; border-radius: 6px; font-weight: bold; cursor: pointer;" onclick="showToast('Enquiry sent to ${escapeHtml(doc.name)}!')">Send Enquiry</button>
      </div>
    </div>
  `).join('') : `<div style="padding: 40px 20px; text-align: center; color: #6b7280; background: #f9fafb; border-radius: 12px; margin-top: 12px;"><i class="fa-solid fa-user-doctor" style="font-size: 32px; margin-bottom: 12px; opacity: 0.5;"></i><p style="margin: 0;">No doctors found matching your criteria</p><button class="btn btn-secondary mt-3" onclick="clearPatientDoctorSearch()">Clear Search</button></div>`;
}
window.handlePatientDocSearch = function() { renderPatientDoctorsList(); };
window.clearPatientDoctorSearch = function() { const input = document.getElementById('pt-doc-search-input'); if (input) input.value = ''; renderPatientDoctorsList(); };

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

window.searchDoctorsFromDashboard = function() {
  const term = document.getElementById('dashboard-doctor-search')?.value.trim().toLowerCase() || '';
  switchPatientPage('doctors');
  const search = document.getElementById('pt-doc-search-input');
  if (search) {
    search.value = term;
    search.dispatchEvent(new Event('input', { bubbles: true }));
  }
};
window.showEmergencyHelp = function() {
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
  try {
    const res = await fetch(`${API_BASE}/emergency/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': currentUser?.token ? `Bearer ${currentUser.token}` : ''
      },
      body: JSON.stringify({
        patientId: currentUser?.patientId || 'pat1',
        latitude: lat,
        longitude: lng
      })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Emergency SOS triggered! Live location link sent to nearby hospital.', 'success');
    } else {
      showToast(data.message || 'Failed to trigger SOS alert.', 'error');
    }
  } catch (err) {
    showToast('Could not connect to server to trigger SOS alert.', 'error');
  }
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
      : 'openBookAppointmentModal()';
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
          <td>${escapeHtml(appt.doctor_name || appt.doctorName || appt.doctor || 'HealthSync care team')}</td>
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
  const value = String(status || '').trim().toUpperCase();
  if (value === 'CONFIRMED') return 'badge-confirmed';
  if (value === 'WAITING' || value === 'CHECKED IN') return 'badge-waiting';
  if (value === 'IN CONSULTATION' || value === 'IN PROGRESS') return 'badge-in-consult';
  if (value === 'COMPLETED') return 'badge-completed';
  if (value === 'CANCELLED') return 'badge-cancelled';
  if (value === 'NO SHOW') return 'badge-noshow';
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

  // Tab panels are sibling sections under the page, not children of the first
  // panel. Searching the shared page wrapper ensures exactly one panel is shown.
  const container = parent.parentElement;
  container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  const target = document.getElementById(contentId);
  if (target) target.classList.add('active');
};

// Used by the appointment empty states without relying on fragile inline DOM selectors.
window.showPatientAppointmentTab = function(contentId) {
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
