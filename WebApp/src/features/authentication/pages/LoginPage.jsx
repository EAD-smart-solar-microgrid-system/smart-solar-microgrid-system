import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContextValue.js';
import { ROUTES } from '../../../constants/routes';
import { Logo } from '../../../components/common/Logo.jsx';

export const LoginPage = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const userData = await login(username, password);
      if (userData?.role === 'Backoffice') {
        navigate(ROUTES.USER_MANAGEMENT);
      } else {
        navigate(ROUTES.STATIONS);
      }
    } catch {
      setError("Invalid username or password");
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
                <input id="login-username" type="text" className="form-control" value={username} onChange={e => setUsername(e.target.value)} required />
              </div>
              <div>
                <label htmlFor="login-password" className="form-label">Password</label>
                <input id="login-password" type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary w-full">Sign in</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
