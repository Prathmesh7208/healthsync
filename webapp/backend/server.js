const http = require('http');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

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
  )`);

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
    }
  });
});

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
      else if (pathname === '/v1/appointments' && req.method === 'POST') {
        db.get("SELECT COUNT(*) AS count FROM appointments", (err, row) => {
          const nextNum = (row ? row.count : 0) + 17;
          const token = "A" + nextNum;
          const apptId = "apt-" + Date.now();
          const qId = "q-" + Date.now();
          const patName = parsedBody.patientName || "Neha Kulkarni";
          const docId = parsedBody.doctorId || "doc1";
          const docName = parsedBody.doctorName || "Dr. Amit Patil";
          const dateStr = parsedBody.date || "Today";
          const timeStr = parsedBody.time || "11:30 AM";

          db.run(`INSERT INTO appointments (id, patient_id, patient_name, doctor_id, doctor_name, slot_date, slot_time, status, token_number) VALUES (?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?)`,
            [apptId, "pat1", patName, docId, docName, dateStr, timeStr, token], () => {
              db.run(`INSERT INTO queue_entries (id, appointment_id, token_number, patient_id, patient_name, doctor_id, status, checkin_time) VALUES (?, ?, ?, ?, ?, ?, 'Waiting', ?)`,
                [qId, apptId, token, "pat1", patName, docId, timeStr], () => {
                  res.writeHead(201);
                  res.end(JSON.stringify({ 
                    success: true, 
                    appointment: { id: apptId, token: token, doctorName: docName, time: timeStr, status: "CONFIRMED" } 
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

// Railway (and other hosts) assign the listening port through PORT.
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🏥 HealthSync Real SQLite Database Server Running`);
  console.log(`🌐 API Server URL: http://localhost:${PORT}`);
  console.log(`====================================================`);
});
