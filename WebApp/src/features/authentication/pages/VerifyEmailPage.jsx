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

export const VerifyEmailPage = () => {
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

  const handleCompleteRegistration = async (event) => {
    event.preventDefault();
    setError('');

    const validationErrors = validateNewPassword({ password, confirmPassword, token });
    setFieldErrors(validationErrors);
    if (hasValidationErrors(validationErrors)) {
      setError(firstValidationMessage(validationErrors));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${appConfig.apiBaseUrl}/auth/complete-registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setSuccess(data.message || 'Your account setup is complete. You can now sign in.');
        setPassword('');
        setConfirmPassword('');
      } else {
        setError(getApiValidationMessage(data, 'Unable to complete account setup. The link may be invalid or expired.'));
      }
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-app)] px-4 py-8 sm:py-14 text-[var(--text-primary)]">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-[var(--shadow-modal)]">
          <div className="mb-6 flex flex-col items-center justify-center text-center">
            <Logo size="lg" showText={false} />
            <h1 className="mt-3 text-2xl font-black text-[var(--text-primary)]">Set Up Your Account</h1>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {email ? `Verify ${email} and create your password` : 'Verify your email and create your password'}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-3.5 text-xs text-[#EF4444]">
              {error}
            </div>
          )}

          {success ? (
            <div className="space-y-4 text-center">
              <div className="rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/10 p-4 text-sm font-semibold text-[#22C55E]">
                {success}
              </div>
              <Link
                to={ROUTES.LOGIN}
                className="inline-flex w-full items-center justify-center rounded-xl bg-[#E3511B] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#F05A20]"
              >
                Go to Sign In →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleCompleteRegistration} className="space-y-4">
              <div>
                <label htmlFor="setup-password" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Create Password <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  id="setup-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setFieldErrors((current) => ({ ...current, password: undefined }));
                    setError('');
                  }}
                  className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none transition focus:border-[#E3511B]"
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby="setup-password-requirements"
                />
                {fieldErrors.password && (
                  <p className="mt-1 text-xs font-semibold text-[#EF4444]">{fieldErrors.password}</p>
                )}
              </div>

              <div id="setup-password-requirements" className="grid grid-cols-2 gap-1 text-xs text-[var(--text-muted)]">
                <span className={passwordRequirements.length ? 'text-[#22C55E]' : ''}>✓ 8–128 characters</span>
                <span className={passwordRequirements.uppercase ? 'text-[#22C55E]' : ''}>✓ Uppercase letter</span>
                <span className={passwordRequirements.lowercase ? 'text-[#22C55E]' : ''}>✓ Lowercase letter</span>
                <span className={passwordRequirements.number ? 'text-[#22C55E]' : ''}>✓ Number</span>
              </div>

              <div>
                <label htmlFor="setup-confirm-password" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Confirm Password <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  id="setup-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    setFieldErrors((current) => ({ ...current, confirmPassword: undefined }));
                    setError('');
                  }}
                  className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none transition focus:border-[#E3511B]"
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  aria-invalid={Boolean(fieldErrors.confirmPassword)}
                  aria-describedby={fieldErrors.confirmPassword ? 'setup-confirm-error' : undefined}
                />
                {fieldErrors.confirmPassword && (
                  <p id="setup-confirm-error" className="mt-1 text-xs font-semibold text-[#EF4444]">
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(event) => setShowPassword(event.target.checked)}
                  className="h-4 w-4 rounded border-[var(--border-default)] accent-[#E3511B]"
                />
                Show passwords
              </label>

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full rounded-xl bg-[#E3511B] py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-[#F05A20] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Completing Setup...' : 'Verify Email & Create Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
