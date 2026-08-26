import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { adminService } from '../../services/adminService';
import { useNavigate } from 'react-router-dom';
import '../../styles/Admin/ManageColleges.css';

// ── Modal Form ────────────────────────────────────────────────────────────────
const CollegeForm = ({ onSave, onClose, saving }) => {
  const [form, setForm] = useState({
    name: '',
    rollNumberPattern: '',
    exampleFormat: '',
    patternDescription: '',
    isActive: true,
  });
  const [localErr, setLocalErr] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalErr('');
    if (!form.name.trim() || !form.rollNumberPattern.trim() || !form.exampleFormat.trim()) {
      setLocalErr('Name, pattern, and example format are all required.');
      return;
    }
    try {
      const regex = new RegExp(form.rollNumberPattern.trim());
      if (!regex.test(form.exampleFormat.trim())) {
        setLocalErr('⚠️ The example format does not match your pattern. Fix either one before saving.');
        return;
      }
    } catch {
      setLocalErr('⚠️ The regex pattern has a syntax error. Please fix it.');
      return;
    }
    onSave(form);
  };

  return (
    <div className="modal-overlay-custom" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card college-form-card">
        <div className="college-form-header">
          <h2 className="college-form-title">Add New College</h2>
          <button onClick={onClose} className="college-form-close">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="college-form-body">
          {localErr && <div className="feedback-banner feedback-banner--error">{localErr}</div>}
          <div className="form-group">
            <label className="form-label">College Name *</label>
            <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Indian Institute of Information Technology" required />
          </div>
          <div className="form-group">
            <label className="form-label">Roll Number Pattern (Regex) *</label>
            <input className="form-input" value={form.rollNumberPattern} onChange={e => set('rollNumberPattern', e.target.value)} placeholder="e.g. ^S\d{4}\d{7}$" required />
          </div>
          <div className="form-group">
            <label className="form-label">Example Format *</label>
            <input className="form-input" value={form.exampleFormat} onChange={e => set('exampleFormat', e.target.value)} placeholder="e.g. S20230010237" required />
          </div>
          <div className="form-actions" style={{ marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" style={{ flex: 2 }} type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Add College'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const ManageColleges = () => {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();

  const flash = (msg, type = 'success') => {
    if (type === 'success') { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); }
    else { setError(msg); setTimeout(() => setError(''), 5000); }
  };

  const fetchColleges = async () => {
    setLoading(true);
    try {
      const data = await adminService.getColleges();
      setColleges(data);
    } catch (err) {
      flash(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchColleges(); }, []);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      const created = await adminService.createCollege(form);
      setColleges(prev => [...prev, created]);
      flash('College added successfully!');
      setShowForm(false);
    } catch (err) {
      flash(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Filter logic
  const filteredColleges = colleges.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? c.subscriptionStatus === statusFilter : true;
    let matchesVisibility = true;
    if (visibilityFilter === 'Active') matchesVisibility = c.isActive === true;
    if (visibilityFilter === 'Disabled') matchesVisibility = c.isActive === false;
    
    return matchesSearch && matchesStatus && matchesVisibility;
  });

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">
        {/* Header */}
        <div className="page-header-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div>
              <h1>Manage Colleges</h1>
              <p>View subscriptions, edit details, and add new institutions.</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add College</button>
          </div>

          <div className="filters-grid" style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '1rem' }}>
            <input
              type="text"
              placeholder="Search college by name..."
              className="form-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 2 }}
            />
            <select className="form-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ flex: 1 }}>
              <option value="">All Subscriptions</option>
              <option value="Active">🟢 Active</option>
              <option value="Payment Pending">🟡 Payment Pending</option>
              <option value="Expired">🔴 Expired</option>
              <option value="Suspended">⏸️ Suspended</option>
            </select>
            <select className="form-input" value={visibilityFilter} onChange={e => setVisibilityFilter(e.target.value)} style={{ flex: 1 }}>
              <option value="">All Visibility</option>
              <option value="Active">👁️ Visible (Active)</option>
              <option value="Disabled">🚫 Hidden (Disabled)</option>
            </select>
          </div>
        </div>

        {/* Feedback banners */}
        {success && <div className="feedback-banner feedback-banner--success">{success}</div>}
        {error && <div className="feedback-banner feedback-banner--error">{error}</div>}

        {/* Table */}
        {loading ? (
          <div className="loading-state"><span className="spinner" /> Loading colleges...</div>
        ) : filteredColleges.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-icon">🏛️</div>
            <h3>No colleges found</h3>
            <p>Try adjusting your search or filters, or add a new college.</p>
          </div>
        ) : (
          <div className="card table-wrapper" style={{ marginTop: '1.5rem' }}>
            <table className="data-table data-table--min-800">
              <thead className="table-head">
                <tr>
                  <th className="table-cell table-cell--header">College</th>
                  <th className="table-cell table-cell--header">Visibility</th>
                  <th className="table-cell table-cell--header">Subscription Plan</th>
                  <th className="table-cell table-cell--header">Subscription Status</th>
                  <th className="table-cell table-cell--header">Expiry Date</th>
                  <th className="table-cell table-cell--header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredColleges.map(col => (
                  <tr key={col._id} className="table-row">
                    <td className="table-cell">
                      <strong>{col.name}</strong>
                    </td>
                    <td className="table-cell">
                      {col.isActive ? <span className="badge badge-success">👁️ Visible</span> : <span className="badge badge-danger">🚫 Hidden</span>}
                    </td>
                    <td className="table-cell">
                      {col.subscriptionPlan || 'N/A'}
                    </td>
                    <td className="table-cell">
                      {col.subscriptionStatus === 'Active' && <span className="badge badge-success">🟢 Active</span>}
                      {col.subscriptionStatus === 'Payment Pending' && <span className="badge badge-warning" style={{ background: 'var(--clr-warning-bg)', color: 'var(--clr-warning)' }}>🟡 Pending</span>}
                      {col.subscriptionStatus === 'Expired' && <span className="badge badge-danger">🔴 Expired</span>}
                      {col.subscriptionStatus === 'Suspended' && <span className="badge" style={{ background: 'var(--clr-bg-alt)' }}>⏸️ Suspended</span>}
                    </td>
                    <td className="table-cell">
                      {col.subscriptionExpiry ? new Date(col.subscriptionExpiry).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="table-cell">
                      <button className="btn btn-sm btn-outline" onClick={() => navigate(`/admin/colleges/${col._id}`)}>
                        View Details →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </main>

      {/* Form Modal */}
      {showForm && (
        <CollegeForm
          onSave={handleSave}
          onClose={() => setShowForm(false)}
          saving={saving}
        />
      )}
    </div>
  );
};

export default ManageColleges;
