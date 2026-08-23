import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import logger from '../utils/logger';

export interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    phone: string;
    role: string;
  };
}

export function setupSocketIO(io: SocketIOServer) {
  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      // Allow anonymous connection for public doctor board updates if needed, or authenticate
      return next();
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as { id: string; phone: string; role: string };
      socket.user = decoded;
      next();
    } catch (err) {
      logger.warn('Socket authentication failed:', err);
      next();
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`Socket connected: ${socket.id} (User: ${socket.user?.id || 'anonymous'})`);

    // Auto-join personal user room if authenticated
    if (socket.user?.id) {
      socket.join(`user:${socket.user.id}`);
      logger.info(`Socket ${socket.id} joined personal room user:${socket.user.id}`);
    }

    // Join Hospital Room
    socket.on('hospital:join', (hospitalId: string) => {
      if (hospitalId) {
        socket.join(`hospital:${hospitalId}`);
        logger.info(`Socket ${socket.id} joined hospital room hospital:${hospitalId}`);
      }
    });

    // Join Doctor Room
    socket.on('doctor:join', (doctorId: string) => {
      if (doctorId) {
        socket.join(`doctor:${doctorId}`);
        logger.info(`Socket ${socket.id} joined doctor room doctor:${doctorId}`);
      }
    });

    // Join Emergency Live Tracking Room
    socket.on('emergency:join', (emergencyId: string) => {
      if (emergencyId) {
        socket.join(`emergency:${emergencyId}`);
        logger.info(`Socket ${socket.id} joined emergency room emergency:${emergencyId}`);
      }
    });

    // Leave Emergency Room
    socket.on('emergency:leave', (emergencyId: string) => {
      if (emergencyId) {
        socket.leave(`emergency:${emergencyId}`);
        logger.info(`Socket ${socket.id} left emergency room emergency:${emergencyId}`);
      }
    });

    // Live GPS Location update relay
    socket.on('emergency:location-relay', (payload: { emergencyId: string; latitude: number; longitude: number; speed?: number; heading?: number; source: string }) => {
      if (payload.emergencyId) {
        socket.to(`emergency:${payload.emergencyId}`).emit('emergency:location-updated', payload);
      }
    });

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} (Reason: ${reason})`);
    });
  });
}
