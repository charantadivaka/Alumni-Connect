import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { storyService } from '../../services/eventService';
import '../../styles/Alumni/Stories.css';

const AlumniStories = () => {
  const { user } = useAuth();
  const [myStories, setMyStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', tags: '' });

  useEffect(() => {
    const fetchMyStories = async () => {
      try {
        const data = await storyService.getMy();
        setMyStories(data);
      } catch (err) {
        setError(err.message || 'Failed to load your stories.');
      } finally {
        setLoading(false);
      }
    };
    fetchMyStories();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) { alert('Title and Content are required.'); return; }
    try {
      setCreating(true);
      const tagsArray = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      const newStory = await storyService.create({ ...form, tags: tagsArray });
      setMyStories(prev => [{ ...newStory, likes: [], author: { name: user.name } }, ...prev]);
      setForm({ title: '', content: '', tags: '' });
      setShowForm(false);
    } catch (err) {
      alert(err.message || 'Failed to create story.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this story?')) return;
    try {
      await storyService.remove(id);
      setMyStories(prev => prev.filter(s => s._id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete.');
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 15 }}>
          <div>
            <h1>My Stories</h1>
            <p>Inspire the next generation by sharing your journey.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
            {showForm ? 'Cancel' : '+ Share Story'}
          </button>
        </div>

        {error && <div className="card" style={{ color: 'var(--clr-danger)', marginBottom: 20 }}>{error}</div>}

        {/* Create Story Form */}
        {showForm && (
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Share Your Story</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input type="text" className="form-input" required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. How I landed my first job at Google" />
              </div>
              <div className="form-group">
                <label className="form-label">Your Story *</label>
                <textarea className="form-input" rows={6} required value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="Share your journey, struggles, advice, and achievements..." />
              </div>
              <div className="form-group">
                <label className="form-label">Tags (comma-separated)</label>
                <input type="text" className="form-input" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="e.g. placement, internship, career" />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>{creating ? 'Sharing...' : 'Share Story'}</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /> Loading...</div>
        ) : myStories.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <span style={{ fontSize: '2rem' }}>✨</span>
            <h3>No Stories Shared Yet</h3>
            <p className="text-muted">Share your journey and inspire students on their career path.</p>
          </div>
        ) : (
          <div className="grid-2">
            {myStories.map(story => (
              <div key={story._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ margin: 0, flex: 1 }}>{story.title}</h3>
                  <span className={`badge ${story.isPublished ? 'badge-success' : 'badge-ghost'}`} style={{ marginLeft: 10 }}>
                    {story.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
                <p className="text-sm" style={{ margin: 0, color: 'var(--clr-text-muted)', lineHeight: 1.6 }}>
                  {story.content?.substring(0, 150)}{story.content?.length > 150 ? '...' : ''}
                </p>
                {story.tags && story.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {story.tags.map(tag => <span key={tag} className="badge badge-ghost">#{tag}</span>)}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--clr-border)' }}>
                  <div style={{ display: 'flex', gap: 12, fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
                    <span>❤️ {(story.likes || []).length}</span>
                    <span>🕐 {new Date(story.createdAt).toLocaleDateString()}</span>
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--clr-danger)' }} onClick={() => handleDelete(story._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AlumniStories;
