import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { mentorshipService } from '../../services/mentorshipService';
import '../../styles/Student/MentorshipSessions.css';

const STAGE_COLORS = {
  Pending:   'badge-primary',
  Accepted:  'badge-success',
  Rejected:  'badge-danger',
  Completed: 'badge-ghost',
  Cancelled: 'badge-danger',
};

const MentorshipSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed'

  // Request form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ alumniId: '', topic: '', goals: '' });
  const [requesting, setRequesting] = useState(false);



  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await mentorshipService.getMy();
        setSessions(data);
      } catch (err) {
        setError(err.message || 'Failed to load sessions.');
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!form.alumniId || !form.topic) { alert('Alumni ID and Topic are required.'); return; }
    try {
      setRequesting(true);
      const newSession = await mentorshipService.request(form);
      setSessions(prev => [{ ...newSession, alumni: { name: 'Alumni' } }, ...prev]);
      setForm({ alumniId: '', topic: '', goals: '' });
      setShowForm(false);
    } catch (err) {
      alert(err.message || 'Failed to request mentorship.');
    } finally {
      setRequesting(false);
    }
  };



  const activeSessions = sessions.filter(s => !['Completed', 'Cancelled', 'Rejected'].includes(s.status));
  const pastSessions   = sessions.filter(s =>  ['Completed', 'Cancelled', 'Rejected'].includes(s.status));
  const displayed      = activeTab === 'active' ? activeSessions : pastSessions;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 15 }}>
          <div>
            <h1>Mentorship Sessions</h1>
            <p>Track your mentorship requests and upcoming sessions.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
            {showForm ? 'Cancel' : '+ Request Mentorship'}
          </button>
        </div>

        {error && <div className="card" style={{ color: 'var(--clr-danger)', marginBottom: 20 }}>{error}</div>}

        {/* Request Form */}
        {showForm && (
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Request a Mentorship Session</h3>
            <p className="text-sm text-muted" style={{ marginBottom: 16 }}>
              You need the exact 24-character Alumni ID. Go to the <strong style={{ color: 'var(--clr-primary)' }}>Find Alumni</strong> page, click "View Profile", and copy the User ID shown at the bottom. Do NOT type their name!
            </p>
            <form onSubmit={handleRequest} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <div className="form-group">
                <label className="form-label">Alumni ID *</label>
                <input type="text" className="form-input" required value={form.alumniId} onChange={e => setForm(p => ({ ...p, alumniId: e.target.value }))} placeholder="e.g. 64b9a8f27..." />
              </div>
              <div className="form-group">
                <label className="form-label">Topic *</label>
                <input type="text" className="form-input" required value={form.topic} onChange={e => setForm(p => ({ ...p, topic: e.target.value }))} placeholder="e.g. Guidance on entering Data Science" />
              </div>
              <div className="form-group">
                <label className="form-label">Goals</label>
                <textarea className="form-input" rows={2} value={form.goals} onChange={e => setForm(p => ({ ...p, goals: e.target.value }))} placeholder="What do you want to achieve?" />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={requesting}>{requesting ? 'Requesting...' : 'Send Request'}</button>
              </div>
            </form>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid var(--clr-border)', paddingBottom: 12 }}>
          <button className={`btn ${activeTab === 'active' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('active')}>
            Active & Pending ({activeSessions.length})
          </button>
          <button className={`btn ${activeTab === 'completed' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('completed')}>
            Past Sessions ({pastSessions.length})
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /> Loading...</div>
        ) : displayed.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <span style={{ fontSize: '2rem' }}>🎓</span>
            <h3>No Sessions Yet</h3>
            <p className="text-muted">
              {activeTab === 'active'
                ? 'Browse alumni and request a mentorship session.'
                : 'Completed and rejected sessions will appear here.'}
            </p>
          </div>
        ) : (
          <div className="grid-2">
            {displayed.map(session => (
              <div key={session._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ margin: 0 }}>{session.topic}</h3>
                  <span className={`badge ${STAGE_COLORS[session.status] || 'badge-ghost'}`}>{session.status}</span>
                </div>

                <div style={{ background: 'var(--clr-bg-elevated)', borderRadius: 'var(--r-sm)', padding: 12 }}>
                  <p className="text-sm" style={{ margin: '0 0 4px' }}>
                    <strong>Mentor:</strong> {session.alumni?.name} {session.alumni?.company ? `(${session.alumni.company})` : ''}
                  </p>
                  {session.goals && (
                    <p className="text-sm" style={{ margin: 0 }}>
                      <strong>Goals:</strong> {session.goals}
                    </p>
                  )}
                </div>

                {session.slot && (
                  <p className="text-sm text-muted">
                    📅 {new Date(session.slot.date).toLocaleDateString()} at {session.slot.startTime} ({session.slot.duration} min)
                  </p>
                )}

                {session.sessionNotes && (
                  <div style={{ background: 'var(--clr-bg-elevated)', borderRadius: 'var(--r-sm)', padding: 12 }}>
                    <p className="text-sm" style={{ margin: 0 }}>
                      <strong>Session Notes:</strong> {session.sessionNotes}
                    </p>
                  </div>
                )}

                <p className="text-sm text-faint" style={{ marginTop: 'auto' }}>
                  Requested: {new Date(session.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MentorshipSessions;
