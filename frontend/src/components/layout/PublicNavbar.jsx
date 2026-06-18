import { Link } from 'react-router-dom';

export const PublicNavbar = () => (
  <header className="public-navbar">
    <Link to="/" className="navbar-logo">
      <span className="logo-icon">🎓</span>
      <span className="logo-text">AlumniConnect</span>
    </Link>
    <nav className="navbar-nav">
      <Link to="/about" className="nav-link">About</Link>
      <Link to="/login" className="btn btn-ghost btn-sm nav-btn-signin">Sign In</Link>
      <Link to="/role-select" className="btn btn-primary btn-sm">Get Started</Link>
    </nav>
  </header>
);
