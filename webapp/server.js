/**
 * HealthSync WebApp Server
 * ========================
 * Single entry-point. Runs from:  c:\HealthSync\webapp\
 * Start:   node server.js
 * Port:    3000
 *
 * - Serves static frontend from ./frontend/
 * - Stores all data in ./healthsync.db  (SQLite, persistent)
 * - REST API under /v1/
 */

'use strict';

const http     = require('http');
const fs       = require('fs');
const path     = require('path');
const sqlite3  = require('sqlite3').verbose();
const { Server } = require('socket.io');

// ─── Database ───────────────────────────────────────────────────────────────
// DB file lives next to server.js  (c:\HealthSync\webapp\healthsync.db)
const DB_PATH      = process.env.DB_PATH || path.join(__dirname, 'healthsync.db');
const FRONTEND_DIR = path.join(__dirname, 'frontend');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) { console.error('❌ Could not open database:', err.message); process.exit(1); }
  console.log('✅ SQLite database connected:', DB_PATH);
});

// ─── Schema & Seed ──────────────────────────────────────────────────────────
db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    mobile_number TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'PATIENT',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

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

  db.run(`CREATE TABLE IF NOT EXISTS doctors (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    full_name TEXT NOT NULL,
    specialization TEXT NOT NULL,
    qualification TEXT,
    clinic_name TEXT,
    consultation_fee INTEGER DEFAULT 500,
    experience TEXT,
    languages TEXT,
    rating REAL DEFAULT 4.9,
    reviews_count INTEGER DEFAULT 320,
    is_verified INTEGER DEFAULT 1,
    available_today INTEGER DEFAULT 1
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS receptionists (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    full_name TEXT NOT NULL,
    clinic_name TEXT,
    assigned_doctor_id TEXT REFERENCES doctors(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    doctor_id TEXT NOT NULL,
    doctor_name TEXT NOT NULL,
    slot_date TEXT NOT NULL,
    slot_time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'CONFIRMED',
    consultation_type TEXT NOT NULL DEFAULT 'IN_PERSON',
    token_number TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  // Safe forward migration for databases created before consultation type existed.
  db.run("ALTER TABLE appointments ADD COLUMN consultation_type TEXT NOT NULL DEFAULT 'IN_PERSON'", () => {});

  db.run(`CREATE TABLE IF NOT EXISTS queue_entries (
    id TEXT PRIMARY KEY,
    appointment_id TEXT,
    token_number TEXT NOT NULL,
    patient_id TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    doctor_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Waiting',
    checkin_time TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS prescriptions (
    id TEXT PRIMARY KEY,
    appointment_id TEXT,
    patient_id TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    doctor_id TEXT NOT NULL,
    doctor_name TEXT NOT NULL,
    diagnosis TEXT NOT NULL,
    medications_json TEXT NOT NULL DEFAULT '[]',
    instructions TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS consents (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    doctor_id TEXT NOT NULL,
    doctor_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'GRANTED',
    duration TEXT NOT NULL DEFAULT '1 Visit',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'UNREAD',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Phase 1 normalized clinical and operational data.  These are additive so
  // existing development databases migrate safely when the server restarts.
  db.run("ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1", () => {});
  db.run("ALTER TABLE users ADD COLUMN language TEXT NOT NULL DEFAULT 'English'", () => {});
  db.run("ALTER TABLE doctors ADD COLUMN registration_number TEXT", () => {});
  db.run("ALTER TABLE appointments ADD COLUMN clinic_id TEXT", () => {});
  db.run("ALTER TABLE appointments ADD COLUMN cancellation_reason TEXT", () => {});
  db.run("ALTER TABLE appointments ADD COLUMN updated_at DATETIME", () => {});

  db.run(`CREATE TABLE IF NOT EXISTS clinics (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, address TEXT, phone TEXT,
    opening_hours TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS clinic_staff (
    id TEXT PRIMARY KEY, clinic_id TEXT NOT NULL, user_id TEXT NOT NULL,
    staff_role TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS user_settings (
    user_id TEXT PRIMARY KEY, language TEXT NOT NULL DEFAULT 'English',
    notifications_enabled INTEGER NOT NULL DEFAULT 1, sms_enabled INTEGER NOT NULL DEFAULT 1,
    reminder_enabled INTEGER NOT NULL DEFAULT 1, theme TEXT NOT NULL DEFAULT 'light',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS patient_contacts (
    id TEXT PRIMARY KEY, patient_id TEXT NOT NULL UNIQUE, address TEXT, city TEXT,
    emergency_contact_name TEXT, emergency_contact_phone TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS patient_medical_profiles (
    patient_id TEXT PRIMARY KEY, allergies TEXT DEFAULT '', chronic_conditions TEXT DEFAULT '',
    past_surgeries TEXT DEFAULT '', family_history TEXT DEFAULT '', updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS patient_vitals (
    id TEXT PRIMARY KEY, patient_id TEXT NOT NULL, heart_rate TEXT, blood_pressure TEXT,
    weight_kg REAL, blood_sugar TEXT, recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS medicine_reminders (
    id TEXT PRIMARY KEY, patient_id TEXT NOT NULL, medicine_name TEXT NOT NULL,
    dosage TEXT, reminder_time TEXT NOT NULL, repeat_rule TEXT NOT NULL DEFAULT 'DAILY',
    start_date TEXT, end_date TEXT, is_active INTEGER NOT NULL DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS consultations (
    id TEXT PRIMARY KEY, appointment_id TEXT, patient_id TEXT NOT NULL, doctor_id TEXT NOT NULL,
    symptoms TEXT, diagnosis TEXT, examination_notes TEXT, treatment_plan TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS prescription_items (
    id TEXT PRIMARY KEY, prescription_id TEXT NOT NULL, medicine_name TEXT NOT NULL,
    dosage TEXT, frequency TEXT, duration TEXT, instructions TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS medical_documents (
    id TEXT PRIMARY KEY, patient_id TEXT NOT NULL, appointment_id TEXT, uploaded_by_user_id TEXT,
    document_type TEXT NOT NULL, file_name TEXT NOT NULL, storage_path TEXT, notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS doctor_availability (
    id TEXT PRIMARY KEY, doctor_id TEXT NOT NULL, day_of_week INTEGER NOT NULL,
    start_time TEXT NOT NULL, end_time TEXT NOT NULL, consultation_type TEXT NOT NULL DEFAULT 'IN_PERSON', is_active INTEGER NOT NULL DEFAULT 1
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS consent_requests (
    id TEXT PRIMARY KEY, patient_id TEXT NOT NULL, doctor_id TEXT NOT NULL, purpose TEXT NOT NULL,
    scope TEXT NOT NULL DEFAULT 'ALL_RECORDS', status TEXT NOT NULL DEFAULT 'PENDING',
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP, responded_at DATETIME, expires_at DATETIME
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY, actor_user_id TEXT, action TEXT NOT NULL, entity_type TEXT NOT NULL,
    entity_id TEXT, metadata_json TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS emergency_cases (
    id TEXT PRIMARY KEY, patient_id TEXT, patient_name TEXT, phone_number TEXT,
    lat REAL, lng REAL, address TEXT, status TEXT DEFAULT 'Pending',
    hospital_id TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS ambulance_drivers (
    id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id),
    full_name TEXT NOT NULL, vehicle_number TEXT, status TEXT DEFAULT 'Available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // ── Seed only when DB is fresh ──────────────────────────────────────────
  db.get('SELECT COUNT(*) AS c FROM doctors', (err, row) => {
    if (row && row.c === 0) {
      // Doctor profiles reference user accounts; create those accounts first.
      // This callback runs after the outer schema sequence, so explicitly
      // serialize these dependent writes before inserting doctor profiles.
      db.serialize(() => {
      const userStmt = db.prepare('INSERT OR IGNORE INTO users (id, mobile_number, role) VALUES (?, ?, ?)', () => {});
      userStmt.run('u-doc1', '9000000001', 'DOCTOR');
      userStmt.run('u-doc2', '9000000002', 'DOCTOR');
      userStmt.run('u-doc3', '9000000003', 'DOCTOR');
      userStmt.run('u-doc4', '9000000004', 'DOCTOR');
      userStmt.run('u-doc5', '9000000005', 'DOCTOR');
      userStmt.finalize();
      const stmt = db.prepare(`
        INSERT INTO doctors
          (id, user_id, full_name, specialization, qualification, clinic_name,
           consultation_fee, experience, languages, rating, reviews_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      stmt.run('doc1','u-doc1','Dr. Amit Patil','Orthopedic Surgeon','MS (Ortho)','HealthSync Clinic, Pune',500,'12+ Years Exp.','Marathi, Hindi, English',4.9,320);
      stmt.run('doc2','u-doc2','Dr. Sneha Joshi','Gynecologist','MD (OB-GYN)','Care Clinic, Pune',600,'10+ Years Exp.','Marathi, Hindi',4.7,210);
      stmt.run('doc3','u-doc3','Dr. Rahul Mehta','Cardiologist','DM (Cardiology)','HeartCare Center, Pune',800,'15+ Years Exp.','Hindi, English',4.9,450);
      stmt.run('doc4','u-doc4','Dr. Priya Kulkarni','Pediatrician','MD (Peds)','Kids Clinic, Pune',400,'8+ Years Exp.','Marathi, Hindi, English',4.8,180);
      stmt.run('doc5','u-doc5','Dr. Sanjay Desai','Dermatologist','MD (DVL)','SkinCare Center, Pune',550,'9+ Years Exp.','Hindi, English',4.6,145);
      stmt.finalize();
      });
      console.log('✅ Seeded 5 doctors');
    }
  });

  db.get('SELECT COUNT(*) AS c FROM patients', (err, row) => {
    if (row && row.c === 0) {
      // Seed demo user and patient. Keep related inserts in their dependency order.
      db.serialize(() => {
      db.run(`INSERT INTO users (id, mobile_number, role) VALUES ('u-pat1','9075012345','PATIENT')`);
      db.run(`INSERT INTO patients (id, user_id, healthsync_id, full_name, gender, date_of_birth, blood_group)
              VALUES ('pat1','u-pat1','HS-2026-907501','Neha Kulkarni','Female','1998-05-14','O+')`);

      // Seed today's queue
      const queueSeed = [
        { id:'q1', token:'A12', name:'Rohit Sharma',   status:'In Consultation', time:'10:42 AM' },
        { id:'q2', token:'A13', name:'Priya Deshmukh', status:'Waiting',          time:'10:50 AM' },
        { id:'q3', token:'A14', name:'Sandeep Jadhav', status:'Waiting',          time:'10:58 AM' },
        { id:'q4', token:'A15', name:'Neha Kulkarni',  status:'Waiting',          time:'11:06 AM' },
        { id:'q5', token:'A16', name:'Amit Verma',     status:'Waiting',          time:'11:15 AM' }
      ];
      const qStmt = db.prepare(`
        INSERT INTO queue_entries
          (id, token_number, patient_id, patient_name, doctor_id, status, checkin_time)
        VALUES (?, ?, ?, ?, 'doc1', ?, ?)`);
      // Queue entries are display records for the demo patient.  Older local
      // databases may enforce a foreign key on patient_id, so every seed row
      // must use the patient created above instead of a made-up `pat-A12` id.
      queueSeed.forEach(q => qStmt.run(q.id, q.token, 'pat1', q.name, q.status, q.time, seedErr => {
        if (seedErr) console.error('Unable to seed demo queue entry:', seedErr.message);
      }));
      qStmt.finalize(seedErr => {
        if (seedErr) console.error('Unable to finalize demo queue seed:', seedErr.message);
      });

      // Seed one prescription
      const medsJSON = JSON.stringify([
        { name:'Tab. Paracetamol 650mg', dosage:'1 tablet', frequency:'1-0-1 After Food', duration:'5 Days' },
        { name:'Tab. Pantoprazole 40mg', dosage:'1 tablet', frequency:'1-0-0 Before Food', duration:'7 Days' }
      ]);
      db.run(`INSERT INTO prescriptions
                (id, patient_id, patient_name, doctor_id, doctor_name, diagnosis, medications_json, instructions)
              VALUES ('rx101','pat1','Neha Kulkarni','doc1','Dr. Amit Patil',
                      'Acute Viral Fever & Migraine', ?, 'Take rest, drink 3 liters of warm water daily.')`,
              [medsJSON], seedErr => {
                if (seedErr) console.error('Unable to seed demo prescription:', seedErr.message);
              });
      });

      console.log('✅ Seeded demo patient, queue, and prescription');
    }
  });

  db.get('SELECT COUNT(*) AS c FROM ambulance_drivers', (err, row) => {
    if (row && row.c === 0) {
      db.serialize(() => {
        db.run(`INSERT INTO users (id, mobile_number, role) VALUES ('u-amb1', '9080706050', 'AMBULANCE')`);
        db.run(`INSERT INTO ambulance_drivers (id, user_id, full_name, vehicle_number) VALUES ('amb1', 'u-amb1', 'Ramesh Driver', 'MH12 AB 1234')`);
      });
      console.log('✅ Seeded demo ambulance driver');
    }
  });
});

