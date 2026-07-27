import 'package:healthsync_mobile/features/patient/domain/entities/patient_profile.dart';
import 'package:healthsync_mobile/features/doctor/domain/entities/doctor_profile.dart';
import 'package:healthsync_mobile/core/domain/entities/appointment.dart';
import 'package:healthsync_mobile/features/patient/domain/entities/prescription.dart';
import 'package:healthsync_mobile/core/domain/entities/user.dart';

class MockRepository {
  static final patient = PatientProfile(
    id: 'p1',
    fullName: 'Rajesh Kumar',
    mobileNumber: '9876543210',
    role: UserRole.patient,
    healthSyncId: 'HS-2026-A3K9M2',
    dob: DateTime(1990, 5, 15),
    gender: 'Male',
    bloodGroup: 'O+',
  );

  static final doctor = DoctorProfile(
    id: 'd1',
    fullName: 'Dr. Amit Shah',
    mobileNumber: '9988776655',
    role: UserRole.doctor,
    specialization: 'Orthopedics',
    qualifications: 'MBBS, MD',
    experienceYears: 12,
    consultationFee: 500,
    registrationNumber: 'AMC-12345',
    languages: const ['English', 'Hindi', 'Marathi'],
    isVerified: true,
  );

  static final appointments = [
    Appointment(
      id: 'a1',
      patientId: 'p1',
      patientName: 'Rajesh Kumar',
      doctorId: 'd1',
      doctorName: 'Dr. Amit Shah',
      clinicId: 'c1',
      dateTime: DateTime.now().add(const Duration(days: 1, hours: 2)),
      status: AppointmentStatus.confirmed,
      tokenNumber: '13',
    ),
  ];

  static final prescriptions = [
    Prescription(
      id: 'pr1',
      patientId: 'p1',
      doctorId: 'd1',
      doctorName: 'Dr. Amit Shah',
      diagnosis: 'Acute Low Back Pain',
      date: DateTime.now().subtract(const Duration(days: 5)),
      medications: const [
        Medication(
          name: 'Naproxen 500mg',
          dosage: '1 tablet',
          frequency: 'Twice daily',
          duration: '5 days',
          timing: 'After meals',
          notes: 'Take with food to avoid stomach upset',
        ),
        Medication(
          name: 'Cyclobenzaprine 5mg',
          dosage: '1 tablet',
          frequency: 'Once at night',
          duration: '3 days',
          timing: 'Before bed',
          notes: 'May cause drowsiness',
        ),
      ],
      instructions:
          'Avoid heavy lifting for 1 week. Apply heat pack 3 times a day.',
      follow_up_date: DateTime.now().add(const Duration(days: 7)),
    ),
  ];
}
