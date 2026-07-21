import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { mentorshipService } from '../../services/mentorshipService';
import { useVideoCall } from '../../context/VideoCallContext';
import '../../styles/Alumni/MentorshipRequests.css';

const STAGE_COLORS = {
  Pending:   'badge-primary',
  Accepted:  'badge-success',
  Rejected:  'badge-danger',
  Completed: 'badge-ghost',
  Cancelled: 'badge-danger',
};

const MentorshipRequests = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const { startCall } = useVideoCall();

  // Notes modal for completing a session
  const [completeTarget, setCompleteTarget] = useState(null);
  const [sessionNotes, setSessionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const handleRespond = async (id, status) => {
    try {
      await mentorshipService.respond(id, { status });
      setSessions(prev => prev.map(s => s._id === id ? { ...s, status } : s));
    } catch (err) {
      alert(err.message || 'Action failed.');
    }
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await mentorshipService.complete(completeTarget._id, { sessionNotes });
      setSessions(prev => prev.map(s => s._id === completeTarget._id ? { ...s, status: 'Completed', sessionNotes } : s));
      setCompleteTarget(null);
      setSessionNotes('');
    } catch (err) {
      alert(err.message || 'Failed to complete session.');
    } finally {
      setSubmitting(false);
    }
  };

  const pending   = sessions.filter(s => s.status === 'Pending');
  const accepted  = sessions.filter(s => s.status === 'Accepted');
  const past      = sessions.filter(s => ['Completed', 'Cancelled', 'Rejected'].includes(s.status));

  const tabMap = { pending, accepted, past };
  const displayed = tabMap[activeTab] || [];

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">
        <div className="page-header">
          <h1>Mentorship Requests</h1>
          <p>Manage mentorship session requests from students.</p>
        </div>

        {error && <div className="card" style={{ color: 'var(--clr-danger)', marginBottom: 20 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid var(--clr-border)', paddingBottom: 12, flexWrap: 'wrap' }}>
          <button className={`btn ${activeTab === 'pending' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('pending')}>
            Pending ({pending.length})
          </button>
          <button className={`btn ${activeTab === 'accepted' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('accepted')}>
            Scheduled ({accepted.length})
          </button>
          <button className={`btn ${activeTab === 'past' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('past')}>
            Past ({past.length})
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /> Loading...</div>
        ) : displayed.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <span style={{ fontSize: '2rem' }}>📭</span>
            <h3>Nothing here</h3>
            <p className="text-muted">No sessions in this category.</p>
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
                    <strong>Student:</strong> {session.student?.name}
                  </p>
                  {session.goals && (
                    <p className="text-sm" style={{ margin: 0 }}>
                      <strong>Goals:</strong> {session.goals}
                    </p>
                  )}
                </div>

                {session.studentFeedback?.rating && (
                  <div style={{ background: 'var(--clr-bg-elevated)', borderRadius: 'var(--r-sm)', padding: 12 }}>
                    <p className="text-sm" style={{ margin: 0 }}>
                      <strong>Student Feedback:</strong> {'⭐'.repeat(session.studentFeedback.rating)} — {session.studentFeedback.comment}
                    </p>
                  </div>
                )}

                <p className="text-sm text-faint">Requested: {new Date(session.createdAt).toLocaleDateString()}</p>

                {session.status === 'Pending' && (
                  <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
                    <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => handleRespond(session._id, 'Accepted')}>Accept</button>
                    <button className="btn btn-ghost btn-sm"   style={{ flex: 1, color: 'var(--clr-danger)' }} onClick={() => handleRespond(session._id, 'Rejected')}>Reject</button>
                  </div>
                )}

                {session.status === 'Accepted' && (
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => { setCompleteTarget(session); setSessionNotes(''); }}
                    >
                      Mark as Completed
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      onClick={() => startCall(
                        session.student?._id,
                        session.student?.name || 'Student',
                        session._id,
                        'mentorship'
                      )}
                      title={`Start video call with ${session.student?.name}`}
                    >
                      📹 Video Call
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Complete Session Modal */}
        {completeTarget && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20
          }}>
            <div className="card" style={{ width: '100%', maxWidth: 480, padding: 30, position: 'relative' }}>
              <button onClick={() => setCompleteTarget(null)}
                style={{ position: 'absolute', top: 15, right: 15, background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--clr-text-muted)' }}>
                ✕
              </button>
              <h2 style={{ marginBottom: 5 }}>Complete Session</h2>
              <p className="text-muted" style={{ marginBottom: 20 }}>Topic: {completeTarget.topic}</p>
              <form onSubmit={handleComplete} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                <div className="form-group">
                  <label className="form-label">Session Notes</label>
                  <textarea className="form-input" rows={4} value={sessionNotes} onChange={e => setSessionNotes(e.target.value)} placeholder="Key takeaways, action items, resources shared..." />
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setCompleteTarget(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : 'Mark Completed'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MentorshipRequests;
