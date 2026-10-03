import React from 'react';
import { ProsumerStatusBadge } from './ProsumerStatusBadge.jsx';

/**
 * ProsumerTable Component
 * Dashboard table for registered solar prosumers with theme styling.
 */
export const ProsumerTable = ({
  prosumers = [],
  onView,
  onEdit,
  onStatusAction,
}) => {
  const renderStatusAction = (prosumer) => {
    if (prosumer.status === 'Pending') {
      return (
        <button
          type="button"
          onClick={() => onStatusAction && onStatusAction(prosumer, 'Active')}
          className="rounded-lg border border-[#22C55E]/30 bg-[#22C55E]/10 px-2.5 py-1 text-xs font-semibold text-[#22C55E] transition hover:bg-[#22C55E]/20"
        >
          Activate
        </button>
      );
    }

    if (prosumer.status === 'Active') {
      return (
        <button
          type="button"
          onClick={() => onStatusAction && onStatusAction(prosumer, 'Deactivated')}
          className="rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 px-2.5 py-1 text-xs font-semibold text-[#EF4444] transition hover:bg-[#EF4444]/20"
        >
          Deactivate
        </button>
      );
    }

    if (prosumer.status === 'Deactivated') {
      return (
        <button
          type="button"
          onClick={() => onStatusAction && onStatusAction(prosumer, 'Active')}
          className="rounded-lg border border-[#E3511B]/30 bg-[#E3511B]/10 px-2.5 py-1 text-xs font-semibold text-[#E3511B] transition hover:bg-[#E3511B]/20"
        >
          Reactivate
        </button>
      );
    }

    return null;
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)]">
      <div className="overflow-x-auto">
        <table className="min-w-full w-full text-left text-xs" aria-label="Solar Prosumers">
          <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
            <tr>
              <th scope="col" className="px-5 py-3.5 font-bold">NIC</th>
              <th scope="col" className="px-5 py-3.5 font-bold">Full Name</th>
              <th scope="col" className="px-5 py-3.5 font-bold">Email</th>
              <th scope="col" className="px-5 py-3.5 font-bold">Phone</th>
              <th scope="col" className="px-5 py-3.5 font-bold">Address</th>
              <th scope="col" className="px-5 py-3.5 font-bold">Status</th>
              <th scope="col" className="px-5 py-3.5 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {prosumers.map((prosumer) => (
              <tr key={prosumer.nic} className="transition hover:bg-[var(--bg-hover)]">
                <td className="px-5 py-3.5 font-mono font-medium text-[var(--text-muted)]">
                  {prosumer.nic}
                </td>
                <td className="px-5 py-3.5 font-bold text-[var(--text-primary)]">
                  {prosumer.fullName || '—'}
                </td>
                <td className="px-5 py-3.5 text-[var(--text-secondary)]">
                  {prosumer.email || '—'}
                </td>
                <td className="px-5 py-3.5 text-[var(--text-secondary)]">
                  {prosumer.phone || '—'}
                </td>
                <td className="max-w-xs truncate px-5 py-3.5 text-[var(--text-muted)]" title={prosumer.address || ''}>
                  {prosumer.address || '—'}
                </td>
                <td className="px-5 py-3.5">
                  <ProsumerStatusBadge status={prosumer.status} />
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="inline-flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onView && onView(prosumer)}
                      className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] px-2.5 py-1 text-xs font-semibold text-[var(--text-primary)] transition hover:border-[#E3511B]/40 hover:text-[#E3511B]"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit && onEdit(prosumer)}
                      className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] px-2.5 py-1 text-xs font-semibold text-[var(--text-primary)] transition hover:border-[#E3511B]/40 hover:text-[#E3511B]"
                    >
                      Edit
                    </button>
                    {renderStatusAction(prosumer)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProsumerTable;
