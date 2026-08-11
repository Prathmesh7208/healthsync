const fs = require('fs');

const serverJsPath = 'c:/HealthSync/webapp/server.js';
let content = fs.readFileSync(serverJsPath, 'utf8');

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

const oldSlotStr = `  if (pathname.match(/^\\/v1\\/doctors\\/([^/]+)\\/slots$/) && method === 'GET') {`;

if (content.includes(oldSlotStr)) {
    content = content.replace(oldSlotStr, summaryEndpoint + '\n' + oldSlotStr);
    console.log("Successfully replaced slots summary!");
}

fs.writeFileSync(serverJsPath, content);
