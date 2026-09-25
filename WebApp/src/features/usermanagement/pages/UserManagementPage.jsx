import React, { useState, useEffect, useContext } from 'react';
import appConfig from '../../../config/appConfig';
import { AuthContext } from '../../authentication/context/AuthContext';

export const UserManagementPage = () => {
  const { token } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: '', password: '', role: 'GridOperator' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchUsers = async () => {
    const res = await fetch(`${appConfig.apiBaseUrl}/admin/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) setUsers(await res.json());
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (editingId) {
      // Update
      const res = await fetch(`${appConfig.apiBaseUrl}/admin/users/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ username: form.username, role: form.role })
      });
      if (res.ok) {
        setSuccessMsg('User updated successfully!');
        cancelEdit();
        fetchUsers();
      } else setError("Failed to update user");
    } else {
      // Create
      const res = await fetch(`${appConfig.apiBaseUrl}/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setSuccessMsg('User created successfully!');
        setForm({ username: '', password: '', role: 'GridOperator' });
        fetchUsers();
      } else setError("Failed to create user. Username might be taken.");
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Deactivated' : 'Active';
    await fetch(`${appConfig.apiBaseUrl}/admin/users/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus })
    });
    fetchUsers();
  };

  const startEdit = (u) => {
    setEditingId(u.id);
    setForm({ username: u.username, password: '', role: u.role });
    setError('');
    setSuccessMsg('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ username: '', password: '', role: 'GridOperator' });
  };

  return (
    <div>
      <h2>User Management (Backoffice)</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <h5 className="card-title">{editingId ? 'Edit User' : 'Create New User'}</h5>
          <form onSubmit={handleCreateOrUpdate} className="d-flex flex-wrap gap-2 align-items-center">
            <input type="text" className="form-control w-auto" placeholder="Username" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required />
            {!editingId && (
              <input type="password" className="form-control w-auto" placeholder="Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
            )}
            <select className="form-select w-auto" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
              <option value="GridOperator">Grid Operator</option>
              <option value="Backoffice">Backoffice</option>
            </select>
            <button type="submit" className="btn btn-primary">{editingId ? 'Update' : 'Create'}</button>
            {editingId && <button type="button" className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>}
          </form>
        </div>
      </div>

      <table className="table table-bordered table-hover bg-white shadow-sm">
        <thead className="table-light">
          <tr>
            <th>Username</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td className="align-middle">{u.username}</td>
              <td className="align-middle">{u.role}</td>
              <td className="align-middle">
                <span className={`badge ${u.status === 'Active' ? 'bg-success' : 'bg-danger'}`}>{u.status}</span>
              </td>
              <td>
                <button className="btn btn-sm btn-outline-primary me-2" onClick={() => startEdit(u)}>Edit</button>
                <button className={`btn btn-sm ${u.status === 'Active' ? 'btn-outline-danger' : 'btn-outline-success'}`} onClick={() => toggleStatus(u.id, u.status)}>
                  {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                </button>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr><td colSpan="4" className="text-center text-muted">No users found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
