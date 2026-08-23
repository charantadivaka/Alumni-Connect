import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { mentorshipService, slotService } from '../../services/mentorshipService';
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

  // Accept modal state
  const [acceptTarget, setAcceptTarget] = useState(null);
  const [slotForm, setSlotForm] = useState({ date: '', startTime: '', duration: '45', type: 'Mentorship' });
  const [isAccepting, setIsAccepting] = useState(false);

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
    if (status === 'Accepted') {
      const session = sessions.find(s => s._id === id);
      setAcceptTarget(session);
      setSlotForm({ date: '', startTime: '', duration: '45', type: 'Mentorship' });
      return;
    }
    try {
      await mentorshipService.respond(id, { status });
      setSessions(prev => prev.map(s => s._id === id ? { ...s, status } : s));
    } catch (err) {
      alert(err.message || 'Action failed.');
    }
  };

  const submitAccept = async (e) => {
    e.preventDefault();
    if (!slotForm.date || !slotForm.startTime) { alert('Date and Start Time are required.'); return; }
    try {
      setIsAccepting(true);
      const newSlot = await slotService.create(slotForm);
      await mentorshipService.respond(acceptTarget._id, { status: 'Accepted', slotId: newSlot._id });
      setSessions(prev => prev.map(s => s._id === acceptTarget._id ? { ...s, status: 'Accepted', slot: newSlot } : s));
      setAcceptTarget(null);
    } catch (err) {
      alert(err.message || 'Failed to schedule and accept.');
    } finally {
      setIsAccepting(false);
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
          <div className="modal-overlay fade-in">
            <div className="modal-content card" style={{ maxWidth: 500 }}>
              <h3 style={{ marginTop: 0 }}>Complete Session</h3>
              <p className="text-muted" style={{ marginBottom: 20 }}>
                Leave any notes or summary for <strong>{completeTarget.student?.name}</strong>.
              </p>
              <form onSubmit={handleComplete}>
                <div className="form-group">
                  <label className="form-label">Session Notes (Optional)</label>
                  <textarea
                    className="form-input"
                    rows="4"
                    placeholder="Key takeaways, next steps..."
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setCompleteTarget(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : 'Mark Completed'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Accept / Schedule Modal */}
        {acceptTarget && (
          <div className="modal-overlay fade-in">
            <div className="modal-content card" style={{ maxWidth: 500 }}>
              <h3 style={{ marginTop: 0 }}>Schedule &amp; Accept Session</h3>
              <p className="text-muted" style={{ marginBottom: 20 }}>
                Provide a time slot for your session with <strong>{acceptTarget.student?.name}</strong>.
              </p>
              <form onSubmit={submitAccept}>
                <div className="grid-2" style={{ gap: 15, marginBottom: 15 }}>
                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input type="date" className="form-input" required value={slotForm.date} onChange={e => setSlotForm(p => ({...p, date: e.target.value}))} min={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Start Time *</label>
                    <input type="time" className="form-input" required value={slotForm.startTime} onChange={e => setSlotForm(p => ({...p, startTime: e.target.value}))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Duration (minutes)</label>
                  <select className="form-input" value={slotForm.duration} onChange={e => setSlotForm(p => ({...p, duration: e.target.value}))}>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">60 min</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setAcceptTarget(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={isAccepting}>
                    {isAccepting ? 'Scheduling...' : 'Accept Request'}
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
