require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const prisma = require('./src/db');

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Global state for live emergency SOS tracking
const activeEmergencies = [];

io.on('connection', (socket) => {
  socket.on('sos_trigger', async (data) => {
    try {
      // In production, validate user here via auth token sent in handshake
      
      const newCase = await prisma.emergencyCase.create({
        data: {
          patientId: data.patientId || data.userId, // Fallback depending on payload
          status: 'ACTIVE',
        }
      });
      
      await prisma.emergencyLocation.create({
        data: {
          emergencyCaseId: newCase.id,
          latitude: data.lat,
          longitude: data.lng
        }
      });

      const broadcastData = {
        caseId: newCase.id,
        patientId: data.userId,
        patientName: data.patientName || 'Unknown Patient',
        phone: data.phone || 'N/A',
        lat: data.lat,
        lng: data.lng,
        timestamp: Date.now(),
        status: 'Pending',
        address: 'Live Location Tracking...'
      };
      
      activeEmergencies.push(broadcastData);
      io.emit('sos_alert', broadcastData);
      socket.emit('sos_acknowledged', broadcastData);
    } catch (err) {
      console.error("SOS Error:", err);
    }
  });

  socket.on('dispatch_ambulance', async (data) => {
    const e = activeEmergencies.find(c => c.caseId === data.caseId);
    if (e) e.status = 'Ambulance Dispatched';
    io.emit('sos_status_update', { caseId: data.caseId, status: 'Ambulance Dispatched' });
    
    // Update DB
    await prisma.emergencyCase.update({
      where: { id: data.caseId },
      data: { status: 'AMBULANCE_ASSIGNED' }
    }).catch(console.error);
  });

  socket.on('resolve_emergency', async (data) => {
    const idx = activeEmergencies.findIndex(c => c.caseId === data.caseId);
    if (idx !== -1) activeEmergencies.splice(idx, 1);
    io.emit('emergency_resolved', { caseId: data.caseId });
    
    // Update DB
    await prisma.emergencyCase.update({
      where: { id: data.caseId },
      data: { status: 'RESOLVED', resolvedAt: new Date() }
    }).catch(console.error);
  });

  socket.on('ambulance_location_update', async (data) => {
    const e = activeEmergencies.find(c => c.caseId === data.caseId);
    if (e) {
      e.lat = data.lat;
      e.lng = data.lng;
    }
    io.emit('ambulance_location_update', data);
    
    // In a real app, throttle DB writes. For now we write every update.
    await prisma.emergencyLocation.create({
      data: {
        emergencyCaseId: data.caseId,
        latitude: data.lat,
        longitude: data.lng
      }
    }).catch(console.error);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(`🏥 HealthSync Production Architecture (Express + Prisma)`);
  console.log(`🌐 API Server URL: http://localhost:${PORT}`);
  
  // Basic DB connection test
  try {
    await prisma.$connect();
    console.log(`✅ Database connection established securely.`);
  } catch(e) {
    console.error(`❌ Database connection failed:`, e);
  }
});
