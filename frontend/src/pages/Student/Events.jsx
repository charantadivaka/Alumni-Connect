import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { eventService } from '../../services/eventService';
import { bookmarkService } from '../../services/otherServices';
import { useDebounce } from '../../hooks/useDebounce';
import '../../styles/Student/Events.css';

const CATEGORIES = ['Hackathon', 'Workshop', 'Webinar', 'Networking', 'Career Fair', 'Seminar', 'Tech Talk', 'Coding Contest', 'Other'];

const StudentEvents = () => {
  const { user } = useAuth();
  
  // Data state
  const [events, setEvents] = useState([]);
  const [bookmarks, setBookmarks] = useState(new Set());
  const [total, setTotal] = useState(0);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rsvping, setRsvping] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [filterCategory, setFilterCategory] = useState('');
  const [timeframe, setTimeframe] = useState(''); // Upcoming, Past
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 400);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', category: 'Hackathon', date: '', location: 'Online', link: '' });

  const fetchEvents = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const params = { page: pageNum, limit: 20 };
      if (filterCategory) params.category = filterCategory;
      if (timeframe) params.timeframe = timeframe;
      if (debouncedSearch) params.search = debouncedSearch;

      const [evs, bks] = await Promise.all([
        eventService.getAll(params),
        pageNum === 1 ? bookmarkService.getAll('Event') : Promise.resolve(null)
      ]);

      const fetchedEvents = evs.events || evs || [];
      if (append) {
        setEvents(prev => [...prev, ...fetchedEvents]);
      } else {
        setEvents(fetchedEvents);
      }
      
      if (evs.total !== undefined) setTotal(evs.total);
      
      if (bks) {
        setBookmarks(new Set(bks.map(b => b.refId)));
      }
    } catch (err) {
      setError(err.message || 'Failed to load events.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filterCategory, timeframe, debouncedSearch]);

  useEffect(() => {
    setPage(1);
    fetchEvents(1, false);
  }, [fetchEvents]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchEvents(nextPage, true);
  };

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const openCreateForm = () => {
    setForm({ title: '', description: '', category: 'Hackathon', date: '', location: 'Online', link: '' });
    setEditingEvent(null);
    setShowForm(true);
  };

  const openEditForm = (ev) => {
    const d = new Date(ev.date);
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localIso = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    
    setForm({
      title: ev.title, description: ev.description, category: ev.category,
      date: localIso, location: ev.location, link: ev.link || ''
    });
    setEditingEvent(ev._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.date || !form.description) { alert('Title, Date, and Description are required.'); return; }
    try {
      setCreating(true);
      const payload = { ...form, date: new Date(form.date).toISOString() };
      
      if (editingEvent) {
        const updated = await eventService.update(editingEvent, payload);
        setEvents(prev => prev.map(ev => ev._id === editingEvent ? { ...ev, ...updated } : ev));
        alert('Event updated successfully!');
      } else {
        const newEvent = await eventService.create(payload);
        setEvents(prev => [newEvent, ...prev]);
        setTotal(t => t + 1);
      }
      setShowForm(false);
    } catch (err) {
      alert(err.message || 'Failed to save event.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event permanently?')) return;
    try {
      await eventService.remove(id);
      setEvents(prev => prev.filter(ev => ev._id !== id));
      setTotal(t => Math.max(0, t - 1));
    } catch (err) {
      alert(err.message || 'Failed to delete event.');
    }
  };

  const handleCancelEvent = async (id) => {
    if (!window.confirm('Mark this event as Cancelled? Students will be notified.')) return;
    try {
      const updated = await eventService.update(id, { status: 'Cancelled' });
      setEvents(prev => prev.map(ev => ev._id === id ? { ...ev, status: 'Cancelled' } : ev));
    } catch (err) {
      alert(err.message || 'Failed to cancel event.');
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
      alert(err.message || 'Failed to register.');
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

  const getEventStatus = (ev) => {
    if (ev.status === 'Cancelled') return { label: 'Cancelled', color: 'var(--clr-danger)' };
    const now = new Date();
    const eventStart = new Date(ev.date);
    const eventEnd = new Date(eventStart.getTime() + 2 * 60 * 60 * 1000); // Assume 2 hour duration

    if (now > eventEnd) return { label: 'Completed', color: 'var(--clr-text-muted)' };
    if (now >= eventStart && now <= eventEnd) return { label: 'Live Now', color: 'var(--clr-success)' };
    return { label: 'Upcoming', color: 'var(--clr-primary)' };
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 15 }}>
          <div>
            <h1>Events</h1>
            <p>Upcoming networking, webinars, and career events.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search events..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '200px' }}
            />
            <select className="form-input" style={{ width: 'auto' }} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="form-input" style={{ width: 'auto' }} value={timeframe} onChange={e => setTimeframe(e.target.value)}>
              <option value="">All Time</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Past">Past</option>
            </select>
            <button className="btn btn-primary" onClick={() => showForm ? setShowForm(false) : openCreateForm()}>
              {showForm ? 'Cancel' : '+ Create Event'}
            </button>
          </div>
        </div>

        {/* Create/Edit Event Form */}
        {showForm && (
          <div className="card" style={{ marginBottom: 24, border: '1px solid var(--clr-primary-light)' }}>
            <h3 style={{ marginBottom: 16 }}>{editingEvent ? 'Edit Event' : 'New Event'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <div className="grid-2" style={{ gap: 15 }}>
                <div className="form-group">
                  <label className="form-label">Event Title *</label>
                  <input type="text" name="title" className="form-input" required value={form.title} onChange={handleChange} placeholder="e.g. Hackfest 2026 / Web Development Workshop" />
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
                  <input type="text" name="location" className="form-input" value={form.location} onChange={handleChange} placeholder="Online / Seminar Hall" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Event Link (optional)</label>
                <input type="url" name="link" className="form-input" value={form.link} onChange={handleChange} placeholder="https://meet.google.com/..." />
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea name="description" className="form-input" rows={3} required value={form.description} onChange={handleChange} placeholder="Describe the event, guidelines, agenda..." />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Saving...' : (editingEvent ? 'Save Changes' : 'Create Event')}
                </button>
              </div>
            </form>
          </div>
        )}

        {error && <div className="card" style={{ color: 'var(--clr-danger)', marginBottom: 20 }}>{error}</div>}

        {loading && page === 1 ? (
          <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /> Loading events...</div>
        ) : events.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <span style={{ fontSize: '2rem' }}>??</span>
            <h3>No Events Found</h3>
            <p className="text-muted">Try adjusting your filters or check back later!</p>
          </div>
        ) : (
          <>
            <div className="grid-2">
              {events.map(ev => {
                const isRsvped = Array.isArray(ev.rsvps) && ev.rsvps.some(id => id === user._id || (id?._id || id) === user._id);
                const eventDate = new Date(ev.date);
                const status = getEventStatus(ev);
                const isCancelled = ev.status === 'Cancelled';
                const isPast = status.label === 'Completed';
                const isOwner = ev.createdBy?._id === user._id || ev.createdBy === user._id;

                return (
                  <div key={ev._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', opacity: isCancelled ? 0.7 : 1 }}>
                    <button 
                      onClick={(e) => handleToggleBookmark(e, ev._id)}
                      style={{ position: 'absolute', top: 15, right: 45, background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
                      title={bookmarks.has(ev._id) ? "Remove Bookmark" : "Save Event"}
                    >
                      {bookmarks.has(ev._id) ? '??' : '??'}
                    </button>
                    {!isOwner && (
                      <button 
                        onClick={(e) => handleReportEvent(e, ev._id)}
                        style={{ position: 'absolute', top: 15, right: 15, background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--clr-danger)' }}
                        title="Report Event"
                      >
                        ??
                      </button>
                    )}
                    
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <h3 style={{ margin: 0, paddingRight: '75px', textDecoration: isCancelled ? 'line-through' : 'none' }}>{ev.title}</h3>
                    </div>

                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: '0.875rem', color: 'var(--clr-text-muted)', alignItems: 'center' }}>
                      <span className="badge" style={{ backgroundColor: 'transparent', border: `1px solid ${status.color}`, color: status.color, fontSize: '0.72rem', padding: '2px 8px' }}>
                        {status.label === 'Live Now' ? '?? ' : status.label === 'Upcoming' ? '?? ' : status.label === 'Completed' ? '? ' : ''}{status.label}
                      </span>
                      <span className="badge badge-ghost" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>{ev.category}</span>
                    </div>
                    
                    <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', display: 'flex', gap: 10 }}>
                      <span>?? {eventDate.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      <span>?? {ev.location}</span>
                    </div>

                    <p className="text-sm" style={{ margin: 0, lineHeight: 1.6 }}>
                      {ev.description?.substring(0, 150)}{ev.description?.length > 150 ? '...' : ''}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--clr-border)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span className="text-sm text-muted">By: {ev.createdBy?.name || 'Alumni'}</span>
                        <span className="text-sm text-primary" style={{ fontWeight: 600 }}>
                          {(ev.rsvps || []).length} students registered
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {ev.link && !isCancelled && (
                          <a href={ev.link} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">?? Link</a>
                        )}
                        
                        {isOwner ? (
                          <>
                            {!isCancelled && !isPast && (
                              <>
                                <button className="btn btn-ghost btn-sm" onClick={() => openEditForm(ev)}>Edit</button>
                                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--clr-danger)' }} onClick={() => handleCancelEvent(ev._id)}>Cancel Event</button>
                              </>
                            )}
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--clr-danger)' }} onClick={() => handleDelete(ev._id)}>Delete</button>
                          </>
                        ) : (
                          <>
                            {!isCancelled && !isPast && (
                              <button
                                className={`btn btn-sm ${isRsvped ? 'btn-ghost' : 'btn-primary'}`}
                                style={isRsvped ? { color: 'var(--clr-danger)' } : {}}
                                onClick={() => handleRsvp(ev._id)}
                                disabled={rsvping === ev._id}
                              >
                                {rsvping === ev._id ? '...' : isRsvped ? 'Cancel Registration' : 'Register / Attend'}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {events.length < total && (
              <div style={{ textAlign: 'center', marginTop: 30 }}>
                <button 
                  className="btn btn-ghost" 
                  onClick={handleLoadMore} 
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Loading...' : 'Load More Events'}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default StudentEvents;
