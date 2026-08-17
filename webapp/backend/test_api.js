const http = require('http');

function makeRequest(path, method, data, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (token) options.headers['Authorization'] = 'Bearer ' + token;
    if (data) options.headers['Content-Length'] = data.length;

    const req = http.request(options, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTest() {
  console.log("1. Testing Auth Verify...");
  const loginRes = await makeRequest('/v1/auth/verify', 'POST', JSON.stringify({
    mobileNumber: '9075012345',
    otp: '123456'
  }));
  console.log("Auth Result:", loginRes.success);
  const token = loginRes.token;

  console.log("2. Fetching Doctors...");
  const docRes = await makeRequest('/v1/doctors/search', 'GET');
  const doctorId = docRes.doctors[0].id;
  console.log("Doctor Found:", docRes.doctors[0].name);

  console.log("3. Testing Double Booking Transaction Lock...");
  const bookingData = JSON.stringify({
    doctorId: doctorId,
    date: '2026-08-20',
    time: '10:00 AM'
  });

  // Fire two requests simultaneously
  const p1 = makeRequest('/v1/appointments', 'POST', bookingData, token);
  const p2 = makeRequest('/v1/appointments', 'POST', bookingData, token);
  
  const results = await Promise.all([p1, p2]);
  console.log("Booking 1 Result:", results[0]);
  console.log("Booking 2 Result:", results[1]);
}

runTest();
