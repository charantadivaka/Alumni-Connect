import { Link } from 'react-router-dom';

export const PublicNavbar = () => (
  <header style={{
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
    background: 'rgba(8,11,26,0.85)', backdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    padding: '0 var(--sp-lg)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    height: 64,
  }}>
    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: '1.5rem' }}>🎓</span>
      <span style={{ fontWeight: 800, fontSize: '1.1rem', background: 'var(--grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        AlumniConnect
      </span>
    </Link>
    <nav style={{ display: 'flex', gap: 'var(--sp-lg)', alignItems: 'center' }}>
      <Link to="/about" style={{ color: 'var(--clr-text-muted)', fontSize: '0.9rem', transition: 'color var(--tr-fast)' }}
        onMouseOver={e => e.target.style.color = 'var(--clr-text)'}
        onMouseOut={e => e.target.style.color = 'var(--clr-text-muted)'}>
        About
      </Link>
      <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
      <Link to="/role-select" className="btn btn-primary btn-sm">Get Started</Link>
    </nav>
  </header>
);
