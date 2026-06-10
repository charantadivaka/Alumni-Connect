import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { interviewService } from '../../services/mentorshipService';

const BADGE = {
  Pending:   'badge-primary',
  Accepted:  'badge-success',
  Rejected:  'badge-danger',
  Completed: 'badge-ghost',
};

const MockInterviews = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('active');

  // Book interview form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ alumniId: '', interviewType: 'Technical', targetRole: '' });
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        const data = await interviewService.getMy();
        setInterviews(data);
      } catch (err) {
        setError(err.message || 'Failed to load interviews.');
      } finally {
        setLoading(false);
      }
    };
    fetchInterviews();
  }, []);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!form.alumniId || !form.targetRole) { alert('Alumni ID and Target Role are required.'); return; }
    try {
      setBooking(true);
      const newInterview = await interviewService.book(form);
      setInterviews(prev => [{ ...newInterview, alumni: { name: 'Alumni' } }, ...prev]);
      setForm({ alumniId: '', interviewType: 'Technical', targetRole: '' });
      setShowForm(false);
    } catch (err) {
      alert(err.message || 'Failed to book interview.');
    } finally {
      setBooking(false);
    }
  };

  const active = interviews.filter(i => !['Rejected', 'Completed'].includes(i.status));
  const past   = interviews.filter(i =>  ['Rejected', 'Completed'].includes(i.status));
  const displayed = activeTab === 'active' ? active : past;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 15 }}>
          <div>
            <h1>Mock Interviews</h1>
            <p>Book practice interviews with alumni to ace your real ones.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
            {showForm ? 'Cancel' : '+ Book Interview'}
          </button>
        </div>

        {error && <div className="card" style={{ color: 'var(--clr-danger)', marginBottom: 20 }}>{error}</div>}

        {/* Book Interview Form */}
        {showForm && (
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Book a Mock Interview</h3>
            <p className="text-sm text-muted" style={{ marginBottom: 16 }}>
              You need the exact 24-character Alumni ID. Go to the <strong style={{ color: 'var(--clr-primary)' }}>Alumni Map</strong> or <strong style={{ color: 'var(--clr-primary)' }}>Find Alumni</strong> page, click "View Profile", and copy the User ID shown at the bottom. Do NOT type their name!
            </p>
            <form onSubmit={handleBook} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <div className="form-group">
                <label className="form-label">Alumni ID *</label>
                <input type="text" className="form-input" required value={form.alumniId} onChange={e => setForm(p => ({ ...p, alumniId: e.target.value }))} placeholder="e.g. 64b9a8f27..." />
              </div>
              <div className="grid-2" style={{ gap: 15 }}>
                <div className="form-group">
                  <label className="form-label">Interview Type</label>
                  <select className="form-input" value={form.interviewType} onChange={e => setForm(p => ({ ...p, interviewType: e.target.value }))}>
                    <option value="Technical">Technical</option>
                    <option value="HR">HR / Behavioral</option>
                    <option value="Case Study">Case Study</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Target Role *</label>
                  <input type="text" className="form-input" required value={form.targetRole} onChange={e => setForm(p => ({ ...p, targetRole: e.target.value }))} placeholder="e.g. Software Engineer at Google" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={booking}>{booking ? 'Booking...' : 'Book Interview'}</button>
              </div>
            </form>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid var(--clr-border)', paddingBottom: 12 }}>
          <button className={`btn ${activeTab === 'active' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('active')}>
            Active ({active.length})
          </button>
          <button className={`btn ${activeTab === 'past' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('past')}>
            Past ({past.length})
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /> Loading...</div>
        ) : displayed.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <span style={{ fontSize: '2rem' }}>🎤</span>
            <h3>No Interviews Here</h3>
            <p className="text-muted">{activeTab === 'active' ? 'Book a mock interview to practice for real ones.' : 'Completed or rejected interviews will show here.'}</p>
          </div>
        ) : (
          <div className="grid-2">
            {displayed.map(iv => (
              <div key={iv._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ margin: 0 }}>{iv.targetRole}</h3>
                  <span className={`badge ${BADGE[iv.status] || 'badge-ghost'}`}>{iv.status}</span>
                </div>
                <div style={{ background: 'var(--clr-bg-elevated)', borderRadius: 'var(--r-sm)', padding: 12 }}>
                  <p className="text-sm" style={{ margin: '0 0 4px' }}><strong>Type:</strong> {iv.interviewType}</p>
                  <p className="text-sm" style={{ margin: 0 }}><strong>With:</strong> {iv.alumni?.name} {iv.alumni?.company ? `— ${iv.alumni.company}` : ''}</p>
                </div>
                {iv.slot && (
                  <p className="text-sm text-muted">📅 {new Date(iv.slot.date).toLocaleDateString()} at {iv.slot.startTime}</p>
                )}
                {iv.status === 'Completed' && iv.feedback?.rating && (
                  <div style={{ background: 'var(--clr-bg-elevated)', borderRadius: 'var(--r-sm)', padding: 12 }}>
                    <p className="text-sm" style={{ margin: '0 0 6px' }}><strong>Feedback:</strong> {'⭐'.repeat(iv.feedback.rating)}</p>
                    {iv.feedback.strengths && <p className="text-sm" style={{ margin: '0 0 4px' }}>✅ <strong>Strengths:</strong> {iv.feedback.strengths}</p>}
                    {iv.feedback.improvements && <p className="text-sm" style={{ margin: 0 }}>📈 <strong>To Improve:</strong> {iv.feedback.improvements}</p>}
                  </div>
                )}
                <p className="text-sm text-faint" style={{ marginTop: 'auto' }}>Booked: {new Date(iv.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MockInterviews;
