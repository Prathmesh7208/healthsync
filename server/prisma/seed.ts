import { PrismaClient, UserRole, DayOfWeek, SlotStatus, AppointmentStatus, MedicineForm, MedicineTiming, MedicalRecordType, EmergencyStatus, LocationSource, AmbulanceStatus, BloodGroup, Gender } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding HealthSync database with rich multi-role test data...');

  const passwordHash = await bcrypt.hash('HealthSync@123', 10);

  // 1. Admin User
  const adminUser = await prisma.user.upsert({
    where: { phone: '+919999999999' },
    update: {},
    create: {
      phone: '+919999999999',
      role: UserRole.ADMIN,
      password: passwordHash,
    },
  });

  // 2. Hospitals (Pune & Mumbai)
  const hospitalsData = [
    {
      name: 'Ruby Hall Clinic',
      address: '40 Sassoon Road, Sangamvadi',
      city: 'Pune',
      state: 'Maharashtra',
      pinCode: '411001',
      latitude: 18.5308,
      longitude: 73.8742,
      phone: '+912066455100',
      hasEmergency: true,
      departments: ['Cardiology', 'Neurology', 'Orthopedics', 'General Medicine', 'Emergency Trauma'],
      facilities: ['24x7 ER', 'ICU', 'Advanced Cath Lab', 'Pharmacy', 'Ambulance Hub'],
    },
    {
      name: 'Sahyadri Super Speciality Hospital',
      address: 'Plot No. 30 C, Erandwane, Karve Road',
      city: 'Pune',
      state: 'Maharashtra',
      pinCode: '411004',
      latitude: 18.5089,
      longitude: 73.8344,
      phone: '+912067213000',
      hasEmergency: true,
      departments: ['Neurosciences', 'Orthopedics', 'Cardiology', 'Pediatrics'],
      facilities: ['Trauma Center', 'Blood Bank', 'Dialysis Unit', 'CT/MRI Scan'],
    },
    {
      name: 'Jupiter Hospital',
      address: 'Near Balewadi Stadium, Baner',
      city: 'Pune',
      state: 'Maharashtra',
      pinCode: '411045',
      latitude: 18.5793,
      longitude: 73.7667,
      phone: '+912027992799',
      hasEmergency: true,
      departments: ['Oncology', 'Cardiology', 'Gastroenterology', 'General Surgery'],
      facilities: ['Robotic Surgery', '24x7 Emergency', 'Multi-organ Transplant'],
    },
    {
      name: 'Surya Mother & Child Care Hospital',
      address: 'Wakdewadi, Shivajinagar',
      city: 'Pune',
      state: 'Maharashtra',
      pinCode: '411005',
      latitude: 18.5362,
      longitude: 73.8528,
      phone: '+912067425555',
      hasEmergency: true,
      departments: ['Pediatrics', 'Neonatology', 'Gynecology & Obstetrics'],
      facilities: ['Level 3 NICU', 'Pediatric ICU', 'Maternity Suite'],
    },
  ];

  const hospitals = [];
  for (const h of hospitalsData) {
    const existing = await prisma.hospital.findFirst({ where: { name: h.name } });
    if (existing) {
      hospitals.push(existing);
    } else {
      const created = await prisma.hospital.create({ data: h });
      hospitals.push(created);
    }
  }

  // 3. Doctors (8 Specialists)
  const doctorsData = [
    {
      phone: '+919822011111',
      fullName: 'Vikramaditya Sharma',
      registrationNumber: 'MCI-2012-88492',
      specializations: ['Cardiology', 'Interventional Cardiology'],
      experienceYears: 16,
      bio: 'Senior Interventional Cardiologist specializing in coronary angioplasty, heart failure management, and preventive cardiac wellness.',
      languages: ['English', 'Hindi', 'Marathi'],
      fee: 1000,
      hospitalIdx: 0,
    },
    {
      phone: '+919822022222',
      fullName: 'Ananya Deshmukh',
      registrationNumber: 'MMC-2015-34190',
      specializations: ['Pediatrics', 'Neonatology'],
      experienceYears: 10,
      bio: 'Dedicated Pediatrician with extensive experience in child development, immunizations, and critical pediatric care.',
      languages: ['English', 'Hindi', 'Marathi'],
      fee: 700,
      hospitalIdx: 3,
    },
    {
      phone: '+919822033333',
      fullName: 'Rajesh Kulkarni',
      registrationNumber: 'MMC-2008-11204',
      specializations: ['General Physician', 'Internal Medicine'],
      experienceYears: 18,
      bio: 'Senior Consultant Physician providing holistic adult healthcare, diabetic management, hypertension care, and seasonal infections.',
      languages: ['English', 'Hindi', 'Marathi'],
      fee: 500,
      hospitalIdx: 1,
    },
    {
      phone: '+919822044444',
      fullName: 'Pooja Iyer',
      registrationNumber: 'MCI-2016-55910',
      specializations: ['Dermatology', 'Cosmetology'],
      experienceYears: 8,
      bio: 'Consultant Dermatologist specializing in clinical dermatology, skin allergies, hair restoration, and laser treatments.',
      languages: ['English', 'Hindi'],
      fee: 800,
      hospitalIdx: 2,
    },
    {
      phone: '+919822055555',
      fullName: 'Siddharth Joshi',
      registrationNumber: 'MMC-2010-98311',
      specializations: ['Orthopedics', 'Joint Replacement'],
      experienceYears: 14,
      bio: 'Orthopedic Surgeon specializing in knee & hip arthroplasty, sports injury rehabilitation, and arthroscopic surgeries.',
      languages: ['English', 'Hindi', 'Marathi'],
      fee: 900,
      hospitalIdx: 0,
    },
    {
      phone: '+919822066666',
      fullName: 'Meera Patil',
      registrationNumber: 'MMC-2014-47812',
      specializations: ['Gynecology', 'Obstetrics'],
      experienceYears: 12,
      bio: 'Senior Obstetrician and Gynecologist offering comprehensive prenatal care, high-risk pregnancy care, and laparoscopic surgeries.',
      languages: ['English', 'Hindi', 'Marathi'],
      fee: 850,
      hospitalIdx: 3,
    },
    {
      phone: '+919822077777',
      fullName: 'Sameer Nambiar',
      registrationNumber: 'MCI-2011-60291',
      specializations: ['Neurology'],
      experienceYears: 15,
      bio: 'Neurologist with super-speciality expertise in stroke management, epilepsy, Parkinson disease, and migraine disorders.',
      languages: ['English', 'Hindi'],
      fee: 1200,
      hospitalIdx: 1,
    },
    {
      phone: '+919822088888',
      fullName: 'Sunita Rao',
      registrationNumber: 'MMC-2017-71023',
      specializations: ['ENT', 'Otorhinolaryngology'],
      experienceYears: 9,
      bio: 'ENT Surgeon specialized in endoscopic sinus surgery, hearing loss treatments, pediatric ENT, and allergic rhinitis.',
      languages: ['English', 'Hindi', 'Marathi'],
      fee: 650,
      hospitalIdx: 2,
    },
  ];

  const doctors = [];
  for (const d of doctorsData) {
    let user = await prisma.user.findUnique({ where: { phone: d.phone } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: d.phone,
          role: UserRole.DOCTOR,
          password: passwordHash,
        },
      });
    }

    let doctor = await prisma.doctor.findUnique({ where: { userId: user.id } });
    if (!doctor) {
      doctor = await prisma.doctor.create({
        data: {
          userId: user.id,
          fullName: d.fullName,
          registrationNumber: d.registrationNumber,
          experienceYears: d.experienceYears,
          bio: d.bio,
          specializations: d.specializations,
          languages: d.languages,
          isAvailable: true,
        },
      });
    }

    // Affiliation
    const hospital = hospitals[d.hospitalIdx];
    await prisma.doctorHospitalAffiliation.upsert({
      where: { doctorId_hospitalId: { doctorId: doctor.id, hospitalId: hospital.id } },
      update: { consultationFee: d.fee },
      create: {
        doctorId: doctor.id,
        hospitalId: hospital.id,
        consultationFee: d.fee,
      },
    });

    // Schedule Monday-Saturday
    for (const day of [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY]) {
      const existingSched = await prisma.doctorSchedule.findFirst({
        where: { doctorId: doctor.id, hospitalId: hospital.id, dayOfWeek: day },
      });
      if (!existingSched) {
        await prisma.doctorSchedule.create({
          data: {
            doctorId: doctor.id,
            hospitalId: hospital.id,
            dayOfWeek: day,
            startTime: '09:00',
            endTime: '17:00',
            slotDurationMinutes: 15,
          },
        });
      }
    }

    // Breaks
    const existingBreak = await prisma.doctorBreak.findFirst({
      where: { doctorId: doctor.id, hospitalId: hospital.id },
    });
    if (!existingBreak) {
      await prisma.doctorBreak.create({
        data: {
          doctorId: doctor.id,
          hospitalId: hospital.id,
          startTime: '13:00',
          endTime: '14:00',
        },
      });
    }

    doctors.push(doctor);
  }

  // 4. Patients
  const patientsData = [
    {
      phone: '+919811100001',
      fullName: 'Aarav Mehta',
      gender: Gender.MALE,
      bloodGroup: BloodGroup.O_POSITIVE,
      knownAllergies: 'Penicillin, Sulfa drugs',
      existingConditions: ['Mild Asthma', 'Hypertension'],
      emergencyContactName: 'Sneha Mehta (Wife)',
      emergencyContactPhone: '+919811100002',
    },
    {
      phone: '+919811100003',
      fullName: 'Priyanka Kadam',
      gender: Gender.FEMALE,
      bloodGroup: BloodGroup.B_POSITIVE,
      knownAllergies: 'Dust, Pollen',
      existingConditions: ['Type 2 Diabetes'],
      emergencyContactName: 'Mahesh Kadam (Brother)',
      emergencyContactPhone: '+919811100004',
    },
    {
      phone: '+919811100005',
      fullName: 'Rohan Gupta',
      gender: Gender.MALE,
      bloodGroup: BloodGroup.A_POSITIVE,
      knownAllergies: 'Peanuts',
      existingConditions: [],
      emergencyContactName: 'Anita Gupta (Mother)',
      emergencyContactPhone: '+919811100006',
    },
  ];

  const patients = [];
  for (const p of patientsData) {
    let user = await prisma.user.findUnique({ where: { phone: p.phone } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: p.phone,
          role: UserRole.PATIENT,
          password: passwordHash,
        },
      });
    }

    let patient = await prisma.patient.findUnique({ where: { userId: user.id } });
    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          userId: user.id,
          fullName: p.fullName,
          gender: p.gender,
          bloodGroup: p.bloodGroup,
          knownAllergies: p.knownAllergies,
          existingConditions: p.existingConditions,
          emergencyContactName: p.emergencyContactName,
          emergencyContactPhone: p.emergencyContactPhone,
        },
      });
    }
    patients.push(patient);
  }

  // 5. Receptionists
  for (let i = 0; i < 3; i++) {
    const phone = `+91983330000${i + 1}`;
    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
          role: UserRole.RECEPTIONIST,
          password: passwordHash,
        },
      });
    }

    const hospital = hospitals[i];
    await prisma.receptionist.upsert({
      where: { userId: user.id },
      update: { hospitalId: hospital.id },
      create: { userId: user.id, hospitalId: hospital.id },
    });
  }

  // 6. Ambulance Operators
  const ambulanceData = [
    { phone: '+919844400001', vehicleNumber: 'MH-12-AM-1001', lat: 18.5308, lng: 73.8742 },
    { phone: '+919844400002', vehicleNumber: 'MH-12-AM-1002', lat: 18.5089, lng: 73.8344 },
    { phone: '+919844400003', vehicleNumber: 'MH-12-AM-1003', lat: 18.5793, lng: 73.7667 },
  ];

  const ambulances = [];
  for (const a of ambulanceData) {
    let user = await prisma.user.findUnique({ where: { phone: a.phone } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: a.phone,
          role: UserRole.AMBULANCE_OPERATOR,
          password: passwordHash,
        },
      });
    }

    const op = await prisma.ambulanceOperator.upsert({
      where: { userId: user.id },
      update: { vehicleNumber: a.vehicleNumber },
      create: {
        userId: user.id,
        vehicleNumber: a.vehicleNumber,
        currentStatus: AmbulanceStatus.AVAILABLE,
        latitude: a.lat,
        longitude: a.lng,
      },
    });
    ambulances.push(op);
  }

  // 7. Slots & Appointments for Today
  const today = new Date();
  const todayOnly = new Date(today.toISOString().split('T')[0]);
  const doctor = doctors[0]; // Dr. Vikramaditya Sharma
  const hospital = hospitals[0]; // Ruby Hall Clinic
  const patient = patients[0]; // Aarav Mehta

  const slotTimes = ['09:30', '10:00', '10:30', '11:00', '11:30', '14:30', '15:00'];

  for (let idx = 0; idx < slotTimes.length; idx++) {
    const st = slotTimes[idx];
    const et = `${st.split(':')[0]}:${Number(st.split(':')[1]) + 15}`;

    const slot = await prisma.slot.upsert({
      where: {
        doctorId_hospitalId_date_startTime: {
          doctorId: doctor.id,
          hospitalId: hospital.id,
          date: todayOnly,
          startTime: st,
        },
      },
      update: {},
      create: {
        doctorId: doctor.id,
        hospitalId: hospital.id,
        date: todayOnly,
        startTime: st,
        endTime: et,
        status: idx === 0 ? SlotStatus.BOOKED : SlotStatus.AVAILABLE,
      },
    });

    // Create 1 appointment for today
    if (idx === 0) {
      const aptId = `HS-APT-${todayOnly.toISOString().split('T')[0].replace(/-/g, '')}-1001`;
      const existingApt = await prisma.appointment.findUnique({ where: { appointmentId: aptId } });
      if (!existingApt) {
        const apt = await prisma.appointment.create({
          data: {
            appointmentId: aptId,
            patientId: patient.id,
            doctorId: doctor.id,
            hospitalId: hospital.id,
            slotId: slot.id,
            date: todayOnly,
            startTime: st,
            endTime: et,
            status: AppointmentStatus.CONFIRMED,
            checkedInAt: new Date(),
            reasonForVisit: 'Routine cardiac follow-up and blood pressure assessment',
          },
        });

        // Add Consultation & Prescription
        const consult = await prisma.consultation.create({
          data: {
            appointmentId: apt.id,
            doctorId: doctor.id,
            patientId: patient.id,
            symptoms: ['Mild shortness of breath', 'Chest heaviness on exertion'],
            diagnosis: 'Stage 1 Essential Hypertension with mild dyspnea',
            observations: 'BP: 138/88 mmHg, Heart Sounds: S1/S2 present, no murmurs. Lungs clear.',
            advice: 'Low-sodium DASH diet, 30 mins brisk walking daily, maintain blood pressure diary.',
            followUpRecommended: true,
            followUpDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            isFinalized: true,
          },
        });

        await prisma.prescription.create({
          data: {
            consultationId: consult.id,
            doctorId: doctor.id,
            patientId: patient.id,
            items: {
              create: [
                {
                  medicineName: 'Telmisartan',
                  dosage: '40mg',
                  form: MedicineForm.TABLET,
                  frequency: 'Once daily (morning)',
                  timing: MedicineTiming.BEFORE_FOOD,
                  duration: '30 days',
                  specialInstructions: 'Take with full glass of water',
                },
                {
                  medicineName: 'Amlodipine',
                  dosage: '5mg',
                  form: MedicineForm.TABLET,
                  frequency: 'Once daily (night)',
                  timing: MedicineTiming.AFTER_FOOD,
                  duration: '30 days',
                },
              ],
            },
          },
        });

        // Add Medicine Reminders
        await prisma.medicineReminder.createMany({
          data: [
            {
              patientId: patient.id,
              medicineName: 'Telmisartan (40mg)',
              dosage: '1 Tablet',
              frequency: 'Daily',
              times: ['08:30'],
              startDate: todayOnly,
              instructions: 'BEFORE_FOOD',
            },
            {
              patientId: patient.id,
              medicineName: 'Amlodipine (5mg)',
              dosage: '1 Tablet',
              frequency: 'Daily',
              times: ['21:30'],
              startDate: todayOnly,
              instructions: 'AFTER_FOOD',
            },
          ],
        });

        // Add Medical Record
        await prisma.medicalRecord.create({
          data: {
            patientId: patient.id,
            type: MedicalRecordType.PRESCRIPTION,
            fileName: 'Prescription - Dr. Vikramaditya Sharma (Cardiology)',
            fileUrl: '',
            category: 'Cardiology Prescription',
            notes: 'Diagnosed Stage 1 Hypertension with DASH diet recommendation',
            uploadedBy: doctor.id,
          },
        });
      }
    }
  }

  // 8. Test Emergency Record
  const emgId = `HS-EMR-${todayOnly.toISOString().split('T')[0].replace(/-/g, '')}-9901`;
  const existingEmg = await prisma.emergency.findUnique({ where: { emergencyId: emgId } });
  if (!existingEmg) {
    const emg = await prisma.emergency.create({
      data: {
        emergencyId: emgId,
        patientId: patient.id,
        hospitalId: hospital.id,
        ambulanceOperatorId: ambulances[0].id,
        status: EmergencyStatus.AMBULANCE_ASSIGNED,
        initialLatitude: 18.5204,
        initialLongitude: 73.8567,
        locationTrails: {
          create: [
            {
              source: LocationSource.PATIENT,
              latitude: 18.5204,
              longitude: 73.8567,
              accuracy: 10,
            },
          ],
        },
        statusHistories: {
          create: [
            {
              status: EmergencyStatus.INITIATED,
              updatedBy: 'SYSTEM',
              notes: 'Patient triggered Emergency SOS from mobile app',
            },
            {
              status: EmergencyStatus.ACKNOWLEDGED,
              updatedBy: 'SYSTEM',
              notes: 'Hospital emergency desk acknowledged alert',
            },
            {
              status: EmergencyStatus.AMBULANCE_ASSIGNED,
              updatedBy: 'SYSTEM',
              notes: `Assigned ambulance unit ${ambulances[0].vehicleNumber}`,
            },
          ],
        },
      },
    });
  }

  console.log('✅ Seed completed successfully!');
  console.log('----------------------------------------------------');
  console.log('Demo Credentials for Testing:');
  console.log('  Patient:        +919811100001 (OTP or HealthSync@123)');
  console.log('  Doctor:         +919822011111 (Password: HealthSync@123)');
  console.log('  Receptionist:   +919833300001 (Password: HealthSync@123)');
  console.log('  Ambulance:      +919844400001 (Password: HealthSync@123)');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
