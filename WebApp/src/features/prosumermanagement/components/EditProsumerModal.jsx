/**
 * EditProsumerModal Component
 *
 * Backoffice modal dialog for updating contact and address information of an existing Solar Prosumer.
 * Guarantees that NIC remains immutable and read-only.
 * Uses validateProsumerForm with requireNic: false.
 */

import { useState } from 'react';
import { updateProsumer } from '../services/prosumerService.js';
import {
  validateProsumerForm,
  hasValidationErrors,
} from '../utils/prosumerFormValidation.js';
import { ApiError } from '../../../services/apiClient.js';

export const EditProsumerModal = ({ isOpen, prosumer, onClose, onSuccess }) => {
  const [form, setForm] = useState(() => ({
    fullName: prosumer?.fullName || '',
    email: prosumer?.email || '',
    phone: prosumer?.phone || '',
    address: prosumer?.address || '',
  }));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  if (!isOpen || !prosumer) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    // NIC is not validated or updated during edit
    const validationErrors = validateProsumerForm(form, { requireNic: false });
    setErrors(validationErrors);

    if (hasValidationErrors(validationErrors)) {
      return;
    }

    setSubmitting(true);
    try {
      const updated = await updateProsumer(prosumer.nic, form);
      if (onSuccess) {
        onSuccess(updated);
      }
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status) {
        setServerError(`API error (${err.status}): ${err.message}`);
      } else {
        setServerError(err?.message || 'Failed to update prosumer profile. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!submitting) {
      setErrors({});
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
        className="w-full max-w-lg rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-modal)] text-[var(--text-primary)] transition-all sm:p-7"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-prosumer-title"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#E3511B]">
              Solar Prosumer
            </p>
            <h2 id="edit-prosumer-title" className="mt-1 text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Edit Prosumer
            </h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Update contact information and registered address for this prosumer.
            </p>
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
            className="mb-5 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-xs font-semibold text-[#EF4444]"
            role="alert"
          >
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* NIC Field (Read-only / Immutable) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="edit-nic" className="block text-xs font-semibold text-[var(--text-secondary)]">
                National Identity Card (NIC)
              </label>
              <span className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Immutable
              </span>
            </div>
            <input
              id="edit-nic"
              name="nic"
              type="text"
              value={prosumer.nic}
              disabled
              readOnly
              className="block w-full cursor-not-allowed rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3.5 py-2.5 font-mono text-xs text-[var(--text-muted)] outline-none"
            />
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">
              The NIC is the primary identifier for this prosumer profile and cannot be changed.
            </p>
          </div>

          {/* Full Name Field */}
          <div>
            <label htmlFor="edit-fullName" className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Full Name <span className="text-[#EF4444]">*</span>
            </label>
            <input
              id="edit-fullName"
              name="fullName"
              type="text"
              value={form.fullName}
              onChange={handleChange}
              placeholder="e.g. Ruwan Silva"
              disabled={submitting}
              className={`block w-full rounded-xl border bg-[var(--bg-secondary)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition focus:border-[#E3511B] focus:ring-1 focus:ring-[#E3511B] disabled:opacity-50 ${
                errors.fullName ? 'border-[#EF4444]' : 'border-[var(--border-default)]'
              }`}
            />
            {errors.fullName && (
              <span className="mt-1 block text-xs font-medium text-[#EF4444]">
                {errors.fullName}
              </span>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="edit-email" className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Email Address <span className="text-[#EF4444]">*</span>
            </label>
            <input
              id="edit-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="e.g. ruwan@example.com"
              disabled={submitting}
              className={`block w-full rounded-xl border bg-[var(--bg-secondary)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition focus:border-[#E3511B] focus:ring-1 focus:ring-[#E3511B] disabled:opacity-50 ${
                errors.email ? 'border-[#EF4444]' : 'border-[var(--border-default)]'
              }`}
            />
            {errors.email && (
              <span className="mt-1 block text-xs font-medium text-[#EF4444]">
                {errors.email}
              </span>
            )}
          </div>

          {/* Phone Field */}
          <div>
            <label htmlFor="edit-phone" className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Phone Number <span className="text-[#EF4444]">*</span>
            </label>
            <input
              id="edit-phone"
              name="phone"
              type="text"
              value={form.phone}
              onChange={handleChange}
              placeholder="e.g. 0712345678 or +94712345678"
              disabled={submitting}
              className={`block w-full rounded-xl border bg-[var(--bg-secondary)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition focus:border-[#E3511B] focus:ring-1 focus:ring-[#E3511B] disabled:opacity-50 ${
                errors.phone ? 'border-[#EF4444]' : 'border-[var(--border-default)]'
              }`}
            />
            {errors.phone && (
              <span className="mt-1 block text-xs font-medium text-[#EF4444]">
                {errors.phone}
              </span>
            )}
          </div>

          {/* Address Field */}
          <div>
            <label htmlFor="edit-address" className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Address <span className="text-[#EF4444]">*</span>
            </label>
            <textarea
              id="edit-address"
              name="address"
              rows={3}
              value={form.address}
              onChange={handleChange}
              placeholder="e.g. 123 Solar Way, Colombo 03"
              disabled={submitting}
              className={`block w-full rounded-xl border bg-[var(--bg-secondary)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition focus:border-[#E3511B] focus:ring-1 focus:ring-[#E3511B] disabled:opacity-50 ${
                errors.address ? 'border-[#EF4444]' : 'border-[var(--border-default)]'
              }`}
            />
            {errors.address && (
              <span className="mt-1 block text-xs font-medium text-[#EF4444]">
                {errors.address}
              </span>
            )}
          </div>

          <div className="flex flex-col-reverse justify-end gap-3 border-t border-[var(--border-subtle)] pt-5 sm:flex-row">
            <button
              type="button"
              onClick={handleCancel}
              disabled={submitting}
              className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-4 py-2.5 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#E3511B] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#E3511B]/20 transition hover:bg-[#F05A20] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProsumerModal;
