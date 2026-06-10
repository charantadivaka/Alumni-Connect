import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { jobService, applicationService } from '../../services/jobService';
import { mentorshipService, interviewService } from '../../services/mentorshipService';
import { connectionService } from '../../services/otherServices';

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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleConnectionRespond = async (id, status) => {
    try {
      await connectionService.respond(id, { status });
      fetchDashboardData(); // Reload data
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
          <div style={{ padding: 'var(--sp-xl)', textAlign: 'center' }}><span className="spinner" /> Loading...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xl)' }}>
            
            {/* Stats Row */}
            <div className="grid-3" style={{ gap: 'var(--sp-md)' }}>
              <div className="card" style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 4px', color: 'var(--clr-primary)' }}>{connectionReqs.length}</p>
                <p className="text-muted" style={{ margin: 0 }}>Connection Requests</p>
              </div>
              <div className="card" style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 4px', color: 'var(--clr-success)' }}>{applications.length}</p>
                <p className="text-muted" style={{ margin: 0 }}>Applications Received</p>
              </div>
              <div className="card" style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 4px', color: 'var(--clr-warning, #f59e0b)' }}>{sessions.length}</p>
                <p className="text-muted" style={{ margin: 0 }}>Pending Mentorship Requests</p>
              </div>
            </div>

            {/* Pending Connections */}
            {connectionReqs.length > 0 && (
              <div>
                <h2 style={{ fontSize: '1.1rem', marginBottom: 'var(--sp-md)' }}>Pending Connection Requests</h2>
                <div className="grid-2" style={{ gap: 'var(--sp-md)' }}>
                  {connectionReqs.map(c => (
                    <div key={c._id} className="card" style={{ padding: 'var(--sp-md)' }}>
                      <div style={{ display: 'flex', gap: 'var(--sp-md)', alignItems: 'center' }}>
                        <div className="avatar-placeholder avatar-md" style={{ width: 40, height: 40 }}>
                          {c.sender?.profilePicture 
                            ? <img src={c.sender.profilePicture} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} /> 
                            : c.sender?.name?.[0]?.toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ margin: '0 0 2px', fontSize: '1rem' }}>{c.sender?.name}</h3>
                          <p className="text-muted" style={{ margin: 0, fontSize: '0.8rem' }}>{c.sender?.role}</p>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
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
            <div className="grid-2" style={{ gap: 'var(--sp-xl)' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', marginBottom: 'var(--sp-md)' }}>Active Mentorships</h2>
                <div style={{ display: 'grid', gap: 'var(--sp-md)' }}>
                  {activeMentorships.length === 0 ? <p className="text-muted">No active mentorships.</p> : activeMentorships.map(m => (
                    <div key={m._id} className="card" style={{ padding: 'var(--sp-md)' }}>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem' }}>{m.topic}</h3>
                      <p className="text-muted" style={{ margin: '0 0 8px 0', fontSize: '0.875rem' }}>
                        Student: {m.student?.name}
                      </p>
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
                <h2 style={{ fontSize: '1.1rem', marginBottom: 'var(--sp-md)' }}>Active Interviews</h2>
                <div style={{ display: 'grid', gap: 'var(--sp-md)' }}>
                  {activeInterviews.length === 0 ? <p className="text-muted">No active mock interviews.</p> : activeInterviews.map(i => (
                    <div key={i._id} className="card" style={{ padding: 'var(--sp-md)' }}>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem' }}>{i.targetRole} ({i.interviewType})</h3>
                      <p className="text-muted" style={{ margin: '0 0 8px 0', fontSize: '0.875rem' }}>
                        Student: {i.student?.name}
                      </p>
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

            <div className="grid-2" style={{ gap: 'var(--sp-xl)' }}>
              {/* Recent Jobs */}
              <div>
                <h2 style={{ fontSize: '1.1rem', marginBottom: 'var(--sp-md)' }}>Your Recent Job Posts</h2>
                <div style={{ display: 'grid', gap: 'var(--sp-md)' }}>
                  {jobs.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: 24 }}>
                      <p className="text-muted">No jobs posted yet. Go to Manage Jobs to create one.</p>
                    </div>
                  ) : jobs.map(job => (
                    <div key={job._id} className="card" style={{ padding: 'var(--sp-md)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ margin: '0 0 2px', fontSize: '1rem' }}>{job.title}</h3>
                          <p className="text-muted" style={{ margin: '0 0 6px', fontSize: '0.8rem' }}>{job.company} • {job.location}</p>
                        </div>
                        <span className={`badge ${job.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {job.isActive ? 'Active' : 'Closed'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span className="badge badge-ghost" style={{ fontSize: '0.7rem' }}>{job.jobType}</span>
                        {job.ctc && <span className="badge badge-ghost" style={{ fontSize: '0.7rem' }}>CTC: {job.ctc}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Applications */}
              <div>
                <h2 style={{ fontSize: '1.1rem', marginBottom: 'var(--sp-md)' }}>Recent Applications</h2>
                <div style={{ display: 'grid', gap: 'var(--sp-md)' }}>
                  {applications.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: 24 }}>
                      <p className="text-muted">No applications received yet.</p>
                    </div>
                  ) : applications.map(app => (
                    <div key={app._id} className="card" style={{ padding: 'var(--sp-md)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ margin: '0 0 2px', fontSize: '1rem' }}>{app.name || app.applicant?.name}</h3>
                          <p className="text-muted" style={{ margin: '0 0 6px', fontSize: '0.8rem' }}>For: {app.job?.title}</p>
                        </div>
                        <span className={`badge ${STAGE_COLOR[app.stage] || 'badge-ghost'}`}>{app.stage}</span>
                      </div>
                      {app.branch && <p className="text-sm text-faint" style={{ margin: 0 }}>{app.branch} {app.rollNo && `• ${app.rollNo}`}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pending Mentorship */}
            {sessions.length > 0 && (
              <div>
                <h2 style={{ fontSize: '1.1rem', marginBottom: 'var(--sp-md)' }}>Pending Mentorship Requests</h2>
                <div className="grid-2" style={{ gap: 'var(--sp-md)' }}>
                  {sessions.map(s => (
                    <div key={s._id} className="card" style={{ padding: 'var(--sp-md)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ margin: '0 0 2px', fontSize: '1rem' }}>{s.student?.name}</h3>
                          <p className="text-muted" style={{ margin: 0, fontSize: '0.875rem' }}>{s.topic}</p>
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
