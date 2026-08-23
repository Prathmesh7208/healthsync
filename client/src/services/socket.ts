import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (token?: string | null): Socket => {
  if (!socket) {
    const socketUrl =
      import.meta.env.VITE_API_URL ||
      (typeof window !== 'undefined' && window.location.origin.includes('onrender.com')
        ? window.location.origin.replace('-client', '-api')
        : window.location.origin);

    socket = io(socketUrl, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      console.log('⚡ Socket.io connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket.io disconnected:', reason);
    });
  } else if (token && !socket.connected) {
    socket.auth = { token };
    socket.connect();
  }

  return socket;
};

export const joinRoom = (room: string) => {
  if (socket?.connected) {
    socket.emit(`${room}:join`);
  }
};

export const leaveRoom = (room: string) => {
  if (socket?.connected) {
    socket.emit(`${room}:leave`);
  }
};

export default getSocket;
