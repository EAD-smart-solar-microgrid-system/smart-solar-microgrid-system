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
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 px-4 py-8"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && handleCancel()}
    >
      <div
        className="mx-auto max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-prosumer-title"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-600">
              Solar Prosumer
            </p>
            <h2 id="edit-prosumer-title" className="mt-1 text-2xl font-bold text-slate-950">
              Edit Prosumer
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Update contact information and registered address for this prosumer.
            </p>
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
            className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
            role="alert"
          >
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* NIC Field (Read-only / Immutable) */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="edit-nic" className="block text-sm font-semibold text-slate-700">
                National Identity Card (NIC)
              </label>
              <span className="text-xs font-medium text-slate-400">Immutable</span>
            </div>
            <input
              id="edit-nic"
              name="nic"
              type="text"
              value={prosumer.nic}
              disabled
              readOnly
              className="mt-1.5 block w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 font-mono text-sm text-slate-600 shadow-sm outline-none"
            />
            <p className="mt-1 text-xs text-slate-400">
              The NIC is the primary identifier for this prosumer profile and cannot be changed.
            </p>
          </div>

          {/* Full Name Field */}
          <div>
            <label htmlFor="edit-fullName" className="block text-sm font-semibold text-slate-700">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="edit-fullName"
              name="fullName"
              type="text"
              value={form.fullName}
              onChange={handleChange}
              placeholder="e.g. Ruwan Silva"
              disabled={submitting}
              className={`mt-1.5 block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 ${
                errors.fullName ? 'border-rose-400' : 'border-slate-300'
              }`}
            />
            {errors.fullName && (
              <span className="mt-1 block text-xs font-medium text-rose-600">
                {errors.fullName}
              </span>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="edit-email" className="block text-sm font-semibold text-slate-700">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              id="edit-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="e.g. ruwan@example.com"
              disabled={submitting}
              className={`mt-1.5 block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 ${
                errors.email ? 'border-rose-400' : 'border-slate-300'
              }`}
            />
            {errors.email && (
              <span className="mt-1 block text-xs font-medium text-rose-600">
                {errors.email}
              </span>
            )}
          </div>

          {/* Phone Field */}
          <div>
            <label htmlFor="edit-phone" className="block text-sm font-semibold text-slate-700">
              Phone Number <span className="text-rose-500">*</span>
            </label>
            <input
              id="edit-phone"
              name="phone"
              type="text"
              value={form.phone}
              onChange={handleChange}
              placeholder="e.g. 0712345678 or +94712345678"
              disabled={submitting}
              className={`mt-1.5 block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 ${
                errors.phone ? 'border-rose-400' : 'border-slate-300'
              }`}
            />
            {errors.phone && (
              <span className="mt-1 block text-xs font-medium text-rose-600">
                {errors.phone}
              </span>
            )}
          </div>

          {/* Address Field */}
          <div>
            <label htmlFor="edit-address" className="block text-sm font-semibold text-slate-700">
              Address <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="edit-address"
              name="address"
              rows={3}
              value={form.address}
              onChange={handleChange}
              placeholder="e.g. 123 Solar Way, Colombo 03"
              disabled={submitting}
              className={`mt-1.5 block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 ${
                errors.address ? 'border-rose-400' : 'border-slate-300'
              }`}
            />
            {errors.address && (
              <span className="mt-1 block text-xs font-medium text-rose-600">
                {errors.address}
              </span>
            )}
          </div>

          <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-200 pt-4 sm:flex-row">
            <button
              type="button"
              onClick={handleCancel}
              disabled={submitting}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
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
