/**
 * Main Application Component
 *
 * Configures React Router.
 * Only fully activates the home route ('/') and wildcard 404 route ('*').
 * Protected routes and feature-specific routes will be implemented by their respective assignees.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ROUTES } from './constants/routes.js';
import { AppLayout } from './layouts/AppLayout.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';
import { EnergySlotReservationsPage } from './features/energyslotreservations/pages/EnergySlotReservationsPage.jsx';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.HOME} element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route
            path={ROUTES.ENERGY_SLOT_RESERVATIONS}
            element={<EnergySlotReservationsPage />}
          />
          <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
