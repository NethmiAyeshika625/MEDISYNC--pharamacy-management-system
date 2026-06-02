import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ToastContainer from './components/ToastContainer';

function AppWrapper() {
  return (
    <NotificationProvider>
      <ToastContainer />
      <App />
    </NotificationProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppWrapper />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
