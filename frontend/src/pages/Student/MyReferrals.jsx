import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { referralService } from '../../services/otherServices';
import { useAuth } from '../../context/AuthContext';

const BADGE = { Pending: 'badge-primary', Submitted: 'badge-success', Rejected: 'badge-danger', 'Not Available': 'badge-ghost' };

const MyReferrals = () => {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Request Referral Modal
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ alumniId: '', jobTitle: '', company: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        const data = await referralService.getMy();
        setReferrals(data);
      } catch (err) {
        setError(err.message || 'Failed to load referrals.');
      } finally {
        setLoading(false);
      }
    };
    fetchReferrals();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.alumniId || !form.jobTitle || !form.company) { alert('Alumni ID, Job Title, and Company are required.'); return; }
    try {
      setSubmitting(true);
      const newRef = await referralService.request(form);
      setReferrals(prev => [{ ...newRef, alumni: { name: 'Alumni', company: form.company } }, ...prev]);
      setForm({ alumniId: '', jobTitle: '', company: '', message: '' });
      setShowForm(false);
    } catch (err) {
      alert(err.message || 'Failed to request referral.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 15 }}>
          <div>
            <h1>My Referrals</h1>
            <p>Track referral requests you've sent to alumni.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
            {showForm ? 'Cancel' : '+ Request Referral'}
          </button>
        </div>

        {error && <div className="card" style={{ color: 'var(--clr-danger)', marginBottom: 20 }}>{error}</div>}

        {showForm && (
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Request a Referral</h3>
            <p className="text-sm text-muted" style={{ marginBottom: 16 }}>You need the exact 24-character Alumni ID. Go to the <strong style={{ color: 'var(--clr-primary)' }}>Alumni Map</strong> or <strong style={{ color: 'var(--clr-primary)' }}>Find Alumni</strong> page, click "View Profile", and copy the User ID shown at the bottom. Do NOT type their name!</p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <div className="form-group">
                <label className="form-label">Alumni ID *</label>
                <input type="text" className="form-input" required value={form.alumniId} onChange={e => setForm(p => ({ ...p, alumniId: e.target.value }))} placeholder="e.g. 64b9a8f27..." />
              </div>
              <div className="grid-2" style={{ gap: 15 }}>
                <div className="form-group">
                  <label className="form-label">Job Title *</label>
                  <input type="text" className="form-input" required value={form.jobTitle} onChange={e => setForm(p => ({ ...p, jobTitle: e.target.value }))} placeholder="e.g. Software Engineer" />
                </div>
                <div className="form-group">
                  <label className="form-label">Company *</label>
                  <input type="text" className="form-input" required value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} placeholder="e.g. Google" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Message to Alumni</label>
                <textarea className="form-input" rows={3} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Introduce yourself and explain why you'd be a great fit..." />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Sending...' : 'Send Request'}</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /> Loading...</div>
        ) : referrals.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <span style={{ fontSize: '2rem' }}>🤝</span>
            <h3>No Referral Requests</h3>
            <p className="text-muted">Request a referral from an alumni working at your dream company!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--sp-md)' }}>
            {referrals.map(ref => (
              <div key={ref._id} className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px' }}>{ref.jobTitle} at {ref.company}</h3>
                  <p className="text-muted text-sm" style={{ margin: '0 0 8px' }}>Referred by: {ref.alumni?.name} ({ref.alumni?.company})</p>
                  {ref.message && <p className="text-sm" style={{ margin: '0 0 8px' }}>Your message: "{ref.message}"</p>}
                  {ref.alumniNote && (
                    <div style={{ background: 'var(--clr-bg-elevated)', borderRadius: 'var(--r-sm)', padding: '8px 12px' }}>
                      <p className="text-sm" style={{ margin: 0 }}>Alumni's note: "{ref.alumniNote}"</p>
                    </div>
                  )}
                  <p className="text-sm text-faint" style={{ marginTop: 8 }}>Requested: {new Date(ref.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`badge ${BADGE[ref.status] || 'badge-ghost'}`}>{ref.status}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyReferrals;
