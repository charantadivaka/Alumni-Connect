import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { bookmarkService } from '../../services/otherServices';
import { JobModal } from '../../components/ui/JobModal';
import '../../styles/Student/SavedItems.css';

const TABS = ['All', 'Opportunities', 'Community', 'Career', 'Applications'];

const MODEL_TO_TAB = {
  Job: 'Opportunities',
  Referral: 'Opportunities',
  Story: 'Community',
  Forum: 'Community',
  Event: 'Community',
  Mentorship: 'Career',
  MockInterview: 'Career',
  Resume: 'Career',
  Application: 'Applications'
};

const MODEL_LABELS = {
  Job:          { icon: '💼', label: 'Job' },
  Application:  { icon: '📋', label: 'Application' },
  Mentorship:   { icon: '🎓', label: 'Mentorship' },
  MockInterview:{ icon: '🎤', label: 'Mock Interview' },
  Referral:     { icon: '🤝', label: 'Referral' },
  Resume:       { icon: '📄', label: 'Resume' },
  Event:        { icon: '📅', label: 'Event' },
  Forum:        { icon: '🗣️', label: 'Forum Post' },
  Story:        { icon: '✨', label: 'Story' },
};

const SavedItems = () => {
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // UI State
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [sortParam, setSortParam] = useState('recent_saved');
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    const fetchBookmarks = async () => {
      setLoading(true);
      try {
        const data = await bookmarkService.getAll('');
        setBookmarks(data);
      } catch (err) {
        setError(err.message || 'Failed to load saved items.');
      } finally {
        setLoading(false);
      }
    };
    fetchBookmarks();
  }, []);

  const handleRemove = async (e, refId, refModel) => {
    e.stopPropagation();
    try {
      await bookmarkService.toggle({ refId, refModel });
      setBookmarks(prev => prev.filter(b => !(b.refId === refId && b.refModel === refModel)));
    } catch (err) {
      alert(err.message || 'Failed to remove bookmark.');
    }
  };

  // Filter and sort logic
  const filteredBookmarks = useMemo(() => {
    let result = bookmarks.filter(bm => bm.details);

    // 1. Filter by Tab
    if (activeTab !== 'All') {
      result = result.filter(bm => MODEL_TO_TAB[bm.refModel] === activeTab);
    }

    // 2. Filter by Search
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(bm => {
        const d = bm.details;
        const title = (d.title || d.headline || d.category || '').toLowerCase();
        const company = (d.company || '').toLowerCase();
        const author = (d.author?.name || d.name || '').toLowerCase();
        return title.includes(query) || company.includes(query) || author.includes(query);
      });
    }

    // 3. Sort
    result.sort((a, b) => {
      if (sortParam === 'recent_saved') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortParam === 'oldest_saved') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sortParam === 'recent_updated') {
        const dateA = new Date(a.details.updatedAt || a.createdAt);
        const dateB = new Date(b.details.updatedAt || b.createdAt);
        return dateB - dateA;
      }
      return 0;
    });

    return result;
  }, [bookmarks, activeTab, search, sortParam]);

  const renderQuickActions = (bm) => {
    const { refModel, details: d, refId } = bm;
    
    switch (refModel) {
      case 'Job':
        return (
          <>
            <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); setSelectedJob(d); }}>View Job</button>
            {d.applyLink && (
              <a href={d.applyLink} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" onClick={e => e.stopPropagation()}>
                Apply
              </a>
            )}
          </>
        );
      case 'Story':
        return (
          <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`../community?tab=stories&storyId=${refId}`); }}>
            Read Story
          </button>
        );
      case 'Forum':
        return (
          <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`../community?tab=forum&postId=${refId}`); }}>
            View Post
          </button>
        );
      case 'Event':
        return (
          <>
            <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`../community?tab=events&eventId=${refId}`); }}>
              View Event
            </button>
            {d.registrationLink && (
              <a href={d.registrationLink} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" onClick={e => e.stopPropagation()}>
                Register
              </a>
            )}
          </>
        );
      case 'Referral':
      case 'Mentorship':
      case 'MockInterview':
      case 'Resume': {
        const userId = d.author?._id || d.provider?._id || d.user?._id || d._id;
        return (
          <>
            <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); if(userId) navigate(`../alumni/${userId}`); }}>
              View Profile
            </button>
            <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`../messages`); }}>
              Message
            </button>
          </>
        );
      }
      case 'Application':
        return (
          <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`../jobs-hub?tab=applications`); }}>
            View Application
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 15 }}>
          <div>
            <h1>Saved Items</h1>
            <p>Your bookmarked opportunities, community posts, and more.</p>
          </div>
        </div>

        {error && <div className="card" style={{ color: 'var(--clr-danger)', marginBottom: 20 }}>{error}</div>}

        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 15, justifyContent: 'space-between', alignItems: 'center' }}>
            
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
              {TABS.map(tab => (
                <button 
                  key={tab} 
                  className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ borderRadius: 20, padding: '6px 16px', whiteSpace: 'nowrap' }}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search saved items..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ minWidth: 200 }}
              />
              <select className="form-input" value={sortParam} onChange={e => setSortParam(e.target.value)} style={{ width: 'auto' }}>
                <option value="recent_saved">Recently Saved</option>
                <option value="oldest_saved">Oldest Saved</option>
                <option value="recent_updated">Recently Updated</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /> Loading...</div>
        ) : filteredBookmarks.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <span style={{ fontSize: '2.5rem' }}>🔖</span>
            <h3 style={{ marginTop: 12 }}>No Saved Items Found</h3>
            <p className="text-muted">Try adjusting your search or save new items.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--sp-md)' }}>
            {filteredBookmarks.map(bm => {
              const meta = MODEL_LABELS[bm.refModel] || { icon: '🔖', label: bm.refModel };
              const d = bm.details;
              const title = d.title || d.headline || 'Item (details unavailable)';
              
              let subtitle = '';
              if (bm.refModel === 'Job') subtitle = [d.company, d.location].filter(Boolean).join(' · ');
              else if (bm.refModel === 'Event') subtitle = d.date ? `📅 ${new Date(d.date).toLocaleDateString()}${d.venue ? ' · ' + d.venue : ''}` : '';
              else if (bm.refModel === 'Story') subtitle = d.author?.name ? `By ${d.author.name}` : '';
              else if (bm.refModel === 'Forum') subtitle = `${d.category || ''} · ${d.replies?.length || 0} replies`;
              else if (d.author?.name || d.provider?.name || d.name) subtitle = d.author?.name || d.provider?.name || d.name;

              return (
                <div
                  key={bm._id}
                  className="card"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 15 }}
                >
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', flex: 1, minWidth: 200 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.5rem', flexShrink: 0, background: 'var(--clr-primary-light)'
                    }}>
                      {meta.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span className="badge badge-primary" style={{ flexShrink: 0 }}>
                          {meta.label}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-faint)' }}>
                          Saved {new Date(bm.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h4>
                      {subtitle && (
                        <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--clr-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 10, flexShrink: 0, alignItems: 'center' }}>
                    {renderQuickActions(bm)}
                    
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--clr-primary)', display: 'flex', alignItems: 'center', gap: 4 }}
                      onClick={(e) => handleRemove(e, bm.refId, bm.refModel)}
                      title="Unsave item"
                    >
                      🔖 Saved
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {selectedJob && (
        <JobModal selectedJob={selectedJob} closeModal={() => setSelectedJob(null)} />
      )}
    </div>
  );
};

export default SavedItems;
