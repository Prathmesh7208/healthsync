const express = require('express');
const prisma = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const router = express.Router();

router.post('/', authenticateToken, requireRole(['DOCTOR']), async (req, res) => {
  try {
    const { patientId, medication, dosage, frequency, duration, instructions } = req.body;
    const doctorId = req.user.doctor?.id;

    if (!doctorId) return res.status(403).json({ success: false, message: 'Only doctors can write prescriptions' });

    const rx = await prisma.prescription.create({
      data: {
        patientId,
        doctorId,
        medication,
        dosage,
        frequency,
        duration,
        instructions
      }
    });

    res.json({ success: true, message: 'Prescription saved', rx });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
