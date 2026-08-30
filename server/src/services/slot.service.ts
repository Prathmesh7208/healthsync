import { SlotStatus, DayOfWeek } from '@prisma/client';
import prisma from '../utils/prisma';

export interface GeneratedSlot {
  id?: string;
  startTime: string;
  endTime: string;
  status: SlotStatus;
}

export class SlotService {
  /**
   * Helper to convert JS day index (0=Sun, 1=Mon, ..., 6=Sat) to Prisma DayOfWeek enum
   */
  static getDayOfWeekEnum(dayIndex: number): DayOfWeek {
    const days: DayOfWeek[] = [
      DayOfWeek.SUNDAY,
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ];
    return days[dayIndex];
  }

  /**
   * Convert "HH:mm" to minutes from midnight
   */
  static timeToMinutes(timeStr: string): number {
    const [h, m] = timeStr.split(':').map((x) => parseInt(x, 10));
    return h * 60 + m;
  }

  /**
   * Convert minutes from midnight to "HH:mm"
   */
  static minutesToTime(mins: number): string {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  /**
   * Core function to generate or query slots for a doctor on a specific date & location
   */
  static async getSlotsForDate(
    doctorId: string,
    hospitalId: string,
    targetDate: Date
  ): Promise<GeneratedSlot[]> {
    const dayOfWeek = this.getDayOfWeekEnum(targetDate.getDay());
    const dateOnly = new Date(targetDate.toISOString().split('T')[0]);

    // 1. Fetch Doctor's custom schedule for this day of week & location
    const schedule = await prisma.doctorSchedule.findFirst({
      where: {
        doctorId,
        hospitalId,
        dayOfWeek,
      },
    });

    // If explicit schedule exists and is disabled
    if (schedule && !schedule.isActive) {
      return [];
    }

    // Default clinic hours if no explicit schedule defined:
    // Mon-Sat: 09:00 - 17:00, 30 min slots. Sunday: Closed.
    let startTime = '09:00';
    let endTime = '17:00';
    let duration = 30;

    if (schedule) {
      startTime = schedule.startTime;
      endTime = schedule.endTime;
      duration = schedule.slotDurationMinutes || 30;
    } else {
      if (dayOfWeek === DayOfWeek.SUNDAY) {
        return []; // Closed on Sunday by default
      }
    }

    // 2. Fetch breaks for this doctor on this day/date
    const breaks = await prisma.doctorBreak.findMany({
      where: {
        doctorId,
        hospitalId,
        OR: [{ dayOfWeek }, { specificDate: dateOnly }],
      },
    });

    // Default lunch break 13:00 - 14:00 if no breaks configured
    const defaultLunchBreak = breaks.length === 0 ? [{ startTime: '13:00', endTime: '14:00' }] : [];

    // 3. Fetch existing appointments for this doctor on this date
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        hospitalId,
        date: dateOnly,
        status: { in: ['BOOKED', 'CONFIRMED', 'IN_PROGRESS'] },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    const bookedTimes = new Set(existingAppointments.map((a) => a.startTime));

    // 4. Generate slots in intervals
    const startMins = this.timeToMinutes(startTime);
    const endMins = this.timeToMinutes(endTime);

    const slots: GeneratedSlot[] = [];

    // Current time check if targetDate is today
    const now = new Date();
    const isToday =
      now.toISOString().split('T')[0] === targetDate.toISOString().split('T')[0];
    const currentMins = now.getHours() * 60 + now.getMinutes();

    for (let cur = startMins; cur + duration <= endMins; cur += duration) {
      const slotStart = this.minutesToTime(cur);
      const slotEnd = this.minutesToTime(cur + duration);

      // Check if slot falls in custom or default break
      const isBreak =
        breaks.some((b) => {
          const bStart = this.timeToMinutes(b.startTime);
          const bEnd = this.timeToMinutes(b.endTime);
          return cur >= bStart && cur < bEnd;
        }) ||
        defaultLunchBreak.some((b) => {
          const bStart = this.timeToMinutes(b.startTime);
          const bEnd = this.timeToMinutes(b.endTime);
          return cur >= bStart && cur < bEnd;
        });

      let status: SlotStatus = SlotStatus.AVAILABLE;

      if (isBreak) {
        status = SlotStatus.UNAVAILABLE;
      } else if (bookedTimes.has(slotStart)) {
        status = SlotStatus.BOOKED;
      } else if (isToday && cur <= currentMins) {
        status = SlotStatus.UNAVAILABLE; // Past slot for today
      }

      slots.push({
        startTime: slotStart,
        endTime: slotEnd,
        status,
      });
    }

    return slots;
  }
}

export default SlotService;
