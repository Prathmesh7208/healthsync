import prisma from '../utils/prisma';
import logger from '../utils/logger';
import NotificationService from '../services/notification.service';
import { NotificationType } from '@prisma/client';

export class ReminderService {
  /**
   * Process medication reminders for the current minute
   */
  public static async processMedicineReminders() {
    try {
      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMins = now.getMinutes().toString().padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMins}`;

      // Find active reminders
      const reminders = await prisma.medicineReminder.findMany({
        where: {
          isActive: true,
          startDate: { lte: now },
          OR: [{ endDate: null }, { endDate: { gte: now } }],
        },
        include: { patient: { include: { user: true } } },
      });

      for (const r of reminders) {
        const times = Array.isArray(r.times) ? (r.times as string[]) : [];
        if (times.includes(currentTimeStr)) {
          await NotificationService.send({
            userId: r.patient.userId,
            type: NotificationType.REMINDER,
            title: '💊 Medication Reminder',
            body: `Time to take your scheduled dose: ${r.medicineName} (${r.dosage}) - ${r.instructions || 'as prescribed'}.`,
            data: { reminderId: r.id, medicineName: r.medicineName },
          });
          logger.info(`Dispatched medication reminder for ${r.patient.fullName} (${r.medicineName})`);
        }
      }
    } catch (err) {
      logger.error('Error processing medicine reminders:', err);
    }
  }

  /**
   * Process appointment reminder 1 hour prior
   */
  public static async processAppointmentReminders() {
    try {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      const targetHours = oneHourLater.getHours().toString().padStart(2, '0');
      const targetMins = oneHourLater.getMinutes().toString().padStart(2, '0');
      const targetTimeStr = `${targetHours}:${targetMins}`;
      const dateOnly = new Date(now.toISOString().split('T')[0]);

      const upcomingApts = await prisma.appointment.findMany({
        where: {
          date: dateOnly,
          startTime: targetTimeStr,
          status: 'CONFIRMED',
        },
        include: { patient: true, doctor: true, hospital: true },
      });

      for (const apt of upcomingApts) {
        await NotificationService.send({
          userId: apt.patient.userId,
          type: NotificationType.APPOINTMENT,
          title: '🗓️ Upcoming Consultation in 1 Hour',
          body: `Your consultation with Dr. ${apt.doctor.fullName} at ${apt.hospital.name} is scheduled for ${apt.startTime}.`,
          data: { appointmentId: apt.id },
        });
      }
    } catch (err) {
      logger.error('Error processing appointment reminders:', err);
    }
  }

  /**
   * Start interval worker loop
   */
  public static startWorker() {
    logger.info('⏰ Starting HealthSync Background Reminder Worker...');
    // Run every minute
    setInterval(async () => {
      await ReminderService.processMedicineReminders();
      await ReminderService.processAppointmentReminders();
    }, 60000);
  }
}

export default ReminderService;
