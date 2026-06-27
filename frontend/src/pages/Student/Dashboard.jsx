import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
const ItemRow = ({ primary, secondary, badge, badgeClass = 'badge-primary' }) => (
  <div className="item-row">
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
          <div className="student-dashboard-grid">

            {/* ── Pending Connections ─────────────────────────────────── */}
            <SectionCard title="Pending Connection Requests" icon="🤝" color="#6c63ff" linkTo="/student/circle" linkLabel="View My Circle →">
              {connections.length === 0
                ? <EmptyMsg msg="No pending connection requests." />
                : connections.slice(0, 4).map(c => (
                    <div key={c._id} className="conn-item" style={{ flexWrap: 'wrap' }}>
                      <div className="avatar-placeholder avatar-sm conn-item-avatar">
                        {c.sender?.profilePicture
                          ? <img src={c.sender.profilePicture} alt={c.sender.name} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
                          : c.sender?.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="conn-item-info">
                        <div className="conn-item-name">{c.sender?.name || 'Unknown'}</div>
                        <div className="conn-item-role">
                          {c.sender?.role}{c.sender?.company ? ` · ${c.sender.company}` : ''}
                        </div>
                      </div>
                      <div className="conn-actions">
                        <button className="btn btn-success btn-sm" onClick={() => handleConnectionRespond(c._id, 'Accepted')}>Accept</button>
                        <button className="btn btn-outline btn-sm" onClick={() => handleConnectionRespond(c._id, 'Rejected')}>Reject</button>
                      </div>
                    </div>
                  ))
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
