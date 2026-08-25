import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './stores/authStore';
import LoginPage from './pages/auth/LoginPage';
import DoctorRegisterPage from './pages/auth/DoctorRegisterPage';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Layouts
import PatientLayout from './layouts/PatientLayout';
import DoctorLayout from './layouts/DoctorLayout';
import ReceptionistLayout from './layouts/ReceptionistLayout';
import AmbulanceLayout from './layouts/AmbulanceLayout';
import AdminLayout from './layouts/AdminLayout';

// Patient Pages
import HomePage from './pages/patient/HomePage';
import ProfileSetup from './pages/patient/ProfileSetup';
import DoctorSearchPage from './pages/patient/DoctorSearchPage';
import DoctorProfilePage from './pages/patient/DoctorProfilePage';
import BookAppointmentPage from './pages/patient/BookAppointmentPage';
import BookingConfirmPage from './pages/patient/BookingConfirmPage';
import BookingSuccessPage from './pages/patient/BookingSuccessPage';
import AppointmentsPage from './pages/patient/AppointmentsPage';
import HealthRecordsPage from './pages/patient/HealthRecordsPage';
import MedicineRemindersPage from './pages/patient/MedicineRemindersPage';
import EmergencyTrackingPage from './pages/patient/EmergencyTrackingPage';
import SettingsPage from './pages/patient/SettingsPage';

// Doctor Pages
import DoctorDashboardPage from './pages/doctor/DoctorDashboardPage';
import DoctorAppointmentsPage from './pages/doctor/AppointmentsPage';
import ScheduleManagementPage from './pages/doctor/ScheduleManagementPage';
import ConsultationPage from './pages/doctor/ConsultationPage';
import DoctorProfileEditPage from './pages/doctor/DoctorProfileEditPage';

// Receptionist Pages
import ReceptionistDashboardPage from './pages/receptionist/ReceptionistDashboardPage';
import AppointmentDashboardPage from './pages/receptionist/AppointmentDashboardPage';
import QueueManagementPage from './pages/receptionist/QueueManagementPage';
import DoctorBoardPage from './pages/receptionist/DoctorBoardPage';
import EmergencyDashboardPage from './pages/receptionist/EmergencyDashboardPage';
import WaitingRoomTvPage from './pages/receptionist/WaitingRoomTvPage';

// Ambulance Pages
import AmbulanceDashboardPage from './pages/ambulance/AmbulanceDashboardPage';
import ActiveEmergencyPage from './pages/ambulance/ActiveEmergencyPage';
import AmbulanceHistoryPage from './pages/ambulance/AmbulanceHistoryPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import DoctorManagementPage from './pages/admin/DoctorManagementPage';
import HospitalManagementPage from './pages/admin/HospitalManagementPage';
import UserManagementPage from './pages/admin/UserManagementPage';

// Real-time Notifications
import NotificationToastContainer from './components/notifications/NotificationToastContainer';

