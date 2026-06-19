import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { adminService } from '../../services/adminService';
import { jobService } from '../../services/jobService';
import { eventService } from '../../services/eventService';
import '../../styles/Admin/ContentModeration.css';

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

  useEffect(() => { fetchData(); }, [activeTab]);

  const handleDeleteJob = async (id) => {
    if (window.confirm('Are you sure you want to delete this reported job? This action cannot be undone.')) {
      try {
        await jobService.remove(id);
        setJobs(jobs.filter(j => j._id !== id));
      } catch (err) {
        alert(err.response?.data?.message || err.message || 'Failed to delete job');
      }
    }
  };

  const handleDeleteEvent = async (id) => {
    if (window.confirm('Are you sure you want to delete this reported event? This action cannot be undone.')) {
      try {
        await eventService.remove(id);
        setEvents(events.filter(e => e._id !== id));
      } catch (err) {
        alert(err.response?.data?.message || err.message || 'Failed to delete event');
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

        <div className="moderation-tabs">
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
          <div className="loading-state"><span className="spinner" /> Loading...</div>
        ) : activeTab === 'jobs' ? (
          <div className="grid-2">
            {jobs.length === 0 ? <p>No reported jobs found.</p> : jobs.map(job => (
              <div key={job._id} className="card reported-card">
                <div className="reported-card-header">
                  <div>
                    <h3 className="reported-card-title">{job.title}</h3>
                    <p className="text-muted reported-card-sub">{job.company} — {job.location}</p>
                    <p className="text-sm reported-info">
                      <strong>Posted by:</strong> {job.postedBy?.name || 'Unknown User'} ({job.postedBy?.email || 'N/A'})
                    </p>
                    <p className="text-sm reported-count">
                      <strong>Reports:</strong> {job.reports?.length || 0}
                    </p>
                  </div>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDeleteJob(job._id)}>
                    Delete Job
                  </button>
                </div>
                <div className="reported-date">
                  Created at: {new Date(job.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid-2">
            {events.length === 0 ? <p>No reported events found.</p> : events.map(evt => (
              <div key={evt._id} className="card reported-card">
                <div className="reported-card-header">
                  <div>
                    <h3 className="reported-card-title">{evt.title}</h3>
                    <p className="text-sm reported-info"><strong>Organizer:</strong> {evt.createdBy?.name || 'Unknown'}</p>
                    <div className="reported-event-meta">
                      <span>📅 {new Date(evt.date).toLocaleDateString()}</span>
                      <span>📍 {evt.location || 'Online'}</span>
                    </div>
                    <p className="text-sm reported-count">
                      <strong>Reports:</strong> {evt.reports?.length || 0}
                    </p>
                  </div>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDeleteEvent(evt._id)}>
                    Delete Event
                  </button>
                </div>
                <p className="text-sm">{evt.description?.substring(0, 100)}...</p>
                <div className="reported-card-footer">
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
