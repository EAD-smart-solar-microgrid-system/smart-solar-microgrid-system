/**
 * ProsumerStatusModal Component
 *
 * Confirmation dialog for prosumer account lifecycle transitions:
 * - Activate (Pending -> Active)
 * - Deactivate (Active -> Deactivated)
 * - Reactivate (Deactivated -> Active)
 */

import { useState } from 'react';
import { ProsumerStatusBadge } from './ProsumerStatusBadge.jsx';
import { updateProsumerStatus } from '../services/prosumerService.js';
import { ApiError } from '../../../services/apiClient.js';

const getActionDetails = (currentStatus, targetStatus) => {
  if (currentStatus === 'Pending' || (targetStatus === 'Active' && currentStatus !== 'Deactivated')) {
    return {
      actionName: 'Activate',
      targetStatus: 'Active',
      title: 'Activate Prosumer Account',
      confirmLabel: 'Activate Account',
      buttonStyle: 'bg-[#22C55E] hover:bg-[#16A34A] text-white shadow-md shadow-[#22C55E]/20',
      description:
        'Are you sure you want to activate this account? The prosumer will be granted active microgrid energy trading and node reservation permissions.',
    };
  }

  if (currentStatus === 'Active' || targetStatus === 'Deactivated') {
    return {
      actionName: 'Deactivate',
      targetStatus: 'Deactivated',
      title: 'Deactivate Prosumer Account',
      confirmLabel: 'Deactivate Account',
      buttonStyle: 'bg-[#EF4444] hover:bg-[#DC2626] text-white shadow-md shadow-[#EF4444]/20',
      description:
        'Are you sure you want to deactivate this account? The prosumer will no longer be able to make energy reservations or participate in microgrid trading.',
    };
  }

  if (currentStatus === 'Deactivated') {
    return {
      actionName: 'Reactivate',
      targetStatus: 'Active',
      title: 'Reactivate Prosumer Account',
      confirmLabel: 'Reactivate Account',
      buttonStyle: 'bg-[#E3511B] hover:bg-[#F05A20] text-white shadow-md shadow-[#E3511B]/20',
      description:
        'Are you sure you want to reactivate this account? Their account access and trading capabilities will be fully restored.',
    };
  }

  return {
    actionName: 'Update Status',
    targetStatus: targetStatus || 'Active',
    title: 'Update Prosumer Status',
    confirmLabel: 'Confirm Status Change',
    buttonStyle: 'bg-[#E3511B] hover:bg-[#F05A20] text-white shadow-md shadow-[#E3511B]/20',
    description: 'Are you sure you want to update the lifecycle status of this prosumer profile?',
  };
};

export const ProsumerStatusModal = ({
  isOpen,
  prosumer,
  targetStatus,
  onClose,
  onSuccess,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  if (!isOpen || !prosumer) {
    return null;
  }

  const {
    actionName,
    targetStatus: resolvedTargetStatus,
    title,
    confirmLabel,
    buttonStyle,
    description,
  } = getActionDetails(prosumer.status, targetStatus);

  const handleConfirm = async () => {
    setSubmitting(true);
    setServerError('');

    try {
      const updated = await updateProsumerStatus(prosumer.nic, resolvedTargetStatus);
      if (onSuccess) {
        onSuccess(updated, actionName);
      }
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status) {
        setServerError(`API error (${err.status}): ${err.message}`);
      } else {
        setServerError(err?.message || 'Failed to update prosumer status. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!submitting) {
      setServerError('');
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 backdrop-blur-sm p-4"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && handleCancel()}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-modal)] text-[var(--text-primary)] transition-all sm:p-7"
        role="dialog"
        aria-modal="true"
        aria-labelledby="status-modal-title"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#E3511B]">
              Account Lifecycle
            </p>
            <h2 id="status-modal-title" className="mt-1 text-xl font-bold tracking-tight text-[var(--text-primary)]">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            disabled={submitting}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-sm text-[var(--text-muted)] transition hover:text-[var(--text-primary)] hover:border-[var(--border-default)] disabled:opacity-50"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {serverError && (
          <div
            className="mb-4 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-xs font-semibold text-[#EF4444]"
            role="alert"
          >
            {serverError}
          </div>
        )}

        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
            <dl className="grid grid-cols-2 gap-3.5 text-xs">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Prosumer
                </dt>
                <dd className="mt-1 font-semibold text-[var(--text-primary)]">
                  {prosumer.fullName || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  National ID (NIC)
                </dt>
                <dd className="mt-1 font-mono font-medium text-[var(--text-secondary)]">
                  {prosumer.nic}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Current Status
                </dt>
                <dd className="mt-1">
                  <ProsumerStatusBadge status={prosumer.status} />
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Requested Action
                </dt>
                <dd className="mt-1 text-xs font-bold uppercase tracking-wider text-[#E3511B]">
                  {actionName}
                </dd>
              </div>
            </dl>
          </div>

          <p className="text-xs leading-relaxed text-[var(--text-muted)]">
            {description}
          </p>
        </div>

        <div className="mt-6 flex flex-col-reverse justify-end gap-3 border-t border-[var(--border-subtle)] pt-4 sm:flex-row">
          <button
            type="button"
            onClick={handleCancel}
            disabled={submitting}
            className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-4 py-2.5 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className={`rounded-xl px-5 py-2.5 text-xs font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${buttonStyle}`}
          >
            {submitting ? 'Updating status…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProsumerStatusModal;
