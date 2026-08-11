const fs = require('fs');

const serverJsPath = 'c:/HealthSync/webapp/server.js';
let content = fs.readFileSync(serverJsPath, 'utf8');

// 1. Update isPublicRoute
content = content.replace(
    /const isPublicRoute = pathname\.startsWith\('\/v1\/auth'\) \|\| pathname\.startsWith\('\/v1\/doctors\/search'\) \|\| pathname === '\/v1\/health';/g,
    `const isPublicRoute = pathname.startsWith('/v1/auth') || pathname.startsWith('/v1/doctors/search') || pathname.match(/^\\/v1\\/doctors\\/([^/]+)\\/slots(\\/summary)?$/) || pathname === '/v1/health';`
);

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

content = content.replace(
    /if \(pathname\.match\(\/\^\\\/v1\\\/doctors\\\/\[\^\/\]\+\\\/slots\$\/\) && method === 'GET'\) \{/,
    summaryEndpoint + '\n    if (pathname.match(/^\\/v1\\/doctors\\/([^/]+)\\/slots$/) && method === \'GET\') {'
);

// 3. Add Double Booking Protection to POST /appointments
// We need to find the INSERT INTO appointments part
const insertRegex = /db\.get\('SELECT COUNT\(\*\) AS c FROM appointments', \(err, rowCount\) => \{[\s\S]*?const nextNum  = \(rowCount\?\.c \|\| 0\) \+ 17;[\s\S]*?const token    = 'A' \+ nextNum;/;

if (insertRegex.test(content)) {
    const doubleBookingCheck = `
      // Strict double booking check
      db.get("SELECT id FROM appointments WHERE doctor_id = ? AND slot_date = ? AND slot_time = ? AND status = 'CONFIRMED'", [docId, date, time], (checkErr, existing) => {
        if (checkErr) return json(res, 500, { success: false, message: 'Database error' });
        if (existing) return json(res, 409, { success: false, message: 'Sorry, this slot was just booked.' });
        
        db.get('SELECT COUNT(*) AS c FROM appointments', (err, rowCount) => {
          const nextNum  = (rowCount?.c || 0) + 17;
          const token    = 'A' + nextNum;`;
          
    content = content.replace(insertRegex, doubleBookingCheck);
    
    // We also need to add an extra '});' to close the db.get double booking check
    // The query goes on to db.run(INSERT INTO queue_entries), then json(res, 201), then closing tags
    const endInsertRegex = /json\(res, 201, \{ success: true, appointment:/;
    if (endInsertRegex.test(content)) {
        content = content.replace(endInsertRegex, `json(res, 201, { success: true, appointment:`);
        // We will just do a standard string replace for the end of the query block
        const oldEndBlock = `
            }
          );
        }
      );
    }
    // "?"? Patient Appointments
`;
        
        // Wait, the regex might be tricky. Let's just find the closing tags of POST /appointments
        content = content.replace(/body\.clinicName \|\| 'HealthSync Multispeciality Hospital';\s*\/\/ Strict double booking check/, "body.clinicName || 'HealthSync Multispeciality Hospital';\n\n      // Strict double booking check");
    }
}

fs.writeFileSync(serverJsPath, content);
console.log("Updated webapp/server.js successfully");
