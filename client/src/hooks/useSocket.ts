import { useEffect } from 'react';
import getSocket from '../services/socket';
import useAuthStore from '../stores/authStore';

export const useSocketEvent = (event: string, callback: (...args: any[]) => void) => {
  const { token } = useAuthStore();

  useEffect(() => {
    const socket = getSocket(token);

    socket.on(event, callback);

    return () => {
      socket.off(event, callback);
    };
  }, [event, callback, token]);
};

export default useSocketEvent;
