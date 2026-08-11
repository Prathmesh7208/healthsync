const fs = require('fs');

const serverPath = 'c:/HealthSync/webapp/backend/server.js';
let serverCode = fs.readFileSync(serverPath, 'utf8');

// Add ALTER TABLE logic to the database initialization block
const dbInitBlock = `
  db.run(\`CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      healthsync_id TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      gender TEXT,
      date_of_birth TEXT,
      blood_group TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )\`, (err) => {
      if (!err) {
        // Try to add email column gracefully if it doesn't exist
        db.run(\`ALTER TABLE patients ADD COLUMN email TEXT\`, (alterErr) => {
          // Ignored if already exists
        });
      }
    });
`;

// Replace the old patients table creation with the new one
serverCode = serverCode.replace(/db\.run\(\`CREATE TABLE IF NOT EXISTS patients \([\s\S]*?TIMESTAMP\s*\)\`\);/, dbInitBlock);

// Add the /v1/auth/profile POST endpoint
const profileEndpoint = `
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
            db.run(\`UPDATE patients SET email = ?, date_of_birth = ?, gender = ? WHERE user_id = ?\`, [email, dob, gender, userId], (updateErr) => {
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
`;

// Insert the new endpoint before the catch-all or at the end of the routing block
if (!serverCode.includes('/v1/auth/profile')) {
  // Find a good place to insert, like before /v1/appointments
  serverCode = serverCode.replace("else if (pathname === '/v1/appointments'", profileEndpoint + "\n        else if (pathname === '/v1/appointments'");
  fs.writeFileSync(serverPath, serverCode);
  console.log('server.js updated with profile endpoint and schema change');
} else {
  console.log('server.js already contains /v1/auth/profile');
}
