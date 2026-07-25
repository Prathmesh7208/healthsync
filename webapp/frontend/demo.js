'use strict';

/* Presentation-only portal. All records below are fictional, cloned in memory
 * per visit, and intentionally never call production data endpoints. */
window.DemoPortal = (() => {
  const root = () => document.getElementById('demo-portal');
  const productionNodes = () => [document.getElementById('auth-screen'), document.getElementById('app')];
  let selectedRole = null;
  let demo = null;

  const source = {
    patient: {
      name: 'Aarav Mehta', hospital: 'Lakeview Multispecialty Hospital',
      stats: [['Upcoming visits','2','Next: 28 Jul'],['Active medicines','4','On schedule'],['Health reports','18','2 new this month'],['Payments this year','₹18,450','All settled']],
      appointments: [['28 Jul, 10:30 AM','Dr. Kavya Iyer','Cardiology follow-up','Confirmed'],['04 Aug, 4:15 PM','Dr. Rohan Shah','Annual wellness visit','Confirmed']],
      records: [['Lipid Profile','26 Jul 2026','Lakeview Diagnostics','Ready'],['HbA1c Report','14 Jun 2026','Lakeview Diagnostics','Reviewed'],['ECG Report','03 May 2026','Cardiology Unit','Reviewed']],
      prescriptions: [['Atorvastatin 10 mg','1 tablet at night','Dr. Kavya Iyer'],['Metformin XR 500 mg','1 tablet after dinner','Dr. Nisha Desai'],['Vitamin D3','Weekly, Sunday','Dr. Rohan Shah']],
      timeline: ['Prescription renewed by Dr. Kavya Iyer','Lipid profile uploaded and reviewed','Video consultation completed','Annual health plan payment received'],
      payments: [['INV-260731','Annual Wellness Plan','₹4,999','Paid'],['INV-260728','Cardiology consultation','₹850','Paid'],['INV-260714','Diagnostic package','₹2,450','Paid']]
    },
    doctor: {
      name: 'Dr. Kavya Iyer', hospital: 'Lakeview Multispecialty Hospital',
      stats: [['Today’s appointments','18','4 completed'],['Patients waiting','5','Average wait 14 min'],['Follow-ups due','12','This week'],['Collections today','₹14,600','18 consultations']],
      appointments: [['09:30','Aarav Mehta','Cardiology follow-up','Checked in'],['10:00','Meera Kulkarni','Hypertension review','In consultation'],['10:30','Ritesh Nair','Chest discomfort','Waiting'],['11:00','Sana Kapoor','ECG review','Waiting']],
      patients: [['Aarav Mehta','HS-204818','Type 2 diabetes · Dyslipidemia'],['Meera Kulkarni','HS-205124','Hypertension · 3 medicines'],['Ritesh Nair','HS-205418','First consultation'],['Sana Kapoor','HS-204992','ECG follow-up']],
      timeline: ['Meera Kulkarni: BP readings reviewed','Aarav Mehta: medication adherence improved','Sana Kapoor: ECG reviewed, follow-up scheduled','Ritesh Nair: clinical history intake completed']
    },
    reception: {
      name: 'Nisha Verma', hospital: 'Lakeview Multispecialty Hospital',
      stats: [['Appointments today','46','38 confirmed'],['Walk-ins registered','11','3 pending check-in'],['Queue waiting','7','Avg. wait 12 min'],['Collections today','₹36,750','UPI · Card · Cash']],
      appointments: [['A12','Aarav Mehta','Dr. Kavya Iyer','In consultation'],['A13','Meera Kulkarni','Dr. Kavya Iyer','Waiting'],['A14','Ritesh Nair','Dr. Kavya Iyer','Waiting'],['W07','Pranav Joshi','Dr. Rohan Shah','Waiting']],
      payments: [['RCPT-73102','Aarav Mehta','₹850','UPI · Paid'],['RCPT-73101','Meera Kulkarni','₹850','Card · Paid'],['RCPT-73100','Pranav Joshi','₹600','Cash · Paid'],['RCPT-73099','Nandita Roy','₹1,250','UPI · Paid']],
      timeline: ['Walk-in token W07 issued to Pranav Joshi','Payment collected for Meera Kulkarni','Aarav Mehta checked in at Cardiology','Dr. Rohan Shah’s 2:00 PM slot opened']
    }
  };

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function escape(value) { const el = document.createElement('div'); el.textContent = value; return el.innerHTML; }
  function showDemo() { productionNodes().forEach(node => node?.classList.add('hidden')); root().classList.remove('hidden'); }
  function closeDemo() { root().classList.add('hidden'); productionNodes().forEach(node => node?.classList.remove('hidden')); history.replaceState(null, '', location.pathname); selectedRole = null; demo = null; }
  function open() { showDemo(); history.replaceState(null, '', `${location.pathname}#demo`); renderGate(); }

  function renderGate() {
    root().innerHTML = `<div class="demo-landing"><div class="demo-landing-card"><div class="demo-eyebrow">HealthSync presentation environment</div><h1>Explore HealthSync in Demo Mode</h1><p class="demo-lead">Use polished, fictional clinical workflows for doctors, reception teams, hospitals, investors and prospective users. Demo activity exists only in this browser and resets when you refresh.</p><div class="demo-security"><i class="fa-solid fa-shield-heart"></i> Demo Mode is isolated from production users, production records and production payments.</div><div class="demo-access"><input id="demo-admin-code" type="password" autocomplete="off" placeholder="Administrator demo access code"><button class="demo-button" onclick="DemoPortal.unlock()">Unlock Demo Portal</button></div><p id="demo-gate-error" class="demo-error"></p><button class="demo-button secondary" style="margin-top:14px" onclick="DemoPortal.close()">Return to production sign in</button></div></div>`;
  }

  async function unlock() {
    const code = document.getElementById('demo-admin-code').value;
    const error = document.getElementById('demo-gate-error');
    error.textContent = '';
    try {
      const response = await fetch('/v1/demo/access', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({code}) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Demo access could not be granted.');
      renderRoles();
    } catch (err) { error.textContent = err.message; }
  }

  function renderRoles() {
    root().innerHTML = `<div class="demo-landing"><div class="demo-landing-card"><div class="demo-eyebrow">Demo Portal unlocked</div><h1>Choose a presentation experience</h1><p class="demo-lead">Each role uses a complete fictional workspace. No OTP is sent, no user account is created, and no production data is accessed.</p><div class="demo-role-grid">${roleCard('patient','fa-user','Demo as Patient','Appointments, reports, prescriptions, payments and health timeline.')} ${roleCard('doctor','fa-user-doctor','Demo as Doctor','Today’s schedule, patient context, notes, care plans and analytics.')} ${roleCard('reception','fa-headset','Demo as Receptionist','Walk-ins, queue, payments, check-ins and daily clinic operations.')}</div><button class="demo-button secondary" style="margin-top:22px" onclick="DemoPortal.close()">Exit Demo Portal</button></div></div>`;
  }
  function roleCard(role, icon, title, description) { return `<article class="demo-role"><div class="demo-role-icon"><i class="fa-solid ${icon}"></i></div><h2>${title}</h2><p>${description}</p><button onclick="DemoPortal.selectRole('${role}')">Continue <i class="fa-solid fa-arrow-right"></i></button></article>`; }
  function selectRole(role) {
    selectedRole = role;
    root().innerHTML = `<div class="demo-landing"><div class="demo-landing-card"><div class="demo-eyebrow">${escape(role)} demo workspace</div><h1>Start as ${role === 'reception' ? 'a Receptionist' : `a ${role[0].toUpperCase() + role.slice(1)}`}</h1><p class="demo-lead">Enter any valid 10-digit mobile number to begin the fictional demonstration. This number is used only inside this browser and is discarded on refresh.</p><div class="demo-access"><input id="demo-mobile" inputmode="numeric" maxlength="10" autocomplete="tel" placeholder="Enter any 10-digit mobile number"><button class="demo-button" onclick="DemoPortal.start()">Launch Demo</button></div><p id="demo-gate-error" class="demo-error"></p><button class="demo-button secondary" style="margin-top:14px" onclick="DemoPortal.open()">Back</button></div></div>`;
  }
  function start() {
    const mobile = document.getElementById('demo-mobile').value.replace(/\D/g, '');
    const error = document.getElementById('demo-gate-error');
    if (!/^\d{10}$/.test(mobile)) { error.textContent = 'Enter exactly 10 digits to start Demo Mode.'; return; }
    demo = clone(source[selectedRole]); demo.mobile = mobile; demo.role = selectedRole; demo.tab = 'overview'; renderWorkspace();
  }
  function renderWorkspace() {
    const roleLabel = demo.role === 'reception' ? 'Receptionist' : demo.role[0].toUpperCase() + demo.role.slice(1);
    root().innerHTML = `<div class="demo-shell"><div class="demo-banner"><i class="fa-solid fa-flask"></i> DEMO MODE — Fictional data only · Changes reset on refresh · Production data is never accessed</div><header class="demo-topbar"><div class="demo-brand"><i class="fa-solid fa-heart-pulse"></i> HealthSync</div><span class="demo-mode-pill">${roleLabel} demo · ${escape(demo.mobile)}</span><span class="demo-spacer"></span><button class="demo-exit" onclick="DemoPortal.close()">Exit demo</button></header><nav class="demo-nav">${tabsFor(demo.role).map(tab => `<button class="${demo.tab === tab[0] ? 'active' : ''}" onclick="DemoPortal.tab('${tab[0]}')"><i class="fa-solid ${tab[2]}"></i> ${tab[1]}</button>`).join('')}</nav><main class="demo-main">${renderTab()}</main></div>`;
  }
  function tabsFor(role) { const common=[['overview','Overview','fa-chart-pie'],['timeline','Health timeline','fa-clock-rotate-left']]; if(role==='patient') return [...common,['records','Health records','fa-file-medical'],['payments','Payments','fa-credit-card']]; if(role==='doctor') return [...common,['schedule','Today’s schedule','fa-calendar-day'],['patients','Patients','fa-users']]; return [...common,['queue','Live queue','fa-list-ol'],['payments','Collections','fa-indian-rupee-sign']]; }
  function renderTab() { if (demo.tab === 'overview') return overview(); if (demo.tab === 'timeline') return timeline(); if (demo.tab === 'records') return records(); if (demo.tab === 'schedule') return schedule(); if (demo.tab === 'patients') return patients(); if (demo.tab === 'queue') return queue(); return payments(); }
  function heading(title, subtitle) { return `<section class="demo-heading"><div><h1>${title}</h1><p>${subtitle}</p></div><div class="demo-mobile-row"><label>Demo mobile</label><input class="demo-mobile-input" value="${escape(demo.mobile)}" readonly></div></section>`; }
  function stats() { return `<section class="demo-stats">${demo.stats.map(s => `<article class="demo-stat"><small>${s[0]}</small><strong>${s[1]}</strong><span>${s[2]}</span></article>`).join('')}</section>`; }
  function overview() { const title = demo.role === 'patient' ? `Welcome back, ${demo.name}` : `${demo.name} · ${demo.hospital}`; const rows = demo.appointments || []; return `${heading(title, demo.role === 'patient' ? 'Your personalized care overview is up to date.' : 'A realistic active-clinic workspace for your presentation.')}${stats()}<section class="demo-grid"><article class="demo-card"><h2>${demo.role === 'patient' ? 'Upcoming consultations' : demo.role === 'doctor' ? 'Today’s consultations' : 'Live appointment register'}</h2>${table(rows, demo.role==='doctor'?['Time','Patient','Reason','Status']:demo.role==='reception'?['Token','Patient','Clinician','Status']:['Date & time','Clinician','Visit','Status'])}</article><aside class="demo-card"><h2>${demo.role==='patient'?'Care timeline':'Operational highlights'}</h2>${timelineList(demo.timeline)}</aside></section>`; }
  function timeline() { return `${heading('Care & activity timeline','A realistic history used only for the presentation.')}${stats()}<section class="demo-card"><div class="demo-timeline">${demo.timeline.concat(['Follow-up message delivered','Clinical summary securely added']).map((item,i)=>`<div><strong>${i === 0 ? 'Today' : `${i + 1} days ago`}</strong><p class="demo-muted">${item}</p></div>`).join('')}</div></section>`; }
  function records() { return `${heading('Digital health records','Fictional reports and prescriptions for the demo patient.')}${stats()}<section class="demo-grid"><article class="demo-card"><h2>Laboratory reports</h2>${table(demo.records,['Report','Date','Facility','Status'])}</article><aside class="demo-card"><h2>Active prescriptions</h2>${demo.prescriptions.map(p=>`<div class="demo-item"><span class="demo-icon"><i class="fa-solid fa-pills"></i></span><div class="demo-item-main"><strong>${p[0]}</strong><p>${p[1]} · ${p[2]}</p></div><span class="demo-badge blue">Active</span></div>`).join('')}</aside></section>`; }
  function schedule() { return `${heading('Today’s clinical schedule','Manage fictional patient visits, notes and follow-ups.')}${stats()}<section class="demo-card"><h2>Appointments</h2>${table(demo.appointments,['Time','Patient','Reason','Status'], true)}</section><section class="demo-card" style="margin-top:16px"><h2>Consultation analytics</h2>${chart()}</section>`; }
  function patients() { return `${heading('Patient workspace','Sample patient histories and current care context.')}${stats()}<section class="demo-card"><h2>Recent patient activity</h2>${table(demo.patients,['Patient','HealthSync ID','Clinical context'], true)}</section>`; }
  function queue() { return `${heading('Live queue management','Issue, call and complete fictional tokens with no production impact.')}${stats()}<section class="demo-card"><h2>Today’s queue</h2>${table(demo.appointments,['Token','Patient','Clinician','Status'], true)}</section>`; }
  function payments() { const rows = demo.payments || source.patient.payments; return `${heading(demo.role==='patient'?'Payments & invoices':'Today’s collections','All payment information shown here is fictional.')}${stats()}<section class="demo-card"><h2>Payment history</h2>${table(rows,demo.role==='patient'?['Invoice','Description','Amount','Status']:['Receipt','Patient','Amount','Status'], true)}</section>`; }
  function table(rows, headers, actions=false) { return `<div class="demo-table-wrap"><table class="demo-table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}${actions?'<th>Action</th>':''}</tr></thead><tbody>${rows.map((row,index)=>`<tr>${row.map((cell,i)=>`<td>${i===row.length-1?`<span class="demo-badge ${String(cell).includes('Waiting')?'orange':''}">${escape(String(cell))}</span>`:escape(String(cell))}</td>`).join('')}${actions?`<td><button class="demo-action" onclick="DemoPortal.action(${index})">${demo.role==='reception'?'Call next':'Open'}</button></td>`:''}</tr>`).join('')}</tbody></table></div>`; }
  function timelineList(items) { return `<div class="demo-list">${items.slice(0,4).map(item=>`<div class="demo-item"><span class="demo-icon"><i class="fa-solid fa-check"></i></span><div class="demo-item-main"><strong>${escape(item)}</strong><p>Fictional clinical activity</p></div></div>`).join('')}</div>`; }
  function chart() { return `<div class="demo-chart">${[42,68,57,84,76,92,64].map(h=>`<span class="demo-bar" style="height:${h}%"></span>`).join('')}</div>`; }
  function tab(tabName) { demo.tab = tabName; renderWorkspace(); }
  function action(index) { if(demo.role==='reception' && demo.appointments[index]) { demo.appointments[index][3] = demo.appointments[index][3] === 'Waiting' ? 'In consultation' : 'Completed'; } else if(demo.role==='doctor' && demo.appointments[index]) { demo.appointments[index][3] = 'Completed'; } renderWorkspace(); }

  if (location.hash === '#demo') setTimeout(open, 0);
  return { open, close: closeDemo, unlock, selectRole, start, tab, action };
})();
