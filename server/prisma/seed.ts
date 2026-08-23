import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning up database and ensuring fresh state with Admin account only...');

  // Delete all dummy data across relations in proper dependency order
  await prisma.emergencyLocationTrail.deleteMany({});
  await prisma.emergencyStatusHistory.deleteMany({});
  await prisma.emergency.deleteMany({});
  await prisma.prescriptionItem.deleteMany({});
  await prisma.prescription.deleteMany({});
  await prisma.consultation.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.slot.deleteMany({});
  await prisma.doctorBreak.deleteMany({});
  await prisma.doctorSchedule.deleteMany({});
  await prisma.doctorHospitalAffiliation.deleteMany({});
  await prisma.medicineReminder.deleteMany({});
  await prisma.medicalRecord.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.ambulanceOperator.deleteMany({});
  await prisma.receptionist.deleteMany({});
  await prisma.doctor.deleteMany({});
  await prisma.patient.deleteMany({});

  // Keep only admin or recreate master admin
  await prisma.user.deleteMany({
    where: {
      NOT: { role: UserRole.ADMIN },
    },
  });

  const passwordHash = await bcrypt.hash('HealthSync@123', 10);

  // Upsert Master Admin Account
  const adminUser = await prisma.user.upsert({
    where: { phone: '+919999999999' },
    update: {
      role: UserRole.ADMIN,
      password: passwordHash,
    },
    create: {
      phone: '+919999999999',
      role: UserRole.ADMIN,
      password: passwordHash,
    },
  });

  console.log('✅ Clean database ready! Only Master Admin account configured:');
  console.log('   Phone:    +919999999999');
  console.log('   Password: HealthSync@123 (or 123456)');
}

main()
  .catch((e) => {
    console.error('Seed cleanup error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
