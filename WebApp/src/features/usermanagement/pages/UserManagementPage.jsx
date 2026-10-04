import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import appConfig from '../../../config/appConfig';
import { AuthContext } from '../../authentication/context/AuthContextValue.js';
import { ProsumerManagementPage } from '../../prosumermanagement/pages/ProsumerManagementPage.jsx';
import { MaterialIcon } from '../../../components/common/MaterialIcon.jsx';

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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Tab 1: Admin Settings & Accounts */}
          <button
            type="button"
            onClick={() => handleTabChange('accounts')}
            className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-xs ${
              activeTab === 'accounts'
                ? 'border border-[#E3511B]/40 bg-[#E3511B]/10 text-[#E3511B]'
                : 'border border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <svg
              className={`h-4 w-4 ${activeTab === 'accounts' ? 'text-[#E3511B]' : 'text-[var(--text-muted)]'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>Admin Settings &amp; Accounts</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                activeTab === 'accounts' ? 'bg-[#E3511B] text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
              }`}
            >
              {totalCount}
            </span>
          </button>

          {/* Tab 2: Solar Prosumers */}
          <button
            type="button"
            onClick={() => handleTabChange('prosumers')}
            className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-xs ${
              activeTab === 'prosumers'
                ? 'border border-[#E3511B]/40 bg-[#E3511B]/10 text-[#E3511B]'
                : 'border border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <svg
              className={`h-4 w-4 ${activeTab === 'prosumers' ? 'text-[#E3511B]' : 'text-[var(--text-muted)]'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>Solar Prosumers</span>
            {pendingProsumerCount > 0 ? (
              <span className="rounded-full bg-[#F59E0B] px-2 py-0.5 text-[10px] font-black text-black animate-pulse">
                {pendingProsumerCount} Pending
              </span>
            ) : (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  activeTab === 'prosumers' ? 'bg-[#E3511B] text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
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
            className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-xs ${
              activeTab === 'create'
                ? 'bg-[#E3511B] text-white font-black'
                : 'border border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            {editingId ? (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit Account: {form.username}</span>
              </>
            ) : (
              <>
                <MaterialIcon name="add" size={15} className="text-white" />
                <span>Create New Administrator</span>
              </>
            )}
          </button>
        </div>

        {/* SUMMARY STAT BADGES */}
        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-center shadow-xs">
            <span className="text-xs font-black text-[var(--text-primary)] mr-1.5">{totalCount}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Users</span>
          </div>
          <div className="rounded-xl border border-[#E3511B]/30 bg-[#E3511B]/10 px-3 py-1.5 text-center shadow-xs">
            <span className="text-xs font-black text-[#E3511B] mr-1.5">{adminCount}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#E3511B]">Admins</span>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 py-1.5 text-center shadow-xs">
            <span className="text-xs font-black text-[var(--text-secondary)] mr-1.5">{operatorCount}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Operators</span>
          </div>
        </div>
      </div>

      {/* ALERT NOTIFICATIONS */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-[#ef5350]/30 bg-[#ef5350]/10 p-4 text-xs text-[#ef5350] shadow-sm">
          <svg className="h-5 w-5 shrink-0 text-[#ef5350]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">{error}</span>
          <button type="button" onClick={() => setError('')} className="ml-auto text-[#ef5350] hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* SECTION 1: ADMIN SETTINGS & ACCOUNTS ONLY */}
      {activeTab === 'accounts' && (
        <div className="space-y-5">
          <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-6 py-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Staff &amp; Administrator Directory
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
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
                    className="w-44 sm:w-56 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3 py-1.5 pl-8 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition focus:border-[#E3511B]"
                  />
                  <svg className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition shadow-xs"
                  title="Send email announcement to all users"
                >
                  <span>📢 Broadcast Mail</span>
                </button>

                {/* Refresh */}
                <button
                  type="button"
                  onClick={fetchUsers}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition"
                  title="Refresh users directory"
                >
                  <svg className="h-3.5 w-3.5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
                </button>

                {/* Create shortcut button */}
                <button
                  type="button"
                  onClick={() => handleTabChange('create')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#E3511B] px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-[#F05A20] shadow-xs"
                >
                  <span>+ Create Admin</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    <th scope="col" className="py-3.5 pl-6 pr-4">User</th>
                    <th scope="col" className="py-3.5 px-4">Role &amp; Privilege Level</th>
                    <th scope="col" className="py-3.5 px-4">Email Address</th>
                    <th scope="col" className="py-3.5 px-4">Status</th>
                    <th scope="col" className="py-3.5 pr-6 pl-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {filteredUsers.map((user) => {
                    const active = isUserActive(user.status);
                    const isAdmin = isBackofficeRole(user.role);
                    const roleLabel = getRoleLabel(user.role);
                    const initials = user.username ? user.username.slice(0, 2).toUpperCase() : 'US';

                    return (
                      <tr key={user.id} className="transition hover:bg-[var(--bg-hover)]">
                        {/* User */}
                        <td className="py-3.5 pl-6 pr-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                                isAdmin
                                  ? 'bg-[#E3511B]/10 text-[#E3511B] border border-[#E3511B]/30'
                                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-default)]'
                              }`}
                            >
                              {initials}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[var(--text-primary)]">{user.username}</span>
                                {isAdmin && (
                                  <span className="text-[10px] rounded bg-[#E3511B]/15 text-[#E3511B] font-extrabold px-1.5 py-0.5 border border-[#E3511B]/30">
                                    ADMIN
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-[var(--text-muted)] font-mono">
                                ID: {user.id ? String(user.id).slice(-6) : '—'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Role & Privilege Level */}
                        <td className="py-3.5 px-4">
                          {isAdmin ? (
                            <div className="inline-flex flex-col">
                              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#E3511B]/10 text-[#E3511B] border border-[#E3511B]/30 px-2.5 py-1 text-xs font-bold">
                                Administrator (Full Access)
                              </span>
                              <span className="text-[10px] text-[var(--text-muted)] mt-0.5 pl-1">
                                Governance &amp; Account Creation
                              </span>
                            </div>
                          ) : (
                            <div className="inline-flex flex-col">
                              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-default)] px-2.5 py-1 text-xs font-medium">
                                {roleLabel}
                              </span>
                              <span className="text-[10px] text-[var(--text-muted)] mt-0.5 pl-1">
                                Station Ops &amp; QR Verification
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Email Address */}
                        <td className="py-3.5 px-4">
                          {user.email ? (
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-[var(--text-primary)]">{user.email}</span>
                              {user.isEmailVerified ? (
                                <span className="text-[10px] font-bold text-[#22C55E]">✓ Verified</span>
                              ) : (
                                <span className="text-[10px] text-[var(--text-muted)]">Unverified</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-[var(--text-muted)] italic">No email set</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {active ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 px-2.5 py-1 text-xs font-semibold text-[#22C55E]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-default)] px-2.5 py-1 text-xs font-medium text-[var(--text-muted)]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-muted)]" />
                              Deactivated
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 pr-6 pl-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(user)}
                              className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] px-2.5 py-1 text-xs font-semibold text-[var(--text-primary)] hover:border-[#E3511B]/40 hover:text-[#E3511B] transition shadow-xs"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleStatus(user.id, user.status)}
                              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                                active
                                  ? 'border border-[#EF4444]/30 bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20'
                                  : 'border border-[#22C55E]/30 bg-[#22C55E]/10 text-[#22C55E] hover:bg-[#22C55E]/20'
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
                      <td colSpan="5" className="py-8 text-center text-xs text-[#738079]">
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
        <div className="rounded-2xl border border-white/7 bg-[#111715] p-6 shadow-lg">
          <ProsumerManagementPage hideHeader={true} hideTabs={true} />
        </div>
      )}

      {/* SECTION 3: CREATE NEW ADMINISTRATOR ACCOUNT ONLY */}
      {activeTab === 'create' && (
        <div className="space-y-4">
          {successMsg && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#22C55E]/30 bg-[#22C55E]/10 p-4 text-xs font-semibold text-[#22C55E] shadow-sm">
              <span>{successMsg}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleTabChange('accounts')}
                  className="rounded-xl bg-[#22C55E] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#16A34A]"
                >
                  View in Directory →
                </button>
                <button
                  type="button"
                  onClick={() => setSuccessMsg('')}
                  className="text-[#22C55E] hover:opacity-70 text-sm px-1"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4 mb-5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#E3511B]">
                  Admin Setting
                </span>
                <h2 className="text-base font-bold text-[var(--text-primary)] mt-0.5">
                  {editingId ? `Edit Account Credentials` : 'Create New Administrator Account'}
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  {editingId
                    ? `Updating profile and role permissions for '${form.username}'`
                    : 'Create an administrator with full platform control or a station grid operator.'}
                </p>
              </div>
              <div>
                {editingId ? (
                  <button
                    type="button"
                    onClick={() => {
                      cancelEdit();
                      handleTabChange('accounts');
                    }}
                    className="rounded-xl border border-white/10 bg-[#0d1210] px-3 py-1.5 text-xs font-semibold text-[#a0aaa5] hover:bg-white/5 hover:text-[#f4f7f6] transition"
                  >
                    ✕ Cancel Editing
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleTabChange('accounts')}
                    className="rounded-xl border border-white/10 bg-[#0d1210] px-3 py-1.5 text-xs font-semibold text-[#a0aaa5] hover:bg-white/5 hover:text-[#f4f7f6] transition"
                  >
                    ← Back to Accounts Directory
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={handleCreateOrUpdate} className="space-y-6">
              {/* STEP 1: SELECT PRIVILEGE & ROLE */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2.5">
                  Account Privilege Level &amp; Role <span className="text-[#EF4444]">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Card 1: Administrator (Full Admin Privileges / Backoffice) */}
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, role: 'Backoffice' })}
                    className={`relative flex flex-col items-start rounded-2xl border p-4 text-left transition ${
                      form.role === 'Backoffice'
                        ? 'border-[#E3511B] bg-[#E3511B]/5 ring-1 ring-[#E3511B]/30 shadow-sm'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-hover)]'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E3511B]/15 text-[#E3511B]">
                          🛡️
                        </span>
                        <span className="text-sm font-extrabold text-[var(--text-primary)]">Administrator</span>
                      </div>
                      <span className="rounded-full bg-[#E3511B]/20 px-2 py-0.5 text-[10px] font-black text-[#E3511B]">
                        Full Governance
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mb-2.5">
                      Complete governance level. Admins can create additional admins, manage operators, activate prosumers, and configure stations.
                    </p>
                    <div className="space-y-1 text-[11px] text-[var(--text-muted)]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#E3511B] font-bold">✓</span>
                        <span>Create &amp; manage other Admin accounts</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#E3511B] font-bold">✓</span>
                        <span>Review &amp; activate mobile Solar Prosumers</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#E3511B] font-bold">✓</span>
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
                        ? 'border-[#E3511B] bg-[#E3511B]/5 ring-1 ring-[#E3511B]/30 shadow-sm'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-hover)]'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                          ⚡
                        </span>
                        <span className="text-sm font-extrabold text-[var(--text-primary)]">Grid Operator</span>
                      </div>
                      <span className="rounded-full bg-[var(--bg-secondary)] px-2 py-0.5 text-[10px] font-bold text-[var(--text-muted)]">
                        Station Ops
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mb-2.5">
                      Operational level. Operators manage physical battery swapping stations, monitor charging slots, and verify prosumer QR tokens.
                    </p>
                    <div className="space-y-1 text-[11px] text-[var(--text-muted)]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#E3511B] font-bold">✓</span>
                        <span>Scan &amp; verify Prosumer QR dispatch tokens</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#E3511B] font-bold">✓</span>
                        <span>Manage physical station battery charging slots</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#E3511B] font-bold">✓</span>
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
                  <label htmlFor="user-username" className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                    Username <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    id="user-username"
                    type="text"
                    placeholder={form.role === 'Backoffice' ? 'e.g. admin_lead, sarah_gov' : 'e.g. operator_colombo, john_ops'}
                    className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition focus:border-[#E3511B]"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="user-password" className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                    {editingId ? 'Password (Leave blank to keep unchanged)' : 'Initial Password'} <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    id="user-password"
                    type="password"
                    placeholder={editingId ? '••••••••' : 'Enter secure password'}
                    className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition focus:border-[#E3511B]"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required={!editingId}
                    disabled={Boolean(editingId)}
                  />
                </div>

                {/* Email Address */}
                <div className="sm:col-span-2">
                  <label htmlFor="user-email" className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                    Email Address (For Credential Delivery &amp; Notifications)
                  </label>
                  <input
                    id="user-email"
                    type="email"
                    placeholder="e.g. staff@microgrid.lk"
                    className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition focus:border-[#E3511B]"
                    value={form.email || ''}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                  <span className="text-[11px] text-[var(--text-muted)] mt-1 block">
                    When provided, an automated email with their role, username, and temporary password will be dispatched to this address.
                  </span>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--border-subtle)]">
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      cancelEdit();
                      handleTabChange('accounts');
                    }}
                    className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-4 py-2.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition shadow-xs"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E3511B] px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#F05A20]"
                >
                  {editingId ? (
                    <span>Save Account Changes</span>
                  ) : form.role === 'Backoffice' ? (
                    <span>Create Administrator Account</span>
                  ) : (
                    <span>Create Grid Operator Account</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BROADCAST ANNOUNCEMENT MODAL */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-modal)]">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">📢</span>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Broadcast Email Announcement</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)] mb-4">
              Send a system-wide announcement, maintenance notification, or update directly to all registered users and prosumers.
            </p>

            {broadcastFeedback && (
              <div className="mb-4 rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/10 p-3.5 text-xs font-semibold text-[#22C55E]">
                {broadcastFeedback}
              </div>
            )}

            <form onSubmit={handleBroadcastSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Target Recipient Group
                </label>
                <select
                  value={broadcastTargetRole}
                  onChange={(e) => setBroadcastTargetRole(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3.5 py-2 text-xs font-semibold text-[var(--text-primary)] outline-none focus:border-[#E3511B]"
                >
                  <option value="All" className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">All Platform Users &amp; Solar Prosumers</option>
                  <option value="Backoffice" className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">Administrators Only</option>
                  <option value="GridOperator" className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">Grid Operators Only</option>
                  <option value="Prosumer" className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">Solar Prosumers Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Subject Line <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Scheduled Station Maintenance Notice"
                  value={broadcastSubject}
                  onChange={(e) => setBroadcastSubject(e.target.value)}
                  required
                  className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3.5 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[#E3511B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Message Content <span className="text-[#EF4444]">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Type your announcement or update here..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  required
                  className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3.5 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[#E3511B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={broadcastLoading}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#E3511B] px-5 py-2 text-xs font-bold text-white transition hover:bg-[#F05A20] disabled:opacity-50"
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