export const App: React.FC = () => {
  const { initAuth, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <BrowserRouter>
      <NotificationToastContainer />
      <Routes>
        {/* Root Redirect based on authentication & role */}
        <Route
          path="/"
          element={
            isAuthenticated && user ? (
              <Navigate
                to={
                  user.role === 'ADMIN'
                    ? '/admin/dashboard'
                    : user.role === 'DOCTOR'
                    ? '/doctor/dashboard'
                    : user.role === 'RECEPTIONIST'
                    ? '/receptionist/dashboard'
                    : user.role === 'AMBULANCE_OPERATOR'
                    ? '/ambulance/dashboard'
                    : '/patient/home'
                }
                replace
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Public Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/doctor/register" element={<DoctorRegisterPage />} />

        {/* Admin Portal Routes (Protected) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="doctors" element={<DoctorManagementPage />} />
          <Route path="hospitals" element={<HospitalManagementPage />} />
          <Route path="users" element={<UserManagementPage />} />
        </Route>

        {/* Patient Portal Routes (Protected) */}
        <Route
          path="/patient"
          element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <PatientLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/patient/home" replace />} />
          <Route path="home" element={<HomePage />} />
          <Route path="profile/setup" element={<ProfileSetup />} />
          <Route path="doctors" element={<DoctorSearchPage />} />
          <Route path="doctors/:id" element={<DoctorProfilePage />} />
          <Route path="doctors/:id/book" element={<BookAppointmentPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="appointments/confirm" element={<BookingConfirmPage />} />
          <Route path="appointments/success" element={<BookingSuccessPage />} />
          <Route path="records" element={<HealthRecordsPage />} />
          <Route path="reminders" element={<MedicineRemindersPage />} />
          <Route path="emergency" element={<EmergencyTrackingPage />} />
          <Route path="emergency/:id" element={<EmergencyTrackingPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Doctor Dashboard Routes (Protected) */}
        <Route
          path="/doctor"
          element={
            <ProtectedRoute allowedRoles={['DOCTOR']}>
              <DoctorLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/doctor/dashboard" replace />} />
          <Route path="dashboard" element={<DoctorDashboardPage />} />
          <Route path="appointments" element={<DoctorAppointmentsPage />} />
          <Route path="schedule" element={<ScheduleManagementPage />} />
          <Route path="consultation/:appointmentId" element={<ConsultationPage />} />
          <Route path="profile" element={<DoctorProfileEditPage />} />
        </Route>

        {/* Receptionist Dashboard Routes (Protected) */}
        <Route
          path="/receptionist"
          element={
            <ProtectedRoute allowedRoles={['RECEPTIONIST']}>
              <ReceptionistLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/receptionist/dashboard" replace />} />
          <Route path="dashboard" element={<ReceptionistDashboardPage />} />
          <Route path="appointments" element={<AppointmentDashboardPage />} />
          <Route path="queue" element={<QueueManagementPage />} />
          <Route path="doctors" element={<DoctorBoardPage />} />
          <Route path="emergencies" element={<EmergencyDashboardPage />} />
        </Route>

        {/* Public / Lobby Waiting Room Full-Screen TV Display */}
        <Route
          path="/receptionist/tv-display"
          element={
            <ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN']}>
              <WaitingRoomTvPage />
            </ProtectedRoute>
          }
        />

        {/* Ambulance Operator Routes (Protected) */}
        <Route
          path="/ambulance"
          element={
            <ProtectedRoute allowedRoles={['AMBULANCE_OPERATOR']}>
              <AmbulanceLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/ambulance/dashboard" replace />} />
          <Route path="dashboard" element={<AmbulanceDashboardPage />} />
          <Route path="active/:id" element={<ActiveEmergencyPage />} />
          <Route path="history" element={<AmbulanceHistoryPage />} />
        </Route>

        {/* Unauthorized Route */}
        <Route
          path="/unauthorized"
          element={
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                textAlign: 'center',
                padding: '1rem',
                backgroundColor: '#0F172A',
                color: '#F8FAFC',
              }}
            >
              <h1 style={{ fontSize: '2rem', color: '#EF4444' }}>403 - Unauthorized</h1>
              <p style={{ color: '#94A3B8', maxWidth: '400px', margin: '1rem 0' }}>
                You do not have permission to access this portal.
              </p>
              <a href="/login" style={{ color: '#60A5FA', textDecoration: 'none', fontWeight: 600 }}>
                Return to Login
              </a>
            </div>
          }
        />

        {/* 404 Catch-all */}
        <Route
          path="*"
          element={
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                textAlign: 'center',
                padding: '1rem',
                backgroundColor: '#0F172A',
                color: '#F8FAFC',
              }}
            >
              <h1 style={{ fontSize: '2rem' }}>404 - Page Not Found</h1>
              <p style={{ color: '#94A3B8' }}>The requested page does not exist.</p>
              <a href="/login" style={{ color: '#60A5FA', textDecoration: 'none', marginTop: '1rem', fontWeight: 600 }}>
                Go to Login
              </a>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
