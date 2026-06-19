import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { referralService } from '../../services/otherServices';
import '../../styles/Alumni/ManageReferrals.css';

const BADGE = { Pending: 'badge-primary', Submitted: 'badge-success', Rejected: 'badge-danger', 'Not Available': 'badge-ghost' };

const ManageReferrals = () => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [respondTarget, setRespondTarget] = useState(null);
  const [respondForm, setRespondForm] = useState({ status: 'Submitted', alumniNote: '' });
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

  const handleRespond = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const updated = await referralService.respond(respondTarget._id, respondForm);
      setReferrals(prev => prev.map(r => r._id === respondTarget._id ? { ...r, status: updated.status, alumniNote: updated.alumniNote } : r));
      setRespondTarget(null);
      setRespondForm({ status: 'Submitted', alumniNote: '' });
    } catch (err) {
      alert(err.message || 'Failed to respond.');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingRefs  = referrals.filter(r => r.status === 'Pending');
  const resolvedRefs = referrals.filter(r => r.status !== 'Pending');

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">
        <div className="page-header">
          <h1>Manage Referrals</h1>
          <p>Review referral requests from students and respond to them.</p>
        </div>

        {error && <div className="card" style={{ color: 'var(--clr-danger)', marginBottom: 20 }}>{error}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /> Loading...</div>
        ) : referrals.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <span style={{ fontSize: '2rem' }}>🤝</span>
            <h3>No Referral Requests</h3>
            <p className="text-muted">You haven't received any referral requests yet.</p>
          </div>
        ) : (
          <>
            {pendingRefs.length > 0 && (
              <>
                <h2 style={{ fontSize: '1.1rem', marginBottom: 16, color: 'var(--clr-primary)' }}>Pending ({pendingRefs.length})</h2>
                <div style={{ display: 'grid', gap: 'var(--sp-md)', marginBottom: 32 }}>
                  {pendingRefs.map(ref => (
                    <div key={ref._id} className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ margin: '0 0 4px' }}>{ref.jobTitle} at {ref.company}</h3>
                        <p className="text-muted text-sm" style={{ margin: '0 0 8px' }}>From: {ref.student?.name} ({ref.student?.department})</p>
                        {ref.message && <p className="text-sm" style={{ margin: 0 }}>Message: "{ref.message}"</p>}
                        <p className="text-sm text-faint" style={{ marginTop: 8 }}>{new Date(ref.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <span className="badge badge-primary">Pending</span>
                        <button className="btn btn-primary btn-sm" onClick={() => { setRespondTarget(ref); setRespondForm({ status: 'Submitted', alumniNote: '' }); }}>
                          Respond
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {resolvedRefs.length > 0 && (
              <>
                <h2 style={{ fontSize: '1.1rem', marginBottom: 16 }}>Resolved ({resolvedRefs.length})</h2>
                <div style={{ display: 'grid', gap: 'var(--sp-md)' }}>
                  {resolvedRefs.map(ref => (
                    <div key={ref._id} className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ margin: '0 0 4px' }}>{ref.jobTitle} at {ref.company}</h3>
                        <p className="text-muted text-sm" style={{ margin: '0 0 8px' }}>From: {ref.student?.name}</p>
                        {ref.alumniNote && <p className="text-sm" style={{ margin: 0 }}>Your note: "{ref.alumniNote}"</p>}
                      </div>
                      <span className={`badge ${BADGE[ref.status] || 'badge-ghost'}`}>{ref.status}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Respond Modal */}
        {respondTarget && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20
          }}>
            <div className="card" style={{ width: '100%', maxWidth: 500, padding: 30, position: 'relative' }}>
              <button onClick={() => setRespondTarget(null)}
                style={{ position: 'absolute', top: 15, right: 15, background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--clr-text-muted)' }}>
                ✕
              </button>
              <h2 style={{ marginBottom: 5 }}>Respond to Referral</h2>
              <p className="text-muted" style={{ marginBottom: 20 }}>{respondTarget.jobTitle} at {respondTarget.company} — from {respondTarget.student?.name}</p>
              <form onSubmit={handleRespond} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={respondForm.status} onChange={e => setRespondForm(p => ({ ...p, status: e.target.value }))}>
                    <option value="Submitted">Submitted (I referred them)</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Not Available">Not Available at my company</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Note to Student (optional)</label>
                  <textarea className="form-input" rows={3} value={respondForm.alumniNote} onChange={e => setRespondForm(p => ({ ...p, alumniNote: e.target.value }))} placeholder="Any additional notes for the student..." />
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setRespondTarget(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Sending...' : 'Send Response'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ManageReferrals;
