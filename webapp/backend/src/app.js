const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const doctorRoutes = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointments');
// const emergencyRoutes = require('./routes/emergency');
// const queueRoutes = require('./routes/queue');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/v1/auth', authRoutes);
app.use('/v1/patients', patientRoutes);
app.use('/v1/doctors', doctorRoutes);
app.use('/v1/appointments', appointmentRoutes);
// app.use('/v1/emergency', emergencyRoutes);
// app.use('/v1/queue', queueRoutes);

// Static frontend serving
app.use(express.static(path.join(__dirname, '../../frontend')));

// Fallback for HTML5 history (SPA behavior if needed)
app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

module.exports = app;
