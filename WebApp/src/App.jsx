import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';

import { ROUTES } from './constants/routes.js';

import { AppLayout } from './layouts/AppLayout.jsx';

import { HomePage } from './pages/HomePage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';
import { StationsPage } from './pages/StationsPage.jsx';

import { EnergySlotReservationsPage } from './features/energyslotreservations/pages/EnergySlotReservationsPage.jsx';
import { ReservationMonitoringPage } from './features/energyslotreservations/pages/ReservationMonitoringPage.jsx';

import { AuthProvider } from './features/authentication/context/AuthContext.jsx';
import { AuthContext } from './features/authentication/context/AuthContextValue.js';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { LoginPage } from './features/authentication/pages/LoginPage.jsx';
import { ResetPasswordPage } from './features/authentication/pages/ResetPasswordPage.jsx';
import { VerifyEmailPage } from './features/authentication/pages/VerifyEmailPage.jsx';

import { UserManagementPage } from './features/usermanagement/pages/UserManagementPage.jsx';
import { ProsumerManagementPage } from './features/prosumermanagement/pages/ProsumerManagementPage.jsx';

const ProtectedRoute = ({ children, roleRequired, rolesAllowed }) => {
  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // User must be authenticated before accessing protected routes.
  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  // Protect routes that belong to exactly one role.
  if (roleRequired && user.role !== roleRequired) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  // Protect routes that may be accessed by multiple permitted roles.
  if (rolesAllowed && !rolesAllowed.includes(user.role)) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return children;
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path={ROUTES.HOME} element={<AppLayout />}>
              <Route index element={<HomePage />} />

              {/* Authentication routes */}
              <Route path={ROUTES.LOGIN} element={<LoginPage />} />
              <Route
                path={ROUTES.RESET_PASSWORD}
                element={<ResetPasswordPage />}
              />
              <Route
                path={ROUTES.VERIFY_EMAIL}
                element={<VerifyEmailPage />}
              />

              {/* Backoffice user management */}
              <Route
                path={ROUTES.USER_MANAGEMENT}
                element={
                  <ProtectedRoute roleRequired="Backoffice">
                    <UserManagementPage />
                  </ProtectedRoute>
                }
              />

              {/* Backoffice admin settings */}
              <Route
                path={ROUTES.ADMIN_SETTINGS}
                element={
                  <ProtectedRoute roleRequired="Backoffice">
                    <UserManagementPage />
                  </ProtectedRoute>
                }
              />

              {/* Backoffice prosumer management */}
              <Route
                path={ROUTES.PROSUMER_MANAGEMENT}
                element={
                  <ProtectedRoute roleRequired="Backoffice">
                    <ProsumerManagementPage />
                  </ProtectedRoute>
                }
              />

              {/* Grid Operator energy slot management */}
              <Route
                path={ROUTES.ENERGY_SLOT_RESERVATIONS}
                element={
                  <ProtectedRoute roleRequired="GridOperator">
                    <EnergySlotReservationsPage />
                  </ProtectedRoute>
                }
              />

              {/*
                Reservation monitoring:
                - GridOperator: view + operational Approve/Reject actions
                - Backoffice: read-only monitoring
              */}
              <Route
                path={ROUTES.RESERVATION_MONITORING}
                element={
                  <ProtectedRoute
                    rolesAllowed={['GridOperator', 'Backoffice']}
                  >
                    <ReservationMonitoringPage />
                  </ProtectedRoute>
                }
              />

              {/* Backoffice station administration */}
              <Route
                path={ROUTES.STATIONS.slice(1)}
                element={
                  <ProtectedRoute roleRequired="Backoffice">
                    <StationsPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;