import { useEffect } from 'react';

export function useSocketFeed(socket, roomType, roomId, onUpdate) {
  useEffect(() => {
    if (!socket || !roomId) {
      return undefined;
    }

    const joinEvent = roomType === 'patient' ? 'join:patient' : 'join:pharmacy';
    socket.emit(joinEvent, roomId);

    const handlers = ['prescription:created', 'prescription:updated', 'order:updated', 'message:created'];
    handlers.forEach((eventName) => socket.on(eventName, onUpdate));

    return () => {
      handlers.forEach((eventName) => socket.off(eventName, onUpdate));
    };
  }, [socket, roomType, roomId, onUpdate]);
}
