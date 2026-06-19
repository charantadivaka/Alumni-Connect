import { useEffect, useState } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { connectionService } from '../../services/otherServices';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import '../../styles/Student/MyCircle.css';

/* ── Reusable PersonCard ─────────────────────────────────────────────── */
const PersonCard = ({ person, connectionId, onRemove, role }) => {
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    if (!window.confirm(`Remove ${person?.name} from your circle?`)) return;
    try {
      setRemoving(true);
      await connectionService.remove(connectionId);
      onRemove(connectionId);
    } catch (err) {
      alert(err.message || 'Failed to remove connection.');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="card slide-up" style={{ display: 'flex', flexDirection: 'column', padding: '20px', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div className="avatar-placeholder" style={{
          width: 56, height: 56, fontSize: '1.4rem', flexShrink: 0,
          background: role === 'alumni' ? 'linear-gradient(135deg,#6c63ff,#00d4ff)' : 'linear-gradient(135deg,#22d3a3,#00d4ff)',
          display: 'grid', placeItems: 'center', borderRadius: '50%', color: '#fff', fontWeight: 700,
        }}>
          {person?.profilePicture
            ? <img src={person.profilePicture} alt={person.name} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} />
            : person?.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{person?.name || 'Unknown'}</div>
          {role === 'alumni' ? (
            <>
              <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
                {person?.designation}{person?.company ? ` @ ${person.company}` : ''}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-faint)' }}>
                {person?.department}{person?.graduationYear ? ` · Class of ${person.graduationYear}` : ''}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>{person?.department}</div>
              {person?.year && <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-faint)' }}>Year {person.year}</div>}
            </>
          )}
          <span className={`badge ${role === 'alumni' ? 'badge-primary' : 'badge-success'}`} style={{ fontSize: '0.68rem', marginTop: 4 }}>
            {role === 'alumni' ? '🎓 Alumni' : '🎒 Student'}
          </span>
        </div>
      </div>

      {/* Skills */}
      {person?.skills?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {person.skills.slice(0, 4).map(sk => (
            <span key={sk} className="tag" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>{sk}</span>
          ))}
        </div>
      )}

      {/* Bio */}
      {person?.bio && (
        <p style={{ fontSize: '0.82rem', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {person.bio}
        </p>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
        <Link to="/student/messages" className="btn btn-primary btn-sm" style={{ flex: 1, textAlign: 'center' }}>
          💬 Message
        </Link>
        <button
          className="btn btn-ghost btn-sm"
          style={{ color: 'var(--clr-danger)' }}
          onClick={handleRemove}
          disabled={removing}
        >
          {removing ? '...' : '✕ Remove'}
        </button>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────
   Main My Circle page
──────────────────────────────────────────────────────────────────────── */
const MyCircle = () => {
  const { user } = useAuth();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('alumni');
  const [pendingIncoming, setPendingIncoming] = useState([]);

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const data = await connectionService.getMy();
        setConnections(data);
        setPendingIncoming(data.filter(c => c.status === 'Pending' && c.receiver?._id === user._id));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchConnections();
  }, []);

  const handleRemove = (connId) => {
    setConnections(prev => prev.filter(c => c._id !== connId));
  };

  const handleRespond = async (connId, action) => {
    try {
      await connectionService.respond(connId, { status: action });
      if (action === 'Accepted') {
        setConnections(prev => prev.map(c => c._id === connId ? { ...c, status: 'Accepted' } : c));
      } else {
        setConnections(prev => prev.filter(c => c._id !== connId));
      }
      setPendingIncoming(prev => prev.filter(c => c._id !== connId));
    } catch (err) {
      alert(err.message || 'Failed to respond.');
    }
  };

  // Accepted connections split by role
  const accepted = connections.filter(c => c.status === 'Accepted');
  const getOther = (conn) => conn.sender?._id === user._id ? conn.receiver : conn.sender;

  const alumniConns = accepted.filter(c => getOther(c)?.role === 'alumni');
  const studentConns = accepted.filter(c => getOther(c)?.role === 'student');

  const tabs = [
    { key: 'alumni',   label: `🎓 Alumni (${alumniConns.length})` },
    { key: 'students', label: `🎒 Students (${studentConns.length})` },
  ];

  const activeList = activeTab === 'alumni' ? alumniConns : studentConns;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">
        <div className="page-header">
          <h1>My Circle</h1>
          <p>People from your college who are part of your network.</p>
        </div>

        {/* Pending requests */}
        {pendingIncoming.length > 0 && (
          <div className="card" style={{ marginBottom: 28, background: 'rgba(108,99,255,0.06)', border: '1px solid var(--clr-border-glow)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              📨 Pending Connection Requests
              <span className="badge badge-primary">{pendingIncoming.length}</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pendingIncoming.map(conn => {
                const sender = conn.sender;
                return (
                  <div key={conn._id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', borderRadius: 'var(--r-md)',
                    background: 'var(--clr-bg-elevated)',
                    border: '1px solid var(--clr-border)',
                  }}>
                    <div className="avatar-placeholder avatar-sm" style={{ width: 36, height: 36, fontSize: '0.85rem', flexShrink: 0 }}>
                      {sender?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{sender?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', textTransform: 'capitalize' }}>
                        {sender?.role}{sender?.company ? ` · ${sender.company}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-primary btn-sm" onClick={() => handleRespond(conn._id, 'Accepted')}>Accept</button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--clr-danger)' }} onClick={() => handleRespond(conn._id, 'Rejected')}>Decline</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                padding: '10px 22px', borderRadius: 'var(--r-md)',
                border: '1px solid var(--clr-border)',
                background: activeTab === t.key ? 'var(--grad-primary)' : 'var(--clr-bg-elevated)',
                color: activeTab === t.key ? '#fff' : 'var(--clr-text-muted)',
                fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : activeList.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-icon">{activeTab === 'alumni' ? '🎓' : '🎒'}</div>
            <h3>No {activeTab === 'alumni' ? 'alumni' : 'student'} connections yet</h3>
            <p>Go to <strong>Network</strong> to send connection requests to {activeTab === 'alumni' ? 'alumni' : 'students'} from your college.</p>
            <Link to="/student/network" className="btn btn-primary" style={{ marginTop: 16 }}>Explore Network →</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--sp-lg)' }}>
            {activeList.map(conn => {
              const other = getOther(conn);
              return (
                <PersonCard
                  key={conn._id}
                  person={other}
                  connectionId={conn._id}
                  onRemove={handleRemove}
                  role={other?.role}
                />
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyCircle;
