import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';
import { notificationService } from '../../services/messageService';

const studentLinks = [
  { to: '/student/dashboard',   icon: '🏠', label: 'Dashboard' },
  { to: '/student/browse',      icon: '🔍', label: 'Find Alumni' },
  { to: '/student/jobs',        icon: '💼', label: 'Job Board' },
  { to: '/student/applications',icon: '📋', label: 'My Applications' },
  { to: '/student/mentorship',  icon: '🎓', label: 'Mentorship' },
  { to: '/student/interviews',  icon: '🎤', label: 'Mock Interviews' },
  { to: '/student/referrals',   icon: '🤝', label: 'Referrals' },
  { to: '/student/resumes',     icon: '📄', label: 'My Resumes' },
  { to: '/student/messages',    icon: '💬', label: 'Messages' },
  { to: '/student/events',      icon: '📅', label: 'Events' },
  { to: '/student/forum',       icon: '🗣️', label: 'Forum' },
  { to: '/student/stories',     icon: '✨', label: 'Stories' },
  { to: '/student/saved',       icon: '🔖', label: 'Saved Items' },
  { to: '/student/map',         icon: '🗺️', label: 'Alumni Map' },
];

const alumniLinks = [
  { to: '/alumni/dashboard',    icon: '🏠', label: 'Dashboard' },
  { to: '/alumni/jobs',         icon: '💼', label: 'Manage Jobs' },
  { to: '/alumni/applications', icon: '📋', label: 'Applications' },
  { to: '/alumni/mentorship',   icon: '🎓', label: 'Mentorship' },
  { to: '/alumni/slots',        icon: '📅', label: 'My Slots' },
  { to: '/alumni/interviews',   icon: '🎤', label: 'Interviews' },
  { to: '/alumni/referrals',    icon: '🤝', label: 'Referrals' },
  { to: '/alumni/messages',     icon: '💬', label: 'Messages' },
  { to: '/alumni/events',       icon: '📆', label: 'Events' },
  { to: '/alumni/stories',      icon: '✨', label: 'Stories' },
  { to: '/alumni/startup',      icon: '🚀', label: 'My Startup' },
];

const adminLinks = [
  { to: '/admin/dashboard',     icon: '🏠', label: 'Dashboard' },
  { to: '/admin/users',         icon: '👥', label: 'Users' },
  { to: '/admin/colleges',      icon: '🏛️', label: 'Colleges' },
  { to: '/admin/verification',  icon: '✅', label: 'Verification Queue' },
  { to: '/admin/moderation',    icon: '🛡️', label: 'Moderation' },
  { to: '/admin/analytics',     icon: '📊', label: 'Analytics' },
];

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [unread, setUnread] = useState(0);

  const links = user?.role === 'student' ? studentLinks
              : user?.role === 'alumni'  ? alumniLinks
              : adminLinks;

  useEffect(() => {
    notificationService.getAll().then(data => {
      setUnread(data.filter(n => !n.isRead).length);
    }).catch(() => {});
  }, [location.pathname]);

  return (
    <aside style={{
      position: 'fixed', top: 0, left: 0,
      width: 'var(--sidebar-w)', height: '100vh',
      background: 'var(--clr-bg-card)',
      borderRight: '1px solid var(--clr-border)',
      display: 'flex', flexDirection: 'column',
      zIndex: 100, overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--clr-border)' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '1.5rem' }}>🎓</span>
          <span style={{ fontWeight: 800, fontSize: '1rem', background: 'var(--grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            AlumniConnect
          </span>
        </Link>
        <Link to={user?.role === 'admin' ? '/admin/dashboard' : `/${user?.role}/profile`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px', borderRadius: 'var(--r-md)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--clr-bg-elevated)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div className="avatar-placeholder avatar-sm" style={{ width: 28, height: 28, fontSize: '0.7rem' }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{user?.name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-faint)', textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '10px 8px' }}>
        {links.map(({ to, icon, label }) => {
          const active = location.pathname === to || location.pathname.startsWith(to + '/');
          return (
            <Link key={to} to={to} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 'var(--r-md)',
              marginBottom: 2, fontSize: '0.875rem',
              color: active ? 'var(--clr-text)' : 'var(--clr-text-muted)',
              background: active ? 'var(--clr-primary-glow)' : 'transparent',
              fontWeight: active ? 600 : 400,
              transition: 'all var(--tr-fast)',
            }}>
              <span>{icon}</span>
              <span>{label}</span>
              {label === 'Messages' && unread > 0 && (
                <span className="badge badge-primary" style={{ marginLeft: 'auto', padding: '1px 7px', fontSize: '0.7rem' }}>
                  {unread}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Controls */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--clr-border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button onClick={logout} className="btn btn-ghost btn-sm btn-full" style={{ justifyContent: 'flex-start', gap: 8 }}>
          <span>🚪</span> Logout
        </button>
      </div>
    </aside>
  );
};
