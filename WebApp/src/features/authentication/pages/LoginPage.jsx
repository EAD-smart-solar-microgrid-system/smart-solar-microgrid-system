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
      } else {
        navigate(ROUTES.STATIONS);
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
    <div className="legacy-page flex justify-center py-6 sm:py-10">
      <div className="col-md-4">
        <div className="card w-full max-w-md shadow-md border border-slate-200/80">
          <div className="card-body">
            <div className="mb-4 flex flex-col items-center justify-center text-center">
              <Logo size="lg" showText={false} />
              <h1 className="mt-3 text-xl font-bold text-slate-900">Sign in to Smart Solar Microgrid</h1>
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-username" className="form-label">Username</label>
                <input
                  id="login-username"
                  type="text"
                  className="form-control"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="form-label mb-0">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotMessage('');
                      setForgotError('');
                      setShowForgotModal(true);
                    }}
                    className="text-xs font-semibold text-amber-600 hover:text-amber-700"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  id="login-password"
                  type="password"
                  className="form-control mt-1"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-full">Sign in</button>
            </form>
          </div>
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">Reset Your Password</h3>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Enter your registered email address. We will send you a secure link to reset your credentials.
            </p>

            {forgotError && (
              <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                {forgotError}
              </div>
            )}

            {forgotMessage ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
                  {forgotMessage}
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label htmlFor="forgot-email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    placeholder="e.g. user@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 focus:bg-white focus:border-amber-500 outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
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
