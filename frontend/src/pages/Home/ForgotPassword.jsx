import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import '../../styles/Home/Login.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setMessage(''); setLoading(true);
    try {
      const data = await api.post('/auth/forgot-password', { email });
      setMessage(data.message || 'If that email exists, a reset link has been sent.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PublicNavbar />
      <div className="auth-page">
        <div className="card auth-card">
          <div className="auth-card-header">
            <span className="auth-card-icon">🔑</span>
            <h2 className="auth-card-title">Forgot Password</h2>
            <p className="auth-card-sub">Enter your email and we'll send a reset link</p>
          </div>

          {error && <div className="auth-error-banner">{error}</div>}
          {message && (
            <div className="auth-error-banner" style={{ background: 'var(--success, #16a34a)', color: '#fff' }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                id="email"
                className="form-input"
                type="email"
                name="email"
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-required="true"
              />
            </div>
            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
              {loading ? <><span className="spinner-sm spinner" /> Sending...</> : 'Send Reset Link'}
            </button>
          </form>

          <p className="auth-footer">
            Remember your password?{' '}
            <Link to="/login" className="auth-footer-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
