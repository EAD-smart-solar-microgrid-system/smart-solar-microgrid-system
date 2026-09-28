import React, { useCallback, useContext, useEffect, useState } from 'react';
import appConfig from '../../../config/appConfig';
import { AuthContext } from '../../authentication/context/AuthContextValue.js';

export const UserManagementPage = () => {
  const { token } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ username: '', password: '', role: 'GridOperator' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${appConfig.apiBaseUrl}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch {
      setError('Unable to load users directory.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ username: '', password: '', role: 'GridOperator' });
    setError('');
  };

  const handleCreateOrUpdate = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMsg('');

    if (editingId) {
      try {
        const response = await fetch(`${appConfig.apiBaseUrl}/admin/users/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ username: form.username, role: form.role }),
        });
        if (response.ok) {
          setSuccessMsg(`User '${form.username}' updated successfully!`);
          cancelEdit();
          fetchUsers();
        } else {
          setError('Failed to update user.');
        }
      } catch {
        setError('Error connecting to server.');
      }
    } else {
      try {
        const response = await fetch(`${appConfig.apiBaseUrl}/admin/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(form),
        });
        if (response.ok) {
          setSuccessMsg(`User '${form.username}' created successfully!`);
          setForm({ username: '', password: '', role: 'GridOperator' });
          fetchUsers();
        } else {
          const errData = await response.json().catch(() => null);
          setError(errData?.message || 'Failed to create user. Username might already exist.');
        }
      } catch {
        setError('Error connecting to server.');
      }
    }
  };

  const isUserActive = (status) => {
    return status === 0 || status === '0' || status === 'Active';
  };

  const getRoleLabel = (role) => {
    if (role === 0 || role === '0' || role === 'Backoffice') return 'Backoffice Admin';
    if (role === 1 || role === '1' || role === 'GridOperator') return 'Grid Operator';
    return String(role);
  };

  const toggleStatus = async (id, currentStatus) => {
    const active = isUserActive(currentStatus);
    const newStatus = active ? 'Deactivated' : 'Active';

    try {
      const response = await fetch(`${appConfig.apiBaseUrl}/admin/users/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        setSuccessMsg(`Account status changed to ${newStatus}.`);
        fetchUsers();
      } else {
        setError('Failed to update user status.');
      }
    } catch {
      setError('Error connecting to server.');
    }
  };

  const startEdit = (user) => {
    setEditingId(user.id);
    setForm({
      username: user.username,
      password: '',
      role: user.role === 0 || user.role === '0' || user.role === 'Backoffice' ? 'Backoffice' : 'GridOperator',
    });
    setError('');
    setSuccessMsg('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Quick stats
  const totalCount = users.length;
  const backofficeCount = users.filter((u) => u.role === 0 || u.role === '0' || u.role === 'Backoffice').length;
  const operatorCount = users.filter((u) => u.role === 1 || u.role === '1' || u.role === 'GridOperator').length;

  return (
    <div className="space-y-8">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-600">
            Administration & Governance
          </span>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            User Management
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Manage administrative backoffice staff and station grid operator access credentials.
          </p>
        </div>

        {/* SUMMARY STAT BADGES */}
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-center shadow-xs">
            <span className="block text-xl font-black text-slate-900">{totalCount}</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Users</span>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-3.5 py-2 text-center shadow-xs">
            <span className="block text-xl font-black text-amber-700">{backofficeCount}</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">Backoffice</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-center shadow-xs">
            <span className="block text-xl font-black text-slate-700">{operatorCount}</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Operators</span>
          </div>
        </div>
      </div>

      {/* ALERT NOTIFICATIONS */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-800 shadow-xs">
          <svg className="h-5 w-5 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-800 shadow-xs">
          <svg className="h-5 w-5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {/* CREATE / EDIT USER CARD */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 border border-amber-200/70 text-amber-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editingId ? `Edit User Credentials` : 'Create New System User'}
              </h2>
              <p className="text-xs text-slate-500">
                {editingId
                  ? `Updating profile and role for '${form.username}'`
                  : 'Add a new backoffice administrator or station grid operator.'}
              </p>
            </div>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
            >
              ✕ Cancel Editing
            </button>
          )}
        </div>

        <form onSubmit={handleCreateOrUpdate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Username */}
            <div>
              <label htmlFor="user-username" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Username
              </label>
              <input
                id="user-username"
                type="text"
                placeholder="e.g. john_operator"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="user-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {editingId ? 'Password (Leave blank to keep)' : 'Password'}
              </label>
              <input
                id="user-password"
                type="password"
                placeholder={editingId ? '••••••••' : 'Enter password'}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={!editingId}
                disabled={Boolean(editingId)}
              />
            </div>

            {/* Role */}
            <div>
              <label htmlFor="user-role" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Assigned Role
              </label>
              <select
                id="user-role"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="GridOperator">Grid Operator (Station & Slots)</option>
                <option value="Backoffice">Backoffice (Full Governance)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-bold text-slate-950 shadow-xs transition hover:bg-amber-400 hover:shadow-sm"
            >
              {editingId ? 'Save Changes' : 'Create User Account'}
            </button>
          </div>
        </form>
      </div>

      {/* USER DIRECTORY TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              User Directory
            </h3>
            <p className="text-xs text-slate-500">
              All registered administrative and operator accounts in MongoDB.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchUsers}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition shadow-2xs"
          >
            <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th scope="col" className="py-3.5 pl-6 pr-4">User</th>
                <th scope="col" className="py-3.5 px-4">Role</th>
                <th scope="col" className="py-3.5 px-4">Status</th>
                <th scope="col" className="py-3.5 pr-6 pl-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {users.map((user) => {
                const active = isUserActive(user.status);
                const roleLabel = getRoleLabel(user.role);
                const isBackoffice = roleLabel.includes('Backoffice');
                const initials = user.username ? user.username.slice(0, 2).toUpperCase() : 'US';

                return (
                  <tr key={user.id} className="transition hover:bg-slate-50/60">
                    {/* User */}
                    <td className="py-4 pl-6 pr-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${isBackoffice ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                          {initials}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{user.username}</span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            ID: {user.id ? String(user.id).slice(-6) : '—'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${isBackoffice ? 'bg-amber-50 text-amber-900 border border-amber-200/80' : 'bg-slate-100 text-slate-800 border border-slate-200'}`}>
                        {isBackoffice ? (
                          <svg className="h-3.5 w-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        ) : (
                          <svg className="h-3.5 w-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        )}
                        {roleLabel}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      {active ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          Deactivated
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 pr-6 pl-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(user)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStatus(user.id, user.status)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                            active
                              ? 'border border-rose-200 bg-rose-50/60 text-rose-700 hover:bg-rose-100'
                              : 'border border-emerald-200 bg-emerald-50/60 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-sm text-slate-400">
                    No users found in directory.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;