// ─── Helpers ────────────────────────────────────────────────────────────────
const crypto = require('crypto');
const JWT_SECRET = 'healthsync-super-secret-key-1234';

// Dependency-free HS256 JWT Utility
function jwtSign(payload, expiresInSeconds = 3600) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload = { ...payload, exp };

  const base64UrlHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64UrlPayload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${base64UrlHeader}.${base64UrlPayload}`)
    .digest('base64url');

  return `${base64UrlHeader}.${base64UrlPayload}.${signature}`;
}

function jwtVerify(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;

    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');

    if (signature !== expectedSignature) return null;

    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return decodedPayload;
  } catch (e) {
    return null;
  }
}

// OTP Store Map: mobileNumber => { code, expiresAt, attempts }
const otpStore = new Map();
const otpRequestStore = new Map();
const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 30 * 1000;
const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const OTP_CHANNEL = process.env.OTP_CHANNEL === 'whatsapp' ? 'whatsapp' : 'sms';
const DEMO_ADMIN_CODE = process.env.DEMO_ADMIN_CODE || '';
const DEMO_GUEST_CODE = process.env.DEMO_GUEST_CODE || '';

function twilioVerifyConfigured() {
  return Boolean(TWILIO_VERIFY_SERVICE_SID && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN);
}
async function twilioVerifyRequest(pathname, params) {
  const auth = Buffer.from(TWILIO_ACCOUNT_SID + ':' + TWILIO_AUTH_TOKEN).toString('base64');
  const response = await fetch('https://verify.twilio.com/v2/Services/' + TWILIO_VERIFY_SERVICE_SID + pathname, {
    method:'POST',
    headers:{ 'Authorization':'Basic ' + auth, 'Content-Type':'application/x-www-form-urlencoded' },
    body:new URLSearchParams(params)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'OTP delivery failed');
  return data;
}
function sendRealOtp(mobile) {
  return twilioVerifyRequest('/Verifications', { To:mobile, Channel:OTP_CHANNEL });
}
function checkRealOtp(mobile, code) {
  return twilioVerifyRequest('/VerificationCheck', { To:mobile, Code:code });
}
function normalizeMobileNumber(value) {
  const raw = String(value || '').trim();
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  // Preserve backwards compatibility for existing Indian-only stored numbers.
  if (!raw.startsWith('+') && /^[6-9]\d{9}$/.test(digits)) return '+91' + digits;
  return '+' + digits;
}
function demoCodeMatches(code, expectedCode) {
  if (!expectedCode || typeof code !== 'string') return false;
  const supplied = Buffer.from(code);
  const expected = Buffer.from(expectedCode);
  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
}

function uid()    { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function nowTime(){ return new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }); }

function json(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// Database-backed Notification Logger
function createNotification(userId, message) {
  const notifId = 'notif-' + uid();
  // Callers that operate on clinical data hold a patient id; notification
  // ownership is always the account user id so the signed-in user can see it.
  db.get('SELECT user_id FROM patients WHERE id=?', [userId], (err, patient) => {
    const recipientId = patient?.user_id || userId;
    db.run('INSERT INTO notifications (id, user_id, message, status) VALUES (?, ?, ?, ?)', [notifId, recipientId, message, 'UNREAD']);
  });
}

function audit(actorUserId, action, entityType, entityId, metadata = {}) {
  db.run('INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, metadata_json) VALUES (?,?,?,?,?,?)',
    ['audit-' + uid(), actorUserId || null, action, entityType, entityId || null, JSON.stringify(metadata)]);
}

function readBody(req) {
  return new Promise(resolve => {
    let raw = '';
    req.on('data', c => { raw += c; });
    req.on('end', () => {
      try { resolve(JSON.parse(raw)); } catch { resolve({}); }
    });
  });
}

// ─── HTTP Server ─────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const url      = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // ── API Router (/v1/) ───────────────────────────────────────────────────
  if (pathname.startsWith('/v1/')) {
    const body = await readBody(req);
    return apiRouter(req, res, pathname, url, body);
  }

  // ── Static File Server ──────────────────────────────────────────────────
  let filePath = path.join(FRONTEND_DIR, pathname === '/' ? 'index.html' : pathname);
  // Security: prevent path traversal outside frontend dir
  if (!filePath.startsWith(FRONTEND_DIR)) {
    res.writeHead(403); res.end(); return;
  }
  const ext = path.extname(filePath);
  const contentTypes = { '.html':'text/html', '.css':'text/css', '.js':'application/javascript',
                         '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml',
                         '.ico':'image/x-icon', '.woff2':'font/woff2' };
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h2>404 — HealthSync: Resource not found</h2>');
    } else {
      res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
      res.end(content);
    }
  });
});

// ─── API Router ──────────────────────────────────────────────────────────────
function apiRouter(req, res, pathname, url, body) {
  const method = req.method;

  // This endpoint only unlocks the browser-only demo portal. It never reads
  // or writes production records, and the access code is configured on Render.
  if (pathname === '/v1/demo/access' && method === 'POST') {
    if (!DEMO_ADMIN_CODE && !DEMO_GUEST_CODE) return json(res, 503, { success:false, message:'Demo Portal is not configured. Set a demo access code on the server.' });
    const code = String(body.code || '');
    const access = demoCodeMatches(code, DEMO_ADMIN_CODE) ? 'admin' : demoCodeMatches(code, DEMO_GUEST_CODE) ? 'guest' : '';
    if (!access) return json(res, 401, { success:false, message:'Invalid demo access code.' });
    return json(res, 200, { success:true, access, message:'Demo Portal unlocked.' });
  }

  // ── Auth: Request OTP ──────────────────────────────────────────────────
  if (pathname === '/v1/auth/login' && method === 'POST') {
    const mobile = normalizeMobileNumber(body.mobileNumber);
    if (!/^\+\d{7,15}$/.test(mobile)) return json(res, 400, { success:false, code:'AUTH_001', message:'Please enter a valid mobile number with country code' });

    const requestedAt = otpRequestStore.get(mobile) || 0;
    const retryAfterMs = OTP_RESEND_COOLDOWN_MS - (Date.now() - requestedAt);
    if (retryAfterMs > 0) {
      return json(res, 429, { success:false, code:'AUTH_002', message:`Please wait ${Math.ceil(retryAfterMs / 1000)} seconds before requesting another OTP.` });
    }
    otpRequestStore.set(mobile, Date.now());

    // Generate random 6 digit numeric code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + OTP_TTL_MS;

    if (twilioVerifyConfigured()) {
      return sendRealOtp(mobile)
        .then(() => json(res, 200, { success:true, message:'OTP sent to your ' + (OTP_CHANNEL === 'whatsapp' ? 'WhatsApp' : 'SMS inbox') + '.', mobile, channel:OTP_CHANNEL }))
        .catch(error => {
          otpRequestStore.delete(mobile);
          json(res, 502, { success:false, message:'Unable to deliver OTP: ' + error.message });
        });
    }
    otpStore.set(mobile, { code: otp, expiresAt, attempts: 0 });
    console.log(`[SMS-MOCK] OTP for mobile ${mobile} is: ${otp}`);

    // Still return OTP for simple UI debugging/tests, but it's generated dynamically
    return json(res, 200, { success:true, message:'OTP sent successfully', mobile, otp });
  }

  // ── Auth: Verify OTP & Return/Create User Session ───────────────────────
  if (pathname === '/v1/auth/verify' && method === 'POST') {
    const mobile = normalizeMobileNumber(body.mobileNumber);
    const otpCode = String(body.otpCode || '').replace(/\D/g, '');

    if (!/^\+\d{7,15}$/.test(mobile) || !/^\d{6}$/.test(otpCode)) {
      return json(res, 400, { success:false, message:'A valid international mobile number and 6-digit OTP are required.' });
    }

    let saved = otpStore.get(mobile);
    if (twilioVerifyConfigured() && !saved) {
      return checkRealOtp(mobile, otpCode)
        .then(result => {
          if (result.status !== 'approved') return json(res, 400, { success:false, message:'Incorrect or expired OTP. Please request a new one.' });
          otpStore.set(mobile, { code:otpCode, expiresAt:Date.now() + 10000, attempts:0 });
          apiRouter(req, res, pathname, url, body);
        })
        .catch(error => json(res, 400, { success:false, message:'OTP verification failed: ' + error.message }));
    }
    if (!saved) {
      return json(res, 400, { success:false, message:'Please request a new OTP first' });
    }

    if (Date.now() > saved.expiresAt) {
      otpStore.delete(mobile);
      otpRequestStore.delete(mobile);
      return json(res, 400, { success:false, message:'OTP has expired. Please request a new one' });
    }

    saved.attempts += 1;
    if (saved.attempts > 3) {
      otpStore.delete(mobile);
      return json(res, 400, { success:false, message:'Too many failed attempts. OTP blocked' });
    }

    if (saved.code !== otpCode) {
      return json(res, 400, { success:false, message: `Incorrect OTP. ${4 - saved.attempts} attempts remaining` });
    }

    // OTP Correct! Clear it.
    otpStore.delete(mobile);
    otpRequestStore.delete(mobile);

    // Look up user or auto-register
    const legacyIndianMobile = mobile.startsWith('+91') ? mobile.slice(3) : mobile;
    db.get('SELECT * FROM users WHERE mobile_number = ? OR mobile_number = ?', [mobile, legacyIndianMobile], (err, user) => {
      if (user) {
        // Existing user
        const token = jwtSign({ userId: user.id, role: user.role });
        const sessId = 'sess-' + uid();
        const refreshToken = crypto.randomBytes(32).toString('base64url');
        db.run('INSERT INTO sessions (id, user_id, access_token, refresh_token) VALUES (?, ?, ?, ?)', [sessId, user.id, token, refreshToken], () => {
          // If doctor, load profile
          if (user.role === 'DOCTOR') {
            db.get('SELECT * FROM doctors WHERE user_id = ?', [user.id], (err, doc) => {
              json(res, 200, {
                success: true,
                token, refreshToken, sessionId: sessId,
                user: { id: user.id, name: doc ? doc.full_name : 'Doctor', mobile, role: 'DOCTOR' }
              });
            });
          } else if (user.role === 'RECEPTIONIST') {
            db.get('SELECT * FROM receptionists WHERE user_id = ?', [user.id], (err, receptionist) => {
              json(res, 200, {
                success: true,
                token, refreshToken, sessionId: sessId,
                user: { id:user.id, receptionistId:receptionist ? receptionist.id : '', name:receptionist ? receptionist.full_name : 'Receptionist', mobile, role:'RECEPTIONIST' }
              });
            });
          } else if (user.role === 'AMBULANCE') {
            db.get('SELECT * FROM ambulance_drivers WHERE user_id = ?', [user.id], (err, driver) => {
              json(res, 200, {
                success: true,
                token, refreshToken, sessionId: sessId,
                user: { id:user.id, driverId:driver ? driver.id : '', name:driver ? driver.full_name : 'Driver', mobile, role:'AMBULANCE' }
              });
            });
          } else {
            db.get('SELECT * FROM patients WHERE user_id = ?', [user.id], (err, pat) => {
              json(res, 200, {
                success: true,
                token, refreshToken, sessionId: sessId,
                user: { id: user.id, patientId: pat ? pat.id : '', name: pat ? pat.full_name : 'Patient', mobile, healthSyncId: pat ? pat.healthsync_id : '', role: 'PATIENT' }
              });
            });
          }
        });
      } else {
        // Register a new account only after OTP verification.
        const newUserId = 'u-' + uid();
        const requestedRole = ['PATIENT','DOCTOR','RECEPTIONIST','AMBULANCE'].includes(String(body.requestedRole || '').toUpperCase()) ? String(body.requestedRole).toUpperCase() : 'PATIENT';
        const name = String(body.fullName || '').trim() || (requestedRole === 'DOCTOR' ? 'New Doctor' : requestedRole === 'RECEPTIONIST' ? 'New Receptionist' : 'New Patient');
        const createSession = (user, extra = {}) => {
          const token = jwtSign({ userId: newUserId, role: requestedRole });
          const sessId = 'sess-' + uid();
          const refreshToken = crypto.randomBytes(32).toString('base64url');
          db.run('INSERT INTO sessions (id, user_id, access_token, refresh_token) VALUES (?, ?, ?, ?)', [sessId, newUserId, token, refreshToken], () => json(res, 200, { success:true, token, refreshToken, sessionId:sessId, user:{ id:newUserId, name, mobile, role:requestedRole, ...extra } }));
        };
        db.run('INSERT INTO users (id, mobile_number, role) VALUES (?, ?, ?)', [newUserId, mobile, requestedRole], () => {
          if (requestedRole === 'DOCTOR') {
            const specialization = String(body.specialization || '').trim() || 'General Medicine';
            const clinic = String(body.clinicName || '').trim() || 'HealthSync Clinic';
            const doctorId = 'd-' + uid();
            return db.run('INSERT INTO doctors (id, user_id, full_name, specialization, clinic_name, qualification, experience, languages, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [doctorId, newUserId, name, specialization, clinic, 'Registration pending verification', 'Not added', 'English', 0], () => createSession({ id:newUserId }, { doctorId }));
          }
          if (requestedRole === 'RECEPTIONIST') {
            const receptionistId = 'r-' + uid();
            return db.run('INSERT INTO receptionists (id, user_id, full_name, clinic_name) VALUES (?, ?, ?, ?)', [receptionistId, newUserId, name, String(body.clinicName || 'HealthSync Clinic')], () => createSession({ id:newUserId }, { receptionistId }));
          }
          if (requestedRole === 'AMBULANCE') {
            const driverId = 'amb-' + uid();
            return db.run('INSERT INTO ambulance_drivers (id, user_id, full_name, vehicle_number) VALUES (?, ?, ?, ?)', [driverId, newUserId, name, String(body.vehicleNumber || 'Unknown Vehicle')], () => createSession({ id:newUserId }, { driverId }));
          }
          const newPatId = 'p-' + uid();
          const hsid = 'HS-2026-' + Math.floor(100000 + Math.random() * 900000);
          db.run('INSERT INTO patients (id, user_id, healthsync_id, full_name) VALUES (?, ?, ?, ?)', [newPatId, newUserId, hsid, name], () => {
            createNotification(newUserId, `Welcome to HealthSync! Your HealthSync ID is ${hsid}`);
            createSession({ id:newUserId }, { patientId:newPatId, healthSyncId:hsid });
          });
        });
      }
    });
    return;
  }

  if (pathname === '/v1/auth/refresh' && method === 'POST') {
    const refreshToken = body.refreshToken || '';
    return db.get('SELECT user_id FROM sessions WHERE refresh_token=?', [refreshToken], (err, session) => {
      if (!session) return json(res, 401, { success:false, code:'AUTH_007', message:'Your session has expired. Please sign in again.' });
      db.get('SELECT role FROM users WHERE id=?', [session.user_id], (userErr, user) => {
        if (!user) return json(res, 401, { success:false, code:'AUTH_007', message:'Your session has expired. Please sign in again.' });
        const token = jwtSign({ userId: session.user_id, role: user.role });
        db.run('UPDATE sessions SET access_token=? WHERE refresh_token=?', [token, refreshToken]);
        json(res, 200, { success:true, token });
      });
    });
  }

  if (pathname === '/v1/auth/logout' && method === 'POST') {
    return db.run('DELETE FROM sessions WHERE refresh_token=?', [body.refreshToken || ''], () => json(res, 200, { success:true }));
  }

  // ── Patient Dashboard ──────────────────────────────────────────────────
  if (pathname === '/v1/patients/dashboard' && method === 'GET') {
    db.all('SELECT * FROM appointments ORDER BY created_at DESC LIMIT 5', (e1, appts) => {
      db.all('SELECT * FROM prescriptions ORDER BY created_at DESC LIMIT 5', (e2, rxs) => {
        json(res, 200, {
          success:true,
          patient: { name:'Neha Kulkarni', healthSyncId:'HS-2026-907501' },
          upcomingAppointments: appts || [],
          recentPrescriptions: (rxs || []).map(r => ({
            ...r, medications: JSON.parse(r.medications_json || '[]')
          })),
          activeQueueToken: 'A15'
        });
      });
    });
    return;
  }

  // ── Doctor Search ──────────────────────────────────────────────────────
  if (pathname === '/v1/doctors/search' && method === 'GET') {
    const q = url.searchParams.get('q') || '';
    const like = `%${q}%`;
    db.all(
      'SELECT * FROM doctors WHERE full_name LIKE ? OR specialization LIKE ? ORDER BY rating DESC',
      [like, like],
      (err, rows) => {
        json(res, 200, {
          success:true,
          doctors: (rows || []).map(d => ({
            id:d.id, name:d.full_name, specialization:d.specialization,
            exp:d.experience, languages:d.languages, rating:d.rating,
            reviews:d.reviews_count, fee:d.consultation_fee,
            clinic:d.clinic_name,
            availability: d.available_today ? 'Available Today' : 'Next Available Tomorrow'
          }))
        });
      });
    return;
  }

  // ── Book / List / Cancel Appointments ────────────────────────────────────
  if (pathname === '/v1/appointments' && method === 'GET') {
    db.all('SELECT * FROM appointments ORDER BY created_at DESC', (err, rows) => {
      json(res, 200, { success: true, appointments: rows || [] });
    });
    return;
  }

  if (pathname.startsWith('/v1/appointments/') && pathname.endsWith('/cancel') && method === 'PUT') {
    const parts = pathname.split('/');
    const apptId = parts[3];
    db.run("UPDATE appointments SET status='Cancelled' WHERE id=?", [apptId], () => {
      db.run("UPDATE queue_entries SET status='Cancelled' WHERE appointment_id=?", [apptId], () => {
        json(res, 200, { success: true, message: 'Appointment cancelled' });
      });
    });
    return;
  }

  if (pathname.startsWith('/v1/reception/checkin/') && method === 'POST') {
    const parts = pathname.split('/');
    const apptId = parts[4];
    db.get("SELECT * FROM appointments WHERE id=?", [apptId], (err, appt) => {
      if (!appt) return json(res, 404, { success: false, message: 'Appointment not found' });
      db.run("UPDATE appointments SET status='Checked In' WHERE id=?", [apptId], () => {
        db.run("UPDATE queue_entries SET status='Waiting' WHERE appointment_id=?", [apptId], () => {
          json(res, 200, { success: true, message: 'Checked in successfully' });
        });
      });
    });
    return;
  }

  if (pathname === '/v1/appointments' && method === 'POST') {
    db.get('SELECT COUNT(*) AS c FROM appointments', (err, row) => {
      const nextNum  = (row?.c || 0) + 17;
      const token    = 'A' + nextNum;
      const apptId   = 'apt-' + uid();
      const qId      = 'q-'   + uid();
      const patName  = body.patientName || 'Neha Kulkarni';
      const patId    = body.patientId   || 'pat1';
      const docId    = body.doctorId    || 'doc1';
      const docName  = body.doctorName  || 'Dr. Amit Patil';
      const date     = body.date || new Date().toISOString().split('T')[0];
      const time     = body.time || nowTime();

      db.run(
        `INSERT INTO appointments
           (id, patient_id, patient_name, doctor_id, doctor_name, slot_date, slot_time, consultation_type, token_number)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [apptId, patId, patName, docId, docName, date, time, body.consultationType === 'ONLINE' ? 'ONLINE' : 'IN_PERSON', token],
        () => {
          db.run(
            `INSERT INTO queue_entries
               (id, appointment_id, token_number, patient_id, patient_name, doctor_id, status, checkin_time)
             VALUES (?, ?, ?, ?, ?, ?, 'Waiting', ?)`,
            [qId, apptId, token, patId, patName, docId, time],
            () => json(res, 201, {
              success:true,
              appointment:{ id:apptId, token, doctorName:docName, date, time, status:'CONFIRMED' }
            }));
        });
    });
    return;
  }

  // ── Live Queue ─────────────────────────────────────────────────────────
  if (pathname === '/v1/queue/live' && method === 'GET') {
    db.all('SELECT q.*, d.full_name AS doc_name FROM queue_entries q LEFT JOIN doctors d ON q.doctor_id = d.id ORDER BY q.rowid ASC', (err, rows) => {
      const queue = (rows || []).map(r => ({
        token: r.token_number,
        patientName: r.patient_name,
        patientId: r.patient_id,
        doctorName: r.doc_name || 'Dr. Amit Patil',
        status: r.status,
        time: r.checkin_time
      }));
      const inConsult   = queue.find(q => q.status === 'In Consultation');
      const waiting     = queue.filter(q => q.status === 'Waiting');
      const completed   = queue.filter(q => q.status === 'Completed');
      const currentTok  = inConsult?.token || (queue[0]?.token || '—');
      const myPos       = waiting.findIndex(q => q.token === 'A15');

      json(res, 200, {
        success:true,
        queue,
        stats:{
          todaysTokens:   queue.length + 50,
          inQueue:        waiting.length,
          inConsultation: inConsult ? 1 : 0,
          completed:      completed.length + 40
        },
        currentServingToken: currentTok,
        myToken:   'A15',
        myPosition: myPos >= 0 ? myPos : 0,
        estimatedWaitMinutes: (myPos >= 0 ? myPos + 1 : 1) * 6
      });
    });
    return;
  }

  // ── Call Next Patient ──────────────────────────────────────────────────
  if (pathname === '/v1/queue/call-next' && method === 'POST') {
    db.run("UPDATE queue_entries SET status='Completed' WHERE status='In Consultation'", () => {
      db.get("SELECT id FROM queue_entries WHERE status='Waiting' ORDER BY rowid ASC LIMIT 1", (err, row) => {
        if (row) {
          db.run("UPDATE queue_entries SET status='In Consultation' WHERE id=?", [row.id], () =>
            json(res, 200, { success:true, message:'Queue advanced — next patient called' }));
        } else {
          json(res, 200, { success:true, message:'Queue is empty — no patients waiting' });
        }
      });
    });
    return;
  }

  // ── Walk-In Registration ───────────────────────────────────────────────
  if (pathname === '/v1/reception/walkin' && method === 'POST') {
    const name    = (body.patientName || 'Walk-In Patient').trim();
    const mobile  = body.mobile || '';
    const docId   = body.doctorId || 'doc1';
    if (!name) return json(res, 400, { success:false, message:'Patient name required' });

    db.get('SELECT COUNT(*) AS c FROM queue_entries', (err, row) => {
      const n     = (row?.c || 0) + 1;
      const token = 'W' + n;
      const qId   = 'qw-' + uid();
      const time  = nowTime();

      db.run(
        `INSERT INTO queue_entries
           (id, token_number, patient_id, patient_name, doctor_id, status, checkin_time)
         VALUES (?,?,?,?,?,'Waiting',?)`,
        [qId, token, 'walk-' + uid(), name, docId, time],
        () => json(res, 201, { success:true, token, name, time })
      );
    });
    return;
  }

  // ── Mark No Show ───────────────────────────────────────────────────────
  if (pathname === '/v1/queue/no-show' && method === 'POST') {
    const token = body.token;
    if (!token) return json(res, 400, { success:false, message:'Token is required' });

    db.get("SELECT id FROM queue_entries WHERE token_number=? AND status='Waiting'", [token], (err, row) => {
      if (!row) return json(res, 404, { success:false, message:`Token ${token} not found or already processed` });
      db.run("UPDATE queue_entries SET status='No Show' WHERE id=?", [row.id], () =>
        json(res, 200, { success:true, message:`Token ${token} marked as No Show` }));
    });
    return;
  }

  // ── GET Prescriptions ──────────────────────────────────────────────────
  if (pathname === '/v1/prescriptions' && method === 'GET') {
    const patId = url.searchParams.get('patientId') || null;
    const sql   = patId
      ? 'SELECT * FROM prescriptions WHERE patient_id=? ORDER BY created_at DESC'
      : 'SELECT * FROM prescriptions ORDER BY created_at DESC';
    const args  = patId ? [patId] : [];

    db.all(sql, args, (err, rows) => {
      json(res, 200, {
        success:true,
        prescriptions: (rows || []).map(r => ({
          id: r.id,
          patientName: r.patient_name,
          doctorName:  r.doctor_name,
          date:        r.created_at?.split(' ')[0] || 'Today',
          diagnosis:   r.diagnosis,
          medications: JSON.parse(r.medications_json || '[]'),
          instructions: r.instructions
        }))
      });
    });
    return;
  }

  // ── POST (Create) Prescription ─────────────────────────────────────────
  if (pathname === '/v1/prescriptions' && method === 'POST') {
    const rxId   = 'rx-' + uid();
    const patId2 = body.patientId   || 'HS-2026-000001';
    const patNm  = body.patientName || 'Patient';
    const diag   = body.diagnosis;
    const meds   = JSON.stringify(body.medications || []);
    const notes  = body.instructions || '';
    const docId  = body.doctorId   || 'doc1';
    const docNm  = body.doctorName || 'Dr. Amit Patil';

    if (!diag || !body.medications?.length)
      return json(res, 400, { success:false, message:'diagnosis and at least one medication required' });

    db.run(
      `INSERT INTO prescriptions
         (id, patient_id, patient_name, doctor_id, doctor_name, diagnosis, medications_json, instructions)
       VALUES (?,?,?,?,?,?,?,?)`,
      [rxId, patId2, patNm, docId, docNm, diag, meds, notes],
      () => json(res, 201, { success:true, prescriptionId:rxId })
    );
    return;
  }

  // ── Consent Management ─────────────────────────────────────────────────
  if (pathname === '/v1/consents' && method === 'GET') {
    const patId3 = url.searchParams.get('patientId');
    const sql3   = patId3 ? 'SELECT * FROM consents WHERE patient_id=?' : 'SELECT * FROM consents';
    db.all(sql3, patId3 ? [patId3] : [], (err, rows) =>
      json(res, 200, { success:true, consents: rows || [] }));
    return;
  }

  if (pathname === '/v1/consents' && method === 'POST') {
    const cId   = 'con-' + uid();
    const patId4  = body.patientId || 'pat1';
    const docId2  = body.doctorId  || 'doc1';
    const docNm2  = body.doctorName || 'Dr. Amit Patil';
    const dur     = body.duration || '1 Visit';
    db.run(
      `INSERT INTO consents (id, patient_id, doctor_id, doctor_name, status, duration)
       VALUES (?,?,?,?,'GRANTED',?)`,
      [cId, patId4, docId2, docNm2, dur],
      () => {
        createNotification(patId4, `Consent granted to ${docNm2} for ${dur}.`);
        json(res, 201, { success:true, consentId:cId });
      }
    );
    return;
  }

  // ── Emergency SOS Endpoint ─────────────────────────────────────────────
  if (pathname === '/v1/emergency/trigger' && method === 'POST') {
    const patId = body.patientId || 'pat1';
    const lat = body.latitude || 18.5204;
    const lng = body.longitude || 73.8567;
    const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

    db.get('SELECT full_name FROM patients WHERE id = ?', [patId], (err, pat) => {
      const name = pat ? pat.full_name : 'Emergency Patient';
      const msg = `🚨 EMERGENCY SOS: ${name} needs help! Live Location: ${mapsUrl}`;

      db.all("SELECT id FROM users WHERE role IN ('DOCTOR', 'RECEPTIONIST')", (err2, users) => {
        if (users && users.length) {
          db.serialize(() => {
            const stmt = db.prepare('INSERT INTO notifications (id, user_id, message, status) VALUES (?, ?, ?, ?)');
            users.forEach(u => {
              stmt.run('notif-' + uid(), u.id, msg, 'UNREAD');
            });
            stmt.finalize();
          });
        }
        json(res, 200, { success: true, message: 'Emergency SOS sent to nearby hospital.', googleMapsUrl: mapsUrl });
      });
    });
    return;
  }

  // ── Real Notifications Endpoints ───────────────────────────────────────
  if (pathname === '/v1/notifications' && method === 'GET') {
    const userId = url.searchParams.get('userId') || 'pat1';
    db.all('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC', [userId], (err, rows) => {
      json(res, 200, { success: true, notifications: rows || [] });
    });
    return;
  }

  if (pathname === '/v1/notifications/clear' && method === 'POST') {
    const userId = body.userId || 'pat1';
    db.run('DELETE FROM notifications WHERE user_id=?', [userId], () => {
      json(res, 200, { success: true, message: 'Notifications cleared' });
    });
    return;
  }

  if (pathname.startsWith('/v1/notifications/') && pathname.endsWith('/read') && method === 'POST') {
    const notificationId = pathname.split('/')[3];
    db.run("UPDATE notifications SET status='READ' WHERE id=?", [notificationId], () => json(res, 200, { success:true }));
    return;
  }

  // ── Health Check ────────────────────────────────────────────────────────
  if (pathname.startsWith('/v1/doctors/') && pathname.endsWith('/profile') && method === 'GET') {
    const doctorId = pathname.split('/')[3];
    return db.get('SELECT * FROM doctors WHERE id=?', [doctorId], (err, profile) => json(res, profile ? 200 : 404, { success:!!profile, profile }));
  }
  if (pathname.startsWith('/v1/doctors/') && pathname.endsWith('/profile') && method === 'PUT') {
    const doctorId = pathname.split('/')[3];
    db.run('UPDATE doctors SET full_name=?, specialization=?, qualification=?, clinic_name=?, consultation_fee=?, experience=?, languages=?, registration_number=? WHERE id=?',
      [body.fullName || '', body.specialization || '', body.qualification || '', body.clinicName || '', Number(body.consultationFee) || 0, body.experience || '', body.languages || '', body.registrationNumber || '', doctorId],
      () => { audit(body.userId, 'UPDATE_DOCTOR_PROFILE', 'doctor', doctorId); json(res, 200, { success:true }); });
    return;
  }
  if (pathname.startsWith('/v1/doctors/') && pathname.endsWith('/availability') && method === 'GET') {
    const doctorId = pathname.split('/')[3];
    return db.all('SELECT * FROM doctor_availability WHERE doctor_id=? AND is_active=1 ORDER BY day_of_week,start_time', [doctorId], (err, slots) => json(res, 200, { success:true, slots:slots || [] }));
  }
  if (pathname.startsWith('/v1/doctors/') && pathname.endsWith('/availability') && method === 'POST') {
    const doctorId = pathname.split('/')[3], id = 'avail-' + uid();
    if (body.dayOfWeek === undefined || !body.startTime || !body.endTime) return json(res, 400, { success:false, message:'day, start time and end time are required' });
    db.run('INSERT INTO doctor_availability (id,doctor_id,day_of_week,start_time,end_time,consultation_type) VALUES (?,?,?,?,?,?)',
      [id, doctorId, Number(body.dayOfWeek), body.startTime, body.endTime, body.consultationType === 'ONLINE' ? 'ONLINE' : 'IN_PERSON'],
      () => { audit(body.userId, 'CREATE_AVAILABILITY', 'doctor_availability', id); json(res, 201, { success:true, slotId:id }); });
    return;
  }
  if (pathname.startsWith('/v1/availability/') && method === 'DELETE') {
    const slotId = pathname.split('/')[3];
    return db.run('UPDATE doctor_availability SET is_active=0 WHERE id=?', [slotId], () => json(res, 200, { success:true }));
  }

  if (pathname === '/v1/consent-requests' && method === 'GET') {
    const doctorId = url.searchParams.get('doctorId'), patientId = url.searchParams.get('patientId');
    const field = doctorId ? 'doctor_id' : 'patient_id', value = doctorId || patientId;
    if (!value) return json(res, 400, { success:false, message:'doctorId or patientId is required' });
    return db.all('SELECT cr.*, p.full_name AS patient_name, d.full_name AS doctor_name FROM consent_requests cr LEFT JOIN patients p ON p.id=cr.patient_id LEFT JOIN doctors d ON d.id=cr.doctor_id WHERE cr.' + field + '=? ORDER BY cr.requested_at DESC', [value], (err, requests) => json(res, 200, { success:true, requests:requests || [] }));
  }
  if (pathname === '/v1/consent-requests' && method === 'POST') {
    const id = 'consent-request-' + uid();
    if (!body.patientId || !body.doctorId || !body.purpose) return json(res, 400, { success:false, message:'patient, doctor and purpose are required' });
    db.run('INSERT INTO consent_requests (id,patient_id,doctor_id,purpose,scope,expires_at) VALUES (?,?,?,?,?,?)', [id, body.patientId, body.doctorId, body.purpose, body.scope || 'ALL_RECORDS', body.expiresAt || null], () => {
      createNotification(body.patientId, 'A doctor has requested access to your medical records.');
      audit(body.userId, 'CREATE_CONSENT_REQUEST', 'consent_request', id); json(res, 201, { success:true, requestId:id });
    });
    return;
  }
  if (pathname.startsWith('/v1/consent-requests/') && pathname.endsWith('/respond') && method === 'PUT') {
    const requestId = pathname.split('/')[3], status = body.approved ? 'GRANTED' : 'DECLINED';
    return db.run('UPDATE consent_requests SET status=?, responded_at=CURRENT_TIMESTAMP WHERE id=? AND status=?', [status, requestId, 'PENDING'], () => {
      audit(body.userId, 'RESPOND_CONSENT_REQUEST', 'consent_request', requestId, { status }); json(res, 200, { success:true, status });
    });
  }

  if (pathname.startsWith('/v1/patients/') && pathname.endsWith('/profile') && method === 'GET') {
    const patientId = pathname.split('/')[3];
    return db.get('SELECT p.*, c.address, c.city, c.emergency_contact_name, c.emergency_contact_phone, m.allergies, m.chronic_conditions FROM patients p LEFT JOIN patient_contacts c ON c.patient_id=p.id LEFT JOIN patient_medical_profiles m ON m.patient_id=p.id WHERE p.id=?', [patientId],
      (err, profile) => json(res, profile ? 200 : 404, { success:!!profile, profile }));
  }
  if (pathname.startsWith('/v1/patients/') && pathname.endsWith('/profile') && method === 'PUT') {
    const patientId = pathname.split('/')[3];
    db.run('UPDATE patients SET full_name=?, gender=?, date_of_birth=?, blood_group=? WHERE id=?', [body.fullName || '', body.gender || '', body.dateOfBirth || '', body.bloodGroup || '', patientId]);
    db.run('INSERT INTO patient_contacts (id,patient_id,address,city,emergency_contact_name,emergency_contact_phone,updated_at) VALUES (?,?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(patient_id) DO UPDATE SET address=excluded.address, city=excluded.city, emergency_contact_name=excluded.emergency_contact_name, emergency_contact_phone=excluded.emergency_contact_phone, updated_at=CURRENT_TIMESTAMP',
      ['contact-' + uid(), patientId, body.address || '', body.city || '', body.emergencyContactName || '', body.emergencyContactPhone || '']);
    db.run('INSERT INTO patient_medical_profiles (patient_id,allergies,chronic_conditions,updated_at) VALUES (?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(patient_id) DO UPDATE SET allergies=excluded.allergies, chronic_conditions=excluded.chronic_conditions, updated_at=CURRENT_TIMESTAMP',
      [patientId, body.allergies || '', body.chronicConditions || ''], () => { audit(body.userId, 'UPDATE_PROFILE', 'patient', patientId); json(res, 200, { success:true }); });
    return;
  }

  if (pathname === '/v1/settings' && method === 'GET') {
    const userId = url.searchParams.get('userId');
    if (!userId) return json(res, 400, { success:false, message:'userId is required' });
    return db.get('SELECT * FROM user_settings WHERE user_id=?', [userId], (err, settings) =>
      json(res, 200, { success:true, settings:settings || { user_id:userId, language:'English', notifications_enabled:1, sms_enabled:1, reminder_enabled:1, theme:'light' } }));
  }
  if (pathname === '/v1/settings' && method === 'PUT') {
    const userId = body.userId;
    if (!userId) return json(res, 400, { success:false, message:'userId is required' });
    db.run('INSERT INTO user_settings (user_id,language,notifications_enabled,sms_enabled,reminder_enabled,theme,updated_at) VALUES (?,?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(user_id) DO UPDATE SET language=excluded.language, notifications_enabled=excluded.notifications_enabled, sms_enabled=excluded.sms_enabled, reminder_enabled=excluded.reminder_enabled, theme=excluded.theme, updated_at=CURRENT_TIMESTAMP',
      [userId, body.language || 'English', body.notificationsEnabled !== false ? 1 : 0, body.smsEnabled !== false ? 1 : 0, body.reminderEnabled !== false ? 1 : 0, body.theme || 'light'],
      () => { audit(userId, 'UPDATE_SETTINGS', 'user_settings', userId); json(res, 200, { success:true }); });
    return;
  }

  if (pathname === '/v1/reminders' && method === 'GET') {
    const patientId = url.searchParams.get('patientId');
    return db.all('SELECT * FROM medicine_reminders WHERE patient_id=? AND is_active=1 ORDER BY reminder_time', [patientId], (err, rows) => json(res, 200, { success:true, reminders:rows || [] }));
  }
  if (pathname === '/v1/reminders' && method === 'POST') {
    const id = 'rem-' + uid();
    if (!body.patientId || !body.medicineName || !body.reminderTime) return json(res, 400, { success:false, message:'patient, medicine and time are required' });
    db.run('INSERT INTO medicine_reminders (id,patient_id,medicine_name,dosage,reminder_time) VALUES (?,?,?,?,?)', [id, body.patientId, body.medicineName, body.dosage || '', body.reminderTime], () => json(res, 201, { success:true, reminderId:id }));
    return;
  }
  if (pathname.startsWith('/v1/reminders/') && method === 'DELETE') {
    const id = pathname.split('/')[3];
    return db.run('UPDATE medicine_reminders SET is_active=0 WHERE id=?', [id], () => json(res, 200, { success:true }));
  }

  if (pathname === '/v1/health' && method === 'GET') {
    return json(res, 200, {
      status:'ok',
      service:'HealthSync API',
      version:'1.0.0',
      timestamp: new Date().toISOString()
    });
  }

  // ── 404 ─────────────────────────────────────────────────────────────────
  json(res, 404, { error:'Endpoint not found', path:pathname });
}

