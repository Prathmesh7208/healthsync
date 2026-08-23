import { NotificationType, NotificationChannel, NotificationStatus } from '@prisma/client';
import prisma from '../utils/prisma';
import logger from '../utils/logger';
import { io } from '../server';

export interface SendNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  channel?: NotificationChannel;
}

export class NotificationService {
  /**
   * Save notification to DB and emit in real-time via Socket.io
   */
  static async send(input: SendNotificationInput) {
    try {
      const notif = await prisma.notification.create({
        data: {
          userId: input.userId,
          type: input.type,
          title: input.title,
          body: input.body,
          data: input.data || {},
          channel: input.channel || NotificationChannel.IN_APP,
          status: NotificationStatus.SENT,
          sentAt: new Date(),
        },
      });

      // Real-time broadcast if socket server is initialized
      if (io) {
        io.to(`user:${input.userId}`).emit('notification:new', notif);
      }

      logger.info(`Notification sent to User ${input.userId}: [${input.type}] ${input.title}`);
      return notif;
    } catch (err: any) {
      logger.error('Failed to create notification', { error: err.message });
    }
  }
}

export default NotificationService;
