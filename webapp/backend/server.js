const http = require('http');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { Server } = require("socket.io");

const dbPath = path.join(__dirname, 'healthsync.db');
const db = new sqlite3.Database(dbPath);

// Initialize Database Schema based on SRS Phase 1 Spec
db.serialize(() => {
  // Users Table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    mobile_number TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Patients Table
  
  db.run(`CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      healthsync_id TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      gender TEXT,
      date_of_birth TEXT,
      blood_group TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (!err) {
        // Try to add email column gracefully if it doesn't exist
        db.run(`ALTER TABLE patients ADD COLUMN email TEXT`, (alterErr) => {
          // Ignored if already exists
        });
      }
    });


  // Doctors Table
  db.run(`CREATE TABLE IF NOT EXISTS doctors (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    full_name TEXT NOT NULL,
    specialization TEXT NOT NULL,
    qualification TEXT,
    clinic_name TEXT,
    consultation_fee INTEGER,
    experience TEXT,
    languages TEXT,
    rating REAL DEFAULT 4.9,
    reviews_count INTEGER DEFAULT 320,
    is_verified INTEGER DEFAULT 1
  )`);

  // Appointments Table
  db.run(`CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    doctor_id TEXT NOT NULL,
    doctor_name TEXT NOT NULL,
    slot_date TEXT NOT NULL,
    slot_time TEXT NOT NULL,
    status TEXT NOT NULL,
    token_number TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Queue Entries Table
  db.run(`CREATE TABLE IF NOT EXISTS queue_entries (
    id TEXT PRIMARY KEY,
    appointment_id TEXT,
    token_number TEXT NOT NULL,
    patient_id TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    doctor_id TEXT NOT NULL,
    status TEXT NOT NULL,
    checkin_time TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Prescriptions Table
  db.run(`CREATE TABLE IF NOT EXISTS prescriptions (
    id TEXT PRIMARY KEY,
    appointment_id TEXT,
    patient_id TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    doctor_id TEXT NOT NULL,
    doctor_name TEXT NOT NULL,
    diagnosis TEXT NOT NULL,
    medications_json TEXT NOT NULL,
    instructions TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Consents Table
  db.run(`CREATE TABLE IF NOT EXISTS consents (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    doctor_id TEXT NOT NULL,
    doctor_name TEXT NOT NULL,
    status TEXT NOT NULL,
    duration TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Records Table (Lab Reports, Vaccinations, etc.)
  db.run(`CREATE TABLE IF NOT EXISTS records (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    title TEXT NOT NULL,
    doctor_name TEXT,
    facility TEXT,
    date TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT,
    summary TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Reminders Table
  db.run(`CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    title TEXT NOT NULL,
    time TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Notifications Table
  db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Seed Default Doctors if empty
  db.get("SELECT COUNT(*) AS count FROM doctors", (err, row) => {
    if (row && row.count === 0) {
      const stmt = db.prepare(`INSERT INTO doctors (id, user_id, full_name, specialization, qualification, clinic_name, consultation_fee, experience, languages, rating, reviews_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      stmt.run("doc1", "u-doc1", "Dr. Amit Patil", "Orthopedic Surgeon", "MS (Ortho)", "HealthSync Clinic, Pune", 500, "12+ Years Exp.", "Marathi, Hindi, English", 4.9, 320);
      stmt.run("doc2", "u-doc2", "Dr. Sneha Joshi", "Gynecologist", "MD (OB-GYN)", "Care Clinic, Pune", 600, "10+ Years Exp.", "Marathi, Hindi", 4.7, 210);
      stmt.run("doc3", "u-doc3", "Dr. Rahul Mehta", "Cardiologist", "DM (Cardiology)", "HeartCare Center, Pune", 800, "15+ Years Exp.", "Hindi, English", 4.9, 450);
      stmt.finalize();
    }
  });

  // Seed Initial Queue & Patient if empty
  db.get("SELECT COUNT(*) AS count FROM patients", (err, row) => {
    if (row && row.count === 0) {
      db.run(`INSERT INTO users (id, mobile_number, role) VALUES ('u-pat1', '9075012345', 'PATIENT')`);
      db.run(`INSERT INTO patients (id, user_id, healthsync_id, full_name, gender, date_of_birth, blood_group) VALUES ('pat1', 'u-pat1', 'HS-2026-907501', 'Neha Kulkarni', 'Female', '1998-05-14', 'O+')`);
      
      // Seed Initial Appointments & Queue
      const queueSeed = [
        { id: "q1", token: "A12", patName: "Rohit Sharma", status: "In Consultation", time: "10:42 AM" },
        { id: "q2", token: "A13", patName: "Priya Deshmukh", status: "Waiting", time: "10:50 AM" },
        { id: "q3", token: "A14", patName: "Sandeep Jadhav", status: "Waiting", time: "10:58 AM" },
        { id: "q4", token: "A15", patName: "Neha Kulkarni", status: "Waiting", time: "11:06 AM" },
        { id: "q5", token: "A16", patName: "Amit Verma", status: "Waiting", time: "11:15 AM" }
      ];

      const qStmt = db.prepare(`INSERT INTO queue_entries (id, token_number, patient_id, patient_name, doctor_id, status, checkin_time) VALUES (?, ?, ?, ?, ?, ?, ?)`);
      queueSeed.forEach(q => {
        qStmt.run(q.id, q.token, "pat-" + q.token, q.patName, "doc1", q.status, q.time);
      });
      qStmt.finalize();

      // Seed Initial Prescription
      const medsJSON = JSON.stringify([
        { name: "Tab. Paracetamol 650mg", dosage: "1 tablet", frequency: "1-0-1 After Food", duration: "5 Days" },
        { name: "Tab. Pantoprazole 40mg", dosage: "1 tablet", frequency: "1-0-0 Before Food", duration: "7 Days" }
      ]);
      db.run(`INSERT INTO prescriptions (id, patient_id, patient_name, doctor_id, doctor_name, diagnosis, medications_json, instructions) VALUES ('rx101', 'pat1', 'Neha Kulkarni', 'doc1', 'Dr. Amit Patil', 'Acute Viral Fever & Migraine', ?, 'Take rest, drink 3 liters of warm water daily.')`, [medsJSON]);

      // Seed Initial Records
      db.run(`INSERT INTO records (id, patient_id, title, doctor_name, facility, date, type, status, summary) VALUES 
        ('rec-1', 'pat1', 'Complete Blood Count', 'Dr. Priya Sharma', 'HealthSync Diagnostics', '16 Apr 2026', 'lab-reports', 'Reviewed', 'Haemoglobin and white-cell counts are within the expected range.'),
        ('rec-2', 'pat1', 'Lipid Profile', 'Dr. Priya Sharma', 'Apollo Diagnostics', '15 Apr 2026', 'lab-reports', 'Action needed', 'LDL is mildly elevated; review diet, activity and follow-up treatment.'),
        ('rec-3', 'pat1', 'ECG Report', 'Dr. Amit Patil', 'Cardiology Unit', '10 Apr 2026', 'lab-reports', 'Reviewed', 'Normal sinus rhythm recorded. No acute abnormality noted.'),
        ('rec-4', 'pat1', 'Thyroid Profile', 'Dr. Amit Patil', 'HealthSync Diagnostics', '02 Apr 2026', 'lab-reports', 'Reviewed', 'Glycaemic control is stable compared with the previous result.')
      `);

      // Seed Initial Notifications
      db.run(`INSERT INTO notifications (id, user_id, title, message, type) VALUES 
        ('notif-1', 'u-pat1', 'Appointment Confirmed', 'Your appointment with Dr. Amit Patil is confirmed for tomorrow.', 'success'),
        ('notif-2', 'u-pat1', 'Lab Results Ready', 'Your Lipid Profile results are available.', 'info')
      `);

      // Seed Initial Reminders
      db.run(`INSERT INTO reminders (id, patient_id, title, time, type) VALUES 
        ('rem-1', 'pat1', 'Take Paracetamol 650mg', '09:00 AM', 'medication'),
        ('rem-2', 'pat1', 'Drink Water (2L goal)', '12:00 PM', 'general'),
        ('rem-3', 'pat1', 'Take Pantoprazole 40mg', '08:00 PM', 'medication')
      `);
    }
  });
});

// Global state for live emergency SOS tracking
const activeEmergencies = [];

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API Endpoints Router (v1)
  if (pathname.startsWith('/v1/')) {
    res.setHeader('Content-Type', 'application/json');
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let parsedBody = {};
      if (body) {
        try { parsedBody = JSON.parse(body); } catch(e) {}
      }

      // Authentication: OTP Request & Verification with DB insertion
      if (pathname === '/v1/auth/login' && req.method === 'POST') {
        const mobile = parsedBody.mobileNumber || "9075012345";
        res.writeHead(200);
        res.end(JSON.stringify({ 
          success: true, 
          message: "OTP Sent Successfully", 
          mobile: mobile,
          otp: "123456"
        }));
      } 
      else if (pathname === '/v1/auth/verify' && req.method === 'POST') {
        const mobile = parsedBody.mobileNumber || "9075012345";
        db.get("SELECT p.* FROM patients p JOIN users u ON p.user_id = u.id WHERE u.mobile_number = ?", [mobile], (err, patientRow) => {
          if (patientRow) {
            res.writeHead(200);
            res.end(JSON.stringify({
              success: true,
              token: "jwt-real-token-" + patientRow.id,
              user: { name: patientRow.full_name, mobile: mobile, healthSyncId: patientRow.healthsync_id, role: "PATIENT" }
            }));
          } else {
            // Register new patient into SQLite
            const newUserId = "u-" + Date.now();
            const newPatId = "p-" + Date.now();
            const hsid = "HS-2026-" + Math.floor(100000 + Math.random() * 900000);
            const name = parsedBody.fullName || "New Patient";

            db.run(`INSERT INTO users (id, mobile_number, role) VALUES (?, ?, 'PATIENT')`, [newUserId, mobile], () => {
              db.run(`INSERT INTO patients (id, user_id, healthsync_id, full_name) VALUES (?, ?, ?, ?)`, [newPatId, newUserId, hsid, name], () => {
                res.writeHead(200);
                res.end(JSON.stringify({
                  success: true,
                  token: "jwt-real-token-" + newPatId,
                  user: { name: name, mobile: mobile, healthSyncId: hsid, role: "PATIENT" }
                }));
              });
            });
          }
        });
      }
      
      // Patient Dashboard & Active Status from DB
      else if (pathname === '/v1/patients/dashboard' && req.method === 'GET') {
        db.all("SELECT * FROM appointments ORDER BY created_at DESC", (err, appts) => {
          db.all("SELECT * FROM prescriptions ORDER BY created_at DESC", (err, rxs) => {
            const formattedRxs = (rxs || []).map(r => ({
              ...r,
              medications: JSON.parse(r.medications_json || '[]')
            }));
            res.writeHead(200);
            res.end(JSON.stringify({
              success: true,
              patient: { name: "Neha Kulkarni", healthSyncId: "HS-2026-907501" },
              upcomingAppointments: appts || [],
              recentPrescriptions: formattedRxs,
              activeQueueToken: "A15"
            }));
          });
        });
      }

      // Doctor Search Query against SQLite
      else if (pathname === '/v1/doctors/search' && req.method === 'GET') {
        const query = url.searchParams.get('q') || '';
        const searchPattern = `%${query}%`;
        db.all("SELECT * FROM doctors WHERE full_name LIKE ? OR specialization LIKE ?", [searchPattern, searchPattern], (err, docs) => {
          const formattedDocs = (docs || []).map(d => ({
            id: d.id,
            name: d.full_name,
            specialization: d.specialization,
            exp: d.experience,
            languages: d.languages,
            rating: d.rating,
            reviews: d.reviews_count,
            availability: "Available Today",
            clinic: d.clinic_name,
            fee: d.consultation_fee
          }));
          res.writeHead(200);
          res.end(JSON.stringify({ success: true, doctors: formattedDocs }));
        });
      }

      // Appointment Booking Engine — Real Persistence into DB
      
        else if (pathname === '/v1/auth/profile' && req.method === 'POST') {
          const authHeader = req.headers['authorization'];
          const token = authHeader && authHeader.split(' ')[1];
          
          if (!token) {
            res.writeHead(401);
            return res.end(JSON.stringify({ success: false, message: 'Unauthorized' }));
          }
          
          jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
              res.writeHead(403);
              return res.end(JSON.stringify({ success: false, message: 'Invalid token' }));
            }
            
            const userId = decoded.id;
            const email = parsedBody.email || '';
            const dob = parsedBody.dateOfBirth || '';
            const gender = parsedBody.gender || '';
            
            // Only updating patients table. We assume user_id is the foreign key.
            db.run(`UPDATE patients SET email = ?, date_of_birth = ?, gender = ? WHERE user_id = ?`, [email, dob, gender, userId], (updateErr) => {
              if (updateErr) {
                console.error('Error updating profile:', updateErr);
                res.writeHead(500);
                return res.end(JSON.stringify({ success: false, message: 'Failed to update profile' }));
              }
              
              res.writeHead(200);
              res.end(JSON.stringify({ success: true, message: 'Profile updated successfully' }));
            });
          });
        }

        else if (pathname.match(/^\/v1\/doctors\/([^\/]+)\/slots\/summary$/) && req.method === 'GET') {
          const match = pathname.match(/^\/v1\/doctors\/([^\/]+)\/slots\/summary$/);
          const doctorId = match[1];
          const datesParam = url.searchParams.get('dates');
          if (!datesParam) {
            res.writeHead(400);
            return res.end(JSON.stringify({ success: false, message: 'Missing dates param' }));
          }
          
          const dateList = datesParam.split(',');
          const totalSlotsPerDay = 14; 
          
          const placeholders = dateList.map(() => '?').join(',');
          const queryParams = [doctorId, ...dateList];
          
          db.all(`SELECT slot_date, COUNT(*) as booked_count FROM appointments WHERE doctor_id = ? AND slot_date IN (${placeholders}) AND status = 'CONFIRMED' GROUP BY slot_date`, queryParams, (err, rows) => {
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

        else if (pathname.match(/^\/v1\/doctors\/([^\/]+)\/slots$/) && req.method === 'GET') {
          const match = pathname.match(/^\/v1\/doctors\/([^\/]+)\/slots$/);
          const doctorId = match[1];
          const dateStr = url.searchParams.get('date');
          
          if (!dateStr) {
            res.writeHead(400);
            return res.end(JSON.stringify({ success: false, message: 'Missing date param' }));
          }
          
          db.all(`SELECT slot_time FROM appointments WHERE doctor_id = ? AND slot_date = ? AND status = 'CONFIRMED'`, [doctorId, dateStr], (err, rows) => {
            if (err) {
              res.writeHead(500);
              return res.end(JSON.stringify({ success: false, message: 'Database error' }));
            }
            
            const bookedTimes = new Set((rows || []).map(r => r.slot_time));
            const slots = [];
            
            const generateBlock = (startH, endH, isPM) => {
              for (let h = startH; h < endH; h++) {
                for (let m of ['00', '30']) {
                  let hour12 = h;
                  if (h > 12) hour12 = h - 12;
                  let hs = hour12 < 10 ? `0${hour12}` : `${hour12}`;
                  let period = isPM ? 'PM' : 'AM';
                  if (h === 12) period = 'PM';
                  let timeStr = `${hs}:${m} ${period}`;
                  
                  slots.push({
                    time: timeStr,
                    available: !bookedTimes.has(timeStr)
                  });
                }
              }
            };
            
            generateBlock(9, 13, false);
            generateBlock(16, 19, true);
            
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, slots: slots }));
          });
        }
  
        
        else if (pathname === '/v1/appointments' && req.method === 'POST') {
          const docId = parsedBody.doctorId || "doc1";
          const dateStr = parsedBody.date || "Today";
          const timeStr = parsedBody.time || "11:30 AM";
          const patId = parsedBody.patientId || "pat1";
          const patName = parsedBody.patientName || "Neha Kulkarni";
          const docName = parsedBody.doctorName || "Dr. Amit Patil";
          
          // Strict double booking check
          db.get("SELECT id FROM appointments WHERE doctor_id = ? AND slot_date = ? AND slot_time = ? AND status IN ('CONFIRMED', 'BOOKED')", [docId, dateStr, timeStr], (checkErr, existing) => {
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
    
              db.run(`INSERT INTO appointments (id, patient_id, patient_name, doctor_id, doctor_name, slot_date, slot_time, status, token_number) VALUES (?, ?, ?, ?, ?, ?, ?, 'BOOKED', ?)`,
                [apptId, patId, patName, docId, docName, dateStr, timeStr, token], () => {
                  res.writeHead(201);
                  res.end(JSON.stringify({ 
                    success: true, 
                    appointment: { 
                      id: apptId, 
                      patient_id: patId,
                      patient_name: patName,
                      doctor_id: docId,
                      doctor_name: docName,
                      slot_date: dateStr,
                      slot_time: timeStr,
                      token: token,
                      status: "BOOKED" 
                    } 
                  }));
                });
            });
          });
        }

      // Live Queue Tracker — Querying Database State
      else if (pathname === '/v1/queue/live' && req.method === 'GET') {
        db.all("SELECT * FROM queue_entries ORDER BY rowid ASC", (err, rows) => {
          const queue = (rows || []).map(r => ({
            token: r.token_number,
            patientName: r.patient_name,
            patientId: r.patient_id,
            doctorName: "Dr. Amit Patil",
            status: r.status,
            time: r.checkin_time
          }));

          const inConsult = queue.find(q => q.status === "In Consultation");
          const waitingList = queue.filter(q => q.status === "Waiting");
          const completedList = queue.filter(q => q.status === "Completed");

          const currentToken = inConsult ? inConsult.token : (queue[0] ? queue[0].token : "None");
          const myPos = waitingList.findIndex(q => q.token === "A15");

          res.writeHead(200);
          res.end(JSON.stringify({
            success: true,
            queue: queue,
            stats: {
              todaysTokens: queue.length + 50,
              inQueue: waitingList.length,
              inConsultation: inConsult ? 1 : 0,
              completed: completedList.length + 40
            },
            currentServingToken: currentToken,
            myToken: "A15",
            myPosition: myPos >= 0 ? myPos : 0,
            estimatedWaitMinutes: (myPos >= 0 ? myPos + 1 : 1) * 6
          }));
        });
      }

      // Call Next Patient — Real DB State Update
      else if (pathname === '/v1/queue/call-next' && req.method === 'POST') {
        db.run("UPDATE queue_entries SET status = 'Completed' WHERE status = 'In Consultation'", () => {
          db.get("SELECT id FROM queue_entries WHERE status = 'Waiting' ORDER BY rowid ASC LIMIT 1", (err, row) => {
            if (row) {
              db.run("UPDATE queue_entries SET status = 'In Consultation' WHERE id = ?", [row.id], () => {
                res.writeHead(200);
                res.end(JSON.stringify({ success: true, message: "Queue Advanced" }));
              });
            } else {
              res.writeHead(200);
              res.end(JSON.stringify({ success: true, message: "No patients waiting" }));
            }
          });
        });
      }

      // Walk-In Patient Registration — Persistent DB Insertion
      else if (pathname === '/v1/reception/walkin' && req.method === 'POST') {
        db.get("SELECT COUNT(*) AS count FROM queue_entries", (err, row) => {
          const walkNum = (row ? row.count : 0) + 1;
          const token = "W" + walkNum;
          const qId = "q-walk-" + Date.now();
          const name = parsedBody.patientName || "Walk-In Patient";
          const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          db.run(`INSERT INTO queue_entries (id, token_number, patient_id, patient_name, doctor_id, status, checkin_time) VALUES (?, ?, ?, ?, 'doc1', 'Waiting', ?)`,
            [qId, token, "pat-walk-" + walkNum, name, timeNow], () => {
              res.writeHead(201);
              res.end(JSON.stringify({ success: true, token: token, name: name }));
            });
        });
      }

      // Prescriptions Management — SQLite Integration
      else if (pathname === '/v1/prescriptions' && req.method === 'GET') {
        db.all("SELECT * FROM prescriptions ORDER BY created_at DESC", (err, rows) => {
          const rxs = (rows || []).map(r => ({
            id: r.id,
            patientName: r.patient_name,
            doctorName: r.doctor_name,
            date: r.created_at ? r.created_at.split(' ')[0] : 'Today',
            diagnosis: r.diagnosis,
            medications: JSON.parse(r.medications_json || '[]'),
            instructions: r.instructions
          }));
          res.writeHead(200);
          res.end(JSON.stringify({ success: true, prescriptions: rxs }));
        });
      }
      else if (pathname === '/v1/prescriptions' && req.method === 'POST') {
        const rxId = "rx-" + Date.now();
        const patName = parsedBody.patientName || "Priya Deshmukh";
        const patId = parsedBody.patientId || "HS-2026-304912";
        const diagnosis = parsedBody.diagnosis || "General Consultation";
        const medsJSON = JSON.stringify(parsedBody.medications || []);
        const instructions = parsedBody.instructions || "";

        db.run(`INSERT INTO prescriptions (id, patient_id, patient_name, doctor_id, doctor_name, diagnosis, medications_json, instructions) VALUES (?, ?, ?, 'doc1', 'Dr. Amit Patil', ?, ?, ?)`,
          [rxId, patId, patName, diagnosis, medsJSON, instructions], () => {
            res.writeHead(201);
            res.end(JSON.stringify({ success: true, prescriptionId: rxId }));
          });
      }

      // Mark No-Show — Update queue entry status
      else if (pathname === '/v1/queue/no-show' && req.method === 'POST') {
        const token = parsedBody.token;
        if (!token) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, message: "Token is required" }));
          return;
        }
        db.get("SELECT id FROM queue_entries WHERE token_number = ? AND status = 'Waiting'", [token], (err, row) => {
          if (!row) {
            res.writeHead(404);
            res.end(JSON.stringify({ success: false, message: "Token not found or not in Waiting status" }));
            return;
          }
          db.run("UPDATE queue_entries SET status = 'No Show' WHERE id = ?", [row.id], () => {
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, message: `Token ${token} marked as No Show` }));
          });
        });
      }

      // Fetch Pending Emergencies
      else if (pathname === '/v1/emergency/pending' && req.method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, cases: activeEmergencies }));
      }

      
      else if (pathname === '/v1/records' && req.method === 'GET') {
        const urlParams = new URL(req.url, `http://${req.headers.host}`);
        const patientId = urlParams.searchParams.get('patientId');
        let query = 'SELECT * FROM records ORDER BY date DESC';
        let params = [];
        if (patientId) {
          query = 'SELECT * FROM records WHERE patient_id = ? ORDER BY date DESC';
          params = [patientId];
        }
        db.all(query, params, (err, rows) => {
          res.writeHead(200);
          res.end(JSON.stringify({ success: true, records: rows || [] }));
        });
      }
      else if (pathname === '/v1/appointments' && req.method === 'GET') {
        const urlParams = new URL(req.url, `http://${req.headers.host}`);
        const patientId = urlParams.searchParams.get('patientId');
        const doctorId = urlParams.searchParams.get('doctorId');
        let query = 'SELECT * FROM appointments ORDER BY slot_date, slot_time';
        let params = [];
        if (patientId) { query = 'SELECT * FROM appointments WHERE patient_id = ? ORDER BY slot_date, slot_time'; params = [patientId]; }
        if (doctorId) { query = 'SELECT * FROM appointments WHERE doctor_id = ? ORDER BY slot_date, slot_time'; params = [doctorId]; }
        db.all(query, params, (err, rows) => {
          res.writeHead(200);
          res.end(JSON.stringify({ success: true, appointments: rows || [] }));
        });
      }
      else if (pathname === '/v1/appointments/next' && req.method === 'GET') {
        const urlParams = new URL(req.url, `http://${req.headers.host}`);
        const patientId = urlParams.searchParams.get('patientId');
        let query = 'SELECT * FROM appointments ORDER BY slot_date, slot_time LIMIT 1';
        let params = [];
        if (patientId) { 
  const today = new Date().toISOString().split('T')[0];
  query = "SELECT * FROM appointments WHERE patient_id = ? AND status NOT IN ('CANCELLED', 'COMPLETED', 'REJECTED') AND slot_date >= ? ORDER BY slot_date, slot_time LIMIT 1"; 
  params = [patientId, today]; 
}
        db.get(query, params, (err, row) => {
          res.writeHead(200);
          res.end(JSON.stringify({ success: true, appointment: row || null }));
        });
      }
      else if (pathname.match(/^\/v1\/patients\/[^\/]+\/profile$/) && req.method === 'GET') {
        const id = pathname.split('/')[3];
        db.get('SELECT * FROM patients WHERE id = ? OR user_id = ?', [id, id], (err, row) => {
          res.writeHead(200);
          res.end(JSON.stringify({ success: true, profile: row || {} }));
        });
      }
      else if (pathname.match(/^\/v1\/patients\/[^\/]+\/profile$/) && (req.method === 'PUT' || req.method === 'POST')) {
        const id = pathname.split('/')[3];
        try {
          const bodyData = JSON.parse(body);
          db.run('UPDATE patients SET full_name = ?, gender = ?, date_of_birth = ?, blood_group = ?, email = ? WHERE id = ? OR user_id = ?',
            [bodyData.full_name || '', bodyData.gender || '', bodyData.date_of_birth || '', bodyData.blood_group || '', bodyData.email || '', id, id],
            (err) => {
              res.writeHead(200);
              res.end(JSON.stringify({ success: true }));
            }
          );
        } catch (e) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, error: 'Invalid data' }));
        }
      }
      else if (pathname === '/v1/reminders' && req.method === 'GET') {
        const urlParams = new URL(req.url, `http://${req.headers.host}`);
        const patientId = urlParams.searchParams.get('patientId');
        let query = 'SELECT * FROM reminders';
        let params = [];
        if (patientId) { query = 'SELECT * FROM reminders WHERE patient_id = ?'; params = [patientId]; }
        db.all(query, params, (err, rows) => {
          res.writeHead(200);
          res.end(JSON.stringify({ success: true, reminders: rows || [] }));
        });
      }
      else if (pathname === '/v1/notifications' && req.method === 'GET') {
        const urlParams = new URL(req.url, `http://${req.headers.host}`);
        const userId = urlParams.searchParams.get('userId');
        db.all('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, rows) => {
          res.writeHead(200);
          res.end(JSON.stringify({ success: true, notifications: rows || [] }));
        });
      }
      else if (pathname === '/v1/notifications/clear' && req.method === 'POST') {
        try {
          const bodyData = JSON.parse(body);
          db.run('DELETE FROM notifications WHERE user_id = ?', [bodyData.userId], () => {
            res.writeHead(200);
            res.end(JSON.stringify({ success: true }));
          });
        } catch (e) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, error: 'Invalid data' }));
        }
      }
      else if (pathname.match(/^\/v1\/notifications\/[^\/]+\/read$/) && req.method === 'POST') {
        const notifId = pathname.split('/')[3];
        db.run('UPDATE notifications SET is_read = 1 WHERE id = ?', [notifId], () => {
          res.writeHead(200);
          res.end(JSON.stringify({ success: true }));
        });
      }

      else {
        res.writeHead(404);

        res.end(JSON.stringify({ error: "Endpoint Not Found" }));
      }
    });
    return;
  }

  // Static Assets Server (HTML/CSS/JS)
  let filePath = path.join(__dirname, '../frontend', pathname === '/' ? 'index.html' : pathname);
  const ext = path.extname(filePath);
  let contentType = 'text/html';
  if (ext === '.css') contentType = 'text/css';
  else if (ext === '.js') contentType = 'application/javascript';
  else if (ext === '.png') contentType = 'image/png';
  else if (ext === '.svg') contentType = 'image/svg+xml';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 HealthSync WebApp Resource Not Found</h1>', 'utf-8');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Setup Socket.io Server
