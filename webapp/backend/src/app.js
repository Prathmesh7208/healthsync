const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const doctorRoutes = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointments');
const emergencyRoutes = require('./routes/emergency');
const queueRoutes = require('./routes/queue');
const receptionRoutes = require('./routes/reception');
const prescriptionRoutes = require('./routes/prescriptions');




const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/v1/auth', authRoutes);
app.use('/v1/patients', patientRoutes);
app.use('/v1/doctors', doctorRoutes);
app.use('/v1/appointments', appointmentRoutes);
app.use('/v1/emergency', emergencyRoutes);
app.use('/v1/queue', queueRoutes);
app.use('/v1/reception', receptionRoutes);
app.use('/v1/prescriptions', prescriptionRoutes);





// Dummy routes for frontend completion
app.get('/v1/notifications', (req, res) => res.json({ success: true, notifications: [] }));
app.post('/v1/notifications/:id/read', (req, res) => res.json({ success: true }));
app.post('/v1/notifications/clear', (req, res) => res.json({ success: true }));

app.get('/v1/reminders', (req, res) => res.json({ success: true, reminders: [] }));
app.post('/v1/reminders', (req, res) => res.json({ success: true }));
app.delete('/v1/reminders/:id', (req, res) => res.json({ success: true }));

app.put('/v1/settings', (req, res) => res.json({ success: true }));
app.post('/v1/auth/logout', (req, res) => res.json({ success: true }));

app.post('/v1/vaccinations', (req, res) => res.json({ success: true }));
app.delete('/v1/vaccinations/:id', (req, res) => res.json({ success: true }));

app.put('/v1/appointments/:id/status', (req, res) => res.json({ success: true }));
app.put('/v1/appointments/:id/cancel', (req, res) => res.json({ success: true }));

// Static frontend serving
app.use(express.static(path.join(__dirname, '../../frontend')));

// Fallback for HTML5 history (SPA behavior if needed)
app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

module.exports = app;
