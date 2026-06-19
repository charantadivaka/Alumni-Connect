import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { bookmarkService } from '../../services/otherServices';
import '../../styles/Student/SavedItems.css';

const MODEL_LABELS = {
  Job:          { icon: '💼', label: 'Job',           color: '#6c63ff' },
  Application:  { icon: '📋', label: 'Application',   color: '#8b5cf6' },
  Mentorship:   { icon: '🎓', label: 'Mentorship',    color: '#22d3a3' },
  MockInterview:{ icon: '🎤', label: 'Mock Interview', color: '#00d4ff' },
  Referral:     { icon: '🤝', label: 'Referral',      color: '#fbbf24' },
  Resume:       { icon: '📄', label: 'Resume',        color: '#f87171' },
  Event:        { icon: '📅', label: 'Event',         color: '#00d4ff' },
  Forum:        { icon: '🗣️', label: 'Forum Post',    color: '#22d3a3' },
  Story:        { icon: '✨', label: 'Story',         color: '#ff6b9d' },
};

const MODEL_OPTIONS = ['', 'Job', 'Application', 'Mentorship', 'MockInterview', 'Referral', 'Resume', 'Event', 'Forum', 'Story'];

const MODEL_DISPLAY = {
  '':             'All Types',
  Job:            '💼 Job',
  Application:    '📋 Application',
  Mentorship:     '🎓 Mentorship',
  MockInterview:  '🎤 Mock Interview',
  Referral:       '🤝 Referral',
  Resume:         '📄 Resume',
  Event:          '📅 Event',
  Forum:          '🗣️ Forum Post',
  Story:          '✨ Story',
};

