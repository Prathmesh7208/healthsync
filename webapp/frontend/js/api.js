async function requestJson(path, options = {}) {
  let response;
  try {
    const headers = options.headers || {};
    if (currentUser?.token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${currentUser.token}`;
    }
    options.headers = headers;
    response = await fetch(`${API_BASE}${path}`, options);
  } catch {
    throw new Error('Cannot connect to HealthSync. Check your internet connection and try again.');
  }

  if (response.status === 401) {
    if (typeof logoutCurrentUser === 'function') logoutCurrentUser();
    throw new Error('Session expired. Please log in again.');
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
var appSocket = null;
let sosTimer = null;
let sosWatchId = null;
var currentEmergencyCaseId = null;
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
      renderEmergencyAlertToDOM(data);
    });

    appSocket.on('emergency_location_update', (data) => {
      // Update google maps link on receptionist / doctor / ambulance side dynamically
      ['rec', 'doc'].forEach(prefix => {
        const link = document.getElementById(`map-link-${prefix}-${data.caseId}`);
        if (link) link.href = `https://www.google.com/maps?q=${data.lat},${data.lng}`;
        if (mapInstances[`${prefix}_${data.caseId}`]) {
          updateMapMarker(mapInstances[`${prefix}_${data.caseId}`], data.lat, data.lng, 'patient');
        }
      });
    });

    appSocket.on('ambulance_location_update', (data) => {
      if (data.caseId === currentEmergencyCaseId) {
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
      }
      
      ['rec', 'doc', 'amb'].forEach(prefix => {
        const mapKey = prefix === 'amb' ? `amb_${data.caseId}` : `${prefix}_${data.caseId}`;
        if (mapInstances[mapKey]) {
          updateMapMarker(mapInstances[mapKey], data.lat, data.lng, 'ambulance');
        }
      });
    });

    appSocket.on('ambulance_dispatched', (data) => {
      const list = document.getElementById('amb-dispatch-list');
      if (!list) return;
      const mapsLink = `https://www.google.com/maps?q=${data.lat},${data.lng}`;
      if (list.querySelector('.empty-state')) list.innerHTML = '';
      list.innerHTML += `
          <div id="amb-disp-${data.id}" class="grid-col-1-2">
            <!-- Left Column: Details -->
            <div style="display: flex; flex-direction: column; gap: 16px;">
              <div class="card" style="border-radius: 12px; border: 1px solid var(--border); box-shadow: var(--shadow-sm); padding: 24px;">
                <h3 style="font-size: 14px; font-weight: 700; margin: 0 0 16px 0; color: #1e293b;">Patient Details</h3>
                <div style="display: flex; gap: 12px; align-items: center;">
                  <div style="width: 48px; height: 48px; border-radius: 50%; overflow: hidden; background: #e2e8f0; display: flex; justify-content: center; align-items: center; font-size: 20px;">👨</div>
                  <div>
                    <h4 style="margin: 0; font-size: 14px; font-weight: 700; color: #0f172a;">${escapeHtml(data.patient_name)}</h4>
                    <p style="margin: 2px 0 0 0; font-size: 12px; color: var(--text-muted);">${escapeHtml(data.phone_number)}</p>
                  </div>
                </div>
              </div>
              
              <div class="card" style="border-radius: 12px; border: 1px solid var(--border); box-shadow: var(--shadow-sm); padding: 24px;">
                <h3 style="font-size: 14px; font-weight: 700; margin: 0 0 8px 0; color: #1e293b;">Emergency Address</h3>
                <p style="margin: 0 0 16px 0; font-size: 13px; color: var(--text-muted); line-height: 1.5;">${escapeHtml(data.address)}</p>
                <a href="${mapsLink}" id="map-link-${data.id}" target="_blank" style="display: block; width: 100%; background: #16a34a; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: 600; font-size: 13px; text-align: center; text-decoration: none;">Open in Maps</a>
              </div>

              <div class="card" style="border-radius: 12px; border: 1px solid var(--border); box-shadow: var(--shadow-sm); padding: 24px;">
                <h3 style="font-size: 14px; font-weight: 700; margin: 0 0 16px 0; color: #1e293b;">Emergency Info</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                  <div style="font-size: 13px; color: var(--text-muted);">Request Time</div>
                  <div style="font-size: 13px; color: #0f172a; font-weight: 500;">Now</div>
                  <div style="font-size: 13px; color: var(--text-muted);">Distance</div>
                  <div style="font-size: 13px; color: #0f172a; font-weight: 500;">Calculating...</div>
                  <div style="font-size: 13px; color: var(--text-muted);">Status</div>
                  <div style="font-size: 13px; color: #3b82f6; font-weight: 600; background: #eff6ff; padding: 2px 8px; border-radius: 4px; display: inline-block;">En Route</div>
                </div>
                <button style="width: 100%; background: white; color: #ef4444; border: 1px solid #ef4444; padding: 10px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; margin-top: 8px;" onclick="resolveEmergency('${data.id}')">Mark as Completed</button>
              </div>
            </div>

            <!-- Right Column: Map -->
            <div style="position: relative;">
              <div id="amb-map-${data.id}" style="height: 100%; min-height: 500px; width: 100%; border-radius: 12px; border: 1px solid var(--border); box-shadow: var(--shadow-sm); z-index: 1;"></div>
              
              <!-- ETA Floating Card -->
              <div style="position: absolute; bottom: 24px; right: 24px; background: white; padding: 20px; border-radius: 12px; box-shadow: var(--shadow-lg); z-index: 1000; display: flex; align-items: center; gap: 16px; border: 1px solid var(--border);">
                <div>
                  <p style="margin: 0; font-size: 12px; font-weight: 600; color: #4f46e5; text-transform: uppercase;">ETA to Patient</p>
                  <h2 style="margin: 4px 0 0 0; font-size: 24px; font-weight: 700; color: #0f172a;">8 Minutes</h2>
                </div>
                <i class="fa-solid fa-truck-medical" style="font-size: 32px; color: #ef4444;"></i>
              </div>
            </div>
          </div>
        `;
        setTimeout(() => {
          mapInstances[`amb_${data.id}`] = initMap(`amb-map-${data.id}`, data.lat, data.lng, 'patient');
        }, 100);
        startAmbulanceLocationTracking(data.id);
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