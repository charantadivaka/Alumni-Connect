import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { adminService } from '../../services/adminService';
import { useNavigate } from 'react-router-dom';
import '../../styles/Admin/UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [accountStatusFilter, setAccountStatusFilter] = useState('');
  const [verificationStatusFilter, setVerificationStatusFilter] = useState('');
  const [sortFilter, setSortFilter] = useState('newest');

  const navigate = useNavigate();

  // Debounce: only update debouncedSearch 350ms after the user stops typing
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const data = await adminService.getColleges();
        setColleges(data);
      } catch (err) {
        console.error('Failed to load colleges', err);
      }
    };
    fetchColleges();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (roleFilter) queryParams.append('role', roleFilter);
      if (debouncedSearch) queryParams.append('search', debouncedSearch);
      if (collegeFilter) queryParams.append('college', collegeFilter);
      if (departmentFilter) queryParams.append('department', departmentFilter);
      if (accountStatusFilter) queryParams.append('accountStatus', accountStatusFilter);
      if (verificationStatusFilter) queryParams.append('verificationStatus', verificationStatusFilter);
      if (sortFilter) queryParams.append('sort', sortFilter);

      const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';
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
  }, [roleFilter, debouncedSearch, collegeFilter, departmentFilter, accountStatusFilter, verificationStatusFilter, sortFilter]);

  const handleSuspend = async (id) => {
    try {
      const res = await adminService.toggleSuspend(id);
      setUsers(users.map(u => u._id === id ? { ...u, isSuspended: res.isSuspended } : u));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleViewProfile = (user) => {
    if (user.role === 'alumni') navigate(`/alumni/alumni/${user._id}`);
    else if (user.role === 'student') navigate(`/student/student/${user._id}`);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">
        <div className="page-header-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
          <div>
            <h1>User Management</h1>
            <p>Manage all students, alumni, and admins on the platform</p>
          </div>
          
          {/* Advanced Filters */}
          <div className="filters-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', width: '100%', marginTop: '1rem' }}>
            <input
              type="text"
              placeholder="Search by name or email..."
              className="form-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select className="form-input" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="">All Roles</option>
              <option value="student">Students</option>
              <option value="alumni">Alumni</option>
              <option value="admin">Admins</option>
            </select>
            <select className="form-input" value={accountStatusFilter} onChange={e => setAccountStatusFilter(e.target.value)}>
              <option value="">All Account Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended / Banned</option>
            </select>
            <select className="form-input" value={verificationStatusFilter} onChange={e => setVerificationStatusFilter(e.target.value)}>
              <option value="">All Verification</option>
              <option value="Verified">Verified</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
            <select className="form-input" value={collegeFilter} onChange={e => setCollegeFilter(e.target.value)}>
              <option value="">All Colleges</option>
              {colleges.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <input
              type="text"
              placeholder="Filter by Department..."
              className="form-input"
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
            />
            <select className="form-input" value={sortFilter} onChange={e => setSortFilter(e.target.value)}>
              <option value="newest">Sort: Newest Registered</option>
              <option value="oldest">Sort: Oldest Registered</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-state"><span className="spinner" /> Loading...</div>
        ) : (
          <div className="card table-wrapper" style={{ marginTop: '1.5rem' }}>
            <table className="data-table data-table--min-800">
              <thead className="table-head">
                <tr>
                  <th className="table-cell table-cell--header">Name</th>
                  <th className="table-cell table-cell--header">Role</th>
                  <th className="table-cell table-cell--header">College & Dept</th>
                  <th className="table-cell table-cell--header">Status</th>
                  <th className="table-cell table-cell--header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id} className="table-row">
                    <td className="table-cell">
                      <strong>{user.name}</strong>
                      <div className="text-muted" style={{ fontSize: '0.875rem' }}>{user.email}</div>
                    </td>
                    <td className="table-cell table-cell--role" style={{ textTransform: 'capitalize' }}>{user.role}</td>
                    <td className="table-cell">
                      <div style={{ fontSize: '0.875rem' }}>{user.college?.name || 'N/A'}</div>
                      <div className="text-muted" style={{ fontSize: '0.8rem' }}>{user.department || 'N/A'}</div>
                    </td>
                    <td className="table-cell">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
                        {user.isSuspended ? (
                          <span className="badge" style={{ backgroundColor: 'var(--clr-danger-bg)', color: 'var(--clr-danger)' }}>🔴 Suspended</span>
                        ) : (
                          <span className="badge" style={{ backgroundColor: 'var(--clr-success-bg)', color: 'var(--clr-success)' }}>🟢 Active</span>
                        )}
                        {user.role === 'alumni' && user.verificationStatus === 'Pending' && (
                          <span className="badge" style={{ backgroundColor: 'var(--clr-warning-bg)', color: 'var(--clr-warning)' }}>🟡 Pending Verification</span>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {user.role !== 'admin' && (
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => handleViewProfile(user)}
                          >
                            View Profile
                          </button>
                        )}
                        {user.role !== 'admin' && (
                          <button
                            className={`btn btn-sm ${user.isSuspended ? 'btn-primary' : 'btn-outline'}`}
                            style={{ 
                              color: user.isSuspended ? '#fff' : 'var(--clr-danger)', 
                              borderColor: user.isSuspended ? 'var(--clr-primary)' : 'var(--clr-danger)',
                              backgroundColor: user.isSuspended ? 'var(--clr-primary)' : 'transparent'
                            }}
                            onClick={() => handleSuspend(user._id)}
                          >
                            {user.isSuspended ? 'Reactivate' : '⭐ Suspend User'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="table-empty" style={{ padding: '2rem', textAlign: 'center', color: 'var(--clr-text-muted)' }}>No users found matching these filters.</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default UserManagement;
