import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import appConfig from '../../../config/appConfig';
import { AuthContext } from '../context/AuthContextValue.js';
import { ROUTES } from '../../../constants/routes';
import { Logo } from '../../../components/common/Logo.jsx';

export const LoginPage = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const userData = await login(username, password);
      if (userData?.role === 'Backoffice') {
        navigate(ROUTES.ADMIN_SETTINGS);
      } else if (userData?.role === 'GridOperator') {
        navigate(ROUTES.ENERGY_SLOT_RESERVATIONS);
      } else {
        navigate(ROUTES.HOME);
      }
    } catch {
      setError("Invalid username or password");
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotMessage('');
    setForgotLoading(true);

    try {
      const response = await fetch(`${appConfig.apiBaseUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setForgotMessage(data.message || 'If an account exists, a password reset link has been dispatched to your email.');
      } else {
        setForgotError(data.message || 'Failed to request password reset.');
      }
    } catch {
      setForgotError('Could not reach the server.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-10 sm:py-16">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-7 sm:p-8 shadow-[var(--shadow-modal)]">
          <div className="mb-6 flex flex-col items-center justify-center text-center">
            <Logo size="lg" />
            <h1 className="mt-4 text-xl font-extrabold text-[var(--text-primary)]">
              Staff Portal Access
            </h1>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Sign in with authorized credentials to access grid trading and node operations
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-3 text-xs font-semibold text-[#EF4444]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-username" className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                Username
              </label>
              <input
                id="login-username"
                type="text"
                className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition focus:border-[#E3511B] focus:ring-1 focus:ring-[#E3511B]"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter staff username"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotMessage('');
                    setForgotError('');
                    setShowForgotModal(true);
                  }}
                  className="text-xs font-semibold text-[#E3511B] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="login-password"
                type="password"
                className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition focus:border-[#E3511B] focus:ring-1 focus:ring-[#E3511B]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="mt-2 w-full rounded-xl bg-[#E3511B] py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#F05A20]"
            >
              Sign In to Dashboard
            </button>
          </form>
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-modal)]">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3 mb-4">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Reset Your Password</h3>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)] mb-4">
              Enter your registered email address. We will send you a secure link to reset your credentials.
            </p>

            {forgotError && (
              <div className="mb-3 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-3 text-xs text-[#EF4444]">
                {forgotError}
              </div>
            )}

            {forgotMessage ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/10 p-4 text-xs font-semibold text-[#22C55E]">
                  {forgotMessage}
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-full rounded-xl bg-[#E3511B] py-2.5 text-xs font-bold text-white transition hover:bg-[#F05A20]"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label htmlFor="forgot-email" className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                    Email Address <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    placeholder="e.g. user@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3.5 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[#E3511B]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="rounded-xl bg-[#E3511B] px-5 py-2 text-xs font-bold text-white transition hover:bg-[#F05A20] disabled:opacity-50"
                  >
                    {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
