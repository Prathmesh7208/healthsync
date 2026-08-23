import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import config from './config';
import logger from './utils/logger';
import prisma from './utils/prisma';
import redis from './utils/redis';

const server = http.createServer(app);

import { setupSocketIO } from './socket';

export const io = new SocketIOServer(server, {
  cors: {
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST'],
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});

setupSocketIO(io);

import ReminderService from './jobs/reminder.worker';

export const startServer = () => {
  server.listen(config.port, () => {
    logger.info(`🚀 HealthSync Server running on http://localhost:${config.port} [${config.env}]`);
    ReminderService.startWorker();
  });

  const gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    server.close(async () => {
      logger.info('HTTP server closed.');
      try {
        await prisma.$disconnect();
        logger.info('Prisma disconnected.');
        if (redis && redis.status === 'ready') {
          await redis.quit();
          logger.info('Redis disconnected.');
        }
        process.exit(0);
      } catch (err) {
        logger.error('Error during shutdown:', err);
        process.exit(1);
      }
    });

    // Force exit if not closed within 10 seconds
    setTimeout(() => {
      logger.error('Forcing shutdown after 10s timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  return server;
};

export default server;
