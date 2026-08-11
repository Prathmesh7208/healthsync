const fs = require('fs');

const serverJsPath = 'c:/HealthSync/webapp/server.js';
let content = fs.readFileSync(serverJsPath, 'utf8');

// 2. Add /slots/summary before /slots
const summaryEndpoint = `
  if (pathname.match(/^\\/v1\\/doctors\\/([^/]+)\\/slots\\/summary$/) && method === 'GET') {
    const match = pathname.match(/^\\/v1\\/doctors\\/([^/]+)\\/slots\\/summary$/);
    const docId = match[1];
    const datesParam = parsedUrl.searchParams.get('dates');
    if (!datesParam) return json(res, 400, { success: false, message: 'Missing dates param' });
    
    const dateList = datesParam.split(',');
    const totalSlotsPerDay = 14; 
    const placeholders = dateList.map(() => '?').join(',');
    const queryParams = [docId, ...dateList];
    
    db.all(\`SELECT slot_date, COUNT(*) as booked_count FROM appointments WHERE doctor_id = ? AND slot_date IN (\${placeholders}) AND status = 'CONFIRMED' GROUP BY slot_date\`, queryParams, (err, rows) => {
      if (err) return json(res, 500, { success: false, message: 'Database error' });
      
      const bookedMap = {};
      (rows || []).forEach(r => { bookedMap[r.slot_date] = r.booked_count; });
      
      const summary = {};
      dateList.forEach(d => {
        const booked = bookedMap[d] || 0;
        const available = Math.max(0, totalSlotsPerDay - booked);
        summary[d] = { available, total: totalSlotsPerDay };
      });
      
      json(res, 200, { success: true, summary });
    });
    return;
  }
`;

const oldSlotRegex = /  if \(pathname\.match\(\/\^\\\/v1\\\/doctors\\\/\[\^\/\]\+\\\/slots\$\/\) && method === 'GET'\) \{/;
if (oldSlotRegex.test(content)) {
    content = content.replace(oldSlotRegex, summaryEndpoint + '\n$&');
}

// 3. Double booking protection check
const oldApptPostStart = `  if (pathname === '/v1/appointments' && method === 'POST') {\n    const patName  = body.patientName || 'Patient';\n    const patId    = req.user ? req.user.userId : (body.patientId || 'pat1');\n    const docId    = body.doctorId    || 'doc1';\n    const docName  = body.doctorName  || 'Doctor';\n    const date     = body.date || new Date().toISOString().split('T')[0];\n    const time     = body.time || nowTime();\n    const patType  = body.patientType || 'Myself';\n    const reason   = body.reasonForVisit || '';\n    const clinic   = body.clinicName || 'HealthSync Multispeciality Hospital';\n\n    db.get('SELECT COUNT(*) AS c FROM appointments', (err, rowCount) => {`;

const newApptPostStart = `  if (pathname === '/v1/appointments' && method === 'POST') {
    const patName  = body.patientName || 'Patient';
    const patId    = req.user ? req.user.userId : (body.patientId || 'pat1');
    const docId    = body.doctorId    || 'doc1';
    const docName  = body.doctorName  || 'Doctor';
    const date     = body.date || new Date().toISOString().split('T')[0];
    const time     = body.time || nowTime();
    const patType  = body.patientType || 'Myself';
    const reason   = body.reasonForVisit || '';
    const clinic   = body.clinicName || 'HealthSync Multispeciality Hospital';

    db.get("SELECT id FROM appointments WHERE doctor_id = ? AND slot_date = ? AND slot_time = ? AND status = 'CONFIRMED'", [docId, date, time], (checkErr, existing) => {
      if (checkErr) return json(res, 500, { success: false, message: 'Database error' });
      if (existing) return json(res, 409, { success: false, message: 'Sorry, this slot was just booked.' });

      db.get('SELECT COUNT(*) AS c FROM appointments', (err, rowCount) => {`;

if (content.includes(oldApptPostStart)) {
    content = content.replace(oldApptPostStart, newApptPostStart);
    
    // Add closing '});' for the double booking check at the end of the POST /appointments block
    const endBlockRegex = /            \)\;\n          \}\n        \);\n      \}\n    \);/;
    // Actually, let's just find `// 📆 Patient Appointments`
    content = content.replace(
        /          }\n        \);\n      }\n    \);\n  }\n\n  \/\/ 📆 Patient Appointments/,
        `          }\n        );\n      }\n    );\n    });\n  }\n\n  // 📆 Patient Appointments`
    );
}

fs.writeFileSync(serverJsPath, content);
console.log("Updated webapp/server.js successfully");
