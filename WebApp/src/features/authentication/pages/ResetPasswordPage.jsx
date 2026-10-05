import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import appConfig from '../../../config/appConfig';
import { ROUTES } from '../../../constants/routes.js';
import { Logo } from '../../../components/common/Logo.jsx';
import {
  firstValidationMessage,
  getApiValidationMessage,
  getPasswordRequirements,
  hasValidationErrors,
  validateNewPassword,
} from '../utils/authValidation.js';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState('');
  const passwordRequirements = getPasswordRequirements(password);

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationErrors = validateNewPassword({ password, confirmPassword, token });
    setFieldErrors(validationErrors);
    if (hasValidationErrors(validationErrors)) {
      setError(firstValidationMessage(validationErrors));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${appConfig.apiBaseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setSuccess(data.message || 'Password successfully reset!');
      } else {
        setError(getApiValidationMessage(data, 'Failed to reset password. The link may have expired.'));
      }
    } catch {
      setError('Unable to reach server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-app)] px-4 py-8 sm:py-14">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="mb-6 flex flex-col items-center justify-center text-center">
            <Logo size="lg" showText={false} />
            <h1 className="mt-3 text-2xl font-black text-slate-900">Set New Password</h1>
            <p className="mt-1 text-xs text-slate-500">
              {email ? `Resetting credentials for ${email}` : 'Enter your new secure password'}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
              {error}
            </div>
          )}

          {success ? (
            <div className="space-y-4 text-center">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
                {success}
              </div>
              <Link
                to={ROUTES.LOGIN}
                className="inline-flex w-full items-center justify-center rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-400"
              >
                Go to Sign In →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFieldErrors((current) => ({ ...current, password: undefined }));
                    setError('');
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-amber-500 outline-none transition"
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby="reset-password-requirements"
                />
                {fieldErrors.password && <p className="mt-1 text-xs font-semibold text-rose-600">{fieldErrors.password}</p>}
              </div>

              <div id="reset-password-requirements" className="grid grid-cols-2 gap-1 text-xs text-slate-600">
                <span className={passwordRequirements.length ? 'text-emerald-700' : ''}>✓ 8–128 characters</span>
                <span className={passwordRequirements.uppercase ? 'text-emerald-700' : ''}>✓ Uppercase letter</span>
                <span className={passwordRequirements.lowercase ? 'text-emerald-700' : ''}>✓ Lowercase letter</span>
                <span className={passwordRequirements.number ? 'text-emerald-700' : ''}>✓ Number</span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setFieldErrors((current) => ({ ...current, confirmPassword: undefined }));
                    setError('');
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-amber-500 outline-none transition"
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  aria-invalid={Boolean(fieldErrors.confirmPassword)}
                  aria-describedby={fieldErrors.confirmPassword ? 'reset-confirm-error' : undefined}
                />
                {fieldErrors.confirmPassword && (
                  <p id="reset-confirm-error" className="mt-1 text-xs font-semibold text-rose-600">
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(event) => setShowPassword(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-amber-500"
                />
                Show passwords
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-slate-950 shadow-xs transition hover:bg-amber-400 disabled:opacity-50"
              >
                {loading ? 'Updating Password...' : 'Reset Password'}
              </button>

              <div className="text-center pt-2">
                <Link to={ROUTES.LOGIN} className="text-xs font-semibold text-slate-500 hover:text-slate-900">
                  ← Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
