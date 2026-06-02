import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/useAuth';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterPharmacist from './pages/RegisterPharmacist';
import PatientDashboard from './pages/PatientDashboard';
import PharmacistDashboard from './pages/PharmacistDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/admin/Users';
import AdminPharmacies from './pages/admin/Pharmacies';
import AdminAudits from './pages/admin/Audits';
import PharmacyDetail from './pages/PharmacyDetail';
import PaymentSuccess from './pages/PaymentSuccess';
import Orders from './pages/Orders';
import PatientHome from './pages/patient/PatientHome';
import PatientPharmacySearch from './pages/patient/PharmacySearch';
import PatientPrescriptions from './pages/patient/Prescriptions';
import PatientProfile from './pages/patient/Profile';
import PatientFeedback from './pages/patient/Feedback';
import PharmacistHome from './pages/pharmacist/PharmacistHome';
import PharmacistPrescriptions from './pages/pharmacist/Prescriptions';
import PharmacistOrders from './pages/pharmacist/Orders';
import PharmacistStock from './pages/pharmacist/Stock';
import PaymentPage from './pages/PaymentPage';

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) {
    return <Landing />;
  }

  return <Navigate to={`/${user.role}`} replace />;
}

export default function App() {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<RoleRedirect />} />
      <Route path="/login" element={user ? <Navigate to={`/${user.role}`} replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={`/${user.role}`} replace /> : <Register />} />
      <Route path="/register-pharmacist" element={user ? <Navigate to={`/${user.role}`} replace /> : <RegisterPharmacist />} />
      <Route
        path="/patient"
        element={
          <ProtectedRoute roles={['patient']}>
            <Layout title="Patient module" subtitle="Use each step separately: find a pharmacy, upload in the pharmacy detail page, create an order, and track it from its own screen.">
              <PatientHome />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/search"
        element={
          <ProtectedRoute roles={['patient']}>
            <Layout title="Find pharmacy" subtitle="Search live pharmacy records from the database by name or city.">
              <PatientPharmacySearch />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/prescriptions"
        element={
          <ProtectedRoute roles={['patient']}>
            <Layout title="My prescriptions" subtitle="Review your prescriptions and create an order only when you are ready.">
              <PatientPrescriptions />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/profile"
        element={
          <ProtectedRoute roles={['patient']}>
            <Layout title="My profile" subtitle="Keep your contact details current for pharmacy follow-up.">
              <PatientProfile />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/feedback"
        element={
          <ProtectedRoute roles={['patient']}>
            <Layout title="Feedback" subtitle="See your previous ratings and feedback from the database.">
              <PatientFeedback />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pharmacist"
        element={
          <ProtectedRoute roles={['pharmacist']}>
            <Layout title="Pharmacist module" subtitle="Handle work in separate queues: prescriptions, then orders.">
              <PharmacistHome />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pharmacist/prescriptions"
        element={
          <ProtectedRoute roles={['pharmacist']}>
            <Layout title="Prescription queue" subtitle="Review incoming prescriptions from your pharmacy database queue.">
              <PharmacistPrescriptions />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pharmacist/orders"
        element={
          <ProtectedRoute roles={['pharmacist']}>
            <Layout title="Order queue" subtitle="Update fulfillment and payment states from live order records.">
              <PharmacistOrders />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pharmacist/stock"
        element={
          <ProtectedRoute roles={['pharmacist']}>
            <Layout title="Stock control" subtitle="Manage live medicine stock, expiry dates, and restock alerts from MongoDB.">
              <PharmacistStock />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['admin']}>
            <Layout title="Admin dashboard" subtitle="Monitor platform activity, users, pharmacies, prescriptions, and order volume.">
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute roles={["admin"]}>
            <Layout title="Users" subtitle="Manage platform users and roles.">
              <AdminUsers />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/pharmacies"
        element={
          <ProtectedRoute roles={["admin"]}>
            <Layout title="Pharmacies" subtitle="Manage pharmacies and their settings.">
              <AdminPharmacies />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/audits"
        element={
          <ProtectedRoute roles={["admin"]}>
            <Layout title="Audit log" subtitle="Recent admin actions and changes.">
              <AdminAudits />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pharmacies/:id"
        element={
          <ProtectedRoute roles={['patient', 'pharmacist', 'admin']}>
            <Layout title="Pharmacy details" subtitle="Public pharmacy information, non-sensitive pharmacist details, and medicine availability previews.">
              <PharmacyDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
      <Route path="/payments/success" element={<PaymentSuccess />} />
      <Route
        path="/payments/pay/:orderId"
        element={
          <ProtectedRoute roles={['patient']}>
            <Layout title="Secure checkout" subtitle="Complete your payment securely with Stripe.">
              <PaymentPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute roles={['patient']}>
            <Layout title="Your orders" subtitle="Track your prescription orders, delivery state, and payment status.">
              <Orders />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
