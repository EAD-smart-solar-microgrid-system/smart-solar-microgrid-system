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
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 backdrop-blur-sm p-4"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-modal)] text-[var(--text-primary)] transition-all sm:p-7"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prosumer-details-title"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#E3511B]">
              Solar Prosumer Profile
            </p>
            <h2 id="prosumer-details-title" className="mt-1 text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Prosumer Details
            </h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Read-only administrative overview of prosumer credentials and records.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-sm text-[var(--text-muted)] transition hover:text-[var(--text-primary)] hover:border-[var(--border-default)]"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 sm:p-5">
            <dl className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-5">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  National ID (NIC)
                </dt>
                <dd className="mt-1 font-mono text-xs font-bold text-[var(--text-primary)]">
                  {prosumer.nic}
                </dd>
              </div>

              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Account Status
                </dt>
                <dd className="mt-1">
                  <ProsumerStatusBadge status={prosumer.status} />
                </dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Full Name
                </dt>
                <dd className="mt-1 text-xs font-semibold text-[var(--text-primary)]">
                  {prosumer.fullName || '—'}
                </dd>
              </div>

              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Email Address
                </dt>
                <dd className="mt-1 text-xs font-medium text-[var(--text-secondary)]">
                  {prosumer.email || '—'}
                </dd>
              </div>

              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Phone Number
                </dt>
                <dd className="mt-1 text-xs font-medium text-[var(--text-secondary)]">
                  {prosumer.phone || '—'}
                </dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Registered Address
                </dt>
                <dd className="mt-1 text-xs font-medium text-[var(--text-secondary)] whitespace-pre-wrap">
                  {prosumer.address || '—'}
                </dd>
              </div>

              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Registration Date
                </dt>
                <dd className="mt-1 text-xs text-[var(--text-muted)]">
                  {formatDate(prosumer.registeredAt || prosumer.createdAt)}
                </dd>
              </div>

              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Last Updated
                </dt>
                <dd className="mt-1 text-xs text-[var(--text-muted)]">
                  {formatDate(prosumer.updatedAt)}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-[var(--border-subtle)] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-5 py-2.5 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProsumerDetailsModal;
