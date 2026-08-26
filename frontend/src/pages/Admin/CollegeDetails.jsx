import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { adminService } from '../../services/adminService';

const CollegeDetails = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modals
  const [showEdit, setShowEdit] = useState(false);
  const [showRenew, setShowRenew] = useState(false);
  const [saving, setSaving] = useState(false);

  // Forms
  const [editForm, setEditForm] = useState({});
  const [renewForm, setRenewForm] = useState({ plan: 'Standard', amount: 50000, expiryDate: '', status: 'Paid', notes: '' });

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await adminService.getCollegeDetails(id);
      setData(res);
      setEditForm(res.college);
      
      // Default renew expiry date to +1 year from today (or existing expiry)
      const currentExpiry = res.college.subscriptionExpiry ? new Date(res.college.subscriptionExpiry) : new Date();
      currentExpiry.setFullYear(currentExpiry.getFullYear() + 1);
      setRenewForm(prev => ({ ...prev, expiryDate: currentExpiry.toISOString().split('T')[0] }));
    } catch (err) {
      setError(err.message || 'Failed to load college details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminService.updateCollege(id, editForm);
      setShowEdit(false);
      fetchDetails();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRenewSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminService.renewCollegeSubscription(id, renewForm);
      setShowRenew(false);
      fetchDetails();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <main className="dashboard-main"><div className="loading-state"><span className="spinner" /> Loading...</div></main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <main className="dashboard-main">
          <div className="card" style={{ color: 'var(--clr-danger)' }}>{error}</div>
        </main>
      </div>
    );
  }

  const { college, stats } = data;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">
        <div className="page-header" style={{ marginBottom: 16 }}>
          <Link to="/admin/colleges" className="btn btn-ghost btn-sm" style={{ marginBottom: 12 }}>← Back to Colleges</Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {college.name}
                {college.subscriptionStatus === 'Active' && <span className="badge badge-success" style={{ fontSize: '0.9rem' }}>🟢 Active</span>}
                {college.subscriptionStatus === 'Payment Pending' && <span className="badge badge-warning" style={{ fontSize: '0.9rem', background: 'var(--clr-warning-bg)', color: 'var(--clr-warning)' }}>🟡 Payment Pending</span>}
                {college.subscriptionStatus === 'Expired' && <span className="badge badge-danger" style={{ fontSize: '0.9rem' }}>🔴 Expired</span>}
                {college.subscriptionStatus === 'Suspended' && <span className="badge" style={{ fontSize: '0.9rem', background: 'var(--clr-bg-alt)' }}>⏸️ Suspended</span>}
              </h1>
              <p className="text-muted">Roll Pattern: <code>{college.rollNumberPattern}</code></p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-outline" onClick={() => setShowEdit(true)}>Edit Details</button>
              <button className="btn btn-primary" onClick={() => setShowRenew(true)}>Renew Subscription</button>
            </div>
          </div>
        </div>

        {/* Access Control Callout */}
        {college.subscriptionStatus !== 'Active' && (
          <div className="card" style={{ background: 'var(--clr-danger-bg)', borderColor: 'var(--clr-danger)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '2rem' }}>🔴</span>
            <div>
              <h3 style={{ margin: '0 0 0.5rem', color: 'var(--clr-danger)' }}>Student Access Disabled</h3>
              <p style={{ margin: 0, color: 'var(--clr-text)' }}>Students from this college currently cannot access the platform because the subscription is {college.subscriptionStatus.toLowerCase()}.</p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>College Statistics</h2>
        <div className="grid-3" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="card stat-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👨‍🎓</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.studentsCount}</div>
            <div className="text-muted">Students</div>
          </div>
          <div className="card stat-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎓</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.alumniCount}</div>
            <div className="text-muted">Alumni</div>
          </div>
          <div className="card stat-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🤝</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.connectionsCount}</div>
            <div className="text-muted">Connections</div>
          </div>
          <div className="card stat-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💼</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.jobsCount}</div>
            <div className="text-muted">Jobs Posted</div>
          </div>
          <div className="card stat-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌟</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.mentorshipsCount}</div>
            <div className="text-muted">Mentorships Given</div>
          </div>
          <div className="card stat-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.activeUsersCount}</div>
            <div className="text-muted">Active (Un-suspended) Users</div>
          </div>
        </div>

        {/* Subscription History */}
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Subscription History</h2>
        <div className="card table-wrapper">
          <table className="data-table">
            <thead className="table-head">
              <tr>
                <th className="table-cell table-cell--header">Date</th>
                <th className="table-cell table-cell--header">Plan</th>
                <th className="table-cell table-cell--header">Amount</th>
                <th className="table-cell table-cell--header">Status</th>
                <th className="table-cell table-cell--header">Notes</th>
              </tr>
            </thead>
            <tbody>
              {(!college.subscriptionHistory || college.subscriptionHistory.length === 0) ? (
                <tr>
                  <td colSpan="5" className="table-cell text-muted" style={{ textAlign: 'center', padding: '2rem' }}>No subscription history recorded.</td>
                </tr>
              ) : (
                college.subscriptionHistory.sort((a,b) => new Date(b.paymentDate) - new Date(a.paymentDate)).map((history, idx) => (
                  <tr key={idx} className="table-row">
                    <td className="table-cell">{new Date(history.paymentDate).toLocaleDateString()}</td>
                    <td className="table-cell">{history.plan}</td>
                    <td className="table-cell">₹{history.amount.toLocaleString()}</td>
                    <td className="table-cell">{history.status}</td>
                    <td className="table-cell">{history.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Renew Modal */}
      {showRenew && (
        <div className="modal-overlay-custom" onClick={e => e.target === e.currentTarget && setShowRenew(false)}>
          <div className="card" style={{ width: 400, maxWidth: '90%' }}>
            <h2 style={{ marginTop: 0 }}>Renew Subscription</h2>
            <form onSubmit={handleRenewSubmit}>
              <div className="form-group">
                <label className="form-label">Plan Name</label>
                <input className="form-input" value={renewForm.plan} onChange={e => setRenewForm({...renewForm, plan: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Amount Paid (₹)</label>
                <input type="number" className="form-input" value={renewForm.amount} onChange={e => setRenewForm({...renewForm, amount: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">New Expiry Date</label>
                <input type="date" className="form-input" value={renewForm.expiryDate} onChange={e => setRenewForm({...renewForm, expiryDate: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-input" value={renewForm.status} onChange={e => setRenewForm({...renewForm, status: e.target.value})}>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes (Optional)</label>
                <input className="form-input" value={renewForm.notes} onChange={e => setRenewForm({...renewForm, notes: e.target.value})} placeholder="e.g. Bank Transfer Ref: XYZ" />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowRenew(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>{saving ? 'Saving...' : 'Renew'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <div className="modal-overlay-custom" onClick={e => e.target === e.currentTarget && setShowEdit(false)}>
          <div className="card" style={{ width: 500, maxWidth: '90%' }}>
            <h2 style={{ marginTop: 0 }}>Edit College</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label">College Name</label>
                <input className="form-input" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Roll Number Regex</label>
                <input className="form-input" value={editForm.rollNumberPattern} onChange={e => setEditForm({...editForm, rollNumberPattern: e.target.value})} required />
                <small className="text-muted">Careful: Changing this affects future registrations.</small>
              </div>
              <div className="form-group">
                <label className="form-label">Subscription Status</label>
                <select className="form-input" value={editForm.subscriptionStatus} onChange={e => setEditForm({...editForm, subscriptionStatus: e.target.value})}>
                  <option value="Active">Active</option>
                  <option value="Payment Pending">Payment Pending</option>
                  <option value="Expired">Expired</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowEdit(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegeDetails;
