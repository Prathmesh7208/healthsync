const express = require('express');
const prisma = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const router = express.Router();

// GET /v1/patients/dashboard
router.get('/dashboard', authenticateToken, requireRole(['PATIENT']), async (req, res) => {
  try {
    const patient = req.user.patient;
    if (!patient) return res.status(404).json({ success: false, message: 'Patient profile not found' });

    // Fetch upcoming appointments
    const upcomingAppointments = await prisma.appointment.findMany({
      where: { 
        patientId: patient.id,
        status: { in: ['BOOKED', 'CONFIRMED'] },
        appointmentDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      },
      include: { doctor: true, clinic: { include: { hospital: true } } },
      orderBy: [{ appointmentDate: 'asc' }, { appointmentTime: 'asc' }]
    });

    // Fetch recent prescriptions
    const recentPrescriptions = await prisma.prescription.findMany({
      where: { patientId: patient.id },
      include: { doctor: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Format prescriptions to match frontend expectations
    const formattedRxs = recentPrescriptions.map(rx => ({
      ...rx,
      doctorName: rx.doctor.fullName,
      medications: [{ name: rx.medication, dosage: rx.dosage, frequency: rx.frequency, duration: rx.duration }]
    }));

    // Format appointments to match frontend expectations
    const formattedAppts = upcomingAppointments.map(appt => ({
      id: appt.id,
      patient_id: appt.patientId,
      patient_name: patient.fullName,
      doctor_id: appt.doctorId,
      doctor_name: appt.doctor.fullName,
      slot_date: appt.appointmentDate.toISOString().split('T')[0],
      slot_time: appt.appointmentTime,
      status: appt.status,
      token_number: "TBD" // You'll fetch queue token if needed
    }));

    res.json({
      success: true,
      patient: { name: patient.fullName },
      upcomingAppointments: formattedAppts,
      recentPrescriptions: formattedRxs,
      activeQueueToken: null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
