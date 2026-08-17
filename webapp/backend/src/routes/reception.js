const express = require('express');
const prisma = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const router = express.Router();

router.post('/walkin', authenticateToken, requireRole(['RECEPTIONIST']), async (req, res) => {
  try {
    const { patientName, doctorId, department } = req.body;

    if (!patientName) {
      return res.status(400).json({ success: false, message: 'Patient name is required' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await prisma.$transaction(async (tx) => {
      // Find the last token number for today for this clinic
      // Since clinic isn't explicitly passed in walkin body, we'll assign to first clinic
      const clinic = await tx.clinic.findFirst();
      if (!clinic) throw new Error('No clinics configured');

      const lastEntry = await tx.queueEntry.findFirst({
        where: { date: today, clinicId: clinic.id },
        orderBy: { tokenNumber: 'desc' }
      });

      const nextToken = lastEntry ? parseInt(lastEntry.tokenNumber.replace('T', '')) + 1 : 1;
      const tokenStr = `T${nextToken.toString().padStart(3, '0')}`;

      // Create a mock user/patient for walk-ins if they don't exist
      // In reality we should link them to an actual record, but for demo:
      let patientUser = await tx.user.findFirst({ where: { phoneNumber: 'WALKIN' } });
      if (!patientUser) {
        patientUser = await tx.user.create({
          data: {
            phoneNumber: `WALKIN-${Date.now()}`,
            role: 'PATIENT',
            patient: { create: { fullName: patientName } }
          },
          include: { patient: true }
        });
      }

      const entry = await tx.queueEntry.create({
        data: {
          clinicId: clinic.id,
          date: today,
          tokenNumber: tokenStr,
          status: 'WAITING',
          // We can link an appointment if needed, but for walk-in we'll just create the queue entry
        }
      });

      return tokenStr;
    });

    res.json({ success: true, message: 'Walk-in registered', token: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/checkin/:apptId', authenticateToken, requireRole(['RECEPTIONIST']), async (req, res) => {
  try {
    const { apptId } = req.params;

    const appointment = await prisma.appointment.findUnique({ where: { id: apptId } });
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });

    if (appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Cannot check-in a completed/cancelled appointment' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const token = await prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id: apptId },
        data: { status: 'CONFIRMED' }
      });

      const lastEntry = await tx.queueEntry.findFirst({
        where: { date: today, clinicId: appointment.clinicId },
        orderBy: { tokenNumber: 'desc' }
      });

      const nextToken = lastEntry ? parseInt(lastEntry.tokenNumber.replace('T', '')) + 1 : 1;
      const tokenStr = `T${nextToken.toString().padStart(3, '0')}`;

      await tx.queueEntry.create({
        data: {
          clinicId: appointment.clinicId,
          appointmentId: appointment.id,
          date: today,
          tokenNumber: tokenStr,
          status: 'WAITING'
        }
      });

      return tokenStr;
    });

    res.json({ success: true, message: 'Patient checked in', token: token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
