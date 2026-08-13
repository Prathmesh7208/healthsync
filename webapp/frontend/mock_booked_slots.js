const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('c:/HealthSync/webapp/healthsync.db');

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

const todayStr = today.toISOString().split('T')[0];
const tomorrowStr = tomorrow.toISOString().split('T')[0];

db.serialize(() => {
  db.get("SELECT id FROM doctors WHERE full_name LIKE '%Amit%'", (err, row) => {
    if (err || !row) {
      console.error("Doctor not found", err);
      return;
    }
    const docId = row.id;
    console.log("Found doctor Amit Patil:", docId);
    
    // Insert some mock appointments for today and tomorrow to show booked slots
    const appts = [
      { docId, patientId: 'pat_mock_1', date: todayStr, time: '10:30 AM' },
      { docId, patientId: 'pat_mock_2', date: todayStr, time: '11:00 AM' },
      { docId, patientId: 'pat_mock_3', date: todayStr, time: '02:00 PM' },
      { docId, patientId: 'pat_mock_4', date: tomorrowStr, time: '09:00 AM' },
      { docId, patientId: 'pat_mock_5', date: tomorrowStr, time: '11:30 AM' }
    ];
    
    const stmt = db.prepare("INSERT INTO appointments (id, doctor_id, patient_id, slot_date, slot_time, status) VALUES (?, ?, ?, ?, ?, 'Confirmed')");
    
    appts.forEach((a, i) => {
      const id = `mock_appt_${Date.now()}_${i}`;
      stmt.run(id, a.docId, a.patientId, a.date, a.time, (err) => {
        if (err && err.code !== 'SQLITE_CONSTRAINT') console.error(err);
      });
    });
    
    stmt.finalize();
    console.log("Inserted mock appointments.");
  });
});
