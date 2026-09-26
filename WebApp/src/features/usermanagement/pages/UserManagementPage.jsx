import { useCallback, useContext, useEffect, useState } from 'react';
import appConfig from '../../../config/appConfig';
import { AuthContext } from '../../authentication/context/AuthContextValue.js';

export const UserManagementPage = () => {
  const { token } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: '', password: '', role: 'GridOperator' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchUsers = useCallback(async () => {
    const response = await fetch(`${appConfig.apiBaseUrl}/admin/users`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (response.ok) setUsers(await response.json());
  }, [token]);

  useEffect(() => {
    Promise.resolve().then(fetchUsers);
  }, [fetchUsers]);

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ username: '', password: '', role: 'GridOperator' });
  };

  const handleCreateOrUpdate = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMsg('');

    if (editingId) {
      const response = await fetch(`${appConfig.apiBaseUrl}/admin/users/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ username: form.username, role: form.role }),
      });
      if (response.ok) {
        setSuccessMsg('User updated successfully!');
        cancelEdit();
        fetchUsers();
      } else {
        setError('Failed to update user.');
      }
    } else {
      const response = await fetch(`${appConfig.apiBaseUrl}/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (response.ok) {
        setSuccessMsg('User created successfully!');
        setForm({ username: '', password: '', role: 'GridOperator' });
        fetchUsers();
      } else {
        setError('Failed to create user. Username might be taken.');
      }
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Deactivated' : 'Active';
    await fetch(`${appConfig.apiBaseUrl}/admin/users/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchUsers();
  };

  const startEdit = (user) => {
    setEditingId(user.id);
    setForm({ username: user.username, password: '', role: user.role });
    setError('');
    setSuccessMsg('');
  };

  return (
    <div className="legacy-page space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-600">Administration</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">User management</h1>
        <p className="mt-2 text-sm text-slate-600">Manage backoffice and grid operator access.</p>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <h5 className="card-title">{editingId ? 'Edit User' : 'Create New User'}</h5>
          <form onSubmit={handleCreateOrUpdate} className="d-flex flex-wrap gap-2 align-items-center">
            <input type="text" className="form-control w-auto" placeholder="Username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required />
            {!editingId && (
              <input type="password" className="form-control w-auto" placeholder="Password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
            )}
            <select className="form-select w-auto" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
              <option value="GridOperator">Grid Operator</option>
              <option value="Backoffice">Backoffice</option>
            </select>
            <button type="submit" className="btn btn-primary">{editingId ? 'Update' : 'Create'}</button>
            {editingId && <button type="button" className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>}
          </form>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered table-hover bg-white shadow-sm">
        <thead className="table-light">
          <tr><th>Username</th><th>Role</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td className="align-middle">{user.username}</td>
              <td className="align-middle">{user.role}</td>
              <td className="align-middle"><span className={`badge ${user.status === 'Active' ? 'bg-success' : 'bg-danger'}`}>{user.status}</span></td>
              <td>
                <button type="button" className="btn btn-sm btn-outline-primary me-2" onClick={() => startEdit(user)}>Edit</button>
                <button type="button" className={`btn btn-sm ${user.status === 'Active' ? 'btn-outline-danger' : 'btn-outline-success'}`} onClick={() => toggleStatus(user.id, user.status)}>
                  {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                </button>
              </td>
            </tr>
          ))}
          {users.length === 0 && <tr><td colSpan="4" className="text-center text-muted">No users found.</td></tr>}
        </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagementPage;
