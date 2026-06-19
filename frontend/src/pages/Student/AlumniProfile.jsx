import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { profileService } from '../../services/profileService';
import { connectionService } from '../../services/otherServices';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Student/AlumniProfile.css';

const AlumniProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('None');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const [profData, connsData] = await Promise.all([
          profileService.getById(id),
          connectionService.getMy()
        ]);
        setProfile(profData);
        
        const conn = connsData.find(c => 
          (c.sender?._id === user._id && c.receiver?._id === id) || 
          (c.receiver?._id === user._id && c.sender?._id === id)
        );
        if (conn) setConnectionStatus(conn.status);

      } catch (err) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [id, user._id]);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">
        <div className="page-header" style={{ marginBottom: 16 }}>
          <Link to="/student/browse" className="btn btn-ghost btn-sm" style={{ marginBottom: 12 }}>← Back to Directory</Link>
          <h1>Alumni Profile</h1>
        </div>

        {error && <div className="card" style={{ color: 'var(--clr-danger)' }}>{error}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /> Loading...</div>
        ) : profile ? (
          <div className="card" style={{ maxWidth: 800 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, flexWrap: 'wrap' }}>
              <div className="avatar-placeholder" style={{ width: 100, height: 100, fontSize: '2.5rem' }}>
                {profile.profilePicture ? (
                  <img src={profile.profilePicture} alt={profile.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  profile.name?.[0]?.toUpperCase()
                )}
              </div>
              <div style={{ flex: 1, minWidth: 250 }}>
                <h2 style={{ margin: '0 0 4px' }}>{profile.name}</h2>
                <p className="text-muted" style={{ margin: '0 0 10px' }}>
                  {profile.designation && `${profile.designation} at `}{profile.company}
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {profile.industry && <span className="badge badge-ghost">{profile.industry}</span>}
                  {profile.mentorshipAvailability === 'Available' && <span className="badge badge-success">✓ Mentoring (Available)</span>}
                  {profile.mentorshipAvailability === 'Limited' && <span className="badge badge-warning" style={{ background: 'var(--clr-warning)', color: 'var(--clr-bg)' }}>⚠️ Mentoring (Limited)</span>}
                  {profile.mentorshipAvailability === 'Fully Booked' && <span className="badge badge-danger">✗ Mentoring (Booked)</span>}
                </div>
              </div>
            </div>

            <div className="grid-2" style={{ gap: 20, marginBottom: 24 }}>
              <div style={{ background: 'var(--clr-bg-elevated)', padding: 16, borderRadius: 'var(--r-md)' }}>
                <p className="text-sm text-muted" style={{ margin: '0 0 4px' }}>Department</p>
                <p style={{ margin: 0, fontWeight: 500 }}>{profile.department || 'N/A'}</p>
              </div>
              <div style={{ background: 'var(--clr-bg-elevated)', padding: 16, borderRadius: 'var(--r-md)' }}>
                <p className="text-sm text-muted" style={{ margin: '0 0 4px' }}>Graduation Year</p>
                <p style={{ margin: 0, fontWeight: 500 }}>{profile.graduationYear || 'N/A'}</p>
              </div>
              <div style={{ background: 'var(--clr-bg-elevated)', padding: 16, borderRadius: 'var(--r-md)' }}>
                <p className="text-sm text-muted" style={{ margin: '0 0 4px' }}>Location</p>
                <p style={{ margin: 0, fontWeight: 500 }}>📍 {profile.location || 'N/A'}</p>
              </div>
              <div style={{ background: 'var(--clr-bg-elevated)', padding: 16, borderRadius: 'var(--r-md)' }}>
                <p className="text-sm text-muted" style={{ margin: '0 0 4px' }}>User ID</p>
                {connectionStatus === 'Accepted' ? (
                  <>
                    <p style={{ margin: 0, fontWeight: 500, fontFamily: 'monospace', fontSize: '0.8rem' }}>{profile._id}</p>
                    <p className="text-sm text-faint" style={{ margin: 0 }}>(Use this ID for booking mock interviews or messaging)</p>
                  </>
                ) : (
                  <>
                    <p style={{ margin: 0, fontWeight: 500, fontSize: '0.8rem', color: 'var(--clr-warning)' }}>Hidden</p>
                    <p className="text-sm text-faint" style={{ margin: 0 }}>(Connection must be accepted to view ID)</p>
                  </>
                )}
              </div>
            </div>

            {profile.bio && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ marginBottom: 8, fontSize: '1.1rem' }}>About</h3>
                <p style={{ lineHeight: 1.6, color: 'var(--clr-text-muted)' }}>{profile.bio}</p>
              </div>
            )}

            {profile.skills && profile.skills.length > 0 && (
              <div>
                <h3 style={{ marginBottom: 12, fontSize: '1.1rem' }}>Skills</h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {profile.skills.map(skill => (
                    <span key={skill} className="badge badge-ghost" style={{ padding: '6px 12px' }}>{skill}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default AlumniProfile;
