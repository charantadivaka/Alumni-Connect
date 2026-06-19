import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';
import { notificationService } from '../../services/messageService';
import './Sidebar.css';

/* ── Student top-level nav items ──────────────────────────────────────── */
const studentLinks = [
  { to: '/student/dashboard',  icon: '🏠', label: 'Home' },
  { to: '/student/network',    icon: '🔍', label: 'Network' },
  { to: '/student/circle',     icon: '👥', label: 'My Circle' },
  { to: '/student/jobs-hub',   icon: '💼', label: 'Jobs' },
  { to: '/student/community',  icon: '🌐', label: 'Community' },
  { to: '/student/saved',      icon: '🔖', label: 'Saved Items' },
  { to: '/student/messages',   icon: '💬', label: 'Messages' },
];

const alumniLinks = [
  { to: '/alumni/dashboard',    icon: '🏠', label: 'Home' },
  { to: '/alumni/network',      icon: '🔍', label: 'Network' },
  { to: '/alumni/jobs-hub',     icon: '💼', label: 'Job Hub' },
  { to: '/alumni/community',    icon: '🌐', label: 'Community' },
  { to: '/alumni/saved',        icon: '🔖', label: 'Saved Items' },
  { to: '/alumni/messages',     icon: '💬', label: 'Messages' },
];

const adminLinks = [
  { to: '/admin/dashboard',     icon: '🏠', label: 'Dashboard' },
  { to: '/admin/users',         icon: '👥', label: 'Users' },
  { to: '/admin/colleges',      icon: '🏛️', label: 'Colleges' },
  { to: '/admin/verification',  icon: '✅', label: 'Verification Queue' },
  { to: '/admin/moderation',    icon: '🛡️', label: 'Moderation' },
  { to: '/admin/analytics',     icon: '📊', label: 'Analytics' },
];

export const Sidebar = ({ defaultOpen = true }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const links = user?.role === 'student' ? studentLinks
              : user?.role === 'alumni'  ? alumniLinks
              : adminLinks;

  useEffect(() => {
    notificationService.getAll().then(data => {
      setUnread(data.filter(n => !n.isRead).length);
    }).catch(() => {});
  }, [location.pathname]);

  // Persist sidebar state in localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebarOpen');
    if (saved !== null) setIsOpen(saved === 'true');
  }, []);

  const toggleSidebar = () => {
    setIsOpen(prev => {
      localStorage.setItem('sidebarOpen', String(!prev));
      return !prev;
    });
  };

  const sidebarW = isOpen ? '240px' : '64px';

  return (
    <>
      {/* Sidebar */}
      <aside
        className="sidebar"
        style={{ width: sidebarW }}
      >
        {/* Header: hamburger + logo */}
        <div className="sidebar-header">
          <button
            onClick={toggleSidebar}
            title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            className="hamburger-btn"
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" style={{ opacity: isOpen ? 1 : 0.7 }} />
            <span className="hamburger-line" />
          </button>

          {isOpen && (
            <Link to="/" className="sidebar-logo">
              <span className="sidebar-logo-icon">🎓</span>
              <span className="sidebar-logo-text">AlumniConnect</span>
            </Link>
          )}
        </div>

        {/* User profile pill */}
        {isOpen && (
          <Link
            to={user?.role === 'admin' ? '/admin/dashboard' : `/${user?.role}/profile`}
            className="sidebar-user-pill-link"
          >
            <div className="sidebar-user-pill">
              <div className="avatar-placeholder avatar-sm" style={{ width: 30, height: 30, fontSize: '0.75rem', flexShrink: 0 }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div className="sidebar-user-name">{user?.name}</div>
                <div className="sidebar-user-role">{user?.role}</div>
              </div>
            </div>
          </Link>
        )}

        {/* Collapsed: avatar only */}
        {!isOpen && (
          <Link
            to={user?.role === 'admin' ? '/admin/dashboard' : `/${user?.role}/profile`}
            className="sidebar-avatar-link"
          >
            <div className="avatar-placeholder avatar-sm" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
          </Link>
        )}

        {/* Nav links */}
        <nav className="sidebar-nav">
          {links.map(({ to, icon, label }) => {
            const active = location.pathname === to || location.pathname.startsWith(to + '/');
            return (
              <Link
                key={to}
                to={to}
                title={!isOpen ? label : ''}
                className={[
                  'sidebar-nav-link',
                  active ? 'sidebar-nav-link--active' : '',
                  isOpen ? 'sidebar-nav-link--open' : 'sidebar-nav-link--collapsed',
                ].join(' ')}
              >
                <span className="sidebar-nav-icon">{icon}</span>
                {isOpen && <span className="sidebar-nav-label">{label}</span>}
                {label === 'Messages' && unread > 0 && isOpen && (
                  <span className="badge badge-primary sidebar-unread-badge">
                    {unread}
                  </span>
                )}
                {label === 'Messages' && unread > 0 && !isOpen && (
                  <span className="sidebar-unread-dot" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="sidebar-footer">
          <button
            onClick={logout}
            title="Logout"
            className={`sidebar-logout ${isOpen ? 'sidebar-logout--open' : 'sidebar-logout--collapsed'}`}
          >
            <span className="sidebar-logout-icon">🚪</span>
            {isOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content offset via CSS variable */}
      <style>{`:root { --sidebar-w: ${sidebarW}; }`}</style>
    </>
  );
};
