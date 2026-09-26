/**
 * ProsumerDetailsModal Component
 *
 * Read-only modal displaying detailed profile data for a solar prosumer.
 * Uses ProsumerStatusBadge and handles missing/optional fields gracefully.
 */

import { ProsumerStatusBadge } from './ProsumerStatusBadge.jsx';

const formatDate = (val) => {
  if (!val) return '—';
  const d = new Date(val);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
};

export const ProsumerDetailsModal = ({ isOpen, prosumer, onClose }) => {
  if (!isOpen || !prosumer) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 px-4 py-8"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="mx-auto max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prosumer-details-title"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-600">
              Solar Prosumer Profile
            </p>
            <h2 id="prosumer-details-title" className="mt-1 text-2xl font-bold text-slate-950">
              Prosumer Details
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Read-only administrative overview of prosumer credentials and records.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-2xl leading-none text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <dl className="grid grid-cols-1 gap-y-3.5 sm:grid-cols-2 sm:gap-x-4">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  National ID (NIC)
                </dt>
                <dd className="mt-1 font-mono text-sm font-semibold text-slate-900">
                  {prosumer.nic}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Account Status
                </dt>
                <dd className="mt-1">
                  <ProsumerStatusBadge status={prosumer.status} />
                </dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Full Name
                </dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">
                  {prosumer.fullName || '—'}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Email Address
                </dt>
                <dd className="mt-1 text-sm text-slate-700">
                  {prosumer.email || '—'}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Phone Number
                </dt>
                <dd className="mt-1 text-sm text-slate-700">
                  {prosumer.phone || '—'}
                </dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Registered Address
                </dt>
                <dd className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">
                  {prosumer.address || '—'}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Registration Date
                </dt>
                <dd className="mt-1 text-xs text-slate-600">
                  {formatDate(prosumer.registeredAt || prosumer.createdAt)}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Last Updated
                </dt>
                <dd className="mt-1 text-xs text-slate-600">
                  {formatDate(prosumer.updatedAt)}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProsumerDetailsModal;
