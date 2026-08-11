const fs = require('fs');

const serverJsPath = 'c:/HealthSync/webapp/server.js';
let content = fs.readFileSync(serverJsPath, 'utf8');

// 1. Update isPublicRoute
const oldPublic = `const isPublicRoute = pathname.startsWith('/v1/auth') || pathname.startsWith('/v1/doctors/search') || pathname === '/v1/health';`;
const newPublic = `const isPublicRoute = pathname.startsWith('/v1/auth') || pathname.startsWith('/v1/doctors/search') || pathname.match(/^\\/v1\\/doctors\\/([^/]+)\\/slots(\\/summary)?$/) || pathname === '/v1/health';`;
if (content.includes(oldPublic)) {
    content = content.replace(oldPublic, newPublic);
}

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

const oldSlot = `    if (pathname.match(/^\\/v1\\/doctors\\/([^/]+)\\/slots$/) && method === 'GET') {`;
if (content.includes(oldSlot)) {
    content = content.replace(oldSlot, summaryEndpoint + '\n' + oldSlot);
}

// 3. Add Double Booking Protection to POST /appointments
const oldApptPostStart = `db.get('SELECT COUNT(*) AS c FROM appointments', (err, rowCount) => {`;
const newApptPostStart = `
      // Strict double booking check
      db.get("SELECT id FROM appointments WHERE doctor_id = ? AND slot_date = ? AND slot_time = ? AND status = 'CONFIRMED'", [docId, date, time], (checkErr, existing) => {
        if (checkErr) return json(res, 500, { success: false, message: 'Database error' });
        if (existing) return json(res, 409, { success: false, message: 'Sorry, this slot was just booked.' });
        
        db.get('SELECT COUNT(*) AS c FROM appointments', (err, rowCount) => {`;

if (content.includes(oldApptPostStart)) {
    content = content.replace(oldApptPostStart, newApptPostStart);
    
    content = content.replace(
        /}\s*\);\s*}\s*\);\s*}\s*\/\/\s*📆 Patient Appointments/,
        `      }\n          );\n        }\n      );\n      });\n    }\n\n    // 📆 Patient Appointments`
    );
}

fs.writeFileSync(serverJsPath, content);
console.log("Updated webapp/server.js successfully");
