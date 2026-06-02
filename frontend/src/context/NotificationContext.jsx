import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = `${Date.now()}-${Math.random()}`;
    const toast = {
      id,
      type: 'info',
      duration: 5000,
      ...notification
    };

    setToasts((prev) => [...prev, toast]);

    if (toast.duration) {
      setTimeout(() => {
        removeNotification(id);
      }, toast.duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ addNotification, removeNotification, toasts }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used inside NotificationProvider');
  }
  return context;
}
