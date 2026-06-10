import { Link } from 'react-router-dom';

const NotFound = () => (
  <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 'var(--sp-lg)' }}>
    <div style={{ fontSize: '5rem', marginBottom: 'var(--sp-lg)' }}>🌌</div>
    <h1 style={{ fontSize: '4rem', fontWeight: 900, background: 'var(--grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>404</h1>
    <h2 style={{ margin: 'var(--sp-md) 0 var(--sp-sm)' }}>Page Not Found</h2>
    <p>The page you're looking for doesn't exist or has been moved.</p>
    <Link to="/" className="btn btn-primary" style={{ marginTop: 'var(--sp-xl)' }}>Go Home</Link>
  </div>
);

export default NotFound;
