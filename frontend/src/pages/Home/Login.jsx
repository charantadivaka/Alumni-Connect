import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import '../../styles/Home/Login.css';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '', otp: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = Login, 2 = 2FA OTP

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (step === 1) {
        const response = await authService.login({ email: form.email, password: form.password });
        if (response.requires2FA) {
            setStep(2);
            return;
        }
        login(response.user);
        navigate(`/${response.user.role}/dashboard`);
      } else {
        const response = await authService.verify2FALogin({ email: form.email, otp: form.otp });
        login(response.user);
        navigate(`/${response.user.role}/dashboard`);
      }
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
            <span className="auth-card-icon">🎓</span>
            <h2 className="auth-card-title">Welcome back</h2>
            <p className="auth-card-sub">Sign in to your account</p>
          </div>

          {error && (
            <div className="auth-error-banner">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {step === 1 ? (
              <>
                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input id="email" className="form-input" type="email" name="email" placeholder="you@university.edu"
                    value={form.email} onChange={handleChange} required aria-required="true" />
                </div>
                <div className="form-group">
                  <label htmlFor="password" className="form-label">Password</label>
                  <div className="password-field">
                    <input id="password" className="form-input" type={showPassword ? 'text' : 'password'} name="password"
                      placeholder="••••••••" value={form.password} onChange={handleChange} required aria-required="true" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="password-toggle"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  <div className="form-extra">
                    <Link to="/forgot-password" className="form-link">Forgot password?</Link>
                  </div>
                </div>
              </>
            ) : (
              <div className="form-group">
                <p style={{ fontSize: '0.9rem', marginBottom: '15px', color: 'var(--clr-text-muted)' }}>
                  A verification code has been sent to your email. Please enter it below.
                </p>
                <label htmlFor="otp" className="form-label">Authentication Code (OTP)</label>
                <input id="otp" className="form-input" type="text" name="otp" placeholder="123456"
                  value={form.otp} onChange={handleChange} required aria-required="true" maxLength={6}
                  style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem', fontWeight: 'bold' }} />
              </div>
            )}
            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
              {loading ? <><span className="spinner-sm spinner" /> Processing...</> : (step === 1 ? 'Sign In' : 'Verify & Sign In')}
            </button>
          </form>

          <p className="auth-footer">
            <Link to="/forgot-password" className="auth-footer-link" style={{ display: 'block', textAlign: 'right', marginBottom: '0.75rem' }}>Forgot password?</Link>
            Don't have an account?{' '}
            <Link to="/role-select" className="auth-footer-link">Get started</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
