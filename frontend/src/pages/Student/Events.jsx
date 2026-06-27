import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { eventService } from '../../services/eventService';
import { bookmarkService } from '../../services/otherServices';
import '../../styles/Student/Events.css';

const StudentEvents = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [bookmarks, setBookmarks] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rsvping, setRsvping] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'Hackathon', date: '', location: 'Online', link: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [evs, bks] = await Promise.all([
          eventService.getAll(),
          bookmarkService.getAll('Event')
        ]);
        setEvents(evs);
        setBookmarks(new Set(bks.map(b => b.refId)));
      } catch (err) {
        setError(err.message || 'Failed to load events.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title || !form.date || !form.description) { alert('Title, Date, and Description are required.'); return; }
    try {
      setCreating(true);
      const newEvent = await eventService.create(form);
      setEvents(prev => [newEvent, ...prev]);
      setForm({ title: '', description: '', category: 'Hackathon', date: '', location: 'Online', link: '' });
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

  const handleToggleBookmark = async (e, eventId) => {
    e.stopPropagation();
    try {
      await bookmarkService.toggle({ refModel: 'Event', refId: eventId });
      setBookmarks(prev => {
        const next = new Set(prev);
        if (next.has(eventId)) next.delete(eventId);
        else next.add(eventId);
        return next;
      });
    } catch (err) {
      alert('Failed to toggle bookmark');
    }
  };

  const handleRsvp = async (eventId) => {
    try {
      setRsvping(eventId);
      const res = await eventService.rsvp(eventId);
      setEvents(prev => prev.map(ev => {
        if (ev._id !== eventId) return ev;
        const rsvps = res.rsvped
          ? [...(ev.rsvps || []), user._id]
          : (ev.rsvps || []).filter(id => id !== user._id);
        return { ...ev, rsvps };
      }));
    } catch (err) {
      alert(err.message || 'Failed to RSVP.');
    } finally {
      setRsvping(null);
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

  const CATEGORIES = ['', 'Hackathon', 'Workshop'];

  const displayed = filterCategory
    ? events.filter(ev => ev.category === filterCategory)
    : events;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 15 }}>
          <div>
            <h1>Events</h1>
            <p>Upcoming networking, webinars, and career events.</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <select className="form-input" style={{ width: 'auto' }} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c || 'All Categories'}</option>)}
            </select>
            <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
              {showForm ? 'Cancel' : '+ Create Event'}
            </button>
          </div>
        </div>

        {/* Create Event Form */}
        {showForm && (
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16 }}>New Event</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <div className="grid-2" style={{ gap: 15 }}>
                <div className="form-group">
                  <label className="form-label">Event Title *</label>
                  <input type="text" name="title" className="form-input" required value={form.title} onChange={handleChange} placeholder="e.g. Hackfest 2026 / Web Development Workshop" />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select name="category" className="form-input" value={form.category} onChange={handleChange}>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Workshop">Workshop</option>
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
                  <input type="text" name="location" className="form-input" value={form.location} onChange={handleChange} placeholder="Online / Seminar Hall" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Event Link (optional)</label>
                <input type="url" name="link" className="form-input" value={form.link} onChange={handleChange} placeholder="https://meet.google.com/..." />
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea name="description" className="form-input" rows={3} required value={form.description} onChange={handleChange} placeholder="Describe the event, hackathon guidelines, agenda..." />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>{creating ? 'Creating...' : 'Create Event'}</button>
              </div>
            </form>
          </div>
        )}

        {error && <div className="card" style={{ color: 'var(--clr-danger)', marginBottom: 20 }}>{error}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /> Loading...</div>
        ) : displayed.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <span style={{ fontSize: '2rem' }}>📅</span>
            <h3>No Events</h3>
            <p className="text-muted">No upcoming events right now. Check back later!</p>
          </div>
        ) : (
          <div className="grid-2">
            {displayed.map(ev => {
              const isRsvped = Array.isArray(ev.rsvps) && ev.rsvps.some(id => id === user._id || (id?._id || id) === user._id);
              const eventDate = new Date(ev.date);
              const isPast = eventDate < new Date();
              return (
                <div key={ev._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
                  <button 
                    onClick={(e) => handleToggleBookmark(e, ev._id)}
                    style={{ position: 'absolute', top: 15, right: 45, background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
                    title={bookmarks.has(ev._id) ? "Remove Bookmark" : "Save Event"}
                  >
                    {bookmarks.has(ev._id) ? '🔖' : '🤍'}
                  </button>
                  <button 
                    onClick={(e) => handleReportEvent(e, ev._id)}
                    style={{ position: 'absolute', top: 15, right: 15, background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--clr-danger)' }}
                    title="Report Event"
                  >
                    🚩
                  </button>
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <h3 style={{ margin: 0, paddingRight: '75px' }}>{ev.title}</h3>
                  </div>

                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: '0.875rem', color: 'var(--clr-text-muted)', alignItems: 'center' }}>
                    <span className="badge badge-ghost" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>{ev.category}</span>
                    <span>📅 {eventDate.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    <span>📍 {ev.location}</span>
                  </div>

                  <p className="text-sm" style={{ margin: 0, lineHeight: 1.6 }}>
                    {ev.description?.substring(0, 150)}{ev.description?.length > 150 ? '...' : ''}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--clr-border)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span className="text-sm text-muted">By: {ev.createdBy?.name || 'Alumni'}</span>
                      <span className="text-sm text-faint">👥 {(ev.rsvps || []).length} attending</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {ev.link && (
                        <a href={ev.link} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">🔗 Link</a>
                      )}
                      {ev.createdBy?._id === user._id || ev.createdBy === user._id ? (
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--clr-danger)' }} onClick={() => handleDelete(ev._id)}>Delete</button>
                      ) : (
                        <>
                          {!isPast && (
                            <button
                              className={`btn btn-sm ${isRsvped ? 'btn-ghost' : 'btn-primary'}`}
                              style={isRsvped ? { color: 'var(--clr-danger)' } : {}}
                              onClick={() => handleRsvp(ev._id)}
                              disabled={rsvping === ev._id}
                            >
                              {rsvping === ev._id ? '...' : isRsvped ? 'Cancel RSVP' : 'RSVP'}
                            </button>
                          )}
                          {isPast && <span className="badge badge-ghost">Past Event</span>}
                        </>
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

export default StudentEvents;
