import { Link, NavLink, Outlet } from 'react-router-dom';
import { ROUTES } from '../constants/routes.js';
import { useContext } from 'react';
import { AuthContext } from '../features/authentication/context/AuthContextValue.js';

export const AppLayout = () => {
  const { user, logout } = useContext(AuthContext);

  const navLinkClass = ({ isActive }) => `rounded-lg px-3 py-2 text-sm font-semibold transition ${
    isActive ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'
  }`;

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="border-b border-slate-800 bg-slate-950 text-white shadow-sm">
        <nav className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6 lg:px-8" aria-label="Primary navigation">
          <Link className="flex min-w-0 items-center gap-3" to={ROUTES.HOME}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-xl text-slate-950" aria-hidden="true">☀</span>
            <span className="truncate text-sm font-bold tracking-tight sm:text-base">Smart Solar Microgrid</span>
          </Link>

          <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-1">
            <NavLink end to={ROUTES.HOME} className={navLinkClass}>Overview</NavLink>
            <NavLink to={ROUTES.STATIONS} className={navLinkClass}>Stations</NavLink>
            {user?.role === 'Backoffice' && (
              <NavLink to={ROUTES.PROSUMER_MANAGEMENT} className={navLinkClass}>Prosumers</NavLink>
            )}
            {user?.role === 'Backoffice' && (
              <NavLink to={ROUTES.USER_MANAGEMENT} className={navLinkClass}>Users</NavLink>
            )}
            {user ? (
              <div className="ml-1 flex max-w-full flex-wrap items-center justify-end gap-2 border-l border-white/15 pl-3">
                <span className="max-w-32 truncate px-2 text-sm text-slate-300" title={user.username}>Hi, {user.username}</span>
                <button type="button" className="rounded-lg border border-white/30 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10" onClick={logout}>Logout</button>
              </div>
            ) : (
              <NavLink to={ROUTES.LOGIN} className={navLinkClass}>Login</NavLink>
            )}
          </div>
        </nav>
      </header>
      <main role="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><Outlet /></main>
      <footer className="border-t border-slate-200 bg-white px-4 py-5 text-center text-xs text-slate-500 sm:px-6">
        <div className="mx-auto max-w-7xl"><p>Shared Web Client Foundation · Smart Solar Microgrid Trading System</p></div>
      </footer>
    </div>
  );
};
export default AppLayout;
