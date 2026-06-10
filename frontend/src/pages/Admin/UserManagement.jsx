import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { adminService } from '../../services/adminService';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(''); // 'student', 'alumni', 'admin'
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
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1>User Management</h1>
            <p>Manage all students, alumni, and admins on the platform</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
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
          <div style={{ padding: 'var(--sp-xl)', textAlign: 'center' }}><span className="spinner" /> Loading...</div>
        ) : (
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead style={{ background: 'var(--clr-bg-elevated)', borderBottom: '1px solid var(--clr-border)' }}>
                <tr>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Name</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Email</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Role</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id} style={{ borderBottom: '1px solid var(--clr-border)' }}>
                    <td style={{ padding: '12px 16px' }}>{user.name}</td>
                    <td style={{ padding: '12px 16px' }}>{user.email}</td>
                    <td style={{ padding: '12px 16px', textTransform: 'capitalize' }}>{user.role}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`badge ${user.isSuspended ? 'badge-danger' : 'badge-success'}`}>
                        {user.isSuspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
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
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--clr-text-muted)' }}>
                No users found.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default UserManagement;
