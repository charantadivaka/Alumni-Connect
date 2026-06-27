import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';
import { notificationService, messageService } from '../../services/messageService';
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

const MOBILE_BREAKPOINT = 768;

export const Sidebar = ({ defaultOpen = true }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= MOBILE_BREAKPOINT);
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = user?.role === 'student' ? studentLinks
              : user?.role === 'alumni'  ? alumniLinks
              : adminLinks;

  // Detect mobile screen size
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'student' || user.role === 'alumni') {
      messageService.getThreads().then(threadsData => {
        const count = threadsData.reduce((sum, t) => sum + (t.unreadCount || 0), 0);
        setUnread(count);
      }).catch(() => {});
    }
  }, [location.pathname, user]);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (isMobile) setMobileOpen(false);
  }, [location.pathname, isMobile]);

  // Persist sidebar state in localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebarOpen');
    if (saved !== null) setIsOpen(saved === 'true');
  }, []);

  const toggleDesktop = () => {
    setIsOpen(prev => {
      localStorage.setItem('sidebarOpen', String(!prev));
      return !prev;
    });
  };

  const sidebarW = isOpen ? '240px' : '64px';
  // On mobile, sidebar is hidden off-screen so content takes full width
  const effectiveSidebarW = isMobile ? '0px' : sidebarW;
  const showLabel = isOpen || isMobile;

  return (
    <>
      {/* Mobile FAB hamburger button */}
      {isMobile && (
        <button
          className="sidebar-mobile-fab"
          onClick={() => setMobileOpen(v => !v)}
          title="Open menu"
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>
      )}

      {/* Mobile backdrop */}
      {isMobile && mobileOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar${isMobile && mobileOpen ? ' sidebar--mobile-open' : ''}`}
        style={isMobile ? undefined : { width: sidebarW }}
      >
        {/* Header */}
        <div className="sidebar-header">
          {!isMobile && (
            <button
              onClick={toggleDesktop}
              title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              className="hamburger-btn"
            >
              <span className="hamburger-line" />
              <span className="hamburger-line" style={{ opacity: isOpen ? 1 : 0.7 }} />
              <span className="hamburger-line" />
            </button>
          )}

          {showLabel && (
            <Link to="/" className="sidebar-logo">
              <span className="sidebar-logo-icon">🎓</span>
              <span className="sidebar-logo-text">AlumniConnect</span>
            </Link>
          )}
        </div>

        {/* User profile pill (open state) */}
        {showLabel && (
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
        {!showLabel && (
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
                title={!showLabel ? label : ''}
                className={[
                  'sidebar-nav-link',
                  active ? 'sidebar-nav-link--active' : '',
                  showLabel ? 'sidebar-nav-link--open' : 'sidebar-nav-link--collapsed',
                ].join(' ')}
              >
                <span className="sidebar-nav-icon">{icon}</span>
                {showLabel && <span className="sidebar-nav-label">{label}</span>}
                {label === 'Messages' && unread > 0 && showLabel && (
                  <span className="badge badge-primary sidebar-unread-badge">
                    {unread}
                  </span>
                )}
                {label === 'Messages' && unread > 0 && !showLabel && (
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
            className={`sidebar-logout ${showLabel ? 'sidebar-logout--open' : 'sidebar-logout--collapsed'}`}
          >
            <span className="sidebar-logout-icon">🚪</span>
            {showLabel && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content offset via CSS variable */}
      <style>{`:root { --sidebar-w: ${effectiveSidebarW}; }`}</style>
    </>
  );
};
