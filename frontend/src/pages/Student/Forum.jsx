import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { Sidebar } from '../../components/layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { forumService } from '../../services/eventService';
import { bookmarkService } from '../../services/otherServices';
import '../../styles/Student/Forum.css';

const CATEGORIES = ['General', 'Career', 'Technical', 'Campus Life', 'Opportunities', 'Other'];

const Forum = () => {
  const { user } = useAuth();
  
  // Data state
  const [threads, setThreads] = useState([]);
  const [bookmarks, setBookmarks] = useState(new Set());
  const [total, setTotal] = useState(0);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  
  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [filterCat, setFilterCat] = useState('');
  const [sortParam, setSortParam] = useState('latest');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  // New/Edit Thread Form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'General' });
  const [editingThreadId, setEditingThreadId] = useState(null);
  const [creating, setCreating] = useState(false);

  // Open thread for replies
  const [openThread, setOpenThread] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [replying, setReplying] = useState(false);

  const fetchThreads = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const params = { page: pageNum, limit: 50 };
      if (filterCat) params.category = filterCat;
      if (debouncedSearch) params.search = debouncedSearch;
      if (sortParam) params.sort = sortParam;

      const [thrsRes, bks] = await Promise.all([
        forumService.getAll(params),
        pageNum === 1 ? bookmarkService.getAll('Forum') : Promise.resolve(null)
      ]);
      
      const fetchedThreads = thrsRes.threads || thrsRes || [];
      if (append) setThreads(prev => [...prev, ...fetchedThreads]);
      else setThreads(fetchedThreads);
      
      if (thrsRes.total !== undefined) setTotal(thrsRes.total);
      if (bks) setBookmarks(new Set(bks.map(b => b.refId)));
    } catch (err) {
      setError(err.message || 'Failed to load forum threads.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filterCat, debouncedSearch, sortParam]);

  useEffect(() => {
    setPage(1);
    fetchThreads(1, false);
  }, [fetchThreads]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchThreads(nextPage, true);
  };

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
    } catch (err) { alert('Failed to toggle bookmark'); }
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    try {
      setCreating(true);
      if (editingThreadId) {
        const updated = await forumService.update(editingThreadId, form);
        setThreads(prev => prev.map(t => t._id === editingThreadId ? { ...t, ...updated } : t));
        if (openThread?._id === editingThreadId) setOpenThread(prev => ({ ...prev, ...updated }));
      } else {
        const newThread = await forumService.create(form);
        setThreads(prev => [{ ...newThread, author: { name: user.name, role: user.role }, upvotes: [], replies: [] }, ...prev]);
        setTotal(t => t + 1);
      }
      setForm({ title: '', content: '', category: 'General' });
      setShowForm(false);
      setEditingThreadId(null);
    } catch (err) { alert(err.message || 'Failed to save thread.'); }
    finally { setCreating(false); }
  };

  const handleDeleteThread = async (id) => {
    if (!window.confirm("Are you sure you want to delete this thread?")) return;
    try {
      await forumService.remove(id);
      setThreads(prev => prev.filter(t => t._id !== id));
      if (openThread?._id === id) setOpenThread(null);
    } catch(err) { alert('Failed to delete thread'); }
  };

  const handleUpvote = async (id) => {
    try {
      const res = await forumService.upvote(id);
      setThreads(prev => prev.map(t => t._id === id ? { ...t, upvotes: Array(res.upvotes).fill('') } : t));
      if (openThread?._id === id) setOpenThread(prev => ({ ...prev, upvotes: Array(res.upvotes).fill('') }));
    } catch (err) { alert(err.message || 'Failed to upvote.'); }
  };

  const handleToggleFollow = async (id) => {
    try {
      const res = await forumService.follow(id);
      setOpenThread(prev => ({ 
        ...prev, 
        followers: res.isFollowing 
          ? [...(prev.followers || []), user._id] 
          : (prev.followers || []).filter(u => u !== user._id)
      }));
    } catch (err) { alert(err.message || 'Failed to follow.'); }
  };

  const handleReport = async (threadId, replyId = null) => {
    if (!window.confirm("Are you sure you want to report this content?")) return;
    try {
      await forumService.report(threadId, replyId);
      alert('Content reported to moderators.');
    } catch (err) { alert(err.message || 'Failed to report.'); }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    try {
      setReplying(true);
      if (editingReplyId) {
        const reply = await forumService.editReply(openThread._id, editingReplyId, { content: replyText.trim() });
        setOpenThread(prev => ({
          ...prev,
          replies: prev.replies.map(r => r._id === editingReplyId ? { ...r, content: reply.content } : r)
        }));
        setEditingReplyId(null);
      } else {
        const reply = await forumService.reply(openThread._id, { content: replyText.trim() });
        setOpenThread(prev => ({ ...prev, replies: [...(prev.replies || []), reply] }));
        setThreads(prev => prev.map(t => t._id === openThread._id ? { ...t, replies: [...(t.replies || []), reply] } : t));
      }
      setReplyText('');
    } catch (err) { alert(err.message || 'Failed to post reply.'); }
    finally { setReplying(false); }
  };

  const handleDeleteReply = async (threadId, replyId) => {
    if (!window.confirm("Delete this reply?")) return;
    try {
      await forumService.deleteReply(threadId, replyId);
      setOpenThread(prev => ({ ...prev, replies: prev.replies.filter(r => r._id !== replyId) }));
      setThreads(prev => prev.map(t => t._id === threadId ? { ...t, replies: t.replies.filter(r => r._id !== replyId) } : t));
    } catch(err) { alert('Failed to delete reply'); }
  };

  const handleAcceptReply = async (threadId, replyId) => {
    try {
      const res = await forumService.acceptReply(threadId, replyId);
      setOpenThread(prev => ({
        ...prev,
        replies: prev.replies.map(r => ({ ...r, isAccepted: r._id === replyId ? res.isAccepted : false }))
      }));
    } catch (err) { alert('Failed to mark accepted answer'); }
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
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <select className="form-input" style={{ width: 'auto' }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="form-input" style={{ width: 'auto' }} value={sortParam} onChange={e => setSortParam(e.target.value)}>
              <option value="latest">Latest</option>
              <option value="upvoted">Most Upvoted</option>
              <option value="discussed">Most Discussed</option>
              <option value="unanswered">Unanswered</option>
            </select>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search discussions..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              style={{ minWidth: 200 }}
            />
            <button className="btn btn-primary" onClick={() => {
              if (!showForm) { setForm({ title: '', content: '', category: 'General' }); setEditingThreadId(null); }
              setShowForm(!showForm);
            }}>
              {showForm ? 'Cancel' : '+ New Post'}
            </button>
          </div>
        </div>

        {error && <div className="card" style={{ color: 'var(--clr-danger)', marginBottom: 20 }}>{error}</div>}

        {/* New/Edit Thread Form */}
        {showForm && (
          <div className="card" style={{ marginBottom: 24, border: '1px solid var(--clr-primary-light)' }}>
            <h3 style={{ marginBottom: 16 }}>{editingThreadId ? 'Edit Discussion' : 'Start a New Discussion'}</h3>
            <form onSubmit={handleCreateOrUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
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
                <button type="submit" className="btn btn-primary" disabled={creating}>{creating ? 'Saving...' : 'Save Post'}</button>
              </div>
            </form>
          </div>
        )}

        {loading && page === 1 ? (
          <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /> Loading...</div>
        ) : threads.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <span style={{ fontSize: '2rem' }}>🗣️</span>
            <h3>No Discussions Found</h3>
            <p className="text-muted">Try adjusting your search or be the first to start a conversation!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--sp-md)' }}>
            {threads.map(thread => {
              const hasAcceptedAnswer = (thread.replies || []).some(r => r.isAccepted);
              return (
                <div key={thread._id} className="card" style={{ cursor: 'pointer', position: 'relative', borderLeft: hasAcceptedAnswer ? '4px solid var(--clr-success)' : 'none' }} onClick={() => setOpenThread(thread)}>
                  <button 
                    onClick={(e) => handleToggleBookmark(e, thread._id)}
                    style={{ position: 'absolute', top: 15, right: 15, background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
                    title={bookmarks.has(thread._id) ? "Remove Bookmark" : "Save Thread"}
                  >
                    {bookmarks.has(thread._id) ? '🔖' : '🤍'}
                  </button>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, paddingRight: 30 }}>
                    <h3 style={{ margin: 0, flex: 1 }}>
                      {thread.isPinned && '📌 '}
                      {hasAcceptedAnswer && '✅ '}
                      {thread.title}
                    </h3>
                    <span className="badge badge-ghost" style={{ marginLeft: 12, flexShrink: 0 }}>{thread.category}</span>
                  </div>
                  <p className="text-sm" style={{ margin: '0 0 12px', lineHeight: 1.6 }}>{thread.content?.substring(0, 180)}{thread.content?.length > 180 ? '...' : ''}</p>
                  <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', color: 'var(--clr-text-muted)', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600 }}>{thread.author?.role === 'alumni' ? '🎓' : '👤'} {thread.author?.name}</span>
                    <span>👍 {(thread.upvotes || []).length} upvotes</span>
                    <span>💬 {(thread.replies || []).length} replies</span>
                    <span>🕐 {new Date(thread.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
            
            {threads.length < total && (
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <button 
                  className="btn btn-ghost" 
                  onClick={handleLoadMore} 
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Loading...' : 'Load More Discussions'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Thread Detail Modal */}
        {openThread && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20
          }}>
            <div className="card" style={{ width: '100%', maxWidth: 800, maxHeight: '90vh', overflowY: 'auto', padding: 30, position: 'relative' }}>
              <div style={{ display: 'flex', gap: 10, position: 'absolute', top: 15, right: 15 }}>
                <button onClick={() => handleToggleFollow(openThread._id)} className="btn btn-sm btn-ghost">
                  {(openThread.followers || []).includes(user._id) ? '🔕 Unfollow' : '🔔 Follow'}
                </button>
                <button onClick={(e) => handleToggleBookmark(e, openThread._id)} className="btn btn-sm btn-ghost" title="Bookmark">
                  {bookmarks.has(openThread._id) ? '🔖' : '🤍'}
                </button>
                <button onClick={() => { setOpenThread(null); fetchThreads(1, false); }} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--clr-text-muted)', marginLeft: 10 }}>✕</button>
              </div>
              
              <span className="badge badge-ghost" style={{ marginBottom: 10 }}>{openThread.category}</span>
              <h2 style={{ marginBottom: 5, paddingRight: 150 }}>{openThread.title}</h2>
              <div style={{ color: 'var(--clr-text-muted)', fontSize: '0.875rem', marginBottom: 20, display: 'flex', gap: 15, alignItems: 'center' }}>
                <span style={{ fontWeight: 600, color: 'var(--clr-text)' }}>
                  {openThread.author?.role === 'alumni' ? '🎓' : '👤'} {openThread.author?.name}
                </span>
                <span>• {new Date(openThread.createdAt).toLocaleDateString()}</span>
                {openThread.author?._id === user._id && (
                  <>
                    <button className="btn-link" onClick={() => { setForm({ title: openThread.title, content: openThread.content, category: openThread.category }); setEditingThreadId(openThread._id); setShowForm(true); setOpenThread(null); }}>Edit</button>
                    <button className="btn-link" style={{ color: 'var(--clr-danger)' }} onClick={() => handleDeleteThread(openThread._id)}>Delete</button>
                  </>
                )}
                {openThread.author?._id !== user._id && (
                  <button className="btn-link" style={{ color: 'var(--clr-danger)' }} onClick={() => handleReport(openThread._id)}>Report</button>
                )}
              </div>
              <p style={{ lineHeight: 1.7, marginBottom: 20, whiteSpace: 'pre-wrap' }}>{openThread.content}</p>

              <button className="btn btn-ghost btn-sm" onClick={() => { handleUpvote(openThread._id); }}>
                👍 {(openThread.upvotes || []).length} Upvotes
              </button>

              <hr style={{ border: 'none', borderTop: '1px solid var(--clr-border)', margin: '20px 0' }} />

              <h4>💬 Replies ({(openThread.replies || []).length})</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                {(openThread.replies || []).length === 0 ? (
                  <p className="text-muted text-sm">No replies yet. Be the first to reply!</p>
                ) : [...openThread.replies].sort((a, b) => b.isAccepted - a.isAccepted).map((reply, i) => (
                  <div key={reply._id || i} style={{ 
                    background: reply.isAccepted ? 'rgba(76, 175, 80, 0.1)' : 'var(--clr-bg-elevated)', 
                    borderLeft: reply.isAccepted ? '4px solid var(--clr-success)' : 'none',
                    borderRadius: 'var(--r-sm)', padding: 14 
                  }}>
                    {reply.isAccepted && <div style={{ color: 'var(--clr-success)', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: 5 }}>✅ Accepted Answer</div>}
                    <p style={{ margin: 0, fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>{reply.content}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
                        {reply.author?.role === 'alumni' ? '🎓' : '👤'} <strong>{reply.author?.name || 'Unknown'}</strong> • {new Date(reply.createdAt).toLocaleDateString()}
                      </span>
                      <div style={{ display: 'flex', gap: 10, fontSize: '0.8rem' }}>
                        {openThread.author?._id === user._id && (
                          <button className="btn-link" style={{ color: 'var(--clr-success)' }} onClick={() => handleAcceptReply(openThread._id, reply._id)}>
                            {reply.isAccepted ? 'Un-accept' : '✅ Accept'}
                          </button>
                        )}
                        {reply.author?._id === user._id && (
                          <>
                            <button className="btn-link" onClick={() => { setReplyText(reply.content); setEditingReplyId(reply._id); }}>Edit</button>
                            <button className="btn-link" style={{ color: 'var(--clr-danger)' }} onClick={() => handleDeleteReply(openThread._id, reply._id)}>Delete</button>
                          </>
                        )}
                        {reply.author?._id !== user._id && (
                          <button className="btn-link" style={{ color: 'var(--clr-danger)' }} onClick={() => handleReport(openThread._id, reply._id)}>Report</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleReply} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <textarea
                  className="form-input" rows={3} style={{ flex: 1 }}
                  placeholder="Write a reply..."
                  value={replyText} onChange={e => setReplyText(e.target.value)}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <button type="submit" className="btn btn-primary" disabled={replying || !replyText.trim()}>
                    {replying ? '...' : (editingReplyId ? 'Save Edit' : 'Reply')}
                  </button>
                  {editingReplyId && (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setEditingReplyId(null); setReplyText(''); }}>Cancel</button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Forum;
