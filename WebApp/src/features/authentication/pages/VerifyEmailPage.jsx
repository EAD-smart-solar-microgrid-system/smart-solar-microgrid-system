import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import appConfig from '../../../config/appConfig';
import { ROUTES } from '../../../constants/routes.js';
import { Logo } from '../../../components/common/Logo.jsx';

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setMessage('Invalid or missing verification token.');
      return;
    }

    fetch(`${appConfig.apiBaseUrl}/auth/verify-email?token=${encodeURIComponent(token)}`, {
      method: 'POST',
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setSuccess(true);
          setMessage(data.message || 'Email verified successfully!');
        } else {
          setSuccess(false);
          setMessage(data.message || 'Failed to verify email. The link may be expired or already used.');
        }
      })
      .catch(() => {
        setSuccess(false);
        setMessage('Network error. Unable to verify email at this time.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  return (
    <div className="flex justify-center py-8 sm:py-14">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 text-center shadow-sm">
          <div className="mb-4 flex flex-col items-center justify-center">
            <Logo size="lg" showText={false} />
            <h1 className="mt-3 text-2xl font-black text-slate-900">Email Verification</h1>
            {email && <p className="mt-0.5 text-xs text-slate-500">{email}</p>}
          </div>

          {loading ? (
            <div className="py-6 text-sm font-semibold text-slate-500">
              Verifying your email token, please wait...
            </div>
          ) : (
            <div className="space-y-4">
              <div
                className={`rounded-xl p-4 text-sm font-medium ${
                  success
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border border-rose-200 bg-rose-50 text-rose-800'
                }`}
              >
                {message}
              </div>

              <Link
                to={ROUTES.LOGIN}
                className="inline-flex w-full items-center justify-center rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-400"
              >
                Proceed to Sign In →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
