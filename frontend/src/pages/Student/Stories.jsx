import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { storyService } from '../../services/eventService';
import { bookmarkService } from '../../services/otherServices';
import '../../styles/Student/Stories.css';

const StudentStories = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [bookmarks, setBookmarks] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liking, setLiking] = useState(null);
  const [openStory, setOpenStory] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stors, bks] = await Promise.all([
          storyService.getAll(),
          bookmarkService.getAll('Story')
        ]);
        setStories(stors);
        setBookmarks(new Set(bks.map(b => b.refId)));
      } catch (err) {
        setError(err.message || 'Failed to load stories.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
    } catch (err) {
      alert('Failed to toggle bookmark');
    }
  };

  const handleLike = async (e, id) => {
    e.stopPropagation();
    try {
      setLiking(id);
      const res = await storyService.like(id);
      setStories(prev => prev.map(s => s._id === id ? { ...s, likes: Array(res.likes).fill(''), _liked: res.liked } : s));
      if (openStory?._id === id) setOpenStory(prev => ({ ...prev, likes: Array(res.likes).fill(''), _liked: res.liked }));
    } catch (err) {
      alert(err.message || 'Failed to like story.');
    } finally {
      setLiking(null);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">
        <div className="page-header">
          <h1>Alumni Success Stories</h1>
          <p>Get inspired by the journeys of alumni from your campus.</p>
        </div>

        {error && <div className="card" style={{ color: 'var(--clr-danger)', marginBottom: 20 }}>{error}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /> Loading...</div>
        ) : stories.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <span style={{ fontSize: '2rem' }}>✨</span>
            <h3>No Stories Yet</h3>
            <p className="text-muted">Alumni haven't shared their stories yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid-2">
            {stories.map(story => (
              <div key={story._id} className="card" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }} onClick={() => setOpenStory(story)}>
                <button 
                  onClick={(e) => handleToggleBookmark(e, story._id)}
                  style={{ position: 'absolute', top: 15, right: 15, background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
                  title={bookmarks.has(story._id) ? "Remove Bookmark" : "Save Story"}
                >
                  {bookmarks.has(story._id) ? '🔖' : '🤍'}
                </button>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div className="avatar-placeholder" style={{ width: 44, height: 44, fontSize: '1rem', flexShrink: 0 }}>
                    {story.author?.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, paddingRight: '30px' }}>{story.author?.name}</p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
                      {story.author?.designation && `${story.author.designation} at `}{story.author?.company} • Class of {story.author?.graduationYear}
                    </p>
                  </div>
                </div>

                <h3 style={{ margin: 0 }}>{story.title}</h3>
                <p className="text-sm" style={{ margin: 0, lineHeight: 1.6, color: 'var(--clr-text-muted)' }}>
                  {story.content?.substring(0, 180)}{story.content?.length > 180 ? '...' : ''}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--clr-border)' }}>
                  <span className="text-sm text-faint">{new Date(story.createdAt).toLocaleDateString()}</span>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={(e) => handleLike(e, story._id)}
                    disabled={liking === story._id}
                    style={{ color: story._liked ? 'var(--clr-primary)' : 'var(--clr-text-muted)' }}
                  >
                    ❤️ {(story.likes || []).length}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Story Detail Modal */}
        {openStory && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20
          }}>
            <div className="card" style={{ width: '100%', maxWidth: 650, maxHeight: '90vh', overflowY: 'auto', padding: 30, position: 'relative' }}>
              <button onClick={() => setOpenStory(null)}
                style={{ position: 'absolute', top: 15, right: 15, background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--clr-text-muted)' }}>
                ✕
              </button>
              
              <button 
                onClick={(e) => handleToggleBookmark(e, openStory._id)}
                style={{ position: 'absolute', top: 15, right: 50, background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
                title={bookmarks.has(openStory._id) ? "Remove Bookmark" : "Save Story"}
              >
                {bookmarks.has(openStory._id) ? '🔖' : '🤍'}
              </button>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
                <div className="avatar-placeholder" style={{ width: 52, height: 52, fontSize: '1.2rem', flexShrink: 0 }}>
                  {openStory.author?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>{openStory.author?.name}</p>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--clr-text-muted)' }}>
                    {openStory.author?.designation && `${openStory.author.designation} at `}{openStory.author?.company} • Class of {openStory.author?.graduationYear}
                  </p>
                </div>
              </div>

              <h2 style={{ marginBottom: 16 }}>{openStory.title}</h2>
              <p style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap', color: 'var(--clr-text-muted)' }}>{openStory.content}</p>

              {openStory.tags && openStory.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
                  {openStory.tags.map(tag => <span key={tag} className="badge badge-ghost">#{tag}</span>)}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--clr-border)' }}>
                <span className="text-sm text-faint">{new Date(openStory.createdAt).toLocaleDateString()}</span>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={(e) => handleLike(e, openStory._id)}
                  disabled={liking === openStory._id}
                  style={{ color: openStory._liked ? 'var(--clr-primary)' : 'var(--clr-text-muted)' }}
                >
                  ❤️ {(openStory.likes || []).length} Likes
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentStories;
