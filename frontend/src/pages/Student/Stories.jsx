import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useDebounce } from '../../hooks/useDebounce';
import { Sidebar } from '../../components/layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { storyService } from '../../services/eventService';
import { bookmarkService } from '../../services/otherServices';
import '../../styles/Student/Stories.css';

const CATEGORIES = ['Interview Experience', 'Career Journey', 'Placement Story', 'Internship', 'Career Advice', 'Higher Studies', 'Other'];

const Stories = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [stories, setStories] = useState([]);
  const [bookmarks, setBookmarks] = useState(new Set());
  const [total, setTotal] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'Interview Experience' });
  
  // Filters
  const [filterCat, setFilterCat] = useState('');
  const [sortParam, setSortParam] = useState('latest');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const fetchStories = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const params = { page: pageNum, limit: 20 };
      if (filterCat) params.category = filterCat;
      if (debouncedSearch) params.search = debouncedSearch;
      if (sortParam) params.sort = sortParam;

      const [sts, bks] = await Promise.all([
        storyService.getAll(params),
        pageNum === 1 ? bookmarkService.getAll('Story') : Promise.resolve(null)
      ]);

      const fetchedStories = sts.stories || sts || [];
      if (append) {
        setStories(prev => [...prev, ...fetchedStories]);
      } else {
        setStories(fetchedStories);
      }
      
      if (sts.total !== undefined) setTotal(sts.total);
      if (bks) setBookmarks(new Set(bks.map(b => b.refId)));
    } catch (err) {
      setError(err.message || 'Failed to load stories.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filterCat, debouncedSearch, sortParam]);

  useEffect(() => {
    setPage(1);
    fetchStories(1, false);
  }, [fetchStories]);

  // Handle scrolling to specific story if storyId is in URL
  useEffect(() => {
    if (!loading && stories.length > 0) {
      const params = new URLSearchParams(location.search);
      const storyId = params.get('storyId');
      if (storyId) {
        setTimeout(() => {
          const el = document.getElementById(`story-${storyId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.style.animation = 'highlight 2s ease';
            // clean up url so it doesn't scroll again on refresh
            params.delete('storyId');
            navigate({ search: params.toString() }, { replace: true });
          }
        }, 500);
      }
    }
  }, [loading, stories, location.search, navigate]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchStories(nextPage, true);
  };

  const handleToggleBookmark = async (e, storyId) => {
    e.stopPropagation();
    try {
      await bookmarkService.toggle({ refModel: 'Story', refId: storyId });
      setBookmarks(prev => {
        const next = new Set(prev);
        if (next.has(storyId)) next.delete(storyId);
        else next.add(storyId);
        return next;
      });
    } catch (err) { alert('Failed to toggle bookmark'); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    try {
      setCreating(true);
      const newStory = await storyService.create(form);
      setStories(prev => [{ ...newStory, author: { name: user.name, role: user.role, profilePicture: user.profilePicture, designation: user.designation, company: user.company, department: user.department, graduationYear: user.graduationYear }, likes: [], likeCount: 0 }, ...prev]);
      setTotal(t => t + 1);
      setForm({ title: '', content: '', category: 'Interview Experience' });
      setShowForm(false);
    } catch (err) { alert(err.message || 'Failed to publish story.'); }
    finally { setCreating(false); }
  };

  const handleLike = async (id) => {
    try {
      const res = await storyService.like(id);
      setStories(prev => prev.map(s => s._id === id ? { ...s, likes: Array(res.likes).fill(''), likeCount: res.likes, _liked: res.liked } : s));
    } catch (err) { alert(err.message || 'Failed to like story.'); }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 15 }}>
          <div>
            <h1>Success Stories</h1>
            <p>Read inspiring journeys and career transitions.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <select className="form-input" style={{ width: 'auto' }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="form-input" style={{ width: 'auto' }} value={sortParam} onChange={e => setSortParam(e.target.value)}>
              <option value="latest">Latest</option>
              <option value="trending">🔥 Trending</option>
            </select>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search stories..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              style={{ minWidth: 200 }}
            />
            <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
              {showForm ? 'Cancel' : 'Share Your Story'}
            </button>
          </div>
        </div>

        {error && <div className="card" style={{ color: 'var(--clr-danger)', marginBottom: 20 }}>{error}</div>}

        {/* Create Story Form */}
        {showForm && (
          <div className="card" style={{ marginBottom: 24, border: '1px solid var(--clr-primary-light)' }}>
            <h3 style={{ marginBottom: 16 }}>Write Your Journey</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <div className="grid-2" style={{ gap: 15 }}>
                <div className="form-group">
                  <label className="form-label">Story Title *</label>
                  <input type="text" className="form-input" required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. From Campus to Google..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Your Experience *</label>
                <textarea className="form-input" rows={6} required value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="Share your interview prep, challenges, and tips..." />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>{creating ? 'Publishing...' : 'Publish Story'}</button>
              </div>
            </form>
          </div>
        )}

        {loading && page === 1 ? (
          <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /> Loading stories...</div>
        ) : stories.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <span style={{ fontSize: '2rem' }}>📖</span>
            <h3>No Stories Found</h3>
            <p className="text-muted">Stay tuned for inspiring alumni journeys!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--sp-lg)' }}>
            <style>{`
              @keyframes highlight {
                0% { box-shadow: 0 0 0 4px var(--clr-primary-light); }
                100% { box-shadow: 0 0 0 0 transparent; }
              }
            `}</style>
            {stories.map(story => {
              const isLiked = story._liked || (Array.isArray(story.likes) && story.likes.some(id => id === user._id || (id?._id || id) === user._id));
              const isTrending = story.likeCount >= 5;
              const authorProfileUrl = `/${user.role}/${story.author?.role === 'alumni' ? 'alumni' : 'student'}/${story.author?._id}`;
              
              return (
                <div id={`story-${story._id}`} key={story._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
                  <button 
                    onClick={(e) => handleToggleBookmark(e, story._id)}
                    style={{ position: 'absolute', top: 15, right: 15, background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
                    title={bookmarks.has(story._id) ? "Remove Bookmark" : "Save Story"}
                  >
                    {bookmarks.has(story._id) ? '🔖' : '🤍'}
                  </button>
                  
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, paddingRight: 40 }}>
                    {story.author?.profilePicture ? (
                      <img src={story.author.profilePicture} alt={story.author.name} style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 60, height: 60, borderRadius: '50%', backgroundColor: 'var(--clr-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--clr-primary)', fontSize: '1.5rem' }}>
                        {story.author?.name?.charAt(0) || 'A'}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                        <h3 style={{ margin: 0 }}>{isTrending ? '🔥 ' : ''}{story.title}</h3>
                        {story.category && <span className="badge badge-primary">{story.category}</span>}
                        {isTrending && <span className="badge badge-warning">⭐ Trending</span>}
                      </div>
                      
                      <div style={{ color: 'var(--clr-text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                        <span style={{ fontWeight: 600, color: 'var(--clr-text)' }}>
                          {story.author?.name} {story.author?.role === 'alumni' ? '🎓 Alumni' : '👤 Student'}
                        </span>
                        <br/>
                        {story.author?.designation && story.author?.company && `${story.author.designation} @ ${story.author.company}`}
                        <br/>
                        {(story.author?.department || story.author?.graduationYear) && (
                          <span style={{ fontSize: '0.85rem' }}>
                            {story.author?.department || 'Unknown Dept'} • {story.author?.graduationYear || 'N/A'}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <Link to={authorProfileUrl} className="btn btn-outline btn-sm" style={{ alignSelf: 'flex-start' }}>
                      View Profile
                    </Link>
                  </div>

                  <div style={{ lineHeight: 1.8, fontSize: '1rem', color: 'var(--clr-text)' }}>
                    {story.content?.split('\n').map((para, i) => <p key={i} style={{ margin: '0 0 1em' }}>{para}</p>)}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--clr-border)', paddingTop: 16, marginTop: 'auto' }}>
                    <span className="text-sm text-muted">{new Date(story.createdAt).toLocaleDateString()}</span>
                    <button 
                      className={`btn btn-sm ${isLiked ? 'btn-ghost' : 'btn-ghost'}`} 
                      onClick={() => handleLike(story._id)}
                      style={isLiked ? { color: 'var(--clr-danger)' } : {}}
                    >
                      {isLiked ? '❤️' : '🤍'} {story.likeCount || 0}
                    </button>
                  </div>
                </div>
              );
            })}
            
            {stories.length < total && (
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <button 
                  className="btn btn-ghost" 
                  onClick={handleLoadMore} 
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Loading...' : 'Load More Stories'}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Stories;
