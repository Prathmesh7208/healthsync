const express = require('express');
const prisma = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { doctorId, date, time } = req.body;
    const patientId = req.user.patient?.id;

    if (!patientId) {
      return res.status(403).json({ success: false, message: 'Only registered patients can book appointments' });
    }

    if (!doctorId || !date || !time) {
      return res.status(400).json({ success: false, message: 'Missing required booking details' });
    }

    const targetDate = new Date(date);

    // Prevent double booking using a transaction
    // Prisma executes these serially or allows us to check before insert
    const result = await prisma.$transaction(async (tx) => {
      // 1. Check if the slot is already booked
      const existing = await tx.appointment.findFirst({
        where: {
          doctorId: doctorId,
          appointmentDate: targetDate,
          appointmentTime: time,
          status: { in: ['CONFIRMED', 'BOOKED'] }
        }
      });

      if (existing) {
        throw new Error('SLOT_TAKEN');
      }

      // 2. We need a clinicId. Let's get the first clinic for this doctor
      const docClinic = await tx.doctorClinic.findFirst({
        where: { doctorId: doctorId },
        include: { doctor: true }
      });

      if (!docClinic) {
        throw new Error('NO_CLINIC');
      }

      // 3. Create the appointment
      const appointment = await tx.appointment.create({
        data: {
          patientId: patientId,
          doctorId: doctorId,
          clinicId: docClinic.clinicId,
          appointmentDate: targetDate,
          appointmentTime: time,
          status: 'BOOKED',
          consultationFee: docClinic.consultationFee || 500
        },
        include: {
          doctor: true,
          patient: true
        }
      });

      return appointment;
    });

    res.status(201).json({
      success: true,
      appointment: {
        id: result.id,
        patient_id: result.patientId,
        patient_name: result.patient.fullName,
        doctor_id: result.doctorId,
        doctor_name: result.doctor.fullName,
        slot_date: date,
        slot_time: time,
        token: "AXX", // Will generate queue token when checked in
        status: "BOOKED"
      }
    });

  } catch (err) {
    if (err.message === 'SLOT_TAKEN') {
      return res.status(409).json({ success: false, message: 'Sorry, this slot was just booked.' });
    }
    console.error(err);
    res.status(500).json({ success: false, message: 'Database error during booking' });
  }
});

router.get('/next', authenticateToken, async (req, res) => {
  try {
    const patientId = req.user.patient?.id;
    if (!patientId) {
       return res.status(403).json({ success: false, message: 'Patient not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextAppt = await prisma.appointment.findFirst({
      where: {
        patientId: patientId,
        status: { notIn: ['CANCELLED', 'COMPLETED', 'REJECTED'] },
        appointmentDate: { gte: today }
      },
      include: { doctor: true, clinic: { include: { hospital: true } } },
      orderBy: [
        { appointmentDate: 'asc' },
        { appointmentTime: 'asc' }
      ]
    });

    if (!nextAppt) {
      return res.json({ success: true, appointment: null });
    }

    // Format for frontend
    res.json({
      success: true,
      appointment: {
        id: nextAppt.id,
        doctor_name: nextAppt.doctor.fullName,
        slot_date: nextAppt.appointmentDate.toISOString().split('T')[0],
        slot_time: nextAppt.appointmentTime,
        status: nextAppt.status
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
