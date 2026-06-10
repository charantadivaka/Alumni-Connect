import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { jobService, applicationService } from '../../services/jobService';
import { eventService } from '../../services/eventService';
import { mentorshipService, interviewService } from '../../services/mentorshipService';
import { referralService } from '../../services/otherServices';
import { messageService } from '../../services/messageService';
import { storyService } from '../../services/eventService';

const Dashboard = () => {
  const { user } = useAuth();
  
  // States
  const [jobs, setJobs] = useState([]);
  const [events, setEvents] = useState([]);
  const [mentorships, setMentorships] = useState([]);
  const [interviews, setInterviews] = useState([]);
  
  // Stats states
  const [stats, setStats] = useState({
    connectedAlumni: 0,
    totalMentors: 0,
    messagesReceived: 0,
    referralRequests: 0,
    successStories: 0,
    applications: { applied: 0, shortlisted: 0, rejected: 0, pending: 0 }
  });
  
  const [nextSession, setNextSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [
          jobsData, 
          eventsData, 
          mentorshipsData, 
          interviewsData,
          applicationsData,
          referralsData,
          threadsData,
          storiesData
        ] = await Promise.all([
          jobService.getAll(),
          eventService.getAll(),
          mentorshipService.getMy(),
          interviewService.getMy(),
          applicationService.getMy(),
          referralService.getMy(),
          messageService.getThreads(),
          storyService.getAll()
        ]);
        
        // Active display items
        setJobs(jobsData.slice(0, 3));
        setEvents(eventsData.slice(0, 3));
        setMentorships(mentorshipsData.filter(m => m.status === 'Accepted').slice(0, 3));
        setInterviews(interviewsData.filter(i => i.status === 'Accepted').slice(0, 3));

        // ── Calculate Stats ──

        // 1. Connected Alumni (unique alumni across accepted mentorships, interviews, referrals)
        const connectedSet = new Set();
        mentorshipsData.filter(m => m.status === 'Accepted').forEach(m => m.alumni && connectedSet.add(m.alumni._id));
        interviewsData.filter(i => i.status === 'Accepted').forEach(i => i.alumni && connectedSet.add(i.alumni._id));
        referralsData.filter(r => r.status === 'Provided' || r.status === 'Accepted').forEach(r => r.alumni && connectedSet.add(r.alumni._id));
        
        // 2. Total Mentors (Unique alumni who mentored till now)
        const mentorsSet = new Set();
        mentorshipsData.filter(m => m.status === 'Accepted' || m.status === 'Completed').forEach(m => m.alumni && mentorsSet.add(m.alumni._id));

        // 3. Messages Received
        const msgsRecv = threadsData.reduce((acc, t) => acc + (t.totalReceived || 0), 0);

        // 4. Application Status
        const appCounts = { applied: 0, shortlisted: 0, rejected: 0, pending: 0 };
        applicationsData.forEach(app => {
          appCounts.applied += 1;
          if (app.status === 'Pending' || app.status === 'Reviewed') appCounts.pending += 1;
          else if (app.status === 'Shortlisted' || app.status === 'Accepted') appCounts.shortlisted += 1;
          else if (app.status === 'Rejected') appCounts.rejected += 1;
        });

        setStats({
          connectedAlumni: connectedSet.size,
          totalMentors: mentorsSet.size,
          messagesReceived: msgsRecv,
          referralRequests: referralsData.length,
          successStories: storiesData.length,
          applications: appCounts
        });

        // 5. Next Session (Closest future mentorship or interview slot)
        const now = new Date();
        const allSessions = [];
        
        mentorshipsData.filter(m => m.status === 'Accepted' && m.slot).forEach(m => {
          const sessionDate = new Date(`${m.slot.date}T${m.slot.startTime}`);
          if (sessionDate > now) allSessions.push({ type: 'Mentorship', title: m.topic, date: sessionDate, alumni: m.alumni });
        });
        
        interviewsData.filter(i => i.status === 'Accepted' && i.slot).forEach(i => {
          const sessionDate = new Date(`${i.slot.date}T${i.slot.startTime}`);
          if (sessionDate > now) allSessions.push({ type: 'Interview', title: i.targetRole, date: sessionDate, alumni: i.alumni });
        });

        if (allSessions.length > 0) {
          allSessions.sort((a, b) => a.date - b.date);
          setNextSession(allSessions[0]);
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">
        <div className="page-header" style={{ marginBottom: 30 }}>
          <h1>Welcome back, {user?.name.split(' ')[0]}! 👋</h1>
          <p>Here's your network overview and upcoming activities.</p>
        </div>

        {loading ? (
          <div style={{ padding: 'var(--sp-xl)', textAlign: 'center' }}><span className="spinner" /> Loading...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 35 }}>
            
            {/* ── Stats Grid ── */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: 20 
            }}>
              
              <div className="card" style={{ border: '1px solid var(--clr-border)', padding: 20, textAlign: 'center' }}>
                <span style={{ fontSize: '2rem' }}>🤝</span>
                <h3 style={{ margin: '10px 0 5px', fontSize: '1.8rem', color: 'var(--clr-primary)' }}>{stats.connectedAlumni}</h3>
                <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Connected Alumni</p>
              </div>

              <div className="card" style={{ border: '1px solid var(--clr-border)', padding: 20, textAlign: 'center' }}>
                <span style={{ fontSize: '2rem' }}>🎓</span>
                <h3 style={{ margin: '10px 0 5px', fontSize: '1.8rem', color: 'var(--clr-primary)' }}>{stats.totalMentors}</h3>
                <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Total Mentors</p>
              </div>

              <div className="card" style={{ border: '1px solid var(--clr-border)', padding: 20, textAlign: 'center' }}>
                <span style={{ fontSize: '2rem' }}>💬</span>
                <h3 style={{ margin: '10px 0 5px', fontSize: '1.8rem', color: 'var(--clr-primary)' }}>{stats.messagesReceived}</h3>
                <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Messages Received</p>
              </div>

              <div className="card" style={{ border: '1px solid var(--clr-border)', padding: 20, textAlign: 'center' }}>
                <span style={{ fontSize: '2rem' }}>📩</span>
                <h3 style={{ margin: '10px 0 5px', fontSize: '1.8rem', color: 'var(--clr-primary)' }}>{stats.referralRequests}</h3>
                <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Referral Requests</p>
              </div>

              <div className="card" style={{ border: '1px solid var(--clr-border)', padding: 20, textAlign: 'center' }}>
                <span style={{ fontSize: '2rem' }}>✨</span>
                <h3 style={{ margin: '10px 0 5px', fontSize: '1.8rem', color: 'var(--clr-primary)' }}>{stats.successStories}</h3>
                <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Success Stories</p>
              </div>

            </div>

            {/* ── App Status & Next Session ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
              
              <div className="card" style={{ border: '1px solid var(--clr-border)', padding: 24 }}>
                <h2 style={{ fontSize: '1.1rem', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>📋</span> Application Status
                </h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 15 }}>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--clr-text)' }}>{stats.applications.applied}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>Applied</div>
                  </div>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--clr-warning)' }}>{stats.applications.pending}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>Pending</div>
                  </div>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--clr-success)' }}>{stats.applications.shortlisted}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>Shortlisted</div>
                  </div>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--clr-danger)' }}>{stats.applications.rejected}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>Rejected</div>
                  </div>
                </div>
              </div>

              {nextSession ? (
                <div className="card" style={{ border: '1px solid var(--clr-primary)', background: 'var(--clr-primary-glow)', padding: 24 }}>
                  <h2 style={{ fontSize: '1.1rem', margin: '0 0 16px', color: 'var(--clr-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>⏰</span> Next Session
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{nextSession.title} <span className="badge badge-primary">{nextSession.type}</span></h3>
                    <p style={{ margin: 0, fontWeight: 600 }}>With: {nextSession.alumni?.name}</p>
                    <p style={{ margin: 0, color: 'var(--clr-text-muted)' }}>
                      {nextSession.date.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="card" style={{ border: '1px solid var(--clr-border)', padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p className="text-muted" style={{ margin: 0 }}>No upcoming sessions scheduled.</p>
                </div>
              )}
            </div>

            {/* ── Active Sessions Row ── */}
            <div className="grid-2" style={{ gap: 20 }}>
              <div className="card" style={{ border: '1px solid var(--clr-border)', background: 'transparent', boxShadow: 'none' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--sp-md)', padding: '0 5px' }}>Active Mentorships</h2>
                <div style={{ display: 'grid', gap: 15 }}>
                  {mentorships.length === 0 ? <p className="text-muted" style={{ padding: '0 5px' }}>No active mentorships.</p> : mentorships.map(m => (
                    <div key={m._id} className="card" style={{ padding: 'var(--sp-md)', border: '1px solid var(--clr-border)' }}>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem' }}>{m.topic}</h3>
                      <p className="text-muted" style={{ margin: '0 0 8px 0', fontSize: '0.875rem' }}>
                        Mentor: {m.alumni?.name} {m.alumni?.company ? `(${m.alumni.company})` : ''}
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

              <div className="card" style={{ border: '1px solid var(--clr-border)', background: 'transparent', boxShadow: 'none' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--sp-md)', padding: '0 5px' }}>Active Interviews</h2>
                <div style={{ display: 'grid', gap: 15 }}>
                  {interviews.length === 0 ? <p className="text-muted" style={{ padding: '0 5px' }}>No active mock interviews.</p> : interviews.map(i => (
                    <div key={i._id} className="card" style={{ padding: 'var(--sp-md)', border: '1px solid var(--clr-border)' }}>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem' }}>{i.targetRole} ({i.interviewType})</h3>
                      <p className="text-muted" style={{ margin: '0 0 8px 0', fontSize: '0.875rem' }}>
                        Interviewer: {i.alumni?.name} {i.alumni?.company ? `(${i.alumni.company})` : ''}
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

            {/* ── General Row ── */}
            <div className="grid-2" style={{ gap: 20 }}>
              <div className="card" style={{ border: '1px solid var(--clr-border)', background: 'transparent', boxShadow: 'none' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--sp-md)', padding: '0 5px' }}>Latest Opportunities</h2>
                <div style={{ display: 'grid', gap: 15 }}>
                  {jobs.length === 0 ? <p className="text-muted" style={{ padding: '0 5px' }}>No jobs posted recently.</p> : jobs.map(job => (
                    <div key={job._id} className="card" style={{ padding: 'var(--sp-md)', border: '1px solid var(--clr-border)' }}>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem' }}>{job.title}</h3>
                      <p className="text-muted" style={{ margin: '0 0 8px 0', fontSize: '0.875rem' }}>{job.company} • {job.location}</p>
                      <span className="badge badge-primary">{job.jobType}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card" style={{ border: '1px solid var(--clr-border)', background: 'transparent', boxShadow: 'none' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--sp-md)', padding: '0 5px' }}>Upcoming Events</h2>
                <div style={{ display: 'grid', gap: 15 }}>
                  {events.length === 0 ? <p className="text-muted" style={{ padding: '0 5px' }}>No events coming up.</p> : events.map(event => (
                    <div key={event._id} className="card" style={{ padding: 'var(--sp-md)', border: '1px solid var(--clr-border)' }}>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem' }}>{event.title}</h3>
                      <p className="text-muted" style={{ margin: '0 0 8px 0', fontSize: '0.875rem' }}>📅 {new Date(event.date).toLocaleDateString()}</p>
                      <span className="badge badge-ghost">📍 {event.location}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