const io = new Server(server, { cors: { origin: "*" } });

io.on('connection', (socket) => {
  socket.on('sos_trigger', (data) => {
    const newCase = {
      caseId: 'sos-' + Date.now(),
      patientId: data.userId,
      patientName: data.patientName || 'Unknown Patient',
      phone: data.phone || 'N/A',
      lat: data.lat,
      lng: data.lng,
      timestamp: Date.now(),
      status: 'Pending',
      address: 'Live Location Tracking...'
    };
    activeEmergencies.push(newCase);
    
    // Broadcast to Receptionist and Ambulance
    io.emit('sos_alert', newCase);
    
    // Acknowledge back to sender
    socket.emit('sos_acknowledged', newCase);
  });

  socket.on('dispatch_ambulance', (data) => {
    const e = activeEmergencies.find(c => c.caseId === data.caseId);
    if (e) e.status = 'Ambulance Dispatched';
    io.emit('sos_status_update', { caseId: data.caseId, status: 'Ambulance Dispatched' });
  });

  socket.on('resolve_emergency', (data) => {
    const idx = activeEmergencies.findIndex(c => c.caseId === data.caseId);
    if (idx !== -1) activeEmergencies.splice(idx, 1);
    io.emit('emergency_resolved', { caseId: data.caseId });
  });

  socket.on('ambulance_location_update', (data) => {
    const e = activeEmergencies.find(c => c.caseId === data.caseId);
    if (e) {
      e.lat = data.lat;
      e.lng = data.lng;
    }
    io.emit('ambulance_location_update', data);
  });
});

// Railway (and other hosts) assign the listening port through PORT.
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🏥 HealthSync Real SQLite Database Server Running`);
  console.log(`🌐 API Server URL: http://localhost:${PORT}`);
  console.log(`====================================================`);
});
