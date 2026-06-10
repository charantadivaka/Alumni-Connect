import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { interviewService } from '../../services/mentorshipService';

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

  // Feedback modal
  const [feedbackTarget, setFeedbackTarget] = useState(null);
  const [feedback, setFeedback] = useState({ strengths: '', improvements: '', rating: 5 });
  const [submitting, setSubmitting] = useState(false);

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
    try {
      await interviewService.respond(id, { status });
      setInterviews(prev => prev.map(i => i._id === id ? { ...i, status } : i));
    } catch (err) {
      alert(err.message || 'Action failed.');
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
  const displayed = tabMap[activeTab] || [];

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">
        <div className="page-header">
          <h1>Mock Interview Requests</h1>
          <p>Review and manage interview practice requests from students.</p>
        </div>

        {error && <div className="card" style={{ color: 'var(--clr-danger)', marginBottom: 20 }}>{error}</div>}

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
                  <button className="btn btn-primary btn-sm" onClick={() => { setFeedbackTarget(iv); setFeedback({ strengths: '', improvements: '', rating: 5 }); }}>
                    Submit Feedback & Complete
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Feedback Modal */}
        {feedbackTarget && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20
          }}>
            <div className="card" style={{ width: '100%', maxWidth: 520, padding: 30, position: 'relative' }}>
              <button onClick={() => setFeedbackTarget(null)}
                style={{ position: 'absolute', top: 15, right: 15, background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--clr-text-muted)' }}>
                ✕
              </button>
              <h2 style={{ marginBottom: 5 }}>Interview Feedback</h2>
              <p className="text-muted" style={{ marginBottom: 20 }}>
                For: {feedbackTarget.student?.name} — {feedbackTarget.interviewType} Interview
              </p>
              <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                <div className="form-group">
                  <label className="form-label">Rating</label>
                  <select className="form-input" value={feedback.rating} onChange={e => setFeedback(p => ({ ...p, rating: Number(e.target.value) }))}>
                    <option value={5}>⭐⭐⭐⭐⭐ Excellent</option>
                    <option value={4}>⭐⭐⭐⭐ Good</option>
                    <option value={3}>⭐⭐⭐ Average</option>
                    <option value={2}>⭐⭐ Below Average</option>
                    <option value={1}>⭐ Poor</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Strengths</label>
                  <textarea className="form-input" rows={3} value={feedback.strengths} onChange={e => setFeedback(p => ({ ...p, strengths: e.target.value }))} placeholder="What did the student do well?" />
                </div>
                <div className="form-group">
                  <label className="form-label">Areas for Improvement</label>
                  <textarea className="form-input" rows={3} value={feedback.improvements} onChange={e => setFeedback(p => ({ ...p, improvements: e.target.value }))} placeholder="What should the student work on?" />
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setFeedbackTarget(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit & Complete'}</button>
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
