import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from './constants/routes.js';
import { AppLayout } from './layouts/AppLayout.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';
import { EnergySlotReservationsPage } from './features/energyslotreservations/pages/EnergySlotReservationsPage.jsx';
import { ReservationMonitoringPage } from './features/energyslotreservations/pages/ReservationMonitoringPage.jsx';
import { AuthProvider, AuthContext } from './features/authentication/context/AuthContext.jsx';
import { LoginPage } from './features/authentication/pages/LoginPage.jsx';
import { UserManagementPage } from './features/usermanagement/pages/UserManagementPage.jsx';
import { StationsPage } from './pages/StationsPage.jsx';
import { useContext } from 'react';

const ProtectedRoute = ({ children, roleRequired }) => {
  const { user, isLoading } = useContext(AuthContext);
  if (isLoading) return <div>Loading...</div>;
  if (!user) return <Navigate to={ROUTES.LOGIN} />;
  if (roleRequired && user.role !== roleRequired) return <Navigate to={ROUTES.HOME} />;
  return children;
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path={ROUTES.HOME} element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />
            <Route path={ROUTES.USER_MANAGEMENT} element={<ProtectedRoute roleRequired="Backoffice"><UserManagementPage /></ProtectedRoute>} />
            <Route path={ROUTES.ENERGY_SLOT_RESERVATIONS} element={<EnergySlotReservationsPage />} />
            <Route path={ROUTES.RESERVATION_MONITORING} element={<ReservationMonitoringPage />} />
            <Route path={ROUTES.STATIONS.slice(1)} element={<StationsPage />} />
            <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
export default App;