// ─── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n====================================================`);
  console.log(`🏥  HealthSync WebApp Server`);
  console.log(`🌐  http://localhost:${PORT}          (Frontend UI)`);
  console.log(`⚡  http://localhost:${PORT}/v1/health (API Health)`);
  console.log(`🗄️   DB: ${DB_PATH}`);
  console.log(`====================================================\n`);
});

// ─── Socket.IO ───────────────────────────────────────────────────────────────
const io = new Server(server, { cors: { origin: '*' } });

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error: No token'));
  if (token.startsWith('DEMO_')) {
    const role = token.replace('DEMO_', '');
    socket.userId = 'demo-' + role.toLowerCase();
    socket.role = role;
    return next();
  }
  const payload = jwtVerify(token);
  if (!payload) return next(new Error('Authentication error: Invalid token'));
  socket.userId = payload.userId;
  socket.role = payload.role;
  next();
});

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id} (User: ${socket.userId}, Role: ${socket.role})`);
  
  // Join role-based rooms
  if (socket.role) {
    socket.join(socket.role);
  }
  socket.join(socket.userId);

  socket.on('sos_trigger', (data) => {
    const { patientId, patientName, lat, lng, address, phone } = data;
    const caseId = 'sos-' + uid();
    
    db.run(
      `INSERT INTO emergency_cases (id, patient_id, patient_name, phone_number, lat, lng, address) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [caseId, patientId, patientName, phone, lat, lng, address],
      () => {
        const emergencyData = { caseId, patientId, patientName, phone, lat, lng, address, status: 'Pending', timestamp: new Date().toISOString() };
        // Broadcast to receptionists, doctors, and ambulances
        io.to('RECEPTIONIST').emit('sos_alert', emergencyData);
        io.to('DOCTOR').emit('sos_alert', emergencyData);
        io.to('AMBULANCE').emit('sos_alert', emergencyData);
        // Acknowledge back to patient
        socket.emit('sos_acknowledged', emergencyData);
      }
    );
  });

  socket.on('location_update', (data) => {
    const { caseId, lat, lng } = data;
    db.run(`UPDATE emergency_cases SET lat = ?, lng = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [lat, lng, caseId]);
    // Broadcast location update to receptionist, ambulance, and doctor
    io.to('RECEPTIONIST').emit('emergency_location_update', data);
    io.to('DOCTOR').emit('emergency_location_update', data);
    io.to('AMBULANCE').emit('emergency_location_update', data);
  });

  socket.on('ambulance_location_update', (data) => {
    const { caseId, lat, lng } = data;
    db.get('SELECT patient_id FROM emergency_cases WHERE id = ?', [caseId], (err, caseData) => {
      if (caseData) io.to(caseData.patient_id).emit('ambulance_location_update', data);
    });
  });

  socket.on('dispatch_ambulance', (data) => {
    const { caseId, hospitalId } = data;
    db.run(`UPDATE emergency_cases SET status = 'Ambulance Dispatched', hospital_id = ? WHERE id = ?`, [hospitalId, caseId], () => {
      db.get('SELECT * FROM emergency_cases WHERE id = ?', [caseId], (err, caseData) => {
        io.to('AMBULANCE').emit('ambulance_dispatched', caseData);
        // Notify patient
        io.to(caseData.patient_id).emit('sos_status_update', { caseId, status: 'Ambulance Dispatched' });
        // Update receptionist
        io.to('RECEPTIONIST').emit('sos_status_update', { caseId, status: 'Ambulance Dispatched' });
      });
    });
  });

  socket.on('resolve_emergency', (data) => {
    const { caseId } = data;
    db.run(`UPDATE emergency_cases SET status = 'Resolved' WHERE id = ?`, [caseId], () => {
      io.to('RECEPTIONIST').emit('sos_status_update', { caseId, status: 'Resolved' });
      io.to('AMBULANCE').emit('sos_status_update', { caseId, status: 'Resolved' });
      db.get('SELECT patient_id FROM emergency_cases WHERE id = ?', [caseId], (err, caseData) => {
        if (caseData) io.to(caseData.patient_id).emit('sos_status_update', { caseId, status: 'Resolved' });
      });
    });
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

process.on('SIGTERM', () => { db.close(); server.close(); });
process.on('SIGINT',  () => { db.close(); server.close(); process.exit(0); });
