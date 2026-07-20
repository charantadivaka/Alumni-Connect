import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import '../../styles/Home/Login.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!token) {
      setError('Invalid reset link. Please request a new one.');
      return;
    }
    setError(''); setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      navigate('/login', { replace: true, state: { message: 'Password reset successfully! Please log in.' } });
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
            <span className="auth-card-icon">🔐</span>
            <h2 className="auth-card-title">Reset Password</h2>
            <p className="auth-card-sub">Choose a new password for your account</p>
          </div>

          {error && <div className="auth-error-banner">{error}</div>}
          {!token && (
            <div className="auth-error-banner">
              Invalid or missing reset token.{' '}
              <Link to="/forgot-password" className="auth-footer-link">Request a new link</Link>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="password" className="form-label">New Password</label>
              <div className="password-field">
                <input
                  id="password"
                  className="form-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="confirm" className="form-label">Confirm Password</label>
              <input
                id="confirm"
                className="form-input"
                type="password"
                placeholder="Repeat your new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary btn-full" type="submit" disabled={loading || !token}>
              {loading ? <><span className="spinner-sm spinner" /> Resetting...</> : 'Reset Password'}
            </button>
          </form>

          <p className="auth-footer">
            <Link to="/login" className="auth-footer-link">Back to Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
