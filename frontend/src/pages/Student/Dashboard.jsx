import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { jobService } from '../../services/jobService';
import { mentorshipService, interviewService } from '../../services/mentorshipService';
import { connectionService } from '../../services/otherServices';

/* ── Reusable section card ─────────────────────────────────────────── */
const SectionCard = ({ title, icon, color, children, linkTo, linkLabel }) => (
  <div style={{
    background: 'var(--clr-bg-card)',
    border: '1px solid var(--clr-border)',
    borderRadius: 'var(--r-lg)',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-card)',
  }}>
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '16px 20px',
      borderBottom: '1px solid var(--clr-border)',
      background: `${color}08`,
    }}>
      <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '1.15rem' }}>{icon}</span> {title}
      </h2>
      {linkTo && (
        <Link to={linkTo} style={{ fontSize: '0.8rem', color: 'var(--clr-primary)', fontWeight: 600 }}>
          {linkLabel || 'See all →'}
        </Link>
      )}
    </div>
    <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {children}
    </div>
  </div>
);

/* ── Item row ────────────────────────────────────────────────────────── */
const ItemRow = ({ primary, secondary, badge, badgeClass = 'badge-primary' }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 12px', borderRadius: 'var(--r-md)',
    background: 'var(--clr-bg-elevated)',
    border: '1px solid var(--clr-border)',
    justifyContent: 'space-between',
  }}>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {primary}
      </div>
      {secondary && (
        <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', marginTop: 2 }}>{secondary}</div>
      )}
    </div>
    {badge && <span className={`badge ${badgeClass}`} style={{ fontSize: '0.68rem', flexShrink: 0 }}>{badge}</span>}
  </div>
);

const EmptyMsg = ({ msg }) => (
  <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.85rem', margin: '4px 0' }}>{msg}</p>
);

/* ── Dashboard ───────────────────────────────────────────────────────── */
const Dashboard = () => {
  const { user } = useAuth();

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
        setJobs(jobsData.slice(0, 4));
        setMentorships(mentorshipsData.filter(m => m.status === 'Accepted').slice(0, 4));
        setInterviews(interviewsData.filter(i => i.status === 'Accepted').slice(0, 4));
        setConnections(connsData.filter(c => c.status === 'Accepted'));
      } catch (err) {
        console.error('Dashboard data error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">

        <div className="page-header" style={{ marginBottom: 28 }}>
          <h1>Welcome back, {user?.name?.split(' ')?.[0] || 'Student'}! 👋</h1>
          <p>Here's a snapshot of your network activity and opportunities.</p>
        </div>

        {loading ? (
          <div style={{ padding: 'var(--sp-xl)', textAlign: 'center' }}>
            <span className="spinner" /> Loading…
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: 22 }}>

            {/* ── New Connections ─────────────────────────────────── */}
            <SectionCard title="New Connections" icon="🤝" color="#6c63ff" linkTo="/student/circle" linkLabel="View My Circle →">
              {connections.length === 0
                ? <EmptyMsg msg="No connections yet. Go to Network to find alumni and students." />
                : connections.slice(0, 4).map(conn => {
                    const other = conn.sender?._id === user?._id ? conn.receiver : conn.sender;
                    return (
                      <div key={conn._id} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '9px 12px', borderRadius: 'var(--r-md)',
                        background: 'var(--clr-bg-elevated)', border: '1px solid var(--clr-border)',
                      }}>
                        <div className="avatar-placeholder avatar-sm" style={{ width: 34, height: 34, fontSize: '0.8rem', flexShrink: 0 }}>
                          {other?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {other?.name || 'Unknown'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', textTransform: 'capitalize' }}>
                            {other?.role}{other?.company ? ` · ${other.company}` : ''}
                          </div>
                        </div>
                        <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>✓ Connected</span>
                      </div>
                    );
                  })
              }
            </SectionCard>

            {/* ── Active Mentorships ───────────────────────────────── */}
            <SectionCard title="Active Mentorships" icon="🎓" color="#22d3a3" linkTo="/student/jobs-hub" linkLabel="Go to Mentorship →">
              {mentorships.length === 0
                ? <EmptyMsg msg="No active mentorships. Visit Jobs → Mentorship to get started." />
                : mentorships.map(m => (
                    <ItemRow
                      key={m._id}
                      primary={m.topic}
                      secondary={`Mentor: ${m.alumni?.name || ''}${m.alumni?.company ? ` (${m.alumni.company})` : ''}`}
                      badge={m.slot ? `📅 ${new Date(m.slot.date).toLocaleDateString()}` : 'Accepted'}
                      badgeClass="badge-success"
                    />
                  ))
              }
            </SectionCard>

            {/* ── Active Interviews ────────────────────────────────── */}
            <SectionCard title="Active Interviews" icon="🎤" color="#00d4ff" linkTo="/student/jobs-hub" linkLabel="Go to Mock Interviews →">
              {interviews.length === 0
                ? <EmptyMsg msg="No active mock interviews. Visit Jobs → Mock Interviews to schedule one." />
                : interviews.map(i => (
                    <ItemRow
                      key={i._id}
                      primary={`${i.targetRole} (${i.interviewType})`}
                      secondary={`Interviewer: ${i.alumni?.name || ''}${i.alumni?.company ? ` (${i.alumni.company})` : ''}`}
                      badge={i.slot ? `📅 ${new Date(i.slot.date).toLocaleDateString()}` : 'Accepted'}
                      badgeClass="badge-cyan"
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
        )}
      </main>
    </div>
  );
};

export default Dashboard;
