import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { matchService } from '../../services/matchService';
import { connectionService } from '../../services/otherServices';
import { useAuth } from '../../context/AuthContext';

const INDUSTRIES = ['', 'Technology', 'Finance', 'Healthcare', 'Education', 'Consulting', 'E-commerce'];

const BrowseAlumni = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alumni, setAlumni] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', industry: '', availability: '', skill: '' });
  const [sortOption, setSortOption] = useState('bestMatch');
  const [collegeName, setCollegeName] = useState('');
  const [noCollege, setNoCollege] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [result, conns] = await Promise.all([
        matchService.getMatches(filters),
        connectionService.getMy()
      ]);
      // Backend now returns { alumni, collegeName, noCollege }
      if (result && typeof result === 'object' && 'alumni' in result) {
        setAlumni(result.alumni || []);
        setCollegeName(result.collegeName || '');
        setNoCollege(result.noCollege || false);
      } else {
        // Fallback: old array format
        setAlumni(Array.isArray(result) ? result : []);
      }
      setConnections(conns);
    } catch {
      setAlumni([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  const setFilter = (k, v) => setFilters(p => ({ ...p, [k]: v }));

  const maxRating = useMemo(() => {
    if (alumni.length === 0) return 0;
    return Math.max(...alumni.map(a => a.rating || 0));
  }, [alumni]);

  const sortedAlumni = useMemo(() => {
    let sorted = [...alumni];
    switch (sortOption) {
      case 'bestMatch':
        sorted.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
        break;
      case 'mostActive':
        sorted.sort((a, b) => (b.studentsHelped || 0) - (a.studentsHelped || 0));
        break;
      case 'highestRated':
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'recentlyJoined':
        sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default:
        break;
    }
    return sorted;
  }, [alumni, sortOption]);

  const getAvailabilityStatus = (status) => {
    if (status === 'Available') return { text: 'Available for Mentorship', color: 'var(--clr-success)', symbol: '🟢' };
    if (status === 'Limited') return { text: 'Limited Availability', color: 'var(--clr-warning)', symbol: '🟡' };
    return { text: 'Fully Booked', color: 'var(--clr-danger)', symbol: '🔴' };
  };

  const handleConnectRequest = async (id) => {
    try {
      await connectionService.request(id);
      setConnections(prev => [...prev, { sender: { _id: user._id }, receiver: { _id: id }, status: 'Pending' }]);
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to send request.");
    }
  };

  const handleMessage = (id) => {
    navigator.clipboard.writeText(id).catch(() => {});
    navigate('/student/messages');
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">

        {/* Page Header */}
        <div className="page-header">
          <h1>
            {collegeName
              ? <>{collegeName} <span className="text-gradient">Alumni</span></>
              : <>Find <span className="text-gradient">Alumni Mentors</span></>
            }
          </h1>
          <p>
            {collegeName
              ? `Showing verified alumni from ${collegeName} — matched to your profile`
              : 'Matched to your skills and career interests'}
          </p>
        </div>

        {/* No College Warning */}
        {noCollege && !loading && (
          <div style={{
            background: 'rgba(251,191,36,0.1)', border: '1.5px solid rgba(251,191,36,0.4)',
            borderRadius: 'var(--r-lg)', padding: '20px 24px', marginBottom: 'var(--sp-lg)',
            display: 'flex', alignItems: 'flex-start', gap: 16,
          }}>
            <span style={{ fontSize: '2rem' }}>🏛️</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>
                Your college isn't set yet
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--clr-text-muted)', marginBottom: 12 }}>
                AlumniConnect shows you alumni only from your own college. Please go to your profile and select your college so we can show you the right alumni.
              </div>
              <Link to="/student/profile" className="btn btn-primary btn-sm">
                Update My Profile →
              </Link>
            </div>
          </div>
        )}

        {/* Filters — only show when college is set */}
        {!noCollege && (
          <div className="card" style={{ marginBottom: 'var(--sp-lg)', display: 'flex', gap: 'var(--sp-md)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: '1 1 200px' }}>
              <label className="form-label">Search</label>
              <input className="form-input" placeholder="Name, company, role…" value={filters.search} onChange={e => setFilter('search', e.target.value)} />
            </div>
            <div className="form-group" style={{ flex: '1 1 140px' }}>
              <label className="form-label">Industry</label>
              <select className="form-input" value={filters.industry} onChange={e => setFilter('industry', e.target.value)}>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i || 'All Industries'}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: '1 1 120px' }}>
              <label className="form-label">Availability</label>
              <select className="form-input" value={filters.availability} onChange={e => setFilter('availability', e.target.value)}>
                <option value="">All</option>
                <option value="true">Available for Mentorship</option>
              </select>
            </div>
            <div className="form-group" style={{ flex: '1 1 140px' }}>
              <label className="form-label">Skill</label>
              <input className="form-input" placeholder="e.g. React" value={filters.skill} onChange={e => setFilter('skill', e.target.value)} />
            </div>
            <div className="form-group" style={{ flex: '1 1 140px' }}>
              <label className="form-label">Sort By</label>
              <select className="form-input" value={sortOption} onChange={e => setSortOption(e.target.value)}>
                <option value="bestMatch">Best Match</option>
                <option value="mostActive">Most Active</option>
                <option value="highestRated">Highest Rated</option>
                <option value="recentlyJoined">Recently Joined</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={load} style={{ marginBottom: 2 }}>Search</button>
          </div>
        )}

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : noCollege ? null : sortedAlumni.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-icon">🔍</div>
            <h3>No alumni found</h3>
            <p>No verified {collegeName} alumni match your current filters. Try adjusting the search.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--sp-lg)' }}>
            {sortedAlumni.map(a => {
              const exp = a.yearsOfExperience || 0;
              const isTopMentor = maxRating > 0 && a.rating === maxRating;
              const avail = getAvailabilityStatus(a.mentorshipAvailability || 'Available');

              const connection = connections.find(c =>
                (c.sender?._id === user._id && c.receiver?._id === a._id) ||
                (c.receiver?._id === user._id && c.sender?._id === a._id)
              );
              const connStatus = connection ? connection.status : 'None';

              return (
                <div key={a._id} className="card slide-up" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px 20px', position: 'relative' }}>

                  {isTopMentor && (
                    <div style={{ position: 'absolute', top: -10, right: 20, background: 'linear-gradient(45deg, #ffd700, #ff8c00)', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800, boxShadow: '0 4px 10px rgba(255, 140, 0, 0.3)' }}>
                      🏆 Top Mentor
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 'var(--sp-md)', alignItems: 'flex-start', marginBottom: 'var(--sp-md)' }}>
                    <div className="avatar-placeholder avatar-md" style={{ width: 60, height: 60, fontSize: '1.5rem', flexShrink: 0 }}>
                      {a.profilePicture
                        ? <img src={a.profilePicture} alt={a.name} style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover' }} />
                        : a.name?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>{a.designation} @ {a.company}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-faint)' }}>{a.department} · {a.graduationYear}</div>
                      <div style={{ fontSize: '0.75rem', marginTop: 4, fontWeight: 600, color: 'var(--clr-primary)' }}>
                        {exp > 0 ? `${exp} Years Experience` : 'Entry Level'}
                      </div>
                    </div>
                  </div>

                  {a.matchScore > 0 && (
                    <div className="match-score" style={{ marginBottom: 'var(--sp-sm)', alignSelf: 'flex-start' }}>
                      ⚡ {a.matchScore} match pts
                    </div>
                  )}

                  {a.bio && <p style={{ fontSize: '0.85rem', marginBottom: 'var(--sp-md)', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.bio}</p>}
                  {!a.bio && <div style={{ flex: 1 }} />}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 'var(--sp-md)' }}>
                    {(a.skills || []).slice(0, 4).map(s => <span key={s} className="tag" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>{s}</span>)}
                  </div>

                  {/* Quick Stats Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid var(--clr-border)', borderBottom: '1px solid var(--clr-border)', marginBottom: 'var(--sp-md)' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--clr-text)' }}>{a.mentorshipsCount || 0}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--clr-text-faint)', textTransform: 'uppercase' }}>Mentorships</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--clr-text)' }}>{a.studentsHelped || 0}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--clr-text-faint)', textTransform: 'uppercase' }}>Students</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--clr-text)' }}>{a.rating ? a.rating.toFixed(1) : 'N/A'}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--clr-text-faint)', textTransform: 'uppercase' }}>Rating</div>
                    </div>
                  </div>

                  {/* Availability Status */}
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 'var(--sp-md)' }}>
                    <span>{avail.symbol}</span>
                    <span style={{ color: avail.color }}>{avail.text}</span>
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
                    <Link to={`/student/alumni/${a._id}`} className="btn btn-outline btn-sm" style={{ flex: 1, textAlign: 'center' }}>Profile</Link>

                    {connStatus === 'None' && (
                      <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => handleConnectRequest(a._id)}>Connect</button>
                    )}
                    {connStatus === 'Pending' && (
                      <button className="btn btn-primary btn-sm" style={{ flex: 1, opacity: 0.7 }} disabled>Request Sent</button>
                    )}
                    {connStatus === 'Accepted' && (
                      <button className="btn btn-success btn-sm" style={{ flex: 1 }} onClick={() => handleMessage(a._id)}>Copy ID & Message</button>
                    )}
                    {connStatus === 'Rejected' && (
                      <button className="btn btn-ghost btn-sm" style={{ flex: 1, color: 'var(--clr-danger)' }} disabled>Rejected</button>
                    )}
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

export default BrowseAlumni;
