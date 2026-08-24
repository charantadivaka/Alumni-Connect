import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { jobService } from '../../services/jobService';
import { mentorshipService, interviewService } from '../../services/mentorshipService';
import { connectionService } from '../../services/otherServices';
import '../../styles/Student/Dashboard.css';

/* ── Reusable section card ─────────────────────────────────────────── */
const SectionCard = ({ title, icon, color, children, linkTo, linkLabel }) => (
  <div className="section-card">
    <div className="section-card-header" style={{ background: `${color}08` }}>
      <h2 className="section-card-title">
        <span className="section-card-icon">{icon}</span> {title}
      </h2>
      {linkTo && (
        <Link to={linkTo} className="section-card-link">
          {linkLabel || 'See all →'}
        </Link>
      )}
    </div>
    <div className="section-card-body">
      {children}
    </div>
  </div>
);

/* ── Item row ────────────────────────────────────────────────────────── */
const ItemRow = ({ primary, secondary, badge, badgeClass = 'badge-primary', onClick }) => (
  <div className={`item-row ${onClick ? 'item-row-clickable' : ''}`} onClick={onClick}>
    <div className="item-row-info">
      <div className="item-row-primary">{primary}</div>
      {secondary && <div className="item-row-secondary">{secondary}</div>}
    </div>
    {badge && <span className={`badge ${badgeClass} item-row-badge`}>{badge}</span>}
  </div>
);

const EmptyMsg = ({ msg }) => (
  <p className="text-muted section-empty-msg">{msg}</p>
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs]               = useState([]);
  const [mentorships, setMentorships] = useState([]);
  const [interviews, setInterviews]   = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsData, mentorshipsData, interviewsData, connsData] = await Promise.all([
          jobService.getAll(),
          mentorshipService.getMy(),
          interviewService.getMy(),
          connectionService.getMy(),
        ]);
        setJobs((jobsData.jobs || jobsData || []).slice(0, 4));
        setMentorships(mentorshipsData.filter(m => m.status === 'Accepted').slice(0, 4));
        setInterviews(interviewsData.filter(i => i.status === 'Accepted').slice(0, 4));
        setConnections(connsData.filter(c => c.receiver?._id === user._id && c.status === 'Pending'));
      } catch (err) {
        console.error('Dashboard data error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user._id]);

  const handleConnectionRespond = async (id, status) => {
    try {
      await connectionService.respond(id, { status });
      const connsData = await connectionService.getMy();
      setConnections(connsData.filter(c => c.receiver?._id === user._id && c.status === 'Pending'));
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    }
  };

  const upcomingActivities = [
    ...mentorships.filter(m => m.slot).map(m => ({ ...m, activityType: 'Mentorship' })),
    ...interviews.filter(i => i.slot).map(i => ({ ...i, activityType: 'Mock Interview' }))
  ].sort((a, b) => new Date(a.slot.date) - new Date(b.slot.date));

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">
        <div className="page-header">
          <h1>Welcome back, {user?.name?.split(' ')?.[0] || 'Student'}! 👋</h1>
          <p>Here's a snapshot of your network activity and opportunities.</p>
        </div>

        {loading ? (
          <div className="loading-state">
            <span className="spinner" /> Loading…
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              <Link to="/student/circle" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 20px', textAlign: 'center', height: '100%', cursor: 'pointer', transition: 'transform 0.2s', borderTop: '4px solid #6c63ff' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                  <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🤝</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '10px 0' }}>{connections.length}</div>
                  <div style={{ fontSize: '1rem', color: 'var(--clr-text-muted)' }}>Requests</div>
                </div>
              </Link>
              <Link to="/student/jobs-hub/mentorship" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 20px', textAlign: 'center', height: '100%', cursor: 'pointer', transition: 'transform 0.2s', borderTop: '4px solid #22d3a3' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                  <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🎓</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '10px 0' }}>{mentorships.length}</div>
                  <div style={{ fontSize: '1rem', color: 'var(--clr-text-muted)' }}>Mentorships</div>
                </div>
              </Link>
              <Link to="/student/jobs-hub/interviews" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 20px', textAlign: 'center', height: '100%', cursor: 'pointer', transition: 'transform 0.2s', borderTop: '4px solid #00d4ff' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                  <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🎤</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '10px 0' }}>{interviews.length}</div>
                  <div style={{ fontSize: '1rem', color: 'var(--clr-text-muted)' }}>Interviews</div>
                </div>
              </Link>
            </div>

            <div className="student-dashboard-grid">
              {/* ── Upcoming Activities ─────────────────────────────── */}
              <SectionCard title="Upcoming Activities" icon="📅" color="#ff6b6b">
                {upcomingActivities.length === 0
                  ? <EmptyMsg msg="No upcoming scheduled activities." />
                  : upcomingActivities.map(act => (
                      <ItemRow
                        key={act._id}
                        primary={act.activityType === 'Mentorship' ? act.topic : `${act.targetRole} (${act.interviewType})`}
                        secondary={`Alumni: ${act.alumni?.name || ''} | 🕐 ${act.slot.startTime} | ⏱ ${act.slot.duration} min`}
                        badge={`📅 ${new Date(act.slot.date).toLocaleDateString()}`}
                        badgeClass={act.activityType === 'Mentorship' ? 'badge-success' : 'badge-cyan'}
                        onClick={() => navigate(act.activityType === 'Mentorship' ? '/student/jobs-hub/mentorship' : '/student/jobs-hub/interviews')}
                      />
                    ))
                }
              </SectionCard>

              {/* ── Latest Opportunities ─────────────────────────────── */}
              <SectionCard title="Latest Opportunities" icon="💼" color="#fbbf24" linkTo="/student/jobs-hub" linkLabel="Browse All Jobs →">
                {jobs.length === 0
                  ? <EmptyMsg msg="No job postings available yet. Check back soon!" />
                  : jobs.map(job => (
                      <ItemRow
                        key={job._id}
                        primary={job.title}
                        secondary={`${job.company} · ${job.location}`}
                        badge={job.jobType}
                        badgeClass="badge-warning"
                      />
                    ))
                }
              </SectionCard>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
