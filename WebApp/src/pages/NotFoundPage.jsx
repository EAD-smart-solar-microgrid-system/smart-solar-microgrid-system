import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes.js';

export const NotFoundPage = () => (
  <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
    <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-600">404 · Not found</p>
    <h1 className="mt-3 text-3xl font-bold text-slate-950">That page does not exist.</h1>
    <p className="mt-3 text-slate-600">The requested resource has not been implemented in this shared client.</p>
    <Link to={ROUTES.HOME} className="mt-6 inline-flex rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-700">Return to overview</Link>
  </div>
);

export default NotFoundPage;
