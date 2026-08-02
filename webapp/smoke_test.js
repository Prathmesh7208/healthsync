const http = require('http');

function post(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    };
    const req = http.request(options, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('\n=== HealthSync API Smoke Tests ===\n');

  // 1. Health check
  const h = await new Promise(resolve => {
    http.get('http://localhost:3000/v1/health', res => {
      let b = ''; res.on('data', c => b += c); res.on('end', () => resolve(JSON.parse(b)));
    });
  });
  console.log('1. Health Check:', h.status === 'ok' ? '✅ PASS' : '❌ FAIL', h);

  // 2. Walk-in registration with name
  const w = await post('/v1/reception/walkin', { patientName: 'Vijay Patil', mobile: '9876543210' });
  console.log('2. Walk-In Registration:', w.body.success && w.body.name === 'Vijay Patil' ? '✅ PASS' : '❌ FAIL', w.body);

  // 3. No-show marking
  const n = await post('/v1/queue/no-show', { token: 'A13' });
  console.log('3. No-Show Mark:', n.body.success ? '✅ PASS' : '❌ FAIL', n.body);

  // 4. Call next patient
  const cn = await post('/v1/queue/call-next', {});
  console.log('4. Call Next:', cn.body.success ? '✅ PASS' : '❌ FAIL', cn.body);

  // 5. Live queue (verify changes persisted)
  const q = await new Promise(resolve => {
    http.get('http://localhost:3000/v1/queue/live', res => {
      let b = ''; res.on('data', c => b += c); res.on('end', () => resolve(JSON.parse(b)));
    });
  });
  console.log('5. Live Queue:', q.success ? '✅ PASS' : '❌ FAIL', 'Queue length:', q.queue.length, '| Stats:', q.stats);

  // 6. Prescription save
  const rx = await post('/v1/prescriptions', {
    patientName: 'Priya Deshmukh', patientId: 'HS-2026-304912',
    doctorName: 'Dr. Amit Patil', doctorId: 'doc1',
    diagnosis: 'Migraine with Aura',
    medications: [{ name: 'Tab. Sumatriptan 50mg', dosage: '1 tablet', frequency: 'SOS (As needed)', duration: '3 Days' }],
    instructions: 'Rest in a dark, quiet room'
  });
  console.log('6. Create Prescription:', rx.body.success ? '✅ PASS' : '❌ FAIL', rx.body);

  // 7. Emergency SOS trigger
  const sos = await post('/v1/emergency/trigger', {
    patientId: 'pat1',
    latitude: 18.5204,
    longitude: 73.8567
  });
  console.log('7. Trigger Emergency SOS:', sos.body.success && sos.body.googleMapsUrl ? '✅ PASS' : '❌ FAIL', sos.body);

  console.log('\n=== All Tests Complete ===\n');
}

run().catch(e => console.error('Test Error:', e));

