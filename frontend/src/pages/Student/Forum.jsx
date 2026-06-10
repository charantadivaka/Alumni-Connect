import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { forumService } from '../../services/eventService';
import { bookmarkService } from '../../services/otherServices';

const CATEGORIES = ['General', 'Career', 'Technical', 'Campus Life', 'Opportunities', 'Other'];

const Forum = () => {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [bookmarks, setBookmarks] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterCat, setFilterCat] = useState('');

  // New Thread Form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'General' });
  const [creating, setCreating] = useState(false);

  // Open thread for replies
  const [openThread, setOpenThread] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [thrs, bks] = await Promise.all([
          forumService.getAll(filterCat ? { category: filterCat } : {}),
          bookmarkService.getAll('Forum')
        ]);
        setThreads(thrs);
        setBookmarks(new Set(bks.map(b => b.refId)));
      } catch (err) {
        setError(err.message || 'Failed to load forum threads.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filterCat]);

  const handleToggleBookmark = async (e, threadId) => {
    e.stopPropagation();
    try {
      await bookmarkService.toggle({ refModel: 'Forum', refId: threadId });
      setBookmarks(prev => {
        const next = new Set(prev);
        if (next.has(threadId)) next.delete(threadId);
        else next.add(threadId);
        return next;
      });
    } catch (err) {
      alert('Failed to toggle bookmark');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) { alert('Title and Content are required.'); return; }
    try {
      setCreating(true);
      const newThread = await forumService.create(form);
      setThreads(prev => [{ ...newThread, author: { name: user.name, role: user.role }, upvotes: [], replies: [] }, ...prev]);
      setForm({ title: '', content: '', category: 'General' });
      setShowForm(false);
    } catch (err) {
      alert(err.message || 'Failed to create thread.');
    } finally {
      setCreating(false);
    }
  };

  const handleUpvote = async (id) => {
    try {
      const res = await forumService.upvote(id);
      setThreads(prev => prev.map(t => t._id === id ? { ...t, upvotes: Array(res.upvotes).fill('') } : t));
      if (openThread?._id === id) {
        setOpenThread(prev => ({ ...prev, upvotes: Array(res.upvotes).fill('') }));
      }
    } catch (err) {
      alert(err.message || 'Failed to upvote.');
    }
  };

  const handleOpenThread = async (thread) => {
    try {
      const full = await forumService.getById(thread._id);
      setOpenThread(full);
      setReplyText('');
    } catch (err) {
      setOpenThread(thread);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    try {
      setReplying(true);
      const reply = await forumService.reply(openThread._id, { content: replyText.trim() });
      setOpenThread(prev => ({ ...prev, replies: [...(prev.replies || []), reply] }));
      setReplyText('');
    } catch (err) {
      alert(err.message || 'Failed to post reply.');
    } finally {
      setReplying(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 15 }}>
          <div>
            <h1>Community Forum</h1>
            <p>Discuss, ask questions, and share knowledge with the community.</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <select className="form-input" style={{ width: 'auto' }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
              {showForm ? 'Cancel' : '+ New Post'}
            </button>
          </div>
        </div>

        {error && <div className="card" style={{ color: 'var(--clr-danger)', marginBottom: 20 }}>{error}</div>}

        {/* New Thread Form */}
        {showForm && (
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Start a New Discussion</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <div className="grid-2" style={{ gap: 15 }}>
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input type="text" className="form-input" required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="What's on your mind?" />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Content *</label>
                <textarea className="form-input" rows={4} required value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="Share your thoughts, questions, or ideas..." />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>{creating ? 'Posting...' : 'Post Thread'}</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /> Loading...</div>
        ) : threads.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <span style={{ fontSize: '2rem' }}>🗣️</span>
            <h3>No Discussions Yet</h3>
            <p className="text-muted">Be the first to start a conversation!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--sp-md)' }}>
            {threads.map(thread => (
              <div key={thread._id} className="card" style={{ cursor: 'pointer', position: 'relative' }} onClick={() => handleOpenThread(thread)}>
                <button 
                  onClick={(e) => handleToggleBookmark(e, thread._id)}
                  style={{ position: 'absolute', top: 15, right: 15, background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
                  title={bookmarks.has(thread._id) ? "Remove Bookmark" : "Save Thread"}
                >
                  {bookmarks.has(thread._id) ? '🔖' : '🤍'}
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, paddingRight: 30 }}>
                  <h3 style={{ margin: 0, flex: 1 }}>{thread.isPinned && '📌 '}{thread.title}</h3>
                  <span className="badge badge-ghost" style={{ marginLeft: 12, flexShrink: 0 }}>{thread.category}</span>
                </div>
                <p className="text-sm" style={{ margin: '0 0 12px', lineHeight: 1.6 }}>{thread.content?.substring(0, 180)}{thread.content?.length > 180 ? '...' : ''}</p>
                <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', color: 'var(--clr-text-muted)', flexWrap: 'wrap' }}>
                  <span>👤 {thread.author?.name} ({thread.author?.role})</span>
                  <span>👍 {(thread.upvotes || []).length} upvotes</span>
                  <span>💬 {(thread.replies || []).length} replies</span>
                  <span>🕐 {new Date(thread.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Thread Detail Modal */}
        {openThread && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20
          }}>
            <div className="card" style={{ width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto', padding: 30, position: 'relative' }}>
              <button onClick={() => setOpenThread(null)}
                style={{ position: 'absolute', top: 15, right: 15, background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--clr-text-muted)' }}>
                ✕
              </button>
              
              <button 
                onClick={(e) => handleToggleBookmark(e, openThread._id)}
                style={{ position: 'absolute', top: 15, right: 50, background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
                title={bookmarks.has(openThread._id) ? "Remove Bookmark" : "Save Thread"}
              >
                {bookmarks.has(openThread._id) ? '🔖' : '🤍'}
              </button>

              <span className="badge badge-ghost" style={{ marginBottom: 10 }}>{openThread.category}</span>
              <h2 style={{ marginBottom: 5 }}>{openThread.title}</h2>
              <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.875rem', marginBottom: 20 }}>
                By {openThread.author?.name} • {new Date(openThread.createdAt).toLocaleDateString()}
              </p>
              <p style={{ lineHeight: 1.7, marginBottom: 20, whiteSpace: 'pre-wrap' }}>{openThread.content}</p>

              <button className="btn btn-ghost btn-sm" onClick={() => { handleUpvote(openThread._id); }}>
                👍 {(openThread.upvotes || []).length} Upvotes
              </button>

              <hr style={{ border: 'none', borderTop: '1px solid var(--clr-border)', margin: '20px 0' }} />

              <h4>💬 Replies ({(openThread.replies || []).length})</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                {(openThread.replies || []).length === 0 ? (
                  <p className="text-muted text-sm">No replies yet. Be the first to reply!</p>
                ) : (openThread.replies || []).map((reply, i) => (
                  <div key={reply._id || i} style={{ background: 'var(--clr-bg-elevated)', borderRadius: 'var(--r-sm)', padding: 14 }}>
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>{reply.content}</p>
                    <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>
                      — {reply.author?.name || 'Unknown'} • {new Date(reply.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleReply} style={{ display: 'flex', gap: 10 }}>
                <textarea
                  className="form-input" rows={2} style={{ flex: 1 }}
                  placeholder="Write a reply..."
                  value={replyText} onChange={e => setReplyText(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" disabled={replying || !replyText.trim()}>
                  {replying ? '...' : 'Reply'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Forum;
