import { Link, useNavigate } from 'react-router-dom';

const Unauthorized = () => {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 'var(--sp-lg)' }}>
      <div style={{ fontSize: '4rem', marginBottom: 'var(--sp-lg)' }}>🔒</div>
      <h2 style={{ marginBottom: 'var(--sp-sm)' }}>Access Denied</h2>
      <p>You don't have permission to view this page.</p>
      <div style={{ display: 'flex', gap: 'var(--sp-md)', marginTop: 'var(--sp-xl)' }}>
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>Go Back</button>
        <Link to="/" className="btn btn-primary">Go Home</Link>
      </div>
    </div>
  );
};

export default Unauthorized;
