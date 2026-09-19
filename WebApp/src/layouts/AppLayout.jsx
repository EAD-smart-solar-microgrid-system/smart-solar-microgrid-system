/**
 * AppLayout Component
 *
 * Shared application shell providing the global header, main content
 * responsive container, React Router Outlet, and common footer.
 *
 * Does not contain authenticated navigation, role menus, or logout logic.
 */

import { Outlet, Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes.js';

export const AppLayout = () => {
  return (
    <div className="d-flex flex-column min-vh-100 bg-light-subtle">
      {/* Application Header */}
      <header>
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
          <div className="container">
            <Link className="navbar-brand fw-bold d-flex align-items-center gap-2" to={ROUTES.HOME}>
              <span className="text-warning">&#9728;</span>
              <span>Smart Solar Microgrid Trading System</span>
            </Link>
            <ul className="navbar-nav ms-auto flex-row flex-wrap gap-1">
              <li className="nav-item">
                <Link className="nav-link py-1" to={ROUTES.HOME}>
                  Home
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link py-1" to={ROUTES.ENERGY_SLOT_RESERVATIONS}>
                  Energy Slots
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </header>

      {/* Main Content Area */}
      <main role="main" className="container my-4 flex-grow-1">
        <Outlet />
      </main>

      {/* Simple Footer */}
      <footer className="footer mt-auto py-3 bg-white border-top text-center text-muted">
        <div className="container">
          <p className="small mb-1">
            <strong>SE4040</strong> &bull; Enterprise Application Development &mdash; Smart Solar Microgrid Trading System
          </p>
          <p className="small mb-0 text-secondary">
            Shared Web Client Foundation &bull; Common Infrastructure Ready
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;
