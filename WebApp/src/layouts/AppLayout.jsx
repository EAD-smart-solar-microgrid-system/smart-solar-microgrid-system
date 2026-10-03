import React, { useContext, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes.js';
import { AuthContext } from '../features/authentication/context/AuthContextValue.js';
import { useTheme } from '../context/ThemeContext.jsx';

/**
 * Helper to determine current breadcrumb and title
 */
const getPageContext = (pathname) => {
  if (pathname === ROUTES.HOME) {
    return { section: 'Overview', title: 'Dashboard' };
  }
  if (pathname === ROUTES.STATIONS || pathname === '/stations') {
    return { section: 'Operations', title: 'Microgrid Nodes' };
  }
  if (pathname === ROUTES.ENERGY_SLOT_RESERVATIONS) {
    return { section: 'Operations', title: 'Energy Slot Reservations' };
  }
  if (pathname === ROUTES.RESERVATION_MONITORING) {
    return { section: 'Operations', title: 'Reservation Monitoring' };
  }
  if (pathname === ROUTES.PROSUMER_MANAGEMENT) {
    return { section: 'Management', title: 'Prosumer Management' };
  }
  if (pathname === ROUTES.ADMIN_SETTINGS || pathname === ROUTES.USER_MANAGEMENT) {
    return { section: 'Management', title: 'Admin Settings & Users' };
  }
  if (pathname === ROUTES.LOGIN) {
    return { section: 'Authentication', title: 'Staff Sign In' };
  }
  return { section: 'Pages', title: 'Dashboard' };
};

export const AppLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const { toggleTheme, isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    navigate(ROUTES.HOME, { replace: true });
    logout();
  };

  const { section, title } = getPageContext(location.pathname);

  // Active item: background #252526 (dark) / #F2F2F3 (light), accent #E3511B, text #F5F5F5 / #171717
  // Inactive item: text #999999 / #77777A, hover #202021 / #ECECEE
  const navItemClass = ({ isActive }) =>
    `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 ${
      isActive
        ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] font-bold shadow-xs'
        : 'text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
    }`;

  return (
    <div className="flex min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] selection:bg-[#E3511B]/25 selection:text-[#E3511B]">
      {/* MOBILE BACKDROP */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR (Width: 235px, #171718 dark / #FFFFFF light) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[235px] flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-sidebar)] transition-transform duration-300 lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* BRAND LOGO HEADER */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border-subtle)] px-5">
          <Link
            to={ROUTES.HOME}
            className="flex items-center gap-2.5 transition hover:opacity-90"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E3511B] text-white shadow-md shadow-[#E3511B]/20">
              <span className="text-lg font-black leading-none">⚡</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold tracking-tight text-[var(--text-primary)]">
                SOLAR<span className="text-[#E3511B]">HUB</span>
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Microgrid System
              </span>
            </div>
          </Link>

          <button
            type="button"
            className="text-[var(--text-muted)] lg:hidden hover:text-[var(--text-primary)]"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        {/* NAVIGATION LINKS */}
        <div className="flex-1 overflow-y-auto px-3.5 py-5 space-y-6">
          {/* OVERVIEW GROUP */}
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Overview
            </p>
            <nav className="mt-2 space-y-1">
              <NavLink
                end
                to={ROUTES.HOME}
                className={navItemClass}
                onClick={() => setMobileMenuOpen(false)}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-[#E3511B]" />
                    )}
                    <svg
                      className={`h-4 w-4 shrink-0 transition ${
                        isActive ? 'text-[#E3511B]' : 'text-[var(--text-muted)]'
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                      />
                    </svg>
                    <span>Dashboard</span>
                  </>
                )}
              </NavLink>
            </nav>
          </div>

          {/* OPERATIONS GROUP */}
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Operations
            </p>
            <nav className="mt-2 space-y-1">
              {/* Microgrid Nodes */}
              <NavLink
                to={ROUTES.STATIONS}
                className={navItemClass}
                onClick={() => setMobileMenuOpen(false)}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-[#E3511B]" />
                    )}
                    <svg
                      className={`h-4 w-4 shrink-0 transition ${
                        isActive ? 'text-[#E3511B]' : 'text-[var(--text-muted)]'
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>Microgrid Nodes</span>
                  </>
                )}
              </NavLink>

              {/* Energy Slots */}
              {user?.role === 'GridOperator' && (
                <NavLink
                  to={ROUTES.ENERGY_SLOT_RESERVATIONS}
                  className={navItemClass}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-[#E3511B]" />
                      )}
                      <svg
                        className={`h-4 w-4 shrink-0 transition ${
                          isActive ? 'text-[#E3511B]' : 'text-[var(--text-muted)]'
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>Energy Slots</span>
                    </>
                  )}
                </NavLink>
              )}

              {/* Reservations Monitoring */}
              {(user?.role === 'GridOperator' || user?.role === 'Backoffice') && (
                <NavLink
                  to={ROUTES.RESERVATION_MONITORING}
                  className={navItemClass}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-[#E3511B]" />
                      )}
                      <svg
                        className={`h-4 w-4 shrink-0 transition ${
                          isActive ? 'text-[#E3511B]' : 'text-[var(--text-muted)]'
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                        />
                      </svg>
                      <span>Reservations</span>
                    </>
                  )}
                </NavLink>
              )}
            </nav>
          </div>

          {/* MANAGEMENT GROUP */}
          {user?.role === 'Backoffice' && (
            <div>
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Management
              </p>
              <nav className="mt-2 space-y-1">
                <NavLink
                  to={ROUTES.PROSUMER_MANAGEMENT}
                  className={navItemClass}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-[#E3511B]" />
                      )}
                      <svg
                        className={`h-4 w-4 shrink-0 transition ${
                          isActive ? 'text-[#E3511B]' : 'text-[var(--text-muted)]'
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                      <span>Prosumers</span>
                    </>
                  )}
                </NavLink>

                <NavLink
                  to={ROUTES.ADMIN_SETTINGS}
                  className={navItemClass}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-[#E3511B]" />
                      )}
                      <svg
                        className={`h-4 w-4 shrink-0 transition ${
                          isActive ? 'text-[#E3511B]' : 'text-[var(--text-muted)]'
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span>Admin &amp; Users</span>
                    </>
                  )}
                </NavLink>
              </nav>
            </div>
          )}
        </div>
      </aside>

      {/* RIGHT SIDE: TOP HEADER + MAIN CONTENT */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* TOP HEADER (#171718 dark / #FFFFFF light, subtle bottom border) */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-sidebar)]/95 px-4 sm:px-6 lg:px-8 backdrop-blur-md">
          {/* Left: Mobile hamburger + Page context breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-1.5 text-[var(--text-muted)] lg:hidden hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open mobile menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {section}
              </p>
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-[var(--text-primary)]">
                {title}
              </h1>
            </div>
          </div>

          {/* Right: Theme Toggle, Notifications & User Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* THEME TOGGLE (Sun / Moon) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition hover:border-[#E3511B]/40 hover:text-[var(--text-primary)]"
              title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label="Toggle theme"
            >
              {isDark ? (
                // Sun Icon (when currently dark, click to switch to light)
                <svg className="h-4 w-4 text-[#F59E0B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                // Moon Icon (when currently light, click to switch to dark)
                <svg className="h-4 w-4 text-[#E3511B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-muted)] transition hover:border-[var(--border-hover)] hover:text-[var(--text-primary)]"
                title="System Notifications"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </button>
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#E3511B]" />
            </div>

            {/* Profile Avatar / Login Button */}
            {user ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] py-1.5 pl-2.5 pr-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E3511B]/15 font-mono text-xs font-extrabold text-[#E3511B] border border-[#E3511B]/30">
                  {user.username ? user.username.slice(0, 2).toUpperCase() : 'US'}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-[var(--text-primary)] truncate max-w-28" title={user.username}>
                    {user.username}
                  </span>
                  <span className="text-[10px] font-semibold text-[#E3511B]">
                    {user.role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg border border-[var(--border-default)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] hover:text-[#EF4444]"
                  title="Sign out"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to={ROUTES.LOGIN}
                className="rounded-xl bg-[#E3511B] px-4 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#F05A20]"
              >
                Sign In
              </Link>
            )}
          </div>
        </header>

        {/* MAIN APPLICATION CONTENT */}
        <main role="main" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>

        {/* REFINED OPERATIONAL FOOTER */}
        <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-sidebar)] px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
              <span>Smart Solar Microgrid Trading Network · Sri Lanka Grid</span>
            </div>
            <p>© 2026 SolarGrid · Decentralized Clean Energy Management</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AppLayout;
