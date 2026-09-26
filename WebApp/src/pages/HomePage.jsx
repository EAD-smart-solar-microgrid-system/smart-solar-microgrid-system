import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes.js';

export const HomePage = () => (
  <div className="space-y-8">
    <section className="overflow-hidden rounded-3xl bg-slate-950 px-6 py-10 text-white shadow-xl sm:px-10 sm:py-14">
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-300">Smart energy operations</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">Smart Solar Microgrid Trading System</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">A central web workspace for configuring microgrid nodes, their capacity, battery slots, and operating schedules through the authoritative C# API.</p>
        <Link to={ROUTES.STATIONS} className="mt-8 inline-flex items-center rounded-lg bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-amber-300">Open node management <span className="ml-2">→</span></Link>
      </div>
    </section>

    <section className="grid gap-5 md:grid-cols-3" aria-label="System principles">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-2xl">⌁</p><h2 className="mt-4 text-lg font-bold text-slate-950">API-led control</h2><p className="mt-2 text-sm leading-6 text-slate-600">Station data is loaded and changed through the ASP.NET Core API, keeping business rules on the server.</p></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-2xl">◷</p><h2 className="mt-4 text-lg font-bold text-slate-950">Operational clarity</h2><p className="mt-2 text-sm leading-6 text-slate-600">Schedules, location, capacity, storage slots, and lifecycle status are visible in one responsive view.</p></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-2xl">⌘</p><h2 className="mt-4 text-lg font-bold text-slate-950">Ready to connect</h2><p className="mt-2 text-sm leading-6 text-slate-600">Authentication is intentionally left for Member 1, with a single API client integration point prepared for the future token.</p></div>
    </section>
  </div>
);

export default HomePage;
