import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { profileService } from '../../services/profileService';
import { connectionService } from '../../services/otherServices';
import { useAuth } from '../../context/AuthContext';

const StudentPublicProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('None');
  const [connId, setConnId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profData, connsData] = await Promise.all([
          profileService.getById(id),
          connectionService.getMy(),
        ]);
        setProfile(profData);

        const conn = connsData.find(c =>
          (c.sender?._id === user._id && c.receiver?._id === id) ||
          (c.receiver?._id === user._id && c.sender?._id === id)
        );
        if (conn) {
          setConnectionStatus(conn.status);
          setConnId(conn._id);
        }
      } catch (err) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user._id]);

  const handleConnect = async () => {
    try {
      await connectionService.request(id);
      setConnectionStatus('Pending');
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to send request.');
    }
  };

  const backPath = `/${user.role}/network`;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">
        <div className="page-header" style={{ marginBottom: 16 }}>
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm" style={{ marginBottom: 12 }}>
            ← Back
          </button>
          <h1>Student Profile</h1>
        </div>

        {error && <div className="card" style={{ color: 'var(--clr-danger)' }}>{error}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /> Loading...</div>
        ) : profile ? (
          <div className="card" style={{ maxWidth: 800 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, flexWrap: 'wrap' }}>
              <div style={{
                width: 100, height: 100, borderRadius: '50%', overflow: 'hidden',
                background: 'var(--grad-primary)', display: 'grid', placeItems: 'center',
                fontSize: '2.5rem', color: '#fff', fontWeight: 700, flexShrink: 0,
              }}>
                {profile.profilePicture ? (
                  <img
                    src={profile.profilePicture}
                    alt={profile.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  profile.name?.[0]?.toUpperCase()
                )}
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <h2 style={{ margin: '0 0 4px' }}>{profile.name}</h2>
                <p className="text-muted" style={{ margin: '0 0 10px', fontSize: '0.9rem' }}>
                  {profile.department || 'Student'}
                  {profile.currentYear ? ` · Year ${profile.currentYear}` : ''}
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {profile.college?.name && (
                    <span className="badge badge-ghost">🏛️ {profile.college.name}</span>
                  )}
                  <span className="badge badge-primary">🎒 Student</span>
                </div>
              </div>

              {/* Connection action */}
              <div style={{ flexShrink: 0 }}>
                {connectionStatus === 'None' && (
                  <button className="btn btn-primary btn-sm" onClick={handleConnect}>Connect</button>
                )}
                {connectionStatus === 'Pending' && (
                  <button className="btn btn-primary btn-sm" disabled style={{ opacity: 0.7 }}>Request Sent</button>
                )}
                {connectionStatus === 'Accepted' && (
                  <span className="badge badge-success" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>✓ Connected</span>
                )}
                {connectionStatus === 'Rejected' && (
                  <button className="btn btn-ghost btn-sm" disabled style={{ color: 'var(--clr-danger)' }}>Rejected</button>
                )}
              </div>
            </div>

            {/* Info grid */}
            <div className="grid-2" style={{ gap: 16, marginBottom: 24 }}>
              <div style={{ background: 'var(--clr-bg-elevated)', padding: 16, borderRadius: 'var(--r-md)' }}>
                <p className="text-sm text-muted" style={{ margin: '0 0 4px' }}>Department</p>
                <p style={{ margin: 0, fontWeight: 500 }}>{profile.department || 'N/A'}</p>
              </div>
              <div style={{ background: 'var(--clr-bg-elevated)', padding: 16, borderRadius: 'var(--r-md)' }}>
                <p className="text-sm text-muted" style={{ margin: '0 0 4px' }}>Current Year</p>
                <p style={{ margin: 0, fontWeight: 500 }}>
                  {profile.currentYear ? `Year ${profile.currentYear}` : 'N/A'}
                </p>
              </div>
              {profile.gpa && (
                <div style={{ background: 'var(--clr-bg-elevated)', padding: 16, borderRadius: 'var(--r-md)' }}>
                  <p className="text-sm text-muted" style={{ margin: '0 0 4px' }}>GPA</p>
                  <p style={{ margin: 0, fontWeight: 500 }}>{profile.gpa}</p>
                </div>
              )}
              <div style={{ background: 'var(--clr-bg-elevated)', padding: 16, borderRadius: 'var(--r-md)' }}>
                <p className="text-sm text-muted" style={{ margin: '0 0 4px' }}>Location</p>
                <p style={{ margin: 0, fontWeight: 500 }}>
                  {profile.location?.city
                    ? `📍 ${profile.location.city}${profile.location.country ? `, ${profile.location.country}` : ''}`
                    : 'N/A'}
                </p>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ marginBottom: 8, fontSize: '1.1rem' }}>About</h3>
                <p style={{ lineHeight: 1.6, color: 'var(--clr-text-muted)' }}>{profile.bio}</p>
              </div>
            )}

            {/* Skills */}
            {profile.skills?.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ marginBottom: 12, fontSize: '1.1rem' }}>Skills</h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {profile.skills.map(skill => (
                    <span key={skill} className="badge badge-ghost" style={{ padding: '6px 12px' }}>{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Career Interests */}
            {profile.careerInterests?.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ marginBottom: 12, fontSize: '1.1rem' }}>Career Interests</h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {profile.careerInterests.map(ci => (
                    <span key={ci} className="tag">{ci}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio */}
            {(profile.portfolio?.github || profile.portfolio?.portfolioUrl) && (
              <div>
                <h3 style={{ marginBottom: 12, fontSize: '1.1rem' }}>Portfolio</h3>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {profile.portfolio.github && (
                    <a href={profile.portfolio.github} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                      🐙 GitHub
                    </a>
                  )}
                  {profile.portfolio.portfolioUrl && (
                    <a href={profile.portfolio.portfolioUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                      🌐 Portfolio
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default StudentPublicProfile;
