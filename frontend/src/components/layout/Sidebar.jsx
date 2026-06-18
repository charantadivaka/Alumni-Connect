import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';
import { notificationService } from '../../services/messageService';

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
      <aside style={{
        position: 'fixed', top: 0, left: 0,
        width: sidebarW, height: '100vh',
        background: 'var(--clr-bg-card)',
        borderRight: '1px solid var(--clr-border)',
        display: 'flex', flexDirection: 'column',
        zIndex: 100, overflowY: 'auto', overflowX: 'hidden',
        transition: 'width 0.28s cubic-bezier(.4,0,.2,1)',
      }}>
        {/* Header: hamburger + logo */}
        <div style={{
          padding: '16px 12px',
          borderBottom: '1px solid var(--clr-border)',
          display: 'flex', alignItems: 'center', gap: 10,
          minHeight: 64, flexShrink: 0,
        }}>
          <button
            onClick={toggleSidebar}
            title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', gap: 5,
              padding: 6, borderRadius: 'var(--r-sm)',
              flexShrink: 0,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--clr-bg-elevated)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <span style={{
              display: 'block', width: 20, height: 2,
              background: 'var(--clr-text-muted)', borderRadius: 2,
              transition: 'all 0.2s',
              transform: isOpen ? 'rotate(0)' : 'none',
            }} />
            <span style={{
              display: 'block', width: 20, height: 2,
              background: 'var(--clr-text-muted)', borderRadius: 2,
              transition: 'all 0.2s',
              opacity: isOpen ? 1 : 0.7,
            }} />
            <span style={{
              display: 'block', width: 20, height: 2,
              background: 'var(--clr-text-muted)', borderRadius: 2,
              transition: 'all 0.2s',
            }} />
          </button>

          {isOpen && (
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
              <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>🎓</span>
              <span style={{
                fontWeight: 800, fontSize: '0.95rem',
                background: 'var(--grad-primary)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                whiteSpace: 'nowrap',
              }}>
                AlumniConnect
              </span>
            </Link>
          )}
        </div>

        {/* User profile pill */}
        {isOpen && (
          <Link
            to={user?.role === 'admin' ? '/admin/dashboard' : `/${user?.role}/profile`}
            style={{ textDecoration: 'none', color: 'inherit', flexShrink: 0 }}
          >
            <div
              style={{
                margin: '10px 8px', display: 'flex', alignItems: 'center', gap: 8,
                cursor: 'pointer', padding: '8px', borderRadius: 'var(--r-md)',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--clr-bg-elevated)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div className="avatar-placeholder avatar-sm" style={{ width: 30, height: 30, fontSize: '0.75rem', flexShrink: 0 }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-faint)', textTransform: 'capitalize' }}>{user?.role}</div>
              </div>
            </div>
          </Link>
        )}

        {/* Collapsed: avatar only */}
        {!isOpen && (
          <Link to={user?.role === 'admin' ? '/admin/dashboard' : `/${user?.role}/profile`} style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center', padding: '10px 0', flexShrink: 0 }}>
            <div className="avatar-placeholder avatar-sm" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
          </Link>
        )}

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '8px 6px', overflowY: 'auto' }}>
          {links.map(({ to, icon, label }) => {
            const active = location.pathname === to || location.pathname.startsWith(to + '/');
            return (
              <Link
                key={to}
                to={to}
                title={!isOpen ? label : ''}
                style={{
                  display: 'flex', alignItems: 'center',
                  gap: isOpen ? 10 : 0,
                  justifyContent: isOpen ? 'flex-start' : 'center',
                  padding: '9px 10px', borderRadius: 'var(--r-md)',
                  marginBottom: 2, fontSize: '0.875rem',
                  color: active ? 'var(--clr-text)' : 'var(--clr-text-muted)',
                  background: active ? 'var(--clr-primary-glow)' : 'transparent',
                  fontWeight: active ? 600 : 400,
                  transition: 'all var(--tr-fast)',
                  whiteSpace: 'nowrap', overflow: 'hidden',
                }}
              >
                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{icon}</span>
                {isOpen && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>}
                {label === 'Messages' && unread > 0 && isOpen && (
                  <span className="badge badge-primary" style={{ marginLeft: 'auto', padding: '1px 7px', fontSize: '0.7rem' }}>
                    {unread}
                  </span>
                )}
                {label === 'Messages' && unread > 0 && !isOpen && (
                  <span style={{
                    position: 'absolute', top: 4, right: 4,
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--clr-primary)',
                  }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '10px 6px', borderTop: '1px solid var(--clr-border)', flexShrink: 0 }}>
          <button
            onClick={logout}
            title="Logout"
            style={{
              display: 'flex', alignItems: 'center',
              justifyContent: isOpen ? 'flex-start' : 'center',
              gap: 8, width: '100%',
              padding: '9px 10px', borderRadius: 'var(--r-md)',
              background: 'none', border: 'none',
              color: 'var(--clr-text-muted)', fontSize: '0.875rem',
              cursor: 'pointer', transition: 'all var(--tr-fast)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.12)'; e.currentTarget.style.color = 'var(--clr-danger)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--clr-text-muted)'; }}
          >
            <span style={{ fontSize: '1.1rem' }}>🚪</span>
            {isOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content offset div injected as CSS variable update */}
      <style>{`:root { --sidebar-w: ${sidebarW}; }`}</style>
    </>
  );
};