// ── Detail Modal ──────────────────────────────────────────────────────────────
const DetailModal = ({ bm, onClose, onRemove }) => {
  const meta = MODEL_LABELS[bm.refModel] || { icon: '🔖', label: bm.refModel };
  const d = bm.details || {};

  const renderDetails = () => {
    switch (bm.refModel) {
      case 'Job':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {d.company && <span className="badge badge-primary">🏢 {d.company}</span>}
              {d.location && <span className="badge badge-cyan">📍 {d.location}</span>}
              {d.type && <span className="badge badge-success">{d.type}</span>}
              {d.salary && <span className="badge badge-warning">💰 {d.salary}</span>}
            </div>
            {d.description && (
              <div>
                <p style={{ fontWeight: 600, marginBottom: 6, color: 'var(--clr-text)' }}>Description</p>
                <p style={{ margin: 0, lineHeight: 1.7 }}>{d.description}</p>
              </div>
            )}
            {d.requirements && d.requirements.length > 0 && (
              <div>
                <p style={{ fontWeight: 600, marginBottom: 8, color: 'var(--clr-text)' }}>Requirements</p>
                <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {d.requirements.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}
            {d.skills && d.skills.length > 0 && (
              <div>
                <p style={{ fontWeight: 600, marginBottom: 8, color: 'var(--clr-text)' }}>Skills</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {d.skills.map((s, i) => <span key={i} className="tag">{s}</span>)}
                </div>
              </div>
            )}
            {d.deadline && (
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>
                ⏰ Deadline: {new Date(d.deadline).toLocaleDateString()}
              </p>
            )}
          </div>
        );

      case 'Event':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {d.category && <span className="badge badge-primary">{d.category}</span>}
              {d.mode && <span className="badge badge-cyan">{d.mode}</span>}
            </div>
            {d.date && (
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--clr-text)' }}>
                📅 {new Date(d.date).toLocaleString()}
              </p>
            )}
            {d.venue && <p style={{ margin: 0 }}>📍 {d.venue}</p>}
            {d.description && <p style={{ margin: 0, lineHeight: 1.7 }}>{d.description}</p>}
            {d.registrationLink && (
              <a href={d.registrationLink} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ width: 'fit-content' }}>
                Register Now →
              </a>
            )}
          </div>
        );

      case 'Story':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {d.tags && d.tags.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {d.tags.map((t, i) => <span key={i} className="tag">{t}</span>)}
              </div>
            )}
            {d.excerpt && <p style={{ margin: 0, lineHeight: 1.7, fontStyle: 'italic' }}>"{d.excerpt}"</p>}
            {d.content && (
              <p style={{ margin: 0, lineHeight: 1.8 }}>
                {d.content.substring(0, 600)}{d.content.length > 600 ? '...' : ''}
              </p>
            )}
            {d.author?.name && (
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>
                ✍️ By {d.author.name} · {d.author.company || ''}
              </p>
            )}
          </div>
        );

      case 'Forum':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {d.category && <span className="badge badge-primary">{d.category}</span>}
              {d.isPinned && <span className="badge badge-warning">📌 Pinned</span>}
            </div>
            {d.content && <p style={{ margin: 0, lineHeight: 1.7 }}>{d.content}</p>}
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>
              💬 {d.replies?.length || 0} replies · ⬆️ {d.upvotes?.length || 0} upvotes
            </p>
          </div>
        );

      default:
        return <p>No additional details available.</p>;
    }
  };

  const title = d.title || d.headline || 'Saved Item';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ width: '100%', maxWidth: 600, maxHeight: '85vh', overflowY: 'auto', padding: 32, position: 'relative' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: '2rem' }}>{meta.icon}</span>
            <div>
              <span className="badge badge-primary" style={{ marginBottom: 6, display: 'block' }}>{meta.label}</span>
              <h3 style={{ margin: 0 }}>{title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--clr-text-muted)', flexShrink: 0 }}
          >✕</button>
        </div>

        <div className="divider" style={{ margin: '0 0 20px' }} />

        {/* Details */}
        {bm.details ? renderDetails() : (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--clr-text-muted)' }}>
            <p>Details could not be loaded. This item may have been deleted.</p>
          </div>
        )}

        <div className="divider" style={{ margin: '20px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--clr-text-faint)' }}>
            Saved on {new Date(bm.createdAt).toLocaleDateString()}
          </p>
          <button
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--clr-danger)' }}
            onClick={() => { onRemove(bm.refId, bm.refModel); onClose(); }}
          >
            🗑️ Remove Bookmark
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const SavedItems = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterModel, setFilterModel] = useState('');
  const [selectedBm, setSelectedBm] = useState(null);

  useEffect(() => {
    const fetchBookmarks = async () => {
      setLoading(true);
      try {
        const data = await bookmarkService.getAll(filterModel);
        setBookmarks(data);
      } catch (err) {
        setError(err.message || 'Failed to load saved items.');
      } finally {
        setLoading(false);
      }
    };
    fetchBookmarks();
  }, [filterModel]);

  const handleRemove = async (refId, refModel) => {
    try {
      await bookmarkService.toggle({ refId, refModel });
      setBookmarks(prev => prev.filter(b => !(b.refId === refId && b.refModel === refModel)));
    } catch (err) {
      alert(err.message || 'Failed to remove bookmark.');
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 15 }}>
          <div>
            <h1>Saved Items</h1>
            <p>Your bookmarked jobs, events, stories, forum posts &amp; more.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <select className="form-input" style={{ width: 'auto' }} value={filterModel} onChange={e => setFilterModel(e.target.value)}>
              {MODEL_OPTIONS.map(m => <option key={m} value={m}>{MODEL_DISPLAY[m]}</option>)}
            </select>
            <button className="btn btn-outline btn-sm" title="Saved items are bookmarked from job board, events, forum & stories pages" style={{ whiteSpace: 'nowrap' }}>
              🔖 Save Items
            </button>
          </div>
        </div>

        {error && <div className="card" style={{ color: 'var(--clr-danger)', marginBottom: 20 }}>{error}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /> Loading...</div>
        ) : bookmarks.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <span style={{ fontSize: '2.5rem' }}>🔖</span>
            <h3 style={{ marginTop: 12 }}>No Saved Items</h3>
            <p className="text-muted">Bookmark jobs, events, stories and forum posts to find them here.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--sp-md)' }}>
            {bookmarks.map(bm => {
              const meta = MODEL_LABELS[bm.refModel] || { icon: '🔖', label: bm.refModel, color: '#6c63ff' };
              const d = bm.details || {};
              const title = d.title || d.headline || 'Item (details unavailable)';
              let subtitle = '';
              if (bm.refModel === 'Job') subtitle = [d.company, d.location].filter(Boolean).join(' · ');
              else if (bm.refModel === 'Event') subtitle = d.date ? `📅 ${new Date(d.date).toLocaleDateString()}${d.venue ? ' · ' + d.venue : ''}` : '';
              else if (bm.refModel === 'Story') subtitle = d.author?.name ? `By ${d.author.name}` : '';
              else if (bm.refModel === 'Forum') subtitle = `${d.category || ''} · ${d.replies?.length || 0} replies`;

              return (
                <div
                  key={bm._id}
                  className="card"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => setSelectedBm(bm)}
                >
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.5rem', flexShrink: 0, background: `${meta.color}22`
                    }}>
                      {meta.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span className="badge badge-primary" style={{ background: `${meta.color}22`, color: meta.color, flexShrink: 0 }}>
                          {meta.label}
                        </span>
                      </div>
                      <h4 style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h4>
                      <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--clr-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {subtitle} &nbsp;•&nbsp; Saved {new Date(bm.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 16 }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--clr-primary)' }}
                      onClick={e => { e.stopPropagation(); setSelectedBm(bm); }}
                    >
                      View Details →
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--clr-danger)' }}
                      onClick={e => { e.stopPropagation(); handleRemove(bm.refId, bm.refModel); }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {selectedBm && (
        <DetailModal
          bm={selectedBm}
          onClose={() => setSelectedBm(null)}
          onRemove={handleRemove}
        />
      )}
    </div>
  );
};

export default SavedItems;
