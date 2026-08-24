import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// Layouts
import PublicLayout from '../layouts/PublicLayout/PublicLayout';
import AuthLayout from '../layouts/AuthLayout/AuthLayout';
import GuestLayout from '../layouts/GuestLayout/GuestLayout';
import StaffLayout from '../layouts/StaffLayout/StaffLayout';

// Routes
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

// Error Pages
import NotFoundPage from '../pages/errors/NotFoundPage/NotFoundPage';

// Auth Pages
const LoginPage = React.lazy(() => import('../pages/auth/LoginPage/LoginPage'));
const RegisterPage = React.lazy(() => import('../pages/auth/RegisterPage/RegisterPage'));

// Public Pages
const HomePage = React.lazy(() => import('../pages/public/HomePage/HomePage'));
const HotelListingPage = React.lazy(() => import('../pages/public/HotelListingPage/HotelListingPage'));
const HotelDetailPage = React.lazy(() => import('../pages/public/HotelDetailPage/HotelDetailPage'));
const ReservationPage = React.lazy(() => import('../pages/public/ReservationPage/ReservationPage'));
const PaymentPage = React.lazy(() => import('../pages/public/PaymentPage/PaymentPage'));
const ConfirmationPage = React.lazy(() => import('../pages/public/ConfirmationPage/ConfirmationPage'));

// Guest Pages
const GuestDashboardPage = React.lazy(() => import('../pages/guest/DashboardPage/DashboardPage'));
const GuestReservationsPage = React.lazy(() => import('../pages/guest/ReservationsPage/ReservationsPage'));
const GuestReservationDetailPage = React.lazy(() => import('../pages/guest/ReservationDetailPage/ReservationDetailPage'));
const GuestProfilePage = React.lazy(() => import('../pages/guest/ProfilePage/ProfilePage'));

// Receptionist Pages
const RecDashboardPage = React.lazy(() => import('../pages/receptionist/DashboardPage/DashboardPage'));
const RecReservationsPage = React.lazy(() => import('../pages/receptionist/ReservationsPage/ReservationsPage'));
const RecCreateReservationPage = React.lazy(() => import('../pages/receptionist/CreateReservationPage/CreateReservationPage'));
const RecReservationDetailPage = React.lazy(() => import('../pages/receptionist/ReservationDetailPage/ReservationDetailPage'));
const RecCheckInPage = React.lazy(() => import('../pages/receptionist/CheckInPage/CheckInPage'));
const RecCheckOutPage = React.lazy(() => import('../pages/receptionist/CheckOutPage/CheckOutPage'));
const RecRoomsPage = React.lazy(() => import('../pages/receptionist/RoomsPage/RoomsPage'));

// Admin (Hotel Manager) Pages
const AdminDashboardPage = React.lazy(() => import('../pages/admin/DashboardPage/DashboardPage'));
const AdminReservationsPage = React.lazy(() => import('../pages/admin/ReservationsPage/ReservationsPage'));
const AdminRoomTypesPage = React.lazy(() => import('../pages/admin/RoomTypesPage/RoomTypesPage'));
const AdminReceptionistsPage = React.lazy(() => import('../pages/admin/ReceptionistsPage/ReceptionistsPage'));
const AdminReportsPage = React.lazy(() => import('../pages/admin/ReportsPage/ReportsPage'));
const AdminSettingsPage = React.lazy(() => import('../pages/admin/SettingsPage/SettingsPage'));

// Super Admin Pages
const SADashboardPage = React.lazy(() => import('../pages/superAdmin/DashboardPage/DashboardPage'));
const SAHotelsPage = React.lazy(() => import('../pages/superAdmin/HotelsPage/HotelsPage'));
const SAHotelDetailPage = React.lazy(() => import('../pages/superAdmin/HotelDetailPage/HotelDetailPage'));
const SAAdministratorsPage = React.lazy(() => import('../pages/superAdmin/AdministratorsPage/AdministratorsPage'));
const SAReportsPage = React.lazy(() => import('../pages/superAdmin/ReportsPage/ReportsPage'));
const SASettingsPage = React.lazy(() => import('../pages/superAdmin/SettingsPage/SettingsPage'));

// Loading Fallback
const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <p>Loading...</p>
  </div>
);

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/hotels" element={<HotelListingPage />} />
          <Route path="/hotels/:hotelId" element={<HotelDetailPage />} />
          <Route path="/reservation" element={<ReservationPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/confirmation" element={<ConfirmationPage />} />
        </Route>

        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected Guest Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute allowedRoles={['guest']} />}>
            <Route path="/guest" element={<GuestLayout />}>
              <Route path="dashboard" element={<GuestDashboardPage />} />
              <Route path="reservations" element={<GuestReservationsPage />} />
              <Route path="reservations/:id" element={<GuestReservationDetailPage />} />
              <Route path="profile" element={<GuestProfilePage />} />
            </Route>
          </Route>
        </Route>

        {/* Protected Receptionist Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute allowedRoles={['receptionist']} />}>
            <Route path="/receptionist" element={<StaffLayout />}>
              <Route path="dashboard" element={<RecDashboardPage />} />
              <Route path="reservations" element={<RecReservationsPage />} />
              <Route path="reservations/create" element={<RecCreateReservationPage />} />
              <Route path="reservations/:id" element={<RecReservationDetailPage />} />
              <Route path="check-in" element={<RecCheckInPage />} />
              <Route path="check-out" element={<RecCheckOutPage />} />
              <Route path="rooms" element={<RecRoomsPage />} />
            </Route>
          </Route>
        </Route>

        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute allowedRoles={['hotel_manager']} />}>
            <Route path="/admin" element={<StaffLayout />}>
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="reservations" element={<AdminReservationsPage />} />
              <Route path="room-types" element={<AdminRoomTypesPage />} />
              <Route path="receptionists" element={<AdminReceptionistsPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>
          </Route>
        </Route>

        {/* Protected Super Admin Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute allowedRoles={['super_admin']} />}>
            <Route path="/super-admin" element={<StaffLayout />}>
              <Route path="dashboard" element={<SADashboardPage />} />
              <Route path="hotels" element={<SAHotelsPage />} />
              <Route path="hotels/:hotelId" element={<SAHotelDetailPage />} />
              <Route path="administrators" element={<SAAdministratorsPage />} />
              <Route path="reports" element={<SAReportsPage />} />
              <Route path="settings" element={<SASettingsPage />} />
            </Route>
          </Route>
        </Route>

        {/* Catch-all 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
