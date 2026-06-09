import { useEffect, useRef } from 'react';
import { getToken } from '../lib/api';

export function useSocketFeed(socket, roomType, roomId, onUpdate) {
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!socket || !roomId) {
      return undefined;
    }

    const token = getToken();
    const normalizedRoomId = String(roomId);

    const joinRoom = () => {
      if (!token) return;
      if (roomType === 'patient') {
        socket.emit('join:patient', { token, patientId: normalizedRoomId });
      } else {
        socket.emit('join:pharmacy', { token, pharmacyId: normalizedRoomId });
      }
    };

    const handleUpdate = () => {
      onUpdateRef.current?.();
    };

    joinRoom();
    socket.on('connect', joinRoom);

    const handlers = ['prescription:created', 'prescription:updated', 'order:updated', 'message:created', 'stock:updated', 'stock:alert'];
    handlers.forEach((eventName) => socket.on(eventName, handleUpdate));

    return () => {
      socket.off('connect', joinRoom);
      handlers.forEach((eventName) => socket.off(eventName, handleUpdate));
    };
  }, [socket, roomType, roomId]);
}
