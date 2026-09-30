import React, { useContext } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes.js';
import { AuthContext } from '../features/authentication/context/AuthContextValue.js';
import { Logo } from '../components/common/Logo.jsx';

export const AppLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate(ROUTES.HOME, { replace: true });
    logout();
  };

  const isAdminSettingsActive =
    location.pathname === ROUTES.ADMIN_SETTINGS || location.pathname === ROUTES.USER_MANAGEMENT;

  const navLinkClass = ({ isActive }) =>
    `rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
      isActive
        ? 'bg-amber-50 text-amber-900 font-bold border border-amber-300'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      
      {/* REDESIGNED NAVBAR (Clean, Light, Minimalist 2-Color Scheme) */}
      <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-xs">
        <nav
          className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8"
          aria-label="Primary navigation"
        >
          {/* Brand Identity on the Left */}
          <Link
            className="flex items-center gap-2.5 transition hover:opacity-90"
            to={ROUTES.HOME}
            aria-label="SolarGrid Home"
          >
            <Logo size="md" title="SolarGrid" theme="light" />
          </Link>

          {/* Right Navigation: Exactly One Login Button when visitor, or Staff Portal when logged in */}
          <div className="flex items-center justify-end">
            {user ? (
              <div className="flex max-w-full flex-wrap items-center justify-end gap-1.5">
                <NavLink end to={ROUTES.HOME} className={navLinkClass}>
                  Overview
                </NavLink>
                {user?.role === 'Backoffice' && (
                  <NavLink to={ROUTES.STATIONS} className={navLinkClass}>
                    Stations
                  </NavLink>
                )}
                {user?.role === 'GridOperator' && (
                  <NavLink to={ROUTES.ENERGY_SLOT_RESERVATIONS} className={navLinkClass}>
                    Energy Slots
                  </NavLink>
                )}
                {(user?.role === 'GridOperator' || user?.role === 'Backoffice') && (
                  <NavLink to={ROUTES.RESERVATION_MONITORING} className={navLinkClass}>
                    Monitoring
                  </NavLink>
                )}
                {user?.role === 'Backoffice' && (
                  <NavLink to={ROUTES.PROSUMER_MANAGEMENT} className={navLinkClass}>
                    Prosumers
                  </NavLink>
                )}
                {user?.role === 'Backoffice' && (
                  <NavLink
                    to={ROUTES.ADMIN_SETTINGS}
                    className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                      isAdminSettingsActive
                        ? 'bg-amber-50 text-amber-900 font-bold border border-amber-300'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    Admin Settings
                  </NavLink>
                )}
                <div className="ml-2 flex items-center gap-2 border-l border-slate-200 pl-3">
                  <span className="max-w-32 truncate text-sm font-medium text-slate-600" title={user.username}>
                    Hi, {user.username}
                  </span>
                  <button
                    type="button"
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-100 hover:text-slate-900"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to={ROUTES.LOGIN}
                className="rounded-xl bg-amber-500 px-5 py-2 text-sm font-bold text-slate-950 shadow-xs transition hover:bg-amber-400 hover:shadow-sm"
              >
                Login
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* MAIN CONTENT AREA */}
      <main role="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>

      {/* REDESIGNED INFORMATIVE FOOTER */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8">
            
            {/* Column 1: Brand & Purpose */}
            <div className="max-w-md space-y-3">
              <Logo size="sm" title="SolarGrid" theme="light" />
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Smart Solar Microgrid Trading System — Decentralized renewable energy exchange network connecting solar prosumers, smart battery charging stations, and grid operators in real-time.
              </p>
            </div>

            {/* Column 2: System Ecosystem */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Ecosystem Modules
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-500">
                <li className="flex items-center gap-1.5">
                  <span className="text-amber-500">▪</span> Prosumer Android App (NIC Verified)
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-amber-500">▪</span> Grid Operator Dispatch Client
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-amber-500">▪</span> Central Backoffice Governance
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-amber-500">▪</span> Cryptographic QR Token Handshake
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Copyright Bar */}
          <div className="mt-8 border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <p>© 2026 SolarGrid · Smart Solar Microgrid Trading System</p>
            <p>Empowering local clean energy communities</p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default AppLayout;
