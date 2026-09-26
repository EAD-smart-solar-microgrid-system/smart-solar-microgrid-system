import { Outlet, Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes.js';
import { useContext } from 'react';
import { AuthContext } from '../features/authentication/context/AuthContext.jsx';

export const AppLayout = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="d-flex flex-column min-vh-100 bg-light-subtle">
      <header>
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
          <div className="container">
            <Link className="navbar-brand fw-bold d-flex align-items-center gap-2" to={ROUTES.HOME}>
              <span className="text-warning">&#9728;</span>
              <span>Smart Solar Microgrid</span>
            </Link>
            <ul className="navbar-nav ms-auto flex-row flex-wrap gap-3 align-items-center">
              <li className="nav-item"><Link className="nav-link py-1" to={ROUTES.HOME}>Home</Link></li>
              <li className="nav-item"><Link className="nav-link py-1" to={ROUTES.STATIONS}>Stations</Link></li>
              {user?.role === 'Backoffice' && (
                <li className="nav-item"><Link className="nav-link py-1" to={ROUTES.USER_MANAGEMENT}>Users</Link></li>
              )}
              {user ? (
                <li className="nav-item">
                  <span className="text-light me-2">Hi, {user.username}</span>
                  <button className="btn btn-sm btn-outline-light" onClick={logout}>Logout</button>
                </li>
              ) : (
                <li className="nav-item"><Link className="btn btn-sm btn-light" to={ROUTES.LOGIN}>Login</Link></li>
              )}
            </ul>
          </div>
        </nav>
      </header>
      <main role="main" className="container my-4 flex-grow-1"><Outlet /></main>
      <footer className="footer mt-auto py-3 bg-white border-top text-center text-muted">
        <div className="container"><p className="small mb-0 text-secondary">Shared Web Client Foundation</p></div>
      </footer>
    </div>
  );
};
export default AppLayout;
