import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { jobService, applicationService } from '../../services/jobService';
import { mentorshipService, interviewService } from '../../services/mentorshipService';
import { connectionService } from '../../services/otherServices';
import '../../styles/Alumni/Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeMentorships, setActiveMentorships] = useState([]);
  const [activeInterviews, setActiveInterviews] = useState([]);
  const [applications, setApplications] = useState([]);
  const [connectionReqs, setConnectionReqs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [jobsData, sessionsData, interviewsData, appsData, connsData] = await Promise.allSettled([
        jobService.getMy(),
        mentorshipService.getMy(),
        interviewService.getMy(),
        applicationService.getAlumni(),
        connectionService.getMy()
      ]);

      if (jobsData.status === 'fulfilled') setJobs(jobsData.value.slice(0, 4));

      if (sessionsData.status === 'fulfilled') {
        const allSessions = sessionsData.value;
        setSessions(allSessions.filter(s => s.status === 'Pending').slice(0, 3));
        setActiveMentorships(allSessions.filter(s => s.status === 'Accepted').slice(0, 3));
      }

      if (interviewsData.status === 'fulfilled') {
        setActiveInterviews(interviewsData.value.filter(i => i.status === 'Accepted').slice(0, 3));
      }

      if (appsData.status === 'fulfilled') setApplications(appsData.value.slice(0, 4));

      if (connsData.status === 'fulfilled') {
        setConnectionReqs(connsData.value.filter(c => c.receiver?._id === user._id && c.status === 'Pending'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  const handleConnectionRespond = async (id, status) => {
    try {
      await connectionService.respond(id, { status });
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const STAGE_COLOR = { Applied: 'badge-primary', 'Under Review': 'badge-ghost', Interview: 'badge-success', Offer: 'badge-success', Rejected: 'badge-danger' };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">
        <div className="page-header">
          <h1>Welcome back, {user?.name}! 🎓</h1>
          <p>Here's an overview of your activity on the platform.</p>
        </div>

        {loading ? (
          <div className="loading-state"><span className="spinner" /> Loading...</div>
        ) : (
          <div className="dashboard-content">

            {/* Stats Row */}
            <div className="grid-3">
              <div className="card dash-card-center">
                <p className="dash-stat-number dash-stat-number--primary">{connectionReqs.length}</p>
                <p className="text-muted dash-stat-label">Connection Requests</p>
              </div>
              <div className="card dash-card-center">
                <p className="dash-stat-number dash-stat-number--success">{applications.length}</p>
                <p className="text-muted dash-stat-label">Applications Received</p>
              </div>
              <div className="card dash-card-center">
                <p className="dash-stat-number dash-stat-number--warning">{sessions.length}</p>
                <p className="text-muted dash-stat-label">Pending Mentorship Requests</p>
              </div>
            </div>

            {/* Pending Connections */}
            {connectionReqs.length > 0 && (
              <div>
                <h2 className="section-title">Pending Connection Requests</h2>
                <div className="grid-2">
                  {connectionReqs.map(c => (
                    <div key={c._id} className="card card-compact">
                      <div className="conn-user-pill">
                        <div className="avatar-placeholder avatar-md" style={{ width: 40, height: 40 }}>
                          {c.sender?.profilePicture
                            ? <img src={c.sender.profilePicture} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} alt={c.sender.name} />
                            : c.sender?.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="conn-user-info">
                          <h3 className="conn-user-name">{c.sender?.name}</h3>
                          <p className="text-muted conn-user-role">{c.sender?.role}</p>
                        </div>
                        <div className="conn-actions">
                          <button className="btn btn-success btn-sm" onClick={() => handleConnectionRespond(c._id, 'Accepted')}>Accept</button>
                          <button className="btn btn-outline btn-sm" onClick={() => handleConnectionRespond(c._id, 'Rejected')}>Reject</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Sessions Row */}
            <div className="grid-2 dashboard-two-col">
              <div>
                <h2 className="section-title">Active Mentorships</h2>
                <div className="card-grid">
                  {activeMentorships.length === 0 ? <p className="text-muted">No active mentorships.</p> : activeMentorships.map(m => (
                    <div key={m._id} className="card card-compact">
                      <h3 className="card-item-title">{m.topic}</h3>
                      <p className="text-muted card-item-sub-sm">Student: {m.student?.name}</p>
                      {m.slot && (
                        <span className="badge badge-success">
                          📅 {new Date(m.slot.date).toLocaleDateString()} at {m.slot.startTime}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="section-title">Active Interviews</h2>
                <div className="card-grid">
                  {activeInterviews.length === 0 ? <p className="text-muted">No active mock interviews.</p> : activeInterviews.map(i => (
                    <div key={i._id} className="card card-compact">
                      <h3 className="card-item-title">{i.targetRole} ({i.interviewType})</h3>
                      <p className="text-muted card-item-sub-sm">Student: {i.student?.name}</p>
                      {i.slot && (
                        <span className="badge badge-primary">
                          📅 {new Date(i.slot.date).toLocaleDateString()} at {i.slot.startTime}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid-2 dashboard-two-col">
              {/* Recent Jobs */}
              <div>
                <h2 className="section-title">Your Recent Job Posts</h2>
                <div className="card-grid">
                  {jobs.length === 0 ? (
                    <div className="card section-empty">
                      <p className="text-muted">No jobs posted yet. Go to Manage Jobs to create one.</p>
                    </div>
                  ) : jobs.map(job => (
                    <div key={job._id} className="card card-compact">
                      <div className="card-row">
                        <div>
                          <h3 className="card-item-title">{job.title}</h3>
                          <p className="text-muted card-item-sub">{job.company} • {job.location}</p>
                        </div>
                        <span className={`badge ${job.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {job.isActive ? 'Active' : 'Closed'}
                        </span>
                      </div>
                      <div className="badge-row">
                        <span className="badge badge-ghost">{job.jobType}</span>
                        {job.ctc && <span className="badge badge-ghost">CTC: {job.ctc}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Applications */}
              <div>
                <h2 className="section-title">Recent Applications</h2>
                <div className="card-grid">
                  {applications.length === 0 ? (
                    <div className="card section-empty">
                      <p className="text-muted">No applications received yet.</p>
                    </div>
                  ) : applications.map(app => (
                    <div key={app._id} className="card card-compact">
                      <div className="card-row">
                        <div>
                          <h3 className="card-item-title">{app.name || app.applicant?.name}</h3>
                          <p className="text-muted card-item-sub">For: {app.job?.title}</p>
                        </div>
                        <span className={`badge ${STAGE_COLOR[app.stage] || 'badge-ghost'}`}>{app.stage}</span>
                      </div>
                      {app.branch && <p className="text-sm text-faint">{app.branch} {app.rollNo && `• ${app.rollNo}`}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pending Mentorship */}
            {sessions.length > 0 && (
              <div>
                <h2 className="section-title">Pending Mentorship Requests</h2>
                <div className="grid-2">
                  {sessions.map(s => (
                    <div key={s._id} className="card card-compact">
                      <div className="card-row">
                        <div>
                          <h3 className="card-item-title">{s.student?.name}</h3>
                          <p className="text-muted card-item-sub-sm">{s.topic}</p>
                        </div>
                        <span className="badge badge-primary">Pending</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
