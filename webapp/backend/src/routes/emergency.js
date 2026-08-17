const express = require('express');
const prisma = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const router = express.Router();

router.get('/pending', authenticateToken, requireRole(['RECEPTIONIST', 'AMBULANCE']), async (req, res) => {
  try {
    const cases = await prisma.emergencyCase.findMany({
      where: { status: { in: ['ACTIVE', 'AMBULANCE_ASSIGNED'] } },
      include: {
        patient: { include: { user: true } },
        locations: { orderBy: { timestamp: 'desc' }, take: 1 }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = cases.map(c => ({
      caseId: c.id,
      patientId: c.patientId,
      patientName: c.patient?.fullName || 'Unknown',
      phone: c.patient?.user?.phoneNumber || 'N/A',
      lat: c.locations[0]?.latitude,
      lng: c.locations[0]?.longitude,
      status: c.status,
      timestamp: c.createdAt
    }));

    res.json({ success: true, cases: formatted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/:caseId/resolve', authenticateToken, requireRole(['RECEPTIONIST', 'AMBULANCE', 'DOCTOR']), async (req, res) => {
  try {
    const { caseId } = req.params;
    await prisma.emergencyCase.update({
      where: { id: caseId },
      data: { status: 'RESOLVED', resolvedAt: new Date() }
    });
    res.json({ success: true, message: 'Resolved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
