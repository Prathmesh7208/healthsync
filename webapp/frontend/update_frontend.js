const fs = require('fs');

const mainJsPath = 'c:/HealthSync/webapp/frontend/js/main.js';
let mainJs = fs.readFileSync(mainJsPath, 'utf8');

// Regexes to locate the existing functions. We will replace them entirely.
const fn1Regex = /window\.openBookAppointmentModalWithDoctor = function \([^)]*\) \{[\s\S]*?openModal\('modal-book-appt'\);\s*\};/;
const fn2Regex = /window\.selectBookingDate = async function \([^)]*\) \{[\s\S]*?\}\s*\};\s*window\.selectBookingTime/;
const fn3Regex = /window\.selectBookingTime = function \([^)]*\) \{[\s\S]*?disabled = false;\s*\};/;

const newOpenModalFn = `window.openBookAppointmentModalWithDoctor = async function (doctorId) {
    bookingDoctor = allDoctors.find(d => String(d.id) === String(doctorId));
    if (!bookingDoctor) return;
    bookingDate = null;
    bookingTime = null;
    bookingStep = 1;
    bookingMode = 'IN_PERSON';
  
    // Render doc info
    document.getElementById('booking-doc-info').innerHTML = \`
      <div style="width: 48px; height: 48px; border-radius: 50%; background: #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; color: #64748b;">
        \${(bookingDoctor.name || bookingDoctor.full_name || 'Dr. Doctor').substring(4, 6)}
      </div>
      <div>
        <h4 style="margin: 0; font-size: 15px; color: #1e293b;">\${escapeHtml(bookingDoctor.name || bookingDoctor.full_name || 'Doctor')}</h4>
        <p style="margin: 2px 0 0; font-size: 12px; color: #64748b;">\${escapeHtml(bookingDoctor.specialization)} • ₹\${bookingDoctor.fee || bookingDoctor.consultation_fee || 500}</p>
      </div>
    \`;
  
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
      dateHtml += \`
        <div class="booking-date-card" id="date-card-\${dateStr}" onclick="selectBookingDate('\${dateStr}')" style="min-width: 76px; padding: 10px; border: 1px solid var(--border); border-radius: 12px; text-align: center; cursor: pointer; transition: 0.2s;">
          <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">\${dayName}</div>
          <div style="font-size: 16px; font-weight: bold; color: var(--text-dark); margin-bottom: 4px;">\${dayNum}</div>
          <div id="date-indicator-\${dateStr}" style="font-size: 10px; color: #94a3b8;"><i class="fa-solid fa-spinner fa-spin"></i></div>
        </div>
      \`;
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
      const res = await fetch(\`\${API_BASE}/doctors/\${bookingDoctor.id}/slots/summary?dates=\${days.join(',')}\`);
      const data = await res.json();
      if (data.success && data.summary) {
        days.forEach(dateStr => {
          const indicator = document.getElementById(\`date-indicator-\${dateStr}\`);
          if (indicator) {
            const sum = data.summary[dateStr];
            if (!sum || sum.available === 0) {
               indicator.innerHTML = '<span style="color:#ef4444;">🔴 Full</span>';
            } else {
               indicator.innerHTML = \`<span style="color:#10b981;">🟢 \${sum.available} slots</span>\`;
            }
          }
        });
      }
    } catch(e) {
      console.error('Failed to load slot summary');
    }
  };`;

