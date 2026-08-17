const express = require('express');
const prisma = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.get('/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    const searchPattern = `%${query}%`;
    
    // SQLite doesn't natively support full text search well with Prisma without specific queries,
    // so we'll use contains
    const doctors = await prisma.doctor.findMany({
      where: {
        OR: [
          { fullName: { contains: query } },
          { specialization: { contains: query } }
        ]
      },
      include: {
        clinics: { include: { clinic: true } }
      }
    });

    const formattedDocs = doctors.map(d => ({
      id: d.id,
      name: d.fullName,
      specialization: d.specialization,
      exp: `${d.experienceYears}+ Years Exp.`,
      languages: d.languages,
      rating: 4.9, // Mock rating as per SQLite
      reviews: 320,
      availability: "Available Today",
      clinic: d.clinics.length > 0 ? d.clinics[0].clinic.name : "HealthSync Clinic",
      fee: d.consultationFee
    }));

    res.json({ success: true, doctors: formattedDocs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

router.get('/:doctorId/slots/summary', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const datesParam = req.query.dates;
    
    if (!datesParam) {
      return res.status(400).json({ success: false, message: 'Missing dates param' });
    }
    
    const dateList = datesParam.split(',');
    const totalSlotsPerDay = 14; 
    
    // Using explicit Date objects for Prisma SQLite
    const dateObjects = dateList.map(d => new Date(d));
    
    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctorId,
        appointmentDate: { in: dateObjects },
        status: { in: ['CONFIRMED', 'BOOKED'] }
      }
    });
    
    const bookedMap = {};
    appointments.forEach(r => { 
      const dStr = r.appointmentDate.toISOString().split('T')[0];
      bookedMap[dStr] = (bookedMap[dStr] || 0) + 1; 
    });
    
    const summary = {};
    dateList.forEach(d => {
      const booked = bookedMap[d] || 0;
      const available = Math.max(0, totalSlotsPerDay - booked);
      summary[d] = { available, total: totalSlotsPerDay };
    });
    
    res.json({ success: true, summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

router.get('/:doctorId/slots', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const dateStr = req.query.date;
    
    if (!dateStr) {
      return res.status(400).json({ success: false, message: 'Missing date param' });
    }
    
    const targetDate = new Date(dateStr);
    
    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctorId,
        appointmentDate: targetDate,
        status: { in: ['CONFIRMED', 'BOOKED'] }
      }
    });
    
    const bookedTimes = new Set(appointments.map(r => r.appointmentTime));
    const slots = [];
    
    const generateBlock = (startH, endH, isPM) => {
      for (let h = startH; h < endH; h++) {
        for (let m of ['00', '30']) {
          let hour12 = h;
          if (h > 12) hour12 = h - 12;
          let hs = hour12 < 10 ? `0${hour12}` : `${hour12}`;
          let period = isPM ? 'PM' : 'AM';
          if (h === 12) period = 'PM';
          let timeStr = `${hs}:${m} ${period}`;
          
          slots.push({
            time: timeStr,
            available: !bookedTimes.has(timeStr)
          });
        }
      }
    };
    
    generateBlock(9, 13, false);
    generateBlock(16, 19, true);
    
    res.json({ success: true, slots: slots });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

module.exports = router;
