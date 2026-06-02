import { useEffect } from 'react';

export function useSocketFeed(socket, roomType, roomId, onUpdate) {
  useEffect(() => {
    const resolvedRoomId = roomId || socket?.auth?.userId;

    if (!socket || !resolvedRoomId) {
      return undefined;
    }

    const joinEvent = roomType === 'patient' ? 'join:patient' : 'join:pharmacy';
    const joinRoom = () => socket.emit(joinEvent, resolvedRoomId);

    joinRoom();
    socket.on('connect', joinRoom);

    const handlers = ['prescription:created', 'prescription:updated', 'order:updated', 'message:created', 'stock:updated', 'stock:alert'];
    handlers.forEach((eventName) => socket.on(eventName, onUpdate));

    return () => {
      socket.off('connect', joinRoom);
      handlers.forEach((eventName) => socket.off(eventName, onUpdate));
    };
  }, [socket, roomType, roomId, onUpdate]);
}
