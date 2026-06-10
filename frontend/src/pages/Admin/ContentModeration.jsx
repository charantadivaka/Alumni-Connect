import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { adminService } from '../../services/adminService';
import { jobService } from '../../services/jobService';
import { eventService } from '../../services/eventService';

const ContentModeration = () => {
  const [activeTab, setActiveTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'jobs') {
        const data = await adminService.getReportedJobs();
        setJobs(data);
      } else {
        const data = await adminService.getReportedEvents();
        setEvents(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleDeleteJob = async (id) => {
    if (window.confirm("Are you sure you want to delete this reported job? This action cannot be undone.")) {
      try {
        await jobService.remove(id);
        setJobs(jobs.filter(j => j._id !== id));
      } catch (err) {
        alert(err.response?.data?.message || err.message || "Failed to delete job");
      }
    }
  };

  const handleDeleteEvent = async (id) => {
    if (window.confirm("Are you sure you want to delete this reported event? This action cannot be undone.")) {
      try {
        await eventService.remove(id);
        setEvents(events.filter(e => e._id !== id));
      } catch (err) {
        alert(err.response?.data?.message || err.message || "Failed to delete event");
      }
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">
        <div className="page-header">
          <h1>Content Moderation</h1>
          <p>Review and manage community-reported job postings and events</p>
        </div>

        <div className="tabs" style={{ display: 'flex', gap: 'var(--sp-md)', marginBottom: 'var(--sp-md)', borderBottom: '1px solid var(--clr-border)', paddingBottom: 'var(--sp-sm)' }}>
          <button 
            className={`btn ${activeTab === 'jobs' ? 'btn-primary' : 'btn-ghost'}`} 
            onClick={() => setActiveTab('jobs')}
          >
            Reported Jobs ({jobs.length})
          </button>
          <button 
            className={`btn ${activeTab === 'events' ? 'btn-primary' : 'btn-ghost'}`} 
            onClick={() => setActiveTab('events')}
          >
            Reported Events ({events.length})
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 'var(--sp-xl)', textAlign: 'center' }}><span className="spinner" /> Loading...</div>
        ) : activeTab === 'jobs' ? (
          <div className="grid-2">
            {jobs.length === 0 ? <p>No reported jobs found.</p> : jobs.map(job => (
              <div key={job._id} className="card" style={{ border: '1px solid var(--clr-danger)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', color: 'var(--clr-text)' }}>{job.title}</h3>
                    <p className="text-muted" style={{ margin: 0, fontSize: '0.875rem' }}>{job.company} — {job.location}</p>
                    <p className="text-sm" style={{ margin: '8px 0' }}>
                      <strong>Posted by:</strong> {job.postedBy?.name || 'Unknown User'} ({job.postedBy?.email || 'N/A'})
                    </p>
                    <p className="text-sm" style={{ margin: '8px 0', color: 'var(--clr-danger)' }}>
                      <strong>Reports:</strong> {job.reports?.length || 0}
                    </p>
                  </div>
                  <button className="btn btn-sm" style={{ background: 'var(--clr-danger)', color: 'white' }} onClick={() => handleDeleteJob(job._id)}>
                    Delete Job
                  </button>
                </div>
                <div style={{ marginTop: 'var(--sp-sm)', fontSize: '0.875rem', color: 'var(--clr-text-muted)' }}>
                  Created at: {new Date(job.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid-2">
            {events.length === 0 ? <p>No reported events found.</p> : events.map(evt => (
              <div key={evt._id} className="card" style={{ border: '1px solid var(--clr-danger)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0' }}>{evt.title}</h3>
                    <p className="text-sm" style={{ margin: '0 0 8px 0' }}><strong>Organizer:</strong> {evt.createdBy?.name || 'Unknown'}</p>
                    <div style={{ display: 'flex', gap: 'var(--sp-md)', fontSize: '0.875rem', color: 'var(--clr-text-muted)', marginBottom: 'var(--sp-md)' }}>
                      <span>📅 {new Date(evt.date).toLocaleDateString()}</span>
                      <span>📍 {evt.location || 'Online'}</span>
                    </div>
                    <p className="text-sm" style={{ margin: '8px 0', color: 'var(--clr-danger)' }}>
                      <strong>Reports:</strong> {evt.reports?.length || 0}
                    </p>
                  </div>
                  <button className="btn btn-sm" style={{ background: 'var(--clr-danger)', color: 'white' }} onClick={() => handleDeleteEvent(evt._id)}>
                    Delete Event
                  </button>
                </div>
                <p className="text-sm" style={{ margin: 0 }}>{evt.description?.substring(0, 100)}...</p>
                <div style={{ marginTop: 'var(--sp-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-primary">{evt.rsvps?.length || 0} RSVPs</span>
                  <span className="text-sm text-faint">{new Date(evt.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ContentModeration;
