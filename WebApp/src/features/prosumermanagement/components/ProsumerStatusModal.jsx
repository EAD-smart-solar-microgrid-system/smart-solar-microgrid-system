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
      buttonStyle: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500',
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
      buttonStyle: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500',
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
      buttonStyle: 'bg-sky-600 hover:bg-sky-700 focus:ring-sky-500',
      description:
        'Are you sure you want to reactivate this account? Their account access and trading capabilities will be fully restored.',
    };
  }

  return {
    actionName: 'Update Status',
    targetStatus: targetStatus || 'Active',
    title: 'Update Prosumer Status',
    confirmLabel: 'Confirm Status Change',
    buttonStyle: 'bg-sky-600 hover:bg-sky-700 focus:ring-sky-500',
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
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 px-4 py-8"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && handleCancel()}
    >
      <div
        className="mx-auto max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
        role="dialog"
        aria-modal="true"
        aria-labelledby="status-modal-title"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-600">
              Account Lifecycle
            </p>
            <h2 id="status-modal-title" className="mt-1 text-2xl font-bold text-slate-950">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            disabled={submitting}
            className="rounded-lg p-2 text-2xl leading-none text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        {serverError && (
          <div
            className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
            role="alert"
          >
            {serverError}
          </div>
        )}

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Prosumer
                </dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {prosumer.fullName || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  National ID (NIC)
                </dt>
                <dd className="mt-1 font-mono font-medium text-slate-900">
                  {prosumer.nic}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Current Status
                </dt>
                <dd className="mt-1">
                  <ProsumerStatusBadge status={prosumer.status} />
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Requested Action
                </dt>
                <dd className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-700">
                  {actionName}
                </dd>
              </div>
            </dl>
          </div>

          <p className="text-sm leading-relaxed text-slate-600">
            {description}
          </p>
        </div>

        <div className="mt-6 flex flex-col-reverse justify-end gap-3 border-t border-slate-200 pt-4 sm:flex-row">
          <button
            type="button"
            onClick={handleCancel}
            disabled={submitting}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${buttonStyle}`}
          >
            {submitting ? 'Updating status…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProsumerStatusModal;
