import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { interviewService, slotService } from '../../services/mentorshipService';
import { useVideoCall } from '../../context/VideoCallContext';
import '../../styles/Alumni/InterviewRequests.css';

const BADGE = {
  Pending:   'badge-primary',
  Accepted:  'badge-success',
  Rejected:  'badge-danger',
  Completed: 'badge-ghost',
};

const InterviewRequests = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const { startCall } = useVideoCall();

  // Feedback modal
  const [feedbackTarget, setFeedbackTarget] = useState(null);
  const [feedback, setFeedback] = useState({ strengths: '', improvements: '', rating: 5 });
  const [submitting, setSubmitting] = useState(false);

  // Accept modal state
  const [acceptTarget, setAcceptTarget] = useState(null);
  const [slotForm, setSlotForm] = useState({ date: '', startTime: '', duration: '45', type: 'MockInterview' });
  const [isAccepting, setIsAccepting] = useState(false);

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

  const handleRespond = async (id, status) => {
    if (status === 'Accepted') {
      const interview = interviews.find(i => i._id === id);
      setAcceptTarget(interview);
      setSlotForm({ date: '', startTime: '', duration: '45', type: 'MockInterview' });
      return;
    }
    try {
      await interviewService.respond(id, { status });
      setInterviews(prev => prev.map(i => i._id === id ? { ...i, status } : i));
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
      await interviewService.respond(acceptTarget._id, { status: 'Accepted', slotId: newSlot._id });
      setInterviews(prev => prev.map(i => i._id === acceptTarget._id ? { ...i, status: 'Accepted', slot: newSlot } : i));
      setAcceptTarget(null);
    } catch (err) {
      alert(err.message || 'Failed to schedule and accept.');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.strengths && !feedback.improvements) { alert('Please fill at least one feedback field.'); return; }
    try {
      setSubmitting(true);
      await interviewService.feedback(feedbackTarget._id, feedback);
      setInterviews(prev => prev.map(i => i._id === feedbackTarget._id ? { ...i, status: 'Completed', feedback } : i));
      setFeedbackTarget(null);
      setFeedback({ strengths: '', improvements: '', rating: 5 });
    } catch (err) {
      alert(err.message || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  const pending   = interviews.filter(i => i.status === 'Pending');
  const accepted  = interviews.filter(i => i.status === 'Accepted');
  const past      = interviews.filter(i => ['Completed', 'Rejected'].includes(i.status));

  const tabMap = { pending, accepted, past };
  const rawDisplayed = tabMap[activeTab] || [];

  const displayed = rawDisplayed.filter(i => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const topicMatch = i.topic?.toLowerCase().includes(q);
    const studentMatch = i.student?.name?.toLowerCase().includes(q);
    return topicMatch || studentMatch;
  });

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">
        <div className="page-header">
          <h1>Mock Interview Requests</h1>
          <p>Review and manage interview practice requests from students.</p>
        </div>

        {error && <div className="card" style={{ color: 'var(--clr-danger)', marginBottom: 20 }}>{error}</div>}

        <div style={{ marginBottom: 20 }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by topic or student name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', maxWidth: '400px' }}
          />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid var(--clr-border)', paddingBottom: 12, flexWrap: 'wrap' }}>
          <button className={`btn ${activeTab === 'pending' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('pending')}>
            Pending ({pending.length})
          </button>
          <button className={`btn ${activeTab === 'accepted' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('accepted')}>
            Accepted ({accepted.length})
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
            <h3>Nothing Here</h3>
            <p className="text-muted">No interview requests in this category.</p>
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
                  <p className="text-sm" style={{ margin: 0 }}><strong>Student:</strong> {iv.student?.name} {iv.student?.department ? `— ${iv.student.department}` : ''}</p>
                </div>

                {iv.slot && (
                  <p className="text-sm text-muted">📅 {new Date(iv.slot.date).toLocaleDateString()} at {iv.slot.startTime}</p>
                )}

                {iv.status === 'Completed' && iv.feedback?.rating && (
                  <div style={{ background: 'var(--clr-bg-elevated)', borderRadius: 'var(--r-sm)', padding: 12 }}>
                    <p className="text-sm" style={{ margin: '0 0 6px' }}>Feedback given: {'⭐'.repeat(iv.feedback.rating)}</p>
                    {iv.feedback.strengths && <p className="text-sm" style={{ margin: '0 0 4px' }}>✅ {iv.feedback.strengths}</p>}
                    {iv.feedback.improvements && <p className="text-sm" style={{ margin: 0 }}>📈 {iv.feedback.improvements}</p>}
                  </div>
                )}

                <p className="text-sm text-faint" style={{ marginTop: 'auto' }}>{new Date(iv.createdAt).toLocaleDateString()}</p>

                {iv.status === 'Pending' && (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => handleRespond(iv._id, 'Accepted')}>Accept</button>
                    <button className="btn btn-ghost btn-sm" style={{ flex: 1, color: 'var(--clr-danger)' }} onClick={() => handleRespond(iv._id, 'Rejected')}>Reject</button>
                  </div>
                )}

                {iv.status === 'Accepted' && (
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => { setFeedbackTarget(iv); setFeedback({ strengths: '', improvements: '', rating: 5 }); }}
                    >
                      Submit Feedback &amp; Complete
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      onClick={() => startCall(
                        iv.student?._id,
                        iv.student?.name || 'Student',
                        iv._id,
                        'interview'
                      )}
                      title={`Start video call with ${iv.student?.name}`}
                    >
                      📹 Video Call
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Feedback Modal */}
        {feedbackTarget && (
          <div className="modal-overlay fade-in">
            <div className="modal-content card" style={{ maxWidth: 500 }}>
              <h3 style={{ marginTop: 0 }}>Provide Feedback</h3>
              <p className="text-muted" style={{ marginBottom: 20 }}>
                For <strong>{feedbackTarget.student?.name}</strong>.
              </p>
              <form onSubmit={handleFeedbackSubmit}>
                <div className="form-group">
                  <label className="form-label">Strengths</label>
                  <textarea className="form-input" rows="3" value={feedback.strengths} onChange={e => setFeedback(p => ({...p, strengths: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Areas for Improvement</label>
                  <textarea className="form-input" rows="3" value={feedback.improvements} onChange={e => setFeedback(p => ({...p, improvements: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Rating (1-5)</label>
                  <input type="number" min="1" max="5" className="form-input" value={feedback.rating} onChange={e => setFeedback(p => ({...p, rating: e.target.value}))} />
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setFeedbackTarget(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Feedback'}
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
              <h3 style={{ marginTop: 0 }}>Schedule &amp; Accept Interview</h3>
              <p className="text-muted" style={{ marginBottom: 20 }}>
                Provide a time slot for your mock interview with <strong>{acceptTarget.student?.name}</strong>.
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

export default InterviewRequests;
