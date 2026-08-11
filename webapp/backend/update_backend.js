const fs = require('fs');

const serverPath = 'c:/HealthSync/webapp/backend/server.js';
let serverCode = fs.readFileSync(serverPath, 'utf8');

// 1. Replace the existing slots endpoint with a robust DB-backed endpoint and add the summary endpoint
const oldSlotsEndpointRegex = /else if \(pathname\.match\(\/\^\\\/v1\\\/doctors\\\/[^/]+\\\/slots\$\/\)[\s\S]*?res\.end\(JSON\.stringify\(\{ success: true, slots: slots \}\)\);\s*\}/;

const newEndpoints = `
        else if (pathname.match(/^\\/v1\\/doctors\\/([^\\/]+)\\/slots\\/summary$/) && req.method === 'GET') {
          const match = pathname.match(/^\\/v1\\/doctors\\/([^\\/]+)\\/slots\\/summary$/);
          const doctorId = match[1];
          const datesParam = url.searchParams.get('dates'); // comma separated dates
          if (!datesParam) {
            res.writeHead(400);
            return res.end(JSON.stringify({ success: false, message: 'Missing dates param' }));
          }
          
          const dateList = datesParam.split(',');
          // We assume schedule 09:00-13:00, 16:00-19:00, 30 min intervals -> 14 total slots per day
          const totalSlotsPerDay = 14; 
          
          // Query all appointments for this doctor in this date range
          const placeholders = dateList.map(() => '?').join(',');
          const queryParams = [doctorId, ...dateList];
          
          db.all(\`SELECT slot_date, COUNT(*) as booked_count FROM appointments WHERE doctor_id = ? AND slot_date IN (\${placeholders}) AND status = 'CONFIRMED' GROUP BY slot_date\`, queryParams, (err, rows) => {
            if (err) {
              res.writeHead(500);
              return res.end(JSON.stringify({ success: false, message: 'Database error' }));
            }
            
            const bookedMap = {};
            (rows || []).forEach(r => { bookedMap[r.slot_date] = r.booked_count; });
            
            const summary = {};
            dateList.forEach(d => {
              const booked = bookedMap[d] || 0;
              const available = Math.max(0, totalSlotsPerDay - booked);
              summary[d] = { available, total: totalSlotsPerDay };
            });
            
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, summary }));
          });
        }

        else if (pathname.match(/^\\/v1\\/doctors\\/([^\\/]+)\\/slots$/) && req.method === 'GET') {
          const match = pathname.match(/^\\/v1\\/doctors\\/([^\\/]+)\\/slots$/);
          const doctorId = match[1];
          const dateStr = url.searchParams.get('date');
          
          if (!dateStr) {
            res.writeHead(400);
            return res.end(JSON.stringify({ success: false, message: 'Missing date param' }));
          }
          
          db.all(\`SELECT slot_time FROM appointments WHERE doctor_id = ? AND slot_date = ? AND status = 'CONFIRMED'\`, [doctorId, dateStr], (err, rows) => {
            if (err) {
              res.writeHead(500);
              return res.end(JSON.stringify({ success: false, message: 'Database error' }));
            }
            
            const bookedTimes = new Set((rows || []).map(r => r.slot_time));
            const slots = [];
            
            // Morning: 09:00 AM to 01:00 PM (Exclusive of 1:00 PM)
            // Afternoon: 04:00 PM to 07:00 PM (Exclusive of 7:00 PM)
            const generateBlock = (startH, endH, isPM) => {
              for (let h = startH; h < endH; h++) {
                for (let m of ['00', '30']) {
                  let hour12 = h;
                  if (h > 12) hour12 = h - 12;
                  let hs = hour12 < 10 ? \`0\${hour12}\` : \`\${hour12}\`;
                  let period = isPM ? 'PM' : 'AM';
                  if (h === 12) period = 'PM';
                  let timeStr = \`\${hs}:\${m} \${period}\`;
                  
                  slots.push({
                    time: timeStr,
                    available: !bookedTimes.has(timeStr)
                  });
                }
              }
            };
            
            generateBlock(9, 13, false); // 09:00 AM - 12:30 PM
            generateBlock(16, 19, true); // 04:00 PM - 06:30 PM
            
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, slots: slots }));
          });
        }
`;

serverCode = serverCode.replace(oldSlotsEndpointRegex, newEndpoints);

// 2. Add double-booking protection to POST /v1/appointments
const oldApptEndpointRegex = /else if \(pathname === '\/v1\/appointments' && req\.method === 'POST'\) \{[\s\S]*?\}\);[\s]*\}\);[\s]*\}/;

const newApptEndpoint = `
        else if (pathname === '/v1/appointments' && req.method === 'POST') {
          const docId = parsedBody.doctorId || "doc1";
          const dateStr = parsedBody.date || "Today";
          const timeStr = parsedBody.time || "11:30 AM";
          const patName = parsedBody.patientName || "Neha Kulkarni";
          const docName = parsedBody.doctorName || "Dr. Amit Patil";
          
          // Strict double booking check
          db.get("SELECT id FROM appointments WHERE doctor_id = ? AND slot_date = ? AND slot_time = ? AND status = 'CONFIRMED'", [docId, dateStr, timeStr], (checkErr, existing) => {
            if (checkErr) {
              res.writeHead(500);
              return res.end(JSON.stringify({ success: false, message: 'Database error' }));
            }
            if (existing) {
              res.writeHead(409);
              return res.end(JSON.stringify({ success: false, message: 'Sorry, this slot was just booked.' }));
            }
            
            // Generate Appointment
            db.get("SELECT COUNT(*) AS count FROM appointments", (err, row) => {
              const nextNum = (row ? row.count : 0) + 17;
              const token = "A" + nextNum;
              const apptId = "apt-" + Date.now();
              const qId = "q-" + Date.now();
    
              db.run(\`INSERT INTO appointments (id, patient_id, patient_name, doctor_id, doctor_name, slot_date, slot_time, status, token_number) VALUES (?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?)\`,
                [apptId, "pat1", patName, docId, docName, dateStr, timeStr, token], () => {
                  db.run(\`INSERT INTO queue_entries (id, appointment_id, token_number, patient_id, patient_name, doctor_id, status, checkin_time) VALUES (?, ?, ?, ?, ?, ?, 'Waiting', ?)\`,
                    [qId, apptId, token, "pat1", patName, docId, 'Waiting', timeStr], () => {
                      res.writeHead(201);
                      res.end(JSON.stringify({ 
                        success: true, 
                        appointment: { id: apptId, token: token, doctorName: docName, time: timeStr, status: "CONFIRMED" } 
                      }));
                    });
                });
            });
          });
        }`;

serverCode = serverCode.replace(oldApptEndpointRegex, newApptEndpoint);

fs.writeFileSync(serverPath, serverCode);
console.log('Successfully applied backend updates to server.js');
