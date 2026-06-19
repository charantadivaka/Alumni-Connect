import { useState, useEffect, useRef, useCallback } from 'react';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './OtpVerification.css';

const RESEND_COOLDOWN = 15; // seconds before resend is allowed

/**
 * OtpVerification
 *
 * Props:
 *   email      {string}  – email the OTP was sent to
 *   role       {string}  – 'student' | 'alumni'  (for redirect after success)
 *   onBack     {fn}      – callback to go back to registration form
 */
const OtpVerification = ({ email, role, onBack }) => {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [digits, setDigits]       = useState(Array(6).fill(''));
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [resendSec, setResendSec] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);

  const inputRefs = useRef([]);

  // ── Countdown timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (resendSec <= 0) return;
    const t = setTimeout(() => setResendSec(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendSec]);

  // ── Focus first box on mount ─────────────────────────────────────────────
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // ── Handle digit input ───────────────────────────────────────────────────
  const handleChange = (idx, val) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next  = [...digits];
    next[idx]   = digit;
    setDigits(next);
    setError('');

    if (digit && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace') {
      if (digits[idx]) {
        const next = [...digits];
        next[idx]  = '';
        setDigits(next);
      } else if (idx > 0) {
        inputRefs.current[idx - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  // Handle pasting a full 6-digit code
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = Array(6).fill('');
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleVerify = useCallback(async () => {
    const otp = digits.join('');
    if (otp.length < 6) {
      setError('Please enter all 6 digits.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await authService.verifyOtp({ email, otp });
      login(data);
      navigate(role === 'alumni' ? '/alumni/dashboard' : '/student/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
      setDigits(Array(6).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }, [digits, email, role, login, navigate]);

  // Auto-submit when all 6 digits are filled
  useEffect(() => {
    if (digits.every(d => d !== '') && !loading) {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits]);

  // ── Resend ───────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendSec > 0 || resending) return;
    setResending(true);
    setError('');
    setSuccess('');
    try {
      await authService.resendOtp({ email });
      setSuccess('A new OTP has been sent to your email.');
      setDigits(Array(6).fill(''));
      setResendSec(RESEND_COOLDOWN);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  // Masked email for display, e.g. ch***@gmail.com
  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(Math.max(b.length, 3)) + c);

  return (
    <div className="otp-page">
      <div className="card otp-card">

        {/* Header */}
        <div className="otp-header">
          <div className="otp-icon-ring">📧</div>
          <h2>Verify your email</h2>
          <p className="otp-header-sub">We sent a 6-digit code to</p>
          <p className="otp-email-display">{maskedEmail}</p>
        </div>

        {/* Error / Success banners */}
        {error && (
          <div className="otp-banner otp-banner--error">❌ {error}</div>
        )}
        {success && (
          <div className="otp-banner otp-banner--success">✅ {success}</div>
        )}

        {/* 6-digit OTP boxes */}
        <div className="otp-boxes-row" onPaste={handlePaste}>
          {digits.map((d, idx) => (
            <input
              key={idx}
              ref={el => { inputRefs.current[idx] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleChange(idx, e.target.value)}
              onKeyDown={e => handleKeyDown(idx, e)}
              onFocus={e => e.target.select()}
              className={`otp-digit-box${d ? ' otp-digit-box--filled' : ''}`}
              aria-label={`OTP digit ${idx + 1}`}
              autoComplete="one-time-code"
              disabled={loading}
            />
          ))}
        </div>

        {/* Verify button */}
        <button
          className="btn btn-primary btn-full"
          onClick={handleVerify}
          disabled={loading || digits.some(d => d === '')}
          style={{ marginBottom: 'var(--sp-md)' }}
        >
          {loading ? (
            <span className="otp-loading-span">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                   className="otp-spin-icon">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
              Verifying…
            </span>
          ) : 'Verify Email & Continue'}
        </button>

        {/* Resend section */}
        <div className="otp-resend-section">
          {resendSec > 0 ? (
            <span className="otp-countdown">
              Resend code in{' '}
              <strong>0:{String(resendSec).padStart(2, '0')}</strong>
            </span>
          ) : (
            <span>
              Didn't receive the code?{' '}
              <button
                onClick={handleResend}
                disabled={resending}
                className="otp-resend-btn"
              >
                {resending ? 'Sending…' : 'Resend OTP'}
              </button>
            </span>
          )}
        </div>

        {/* Back link */}
        <div className="otp-back-section">
          <button onClick={onBack} className="otp-back-btn">
            ← Back to registration
          </button>
        </div>

      </div>
    </div>
  );
};

export default OtpVerification;
