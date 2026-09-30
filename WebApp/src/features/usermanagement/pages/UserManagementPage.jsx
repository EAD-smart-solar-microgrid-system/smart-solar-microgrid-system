import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import appConfig from '../../../config/appConfig';
import { AuthContext } from '../../authentication/context/AuthContextValue.js';
import { ProsumerManagementPage } from '../../prosumermanagement/pages/ProsumerManagementPage.jsx';

export const UserManagementPage = () => {
  const { token } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [pendingProsumerCount, setPendingProsumerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ username: '', password: '', role: 'Backoffice', email: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [accountSearch, setAccountSearch] = useState('');

  // Broadcast modal state
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTargetRole, setBroadcastTargetRole] = useState('All');
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastFeedback, setBroadcastFeedback] = useState('');

  // Active sub-navigation tab: 'accounts' | 'prosumers' | 'create'
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'prosumers' || tabParam === 'solar-prosumers') return 'prosumers';
      if (tabParam === 'create' || params.get('action') === 'create' || window.location.hash === '#create') return 'create';
      if (tabParam === 'accounts' || tabParam === 'directory') return 'accounts';
    }
    return 'accounts';
  });

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setError('');
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', newTab);
      url.searchParams.delete('action');
      window.history.replaceState({}, '', url.toString());
    }
  };

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

    if (token) {
      fetch(`${appConfig.apiBaseUrl}/admin/prosumers`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          const pending = Array.isArray(data)
            ? data.filter((p) => p.status === 'Pending' || p.status === 'PendingActivation').length
            : 0;
          setPendingProsumerCount(pending);
        })
        .catch(() => {});
    }
  }, [fetchUsers, token]);

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ username: '', password: '', role: 'Backoffice', email: '' });
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
          body: JSON.stringify({
            username: form.username,
            role: form.role,
            email: form.email,
          }),
        });
        if (response.ok) {
          const roleTitle = form.role === 'Backoffice' ? 'Administrator' : 'Grid Operator';
          setSuccessMsg(`User '${form.username}' updated successfully as ${roleTitle}!`);
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
          const roleTitle = form.role === 'Backoffice' ? 'Administrator (Full Admin Privileges)' : 'Grid Operator';
          const emailNotice = form.email ? ` Credentials email sent to ${form.email}.` : '';
          setSuccessMsg(`New ${roleTitle} account '${form.username}' created successfully!${emailNotice}`);
          setForm({ username: '', password: '', role: 'Backoffice', email: '' });
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

  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    setBroadcastLoading(true);
    setBroadcastFeedback('');

    try {
      const response = await fetch(`${appConfig.apiBaseUrl}/admin/users/broadcast-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          subject: broadcastSubject,
          message: broadcastMessage,
          targetRole: broadcastTargetRole === 'All' ? null : broadcastTargetRole,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setBroadcastFeedback(data.message || 'Broadcast email dispatched successfully!');
        setBroadcastSubject('');
        setBroadcastMessage('');
      } else {
        setBroadcastFeedback(data.message || 'Failed to dispatch broadcast email.');
      }
    } catch {
      setBroadcastFeedback('Could not connect to backend server.');
    } finally {
      setBroadcastLoading(false);
    }
  };

  const isUserActive = (status) => {
    return status === 0 || status === '0' || status === 'Active';
  };

  const isBackofficeRole = (role) => {
    return role === 0 || role === '0' || role === 'Backoffice';
  };

  const getRoleLabel = (role) => {
    if (isBackofficeRole(role)) return 'Administrator';
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
      role: isBackofficeRole(user.role) ? 'Backoffice' : 'GridOperator',
      email: user.email || '',
    });
    setError('');
    setSuccessMsg('');
    handleTabChange('create');
  };

  // Quick stats
  const totalCount = users.length;
  const adminCount = users.filter((u) => isBackofficeRole(u.role)).length;
  const operatorCount = users.filter((u) => u.role === 1 || u.role === '1' || u.role === 'GridOperator').length;

  // Filtered users for directory search
  const filteredUsers = useMemo(() => {
    const q = accountSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const uname = (u.username || '').toLowerCase();
      const uemail = (u.email || '').toLowerCase();
      const role = getRoleLabel(u.role).toLowerCase();
      return uname.includes(q) || uemail.includes(q) || role.includes(q);
    });
  }, [users, accountSearch]);

  return (
    <div className="space-y-6">
      {/* SUB-NAVIGATION & QUICK STATS BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Tab 1: Admin Settings & Accounts */}
          <button
            type="button"
            onClick={() => handleTabChange('accounts')}
            className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-bold transition shadow-xs ${
              activeTab === 'accounts'
                ? 'bg-slate-900 text-white shadow-slate-900/10'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <svg
              className={`h-4 w-4 ${activeTab === 'accounts' ? 'text-amber-400' : 'text-slate-400'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>Admin Settings &amp; Accounts</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                activeTab === 'accounts' ? 'bg-slate-800 text-amber-300' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {totalCount}
            </span>
          </button>

          {/* Tab 2: Solar Prosumers */}
          <button
            type="button"
            onClick={() => handleTabChange('prosumers')}
            className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-bold transition shadow-xs ${
              activeTab === 'prosumers'
                ? 'bg-slate-900 text-white shadow-slate-900/10'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <svg
              className={`h-4 w-4 ${activeTab === 'prosumers' ? 'text-amber-400' : 'text-amber-500'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>Solar Prosumers</span>
            {pendingProsumerCount > 0 ? (
              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-black text-slate-950 animate-pulse">
                {pendingProsumerCount} Pending
              </span>
            ) : (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  activeTab === 'prosumers' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-500'
                }`}
              >
                Directory
              </span>
            )}
          </button>

          {/* Tab 3: Create New Administrator Account */}
          <button
            type="button"
            onClick={() => handleTabChange('create')}
            className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-bold transition shadow-xs ${
              activeTab === 'create'
                ? 'bg-amber-500 text-slate-950 font-black ring-2 ring-amber-400/50 shadow-amber-500/20'
                : 'border border-amber-300/80 bg-amber-50/70 text-amber-900 hover:bg-amber-100'
            }`}
          >
            {editingId ? (
              <>
                <svg className="h-4 w-4 text-amber-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit Account: {form.username}</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span>Create New Administrator Account</span>
              </>
            )}
          </button>
        </div>

        {/* SUMMARY STAT BADGES */}
        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-center shadow-xs">
            <span className="text-sm font-black text-slate-900 mr-1.5">{totalCount}</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Users</span>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-1.5 text-center shadow-xs">
            <span className="text-sm font-black text-amber-700 mr-1.5">{adminCount}</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">Admins</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-center shadow-xs">
            <span className="text-sm font-black text-slate-700 mr-1.5">{operatorCount}</span>
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
          <button type="button" onClick={() => setError('')} className="ml-auto text-rose-500 hover:text-rose-800">
            ✕
          </button>
        </div>
      )}

      {/* SECTION 1: ADMIN SETTINGS & ACCOUNTS ONLY */}
      {activeTab === 'accounts' && (
        <div className="space-y-5">
          {/* User Directory Table Card */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Staff &amp; Administrator Directory
                </h3>
                <p className="text-xs text-slate-500">
                  All registered administrators and grid operators configured in system settings.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search accounts or emails..."
                    value={accountSearch}
                    onChange={(e) => setAccountSearch(e.target.value)}
                    className="w-44 sm:w-56 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 pl-8 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 outline-none transition"
                  />
                  <svg className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* Broadcast Announcement Button */}
                <button
                  type="button"
                  onClick={() => {
                    setBroadcastFeedback('');
                    setShowBroadcastModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                  title="Send email announcement to all users"
                >
                  <span>📢 Broadcast Mail</span>
                </button>

                {/* Refresh */}
                <button
                  type="button"
                  onClick={fetchUsers}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition shadow-2xs"
                  title="Refresh users directory"
                >
                  <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
                </button>

                {/* Create shortcut button */}
                <button
                  type="button"
                  onClick={() => handleTabChange('create')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 transition hover:bg-amber-400 shadow-xs"
                >
                  <span>+ Create Admin</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th scope="col" className="py-3.5 pl-6 pr-4">User</th>
                    <th scope="col" className="py-3.5 px-4">Role &amp; Privilege Level</th>
                    <th scope="col" className="py-3.5 px-4">Email Address</th>
                    <th scope="col" className="py-3.5 px-4">Status</th>
                    <th scope="col" className="py-3.5 pr-6 pl-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredUsers.map((user) => {
                    const active = isUserActive(user.status);
                    const isAdmin = isBackofficeRole(user.role);
                    const roleLabel = getRoleLabel(user.role);
                    const initials = user.username ? user.username.slice(0, 2).toUpperCase() : 'US';

                    return (
                      <tr key={user.id} className="transition hover:bg-slate-50/60">
                        {/* User */}
                        <td className="py-4 pl-6 pr-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                                isAdmin
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300 ring-2 ring-amber-400/20'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {initials}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900">{user.username}</span>
                                {isAdmin && (
                                  <span className="text-[10px] rounded bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.2">
                                    ADMIN
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400 font-mono">
                                ID: {user.id ? String(user.id).slice(-6) : '—'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Role & Privilege Level */}
                        <td className="py-4 px-4">
                          {isAdmin ? (
                            <div className="inline-flex flex-col">
                              <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/90 px-2.5 py-1 text-xs font-bold">
                                <svg className="h-3.5 w-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                Administrator (Full Access)
                              </span>
                              <span className="text-[10px] text-slate-400 mt-0.5 pl-1">
                                Governance &amp; Account Creation
                              </span>
                            </div>
                          ) : (
                            <div className="inline-flex flex-col">
                              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-1 text-xs font-medium">
                                <svg className="h-3.5 w-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                {roleLabel}
                              </span>
                              <span className="text-[10px] text-slate-400 mt-0.5 pl-1">
                                Station Ops &amp; QR Verification
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Email Address */}
                        <td className="py-4 px-4">
                          {user.email ? (
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-slate-900">{user.email}</span>
                              {user.isEmailVerified ? (
                                <span className="text-[10px] font-bold text-emerald-600">✓ Verified</span>
                              ) : (
                                <span className="text-[10px] text-slate-400">Unverified</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No email set</span>
                          )}
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

                  {filteredUsers.length === 0 && !loading && (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-sm text-slate-400">
                        {accountSearch ? 'No accounts matched your search.' : 'No users found in directory.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: SOLAR PROSUMERS ONLY */}
      {activeTab === 'prosumers' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <ProsumerManagementPage hideHeader={true} hideTabs={true} />
        </div>
      )}

      {/* SECTION 3: CREATE NEW ADMINISTRATOR ACCOUNT ONLY */}
      {activeTab === 'create' && (
        <div className="space-y-4">
          {successMsg && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-800 shadow-xs">
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{successMsg}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleTabChange('accounts')}
                  className="rounded-xl bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-800"
                >
                  View in Directory →
                </button>
                <button
                  type="button"
                  onClick={() => setSuccessMsg('')}
                  className="text-emerald-700 hover:text-emerald-950 text-base px-1"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 border border-amber-200/70 text-amber-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-800">
                      Admin Setting
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 mt-0.5">
                    {editingId ? `Edit Account Credentials` : 'Create New Administrator Account'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {editingId
                      ? `Updating profile and role permissions for '${form.username}'`
                      : 'Create an administrator with full platform control or a station grid operator.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {editingId ? (
                  <button
                    type="button"
                    onClick={() => {
                      cancelEdit();
                      handleTabChange('accounts');
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    ✕ Cancel Editing
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleTabChange('accounts')}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    ← Back to Accounts Directory
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={handleCreateOrUpdate} className="space-y-6">
              {/* STEP 1: SELECT PRIVILEGE & ROLE */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
                  Account Privilege Level &amp; Role <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Card 1: Administrator (Full Admin Privileges / Backoffice) */}
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, role: 'Backoffice' })}
                    className={`relative flex flex-col items-start rounded-2xl border p-4 text-left transition ${
                      form.role === 'Backoffice'
                        ? 'border-amber-500 bg-gradient-to-br from-amber-50/70 via-orange-50/30 to-white ring-2 ring-amber-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </span>
                        <span className="text-sm font-extrabold text-slate-900">Administrator</span>
                      </div>
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-black text-amber-800">
                        Full Admin Privileges
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-2.5">
                      Complete governance level. Admins can create additional admins, manage operators, activate prosumers, and configure stations.
                    </p>
                    <div className="space-y-1 text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-600 font-bold">✓</span>
                        <span>Create &amp; manage other Admin accounts</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-600 font-bold">✓</span>
                        <span>Review &amp; activate mobile Solar Prosumers</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-600 font-bold">✓</span>
                        <span>Full access to stations, slots &amp; audit trails</span>
                      </div>
                    </div>
                  </button>

                  {/* Card 2: Grid Operator */}
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, role: 'GridOperator' })}
                    className={`relative flex flex-col items-start rounded-2xl border p-4 text-left transition ${
                      form.role === 'GridOperator'
                        ? 'border-slate-800 bg-gradient-to-br from-slate-50 via-slate-100/50 to-white ring-2 ring-slate-800/10 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </span>
                        <span className="text-sm font-extrabold text-slate-900">Grid Operator</span>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                        Station Operations
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-2.5">
                      Operational level. Operators manage physical battery swapping stations, monitor charging slots, and verify prosumer QR tokens.
                    </p>
                    <div className="space-y-1 text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-700 font-bold">✓</span>
                        <span>Scan &amp; verify Prosumer QR dispatch tokens</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-700 font-bold">✓</span>
                        <span>Manage physical station battery charging slots</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-700 font-bold">✓</span>
                        <span>Monitor live energy dispatch &amp; reservations</span>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* STEP 2: CREDENTIALS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Username */}
                <div>
                  <label htmlFor="user-username" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Username <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="user-username"
                    type="text"
                    placeholder={form.role === 'Backoffice' ? 'e.g. admin_lead, sarah_gov' : 'e.g. operator_colombo, john_ops'}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="user-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    {editingId ? 'Password (Leave blank to keep unchanged)' : 'Initial Password'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="user-password"
                    type="password"
                    placeholder={editingId ? '••••••••' : 'Enter secure password'}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required={!editingId}
                    disabled={Boolean(editingId)}
                  />
                </div>

                {/* Email Address */}
                <div className="sm:col-span-2">
                  <label htmlFor="user-email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Email Address (For Credential Delivery &amp; Notifications)
                  </label>
                  <input
                    id="user-email"
                    type="email"
                    placeholder="e.g. ravindusdc@gmail.com, staff@microgrid.lk"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition"
                    value={form.email || ''}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    When provided, an automated email with their role, username, and temporary password will be dispatched to this address.
                  </span>
                </div>
              </div>

              {/* ROLE CONFIRMATION HINT */}
              <div
                className={`flex items-start gap-2.5 rounded-xl p-3 text-xs ${
                  form.role === 'Backoffice'
                    ? 'border border-amber-200 bg-amber-50/60 text-amber-900'
                    : 'border border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                <span className="text-base shrink-0">{form.role === 'Backoffice' ? '🛡️' : '⚡'}</span>
                <div>
                  <strong>{form.role === 'Backoffice' ? 'Creating Administrator Account:' : 'Creating Grid Operator Account:'}</strong>{' '}
                  {form.role === 'Backoffice'
                    ? 'This user will be assigned the Backoffice role with full admin privileges, including the authority to create and manage other admin accounts and activate prosumers.'
                    : 'This user will be assigned the GridOperator role with operational permissions to manage battery charging stations and verify tokens.'}
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center justify-end gap-3 pt-1">
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      cancelEdit();
                      handleTabChange('accounts');
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-bold text-slate-950 shadow-xs transition hover:bg-amber-400 hover:shadow-sm"
                >
                  {editingId ? (
                    <span>Save Account Changes</span>
                  ) : form.role === 'Backoffice' ? (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>Create Administrator Account</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Create Grid Operator Account</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BROADCAST ANNOUNCEMENT MODAL */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">📢</span>
                <h3 className="text-base font-bold text-slate-900">Broadcast Email Announcement</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Send a system-wide announcement, maintenance notification, or update directly to all registered users and prosumers.
            </p>

            {broadcastFeedback && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800">
                {broadcastFeedback}
              </div>
            )}

            <form onSubmit={handleBroadcastSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Target Recipient Group
                </label>
                <select
                  value={broadcastTargetRole}
                  onChange={(e) => setBroadcastTargetRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
                >
                  <option value="All">All Platform Users &amp; Solar Prosumers</option>
                  <option value="Backoffice">Administrators Only</option>
                  <option value="GridOperator">Grid Operators Only</option>
                  <option value="Prosumer">Solar Prosumers Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Subject Line <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Scheduled Station Maintenance Notice"
                  value={broadcastSubject}
                  onChange={(e) => setBroadcastSubject(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 focus:bg-white focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Message Content <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Type your announcement or update here..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 focus:bg-white focus:border-amber-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={broadcastLoading}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
                >
                  {broadcastLoading ? 'Dispatching Mail...' : 'Send Broadcast Email 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
