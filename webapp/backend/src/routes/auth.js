const express = require('express');
const jwt = require('jsonwebtoken');
const prisma = require('../db');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const mobileNumber = req.body.mobileNumber;
    if (!mobileNumber) return res.status(400).json({ success: false, message: 'Mobile number is required' });

    // In a real production app, you would generate a random 6 digit OTP, hash it, save to OtpRecord, and send via SMS.
    // Here we'll simulate a 123456 OTP just for end-to-end testing, but we'll mock the DB behavior.
    
    // Simulate checking if user exists
    let user = await prisma.user.findUnique({ where: { phoneNumber: mobileNumber } });
    if (!user) {
      // Allow registration during verification
    }

    res.json({ 
      success: true, 
      message: "OTP Sent Successfully", 
      mobile: mobileNumber,
      otp: "123456" // Mock OTP payload for frontend testing
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const mobile = req.body.mobileNumber;
    const otp = req.body.otp;
    const name = req.body.fullName || "New User";

    if (!mobile || !otp) return res.status(400).json({ success: false, message: 'Mobile and OTP required' });

    // Validate Mock OTP
    if (otp !== "123456") {
      return res.status(401).json({ success: false, message: 'Invalid OTP' });
    }

    let user = await prisma.user.findUnique({ 
      where: { phoneNumber: mobile },
      include: { patient: true }
    });
    
    let isNewUser = false;
    
    if (!user) {
      isNewUser = true;
      // Register New Patient User atomically
      user = await prisma.user.create({
        data: {
          phoneNumber: mobile,
          role: 'PATIENT',
          isVerified: true,
          patient: {
            create: {
              fullName: name
            }
          }
        },
        include: { patient: true }
      });
    } else {
      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token: token,
      user: { 
        id: user.id,
        patientId: user.patient ? user.patient.id : null,
        name: user.patient ? user.patient.fullName : name, 
        mobile: mobile, 
        role: user.role 
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

router.post('/profile', authenticateToken, async (req, res) => {
  try {
    const { email, dateOfBirth, gender, bloodGroup } = req.body;
    
    if (req.user.role !== 'PATIENT') {
      return res.status(403).json({ success: false, message: 'Only patients can update this profile type' });
    }

    const dobDate = dateOfBirth ? new Date(dateOfBirth) : null;

    await prisma.patient.update({
      where: { userId: req.user.id },
      data: {
        email: email || undefined,
        gender: gender || undefined,
        dateOfBirth: dobDate || undefined,
        bloodGroup: bloodGroup || undefined,
      }
    });

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