const newSelectDateFn = `window.selectBookingDate = async function (dateStr) {
    bookingDate = dateStr;
    bookingTime = null;
    document.getElementById('btn-booking-next').disabled = true;
  
    // Highlight selected date
    document.querySelectorAll('.booking-date-card').forEach(el => {
      el.style.background = 'transparent';
      el.style.borderColor = 'var(--border)';
    });
    const selectedEl = document.getElementById(\`date-card-\${dateStr}\`);
    if (selectedEl) {
      selectedEl.style.background = '#eff6ff';
      selectedEl.style.borderColor = 'var(--blue-primary)';
    }
  
    const container = document.getElementById('booking-time-container');
    container.innerHTML = '<div style="text-align:center; padding:40px 20px; color:#64748b;"><i class="fa-solid fa-spinner fa-spin" style="font-size:24px; margin-bottom:12px; color:var(--blue-primary);"></i><br>Loading available slots...</div>';
  
    try {
      const res = await fetch(\`\${API_BASE}/doctors/\${bookingDoctor.id}/slots?date=\${dateStr}\`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      
      if (!data.slots || data.slots.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:30px 20px;"><p style="color:#ef4444; font-weight:600; margin-bottom:12px;">No appointments available on this date.</p><button class="btn btn-outline btn-sm" onclick="selectBookingDate(\\'' + getNextDateStr(dateStr) + '\\')">View Next Available Date</button></div>';
        return;
      }
      
      const allBooked = data.slots.every(s => !s.available);
      if (allBooked) {
        container.innerHTML = '<div style="text-align:center; padding:30px 20px;"><p style="color:#ef4444; font-weight:600; margin-bottom:12px;">All appointments are booked for this date.</p><button class="btn btn-outline btn-sm" onclick="selectBookingDate(\\'' + getNextDateStr(dateStr) + '\\')">View Next Available Date</button></div>';
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
        let groupHtml = \`<h5 style="margin: 16px 0 12px; font-size: 14px; color: #1e293b; font-weight:600;">\${title}</h5><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 8px;">\`;
        slots.forEach(s => {
          const id = \`time-slot-\${s.time.replace(/[: ]/g, '-')}\`;
          if (s.available) {
            groupHtml += \`<div id="\${id}" class="time-slot-box available" onclick="selectBookingTime('\${s.time}', '\${id}')" style="padding: 10px; border: 1px solid var(--blue-primary); border-radius: 8px; cursor: pointer; display:flex; flex-direction:column; align-items:center; transition:0.2s;">
              <span style="font-weight:600; font-size:14px; color:#1e293b; margin-bottom:4px;">\${s.time}</span>
              <span style="font-size:11px; color:#10b981; display:flex; align-items:center; gap:4px;"><i class="fa-solid fa-circle" style="font-size:8px;"></i> Available</span>
            </div>\`;
          } else {
            groupHtml += \`<div class="time-slot-box booked" style="padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; cursor: not-allowed; background:#f8fafc; opacity:0.7; display:flex; flex-direction:column; align-items:center;">
              <span style="font-weight:600; font-size:14px; color:#94a3b8; margin-bottom:4px; text-decoration:line-through;">\${s.time}</span>
              <span style="font-size:11px; color:#ef4444; display:flex; align-items:center; gap:4px;"><i class="fa-solid fa-circle" style="font-size:8px;"></i> Booked</span>
            </div>\`;
          }
        });
        groupHtml += \`</div>\`;
        return groupHtml;
      };
  
      html += renderGroup('Morning', morning);
      html += renderGroup('Afternoon', afternoon);
      html += renderGroup('Evening', evening);
      
      html += \`<div style="display:flex; justify-content:center; gap:16px; margin-top:24px; padding-top:16px; border-top:1px solid #f1f5f9; font-size:11px; color:#64748b;">
        <span><i class="fa-solid fa-circle" style="color:#10b981;"></i> Available</span>
        <span><i class="fa-solid fa-circle" style="color:#ef4444;"></i> Booked</span>
        <span><i class="fa-solid fa-circle" style="color:#3b82f6;"></i> Selected</span>
      </div>\`;
  
      container.innerHTML = html;
    } catch (err) {
      container.innerHTML = '<div style="text-align:center; padding:30px 20px;"><p style="color:#ef4444; font-weight:600; margin-bottom:12px;">Unable to load appointment availability.</p><button class="btn btn-outline btn-sm" onclick="selectBookingDate(\\'' + dateStr + '\\')">Try Again</button></div>';
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
  };`;

// Replace fn1 and fn2 in main.js
if (mainJs.match(fn1Regex)) {
  mainJs = mainJs.replace(fn1Regex, newOpenModalFn);
} else {
  console.log('fn1 regex failed');
}

// Remove the old selectBookingTime since it is merged into fn2 replacement text
if (mainJs.match(fn2Regex)) {
  mainJs = mainJs.replace(fn2Regex, newSelectDateFn + '\n\n  window.selectBookingTime');
} else {
  console.log('fn2 regex failed');
}

fs.writeFileSync(mainJsPath, mainJs);

// Also need to check if remote_main.js exists and update it too
const remoteJsPath = 'c:/HealthSync/webapp/frontend/js/remote_main.js';
if (fs.existsSync(remoteJsPath)) {
  let remoteJs = fs.readFileSync(remoteJsPath, 'utf8');
  remoteJs = remoteJs.replace(fn1Regex, newOpenModalFn);
  remoteJs = remoteJs.replace(fn2Regex, newSelectDateFn + '\n\n  window.selectBookingTime');
  fs.writeFileSync(remoteJsPath, remoteJs);
}

console.log('Updated main.js with new frontend logic');
