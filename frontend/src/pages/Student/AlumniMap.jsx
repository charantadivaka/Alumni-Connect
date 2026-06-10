import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { matchService } from '../../services/matchService';

const AlumniMap = () => {
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('');
  const [selectedAlumni, setSelectedAlumni] = useState(null);

  useEffect(() => {
    const fetchAlumni = async () => {
      try {
        const data = await matchService.getDirectory();
        setAlumni(data);
      } catch (err) {
        setError(err.message || 'Failed to load alumni directory.');
      } finally {
        setLoading(false);
      }
    };
    fetchAlumni();
  }, []);

  const industries = [...new Set(alumni.map(a => a.industry).filter(Boolean))].sort();

  const filtered = alumni.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.name?.toLowerCase().includes(q) || a.company?.toLowerCase().includes(q) || a.location?.toLowerCase().includes(q) || a.designation?.toLowerCase().includes(q);
    const matchIndustry = !filterIndustry || a.industry === filterIndustry;
    return matchSearch && matchIndustry;
  });

  // Group by location for a "map-like" view
  const byLocation = filtered.reduce((acc, a) => {
    const loc = a.location || 'Unknown Location';
    if (!acc[loc]) acc[loc] = [];
    acc[loc].push(a);
    return acc;
  }, {});

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">
        <div className="page-header">
          <h1>Alumni Map</h1>
          <p>Explore where our alumni are working around the world.</p>
        </div>

        {error && <div className="card" style={{ color: 'var(--clr-danger)', marginBottom: 20 }}>{error}</div>}

        {/* Filters */}
        <div className="card" style={{ marginBottom: 20, display: 'flex', gap: 15, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by name, company, location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ minWidth: 160 }}>
            <select className="form-input" value={filterIndustry} onChange={e => setFilterIndustry(e.target.value)} style={{ width: '100%' }}>
              <option value="">All Industries</option>
              {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
            </select>
          </div>
          <span className="badge badge-ghost">{filtered.length} alumni found</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /> Loading alumni...</div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <span style={{ fontSize: '2rem' }}>🗺️</span>
            <h3>No Alumni Found</h3>
            <p className="text-muted">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--sp-xl)' }}>
            {Object.entries(byLocation).map(([location, alumniList]) => (
              <div key={location}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: '1.2rem' }}>📍</span>
                  <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--clr-primary)' }}>{location}</h2>
                  <span className="badge badge-ghost">{alumniList.length}</span>
                </div>
                <div className="grid-2" style={{ gap: 'var(--sp-md)' }}>
                  {alumniList.map(a => (
                    <div
                      key={a._id}
                      className="card"
                      style={{ cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start' }}
                      onClick={() => setSelectedAlumni(a)}
                    >
                      <div className="avatar-placeholder" style={{ width: 44, height: 44, fontSize: '1rem', flexShrink: 0 }}>
                        {a.name?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ margin: '0 0 2px', fontSize: '0.95rem' }}>{a.name}</h3>
                        <p className="text-muted" style={{ margin: '0 0 6px', fontSize: '0.8rem' }}>
                          {a.designation && `${a.designation} at `}{a.company}
                        </p>
                        {a.industry && <span className="badge badge-ghost" style={{ fontSize: '0.7rem' }}>{a.industry}</span>}
                        {a.mentorshipAvailability === 'Available' && <span className="badge badge-success" style={{ fontSize: '0.7rem', marginLeft: 6 }}>🟢 Available for Mentorship</span>}
                        {a.mentorshipAvailability === 'Limited' && <span className="badge badge-warning" style={{ fontSize: '0.7rem', marginLeft: 6, background: 'var(--clr-warning)', color: 'var(--clr-bg)' }}>🟡 Limited Mentorship</span>}
                        {a.mentorshipAvailability === 'Fully Booked' && <span className="badge badge-danger" style={{ fontSize: '0.7rem', marginLeft: 6 }}>🔴 Fully Booked</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Alumni Detail Modal */}
        {selectedAlumni && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20
          }}>
            <div className="card" style={{ width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', padding: 30, position: 'relative' }}>
              <button onClick={() => setSelectedAlumni(null)}
                style={{ position: 'absolute', top: 15, right: 15, background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--clr-text-muted)' }}>
                ✕
              </button>

              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
                <div className="avatar-placeholder" style={{ width: 60, height: 60, fontSize: '1.5rem', flexShrink: 0 }}>
                  {selectedAlumni.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h2 style={{ margin: '0 0 4px' }}>{selectedAlumni.name}</h2>
                  <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>
                    {selectedAlumni.designation && `${selectedAlumni.designation} at `}{selectedAlumni.company}
                  </p>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                <tbody>
                  {selectedAlumni.department && (
                    <tr style={{ borderBottom: '1px solid var(--clr-border)' }}>
                      <td style={{ padding: '8px 0', fontWeight: 'bold', width: '40%', fontSize: '0.875rem' }}>Department</td>
                      <td style={{ padding: '8px 0', fontSize: '0.875rem' }}>{selectedAlumni.department}</td>
                    </tr>
                  )}
                  {selectedAlumni.graduationYear && (
                    <tr style={{ borderBottom: '1px solid var(--clr-border)' }}>
                      <td style={{ padding: '8px 0', fontWeight: 'bold', fontSize: '0.875rem' }}>Graduation Year</td>
                      <td style={{ padding: '8px 0', fontSize: '0.875rem' }}>{selectedAlumni.graduationYear}</td>
                    </tr>
                  )}
                  {selectedAlumni.industry && (
                    <tr style={{ borderBottom: '1px solid var(--clr-border)' }}>
                      <td style={{ padding: '8px 0', fontWeight: 'bold', fontSize: '0.875rem' }}>Industry</td>
                      <td style={{ padding: '8px 0', fontSize: '0.875rem' }}>{selectedAlumni.industry}</td>
                    </tr>
                  )}
                  {selectedAlumni.location && (
                    <tr style={{ borderBottom: '1px solid var(--clr-border)' }}>
                      <td style={{ padding: '8px 0', fontWeight: 'bold', fontSize: '0.875rem' }}>Location</td>
                      <td style={{ padding: '8px 0', fontSize: '0.875rem' }}>📍 {selectedAlumni.location}</td>
                    </tr>
                  )}
                  <tr style={{ borderBottom: '1px solid var(--clr-border)' }}>
                    <td style={{ padding: '8px 0', fontWeight: 'bold', fontSize: '0.875rem' }}>Mentorship</td>
                    <td style={{ padding: '8px 0', fontSize: '0.875rem' }}>
                      {selectedAlumni.mentorshipAvailability === 'Available' && <span className="badge badge-success">🟢 Available</span>}
                      {selectedAlumni.mentorshipAvailability === 'Limited' && <span className="badge badge-warning" style={{ background: 'var(--clr-warning)', color: 'var(--clr-bg)' }}>🟡 Limited</span>}
                      {selectedAlumni.mentorshipAvailability === 'Fully Booked' && <span className="badge badge-danger">🔴 Fully Booked</span>}
                    </td>
                  </tr>
                </tbody>
              </table>

              {selectedAlumni.bio && (
                <div>
                  <h4 style={{ marginBottom: 8 }}>About</h4>
                  <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--clr-text-muted)' }}>{selectedAlumni.bio}</p>
                </div>
              )}

              {selectedAlumni.skills && selectedAlumni.skills.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <h4 style={{ marginBottom: 8 }}>Skills</h4>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {selectedAlumni.skills.map(s => <span key={s} className="badge badge-ghost">{s}</span>)}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--clr-border)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <span className="text-sm text-faint" style={{ marginRight: 'auto', alignSelf: 'center' }}>User ID: {selectedAlumni._id}</span>
                <button className="btn btn-ghost" onClick={() => setSelectedAlumni(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AlumniMap;
