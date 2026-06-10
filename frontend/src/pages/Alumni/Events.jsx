import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { eventService } from '../../services/eventService';

const CATEGORIES = ['Webinar', 'Career Fair', 'Networking', 'Workshop', 'Other'];

const AlumniEvents = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'Other', date: '', location: 'Online', link: '' });

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await eventService.getAll();
        setEvents(data);
      } catch (err) {
        setError(err.message || 'Failed to load events.');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title || !form.date || !form.description) { alert('Title, Date, and Description are required.'); return; }
    try {
      setCreating(true);
      const newEvent = await eventService.create(form);
      setEvents(prev => [newEvent, ...prev]);
      setForm({ title: '', description: '', category: 'Other', date: '', location: 'Online', link: '' });
      setShowForm(false);
    } catch (err) {
      alert(err.message || 'Failed to create event.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await eventService.remove(id);
      setEvents(prev => prev.filter(ev => ev._id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete event.');
    }
  };

  const handleReportEvent = async (e, eventId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to report this event as spam or inappropriate?")) {
      try {
        await eventService.report(eventId);
        alert('Event reported to admin successfully.');
      } catch (err) {
        alert(err.response?.data?.message || err.message || 'Failed to report event');
      }
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 15 }}>
          <div>
            <h1>Events</h1>
            <p>Create and manage events for your alumni community.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
            {showForm ? 'Cancel' : '+ Create Event'}
          </button>
        </div>

        {error && <div className="card" style={{ color: 'var(--clr-danger)', marginBottom: 20 }}>{error}</div>}

        {/* Create Event Form */}
        {showForm && (
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16 }}>New Event</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <div className="grid-2" style={{ gap: 15 }}>
                <div className="form-group">
                  <label className="form-label">Event Title *</label>
                  <input type="text" name="title" className="form-input" required value={form.title} onChange={handleChange} placeholder="e.g. Annual Alumni Networking Meetup" />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select name="category" className="form-input" value={form.category} onChange={handleChange}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid-2" style={{ gap: 15 }}>
                <div className="form-group">
                  <label className="form-label">Date & Time *</label>
                  <input type="datetime-local" name="date" className="form-input" required value={form.date} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input type="text" name="location" className="form-input" value={form.location} onChange={handleChange} placeholder="Online / City Name" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Event Link (optional)</label>
                <input type="url" name="link" className="form-input" value={form.link} onChange={handleChange} placeholder="https://meet.google.com/..." />
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea name="description" className="form-input" rows={3} required value={form.description} onChange={handleChange} placeholder="Describe the event, agenda, speakers..." />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>{creating ? 'Creating...' : 'Create Event'}</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /> Loading...</div>
        ) : events.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <span style={{ fontSize: '2rem' }}>📅</span>
            <h3>No Events Yet</h3>
            <p className="text-muted">Be the first to create an event for the community!</p>
          </div>
        ) : (
          <div className="grid-2">
            {events.map(ev => {
              const isOwner = ev.createdBy?._id === user._id || ev.createdBy === user._id;
              return (
                <div key={ev._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ margin: 0 }}>{ev.title}</h3>
                    <span className="badge badge-ghost">{ev.category}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.875rem', color: 'var(--clr-text-muted)' }}>
                    <span>📅 {new Date(ev.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    <span>📍 {ev.location}</span>
                  </div>
                  <p className="text-sm" style={{ margin: 0, lineHeight: 1.6 }}>{ev.description?.substring(0, 150)}{ev.description?.length > 150 ? '...' : ''}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--clr-border)' }}>
                    <span className="text-sm text-faint">👥 {(ev.rsvps || []).length} RSVPs</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {ev.link && <a href={ev.link} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">🔗 Link</a>}
                      {isOwner ? (
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--clr-danger)' }} onClick={() => handleDelete(ev._id)}>Delete</button>
                      ) : (
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--clr-danger)' }} onClick={(e) => handleReportEvent(e, ev._id)} title="Report Event">🚩 Report</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default AlumniEvents;
