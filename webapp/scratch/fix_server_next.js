const fs = require('fs');
const file = 'c:/HealthSync/webapp/backend/server.js';
let content = fs.readFileSync(file, 'utf8');

const nextFind = `if (patientId) { query = 'SELECT * FROM appointments WHERE patient_id = ? ORDER BY slot_date, slot_time LIMIT 1'; params = [patientId]; }`;
const nextReplace = `if (patientId) { 
  const today = new Date().toISOString().split('T')[0];
  query = "SELECT * FROM appointments WHERE patient_id = ? AND status NOT IN ('CANCELLED', 'COMPLETED', 'REJECTED') AND slot_date >= ? ORDER BY slot_date, slot_time LIMIT 1"; 
  params = [patientId, today]; 
}`;

content = content.replace(nextFind, nextReplace);
fs.writeFileSync(file, content);
console.log('Patched /appointments/next in server.js');
