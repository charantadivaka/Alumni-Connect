import { useState, useEffect, useRef, useCallback } from 'react';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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
    // Accept only one digit
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
      // Shake animation — clear inputs on wrong OTP
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

  // ── Styles ───────────────────────────────────────────────────────────────
  const boxStyle = (idx) => ({
    width: 52,
    height: 60,
    fontSize: '1.75rem',
    fontWeight: 700,
    fontFamily: 'monospace',
    textAlign: 'center',
    border: `2px solid ${digits[idx] ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
    borderRadius: 'var(--r-lg)',
    background: digits[idx] ? 'rgba(99,102,241,0.08)' : 'var(--clr-bg-elevated)',
    color: 'var(--clr-text)',
    outline: 'none',
    transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
    boxShadow: digits[idx] ? '0 0 0 3px rgba(99,102,241,0.2)' : 'none',
    caretColor: 'var(--clr-primary)',
    cursor: 'text',
  });

  // Masked email for display, e.g. ch***@gmail.com
  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(Math.max(b.length, 3)) + c);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--sp-lg)',
      background: 'var(--clr-bg)',
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 460, padding: 'var(--sp-2xl)' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--sp-xl)' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))',
            border: '2px solid rgba(99,102,241,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', margin: '0 auto var(--sp-md)',
          }}>
            📧
          </div>
          <h2 style={{ margin: '0 0 var(--sp-xs)', fontSize: '1.5rem' }}>Verify your email</h2>
          <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.9rem', margin: 0 }}>
            We sent a 6-digit code to
          </p>
          <p style={{ color: 'var(--clr-primary)', fontWeight: 600, fontSize: '0.95rem', margin: '4px 0 0' }}>
            {maskedEmail}
          </p>
        </div>

        {/* Error / Success banners */}
        {error && (
          <div style={{
            background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.35)',
            borderRadius: 'var(--r-md)', padding: '10px 14px',
            color: 'var(--clr-danger)', marginBottom: 'var(--sp-md)',
            fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            ❌ {error}
          </div>
        )}
        {success && (
          <div style={{
            background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.35)',
            borderRadius: 'var(--r-md)', padding: '10px 14px',
            color: 'var(--clr-success)', marginBottom: 'var(--sp-md)',
            fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            ✅ {success}
          </div>
        )}

        {/* 6-digit OTP boxes */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 'var(--sp-xl)' }}
             onPaste={handlePaste}>
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
              style={boxStyle(idx)}
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
          style={{ marginBottom: 'var(--sp-md)', position: 'relative' }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                   style={{ animation: 'spin 0.8s linear infinite' }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
              Verifying…
            </span>
          ) : 'Verify Email & Continue'}
        </button>

        {/* Resend section */}
        <div style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--clr-text-muted)' }}>
          {resendSec > 0 ? (
            <span>
              Resend code in{' '}
              <strong style={{ color: 'var(--clr-primary)', fontVariantNumeric: 'tabular-nums' }}>
                0:{String(resendSec).padStart(2, '0')}
              </strong>
            </span>
          ) : (
            <span>
              Didn't receive the code?{' '}
              <button
                onClick={handleResend}
                disabled={resending}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--clr-primary)', fontWeight: 600, fontSize: '0.875rem',
                  textDecoration: 'underline', padding: 0,
                  opacity: resending ? 0.6 : 1,
                }}
              >
                {resending ? 'Sending…' : 'Resend OTP'}
              </button>
            </span>
          )}
        </div>

        {/* Back link */}
        <div style={{ textAlign: 'center', marginTop: 'var(--sp-lg)' }}>
          <button
            onClick={onBack}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--clr-text-muted)', fontSize: '0.85rem',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            ← Back to registration
          </button>
        </div>


      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default OtpVerification;
