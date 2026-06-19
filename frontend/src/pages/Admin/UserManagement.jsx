import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { adminService } from '../../services/adminService';
import '../../styles/Admin/UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const queryParams = [];
      if (filter) queryParams.push(`role=${filter}`);
      if (search) queryParams.push(`search=${search}`);
      const qs = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const data = await adminService.getUsers(qs);
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filter, search]);

  const handleSuspend = async (id) => {
    try {
      const res = await adminService.toggleSuspend(id);
      setUsers(users.map(u => u._id === id ? { ...u, isSuspended: res.isSuspended } : u));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">
        <div className="page-header-row">
          <div>
            <h1>User Management</h1>
            <p>Manage all students, alumni, and admins on the platform</p>
          </div>
          <div className="page-header-controls">
            <input
              type="text"
              placeholder="Search by name or email..."
              className="form-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select className="form-input" value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="">All Roles</option>
              <option value="student">Students</option>
              <option value="alumni">Alumni</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-state"><span className="spinner" /> Loading...</div>
        ) : (
          <div className="card table-wrapper">
            <table className="data-table data-table--min-800">
              <thead className="table-head">
                <tr>
                  <th className="table-cell table-cell--header">Name</th>
                  <th className="table-cell table-cell--header">Email</th>
                  <th className="table-cell table-cell--header">Role</th>
                  <th className="table-cell table-cell--header">Status</th>
                  <th className="table-cell table-cell--header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id} className="table-row">
                    <td className="table-cell">{user.name}</td>
                    <td className="table-cell">{user.email}</td>
                    <td className="table-cell table-cell--role">{user.role}</td>
                    <td className="table-cell">
                      <span className={`badge ${user.isSuspended ? 'badge-danger' : 'badge-success'}`}>
                        {user.isSuspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td className="table-cell">
                      {user.role !== 'admin' && (
                        <button
                          className="btn btn-sm btn-ghost"
                          style={{ color: user.isSuspended ? 'var(--clr-success)' : 'var(--clr-danger)' }}
                          onClick={() => handleSuspend(user._id)}
                        >
                          {user.isSuspended ? 'Unsuspend' : 'Suspend'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="table-empty">No users found.</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default UserManagement;
