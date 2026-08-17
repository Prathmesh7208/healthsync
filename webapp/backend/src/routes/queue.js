const express = require('express');
const prisma = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const router = express.Router();

router.get('/live', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const queue = await prisma.queueEntry.findMany({
      where: { date: today, status: { in: ['WAITING', 'IN_CONSULTATION'] } },
      include: {
        appointment: { include: { patient: true, doctor: true } }
      },
      orderBy: { tokenNumber: 'asc' }
    });

    const formatted = queue.map(q => ({
      id: q.id,
      patient_name: q.appointment?.patient?.fullName || 'Walk-in Patient',
      doctor_name: q.appointment?.doctor?.fullName || 'General OPD',
      token_number: q.tokenNumber,
      status: q.status
    }));

    res.json({ success: true, queue: formatted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/call-next', authenticateToken, requireRole(['RECEPTIONIST', 'DOCTOR']), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Using transaction to find first waiting and mark as IN_CONSULTATION
    const nextInQueue = await prisma.$transaction(async (tx) => {
      const entry = await tx.queueEntry.findFirst({
        where: { date: today, status: 'WAITING' },
        orderBy: { tokenNumber: 'asc' }
      });

      if (!entry) return null;

      return await tx.queueEntry.update({
        where: { id: entry.id },
        data: { status: 'IN_CONSULTATION' }
      });
    });

    if (!nextInQueue) {
      return res.json({ success: false, message: 'Queue is empty.' });
    }

    res.json({ success: true, message: `Called token ${nextInQueue.tokenNumber}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/no-show', authenticateToken, requireRole(['RECEPTIONIST', 'DOCTOR']), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const current = await prisma.queueEntry.findFirst({
      where: { date: today, status: 'IN_CONSULTATION' },
      orderBy: { tokenNumber: 'desc' }
    });

    if (!current) {
      return res.json({ success: false, message: 'No patient is currently in consultation.' });
    }

    await prisma.queueEntry.update({
      where: { id: current.id },
      data: { status: 'COMPLETED' }
    });

    res.json({ success: true, message: 'Marked as completed/no-show' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
