import { useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { useNotification } from '../context/NotificationContext';

export function useSocketNotifications() {
  const { socket } = useAuth();
  const { addNotification } = useNotification();

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleStockAlert = (data) => {
      addNotification({
        type: 'warning',
        title: 'Stock Alert',
        message: data.message,
        duration: 7000
      });
    };

    const handleStockUpdated = (data) => {
      addNotification({
        type: 'success',
        title: 'Stock Updated',
        message: data.medicine?.name ? `${data.medicine.name} stock has been updated` : 'Stock has been updated',
        duration: 5000
      });
    };

    const handlePrescriptionCreated = (data) => {
      addNotification({
        type: 'info',
        title: 'New Prescription',
        message: `Prescription received for pharmacy`,
        duration: 5000
      });
    };

    const handleOrderUpdated = (data) => {
      addNotification({
        type: 'info',
        title: 'Order Updated',
        message: data.message || 'Order status has been updated',
        duration: 5000
      });
    };

    const handleOrderReady = (data) => {
      addNotification({
        type: 'success',
        title: 'Order Ready',
        message: data.message || 'Your order is ready for pickup or delivery',
        duration: 8000
      });
    };

    const handlePrescriptionUpdated = (data) => {
      addNotification({
        type: data.status === 'rejected' ? 'warning' : 'success',
        title: 'Prescription Updated',
        message: data.status ? `Your prescription is now ${data.status}` : 'Your prescription status has changed',
        duration: 6000
      });
    };

    const handleMessageCreated = () => {
      addNotification({
        type: 'info',
        title: 'New Message',
        message: 'You have a new message from the pharmacy',
        duration: 6000
      });
    };

    socket.on('stock:alert', handleStockAlert);
    socket.on('stock:updated', handleStockUpdated);
    socket.on('prescription:created', handlePrescriptionCreated);
    socket.on('prescription:updated', handlePrescriptionUpdated);
    socket.on('message:created', handleMessageCreated);
    socket.on('order:updated', handleOrderUpdated);
    socket.on('order:ready', handleOrderReady);

    return () => {
      socket.off('stock:alert', handleStockAlert);
      socket.off('stock:updated', handleStockUpdated);
      socket.off('prescription:created', handlePrescriptionCreated);
      socket.off('prescription:updated', handlePrescriptionUpdated);
      socket.off('message:created', handleMessageCreated);
      socket.off('order:updated', handleOrderUpdated);
      socket.off('order:ready', handleOrderReady);
    };
  }, [socket, addNotification]);
}
