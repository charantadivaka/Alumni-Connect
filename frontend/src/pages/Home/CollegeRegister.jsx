import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import '../../styles/Home/CollegeRegister.css';
import { api } from '../../services/api';

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || '';

// ── Razorpay Script Loader ───────────────────────────────────────────────────
const loadRazorpay = () =>
  new Promise((resolve) => {
    if (document.getElementById('razorpay-sdk')) { resolve(true); return; }
    const script = document.createElement('script');
    script.id = 'razorpay-sdk';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

// ── Step Indicator ───────────────────────────────────────────────────────────
const StepIndicator = ({ current }) => (
  <div className="cr-steps">
    {['College Details', 'Review & Pay'].map((label, i) => {
      const step = i + 1;
      const active = step === current;
      const done = step < current;
      return (
        <div key={label} className={`cr-step ${active ? 'cr-step--active' : ''} ${done ? 'cr-step--done' : ''}`}>
          <div className="cr-step-circle">{done ? '✓' : step}</div>
          <span className="cr-step-label">{label}</span>
          {i < 1 && <div className={`cr-step-line ${done ? 'cr-step-line--done' : ''}`} />}
        </div>
      );
    })}
  </div>
);

// ── Live Regex Tester ─────────────────────────────────────────────────────────
const RegexTester = ({ pattern, example }) => {
  const [testVal, setTestVal] = useState('');
  let status = null;
  if (testVal) {
    try {
      status = new RegExp(pattern).test(testVal) ? 'match' : 'no-match';
    } catch { status = 'invalid'; }
  }
  return (
    <div className="cr-regex-tester">
      <label className="form-label">🧪 Live Pattern Tester</label>
      <input
        className={`form-input cr-regex-input ${status === 'match' ? 'cr-input-success' : status === 'no-match' ? 'cr-input-error' : ''}`}
        placeholder={`Type a roll number to test (e.g. ${example || '21A91A0101'})`}
        value={testVal}
        onChange={e => setTestVal(e.target.value)}
      />
      {testVal && (
        <p className={`cr-regex-result ${status === 'match' ? 'cr-result-match' : status === 'no-match' ? 'cr-result-no-match' : 'cr-result-invalid'}`}>
          {status === 'match' && '✅ Matches the pattern'}
          {status === 'no-match' && '❌ Does not match the pattern'}
          {status === 'invalid' && '⚠️ Invalid regex pattern'}
        </p>
      )}
    </div>
  );
};

// ── Fee Status Checker ────────────────────────────────────────────────────────
const FeeStatusChecker = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    setError('');
    try {
      const data = await api.get(`/colleges/fee-status?name=${encodeURIComponent(query.trim())}`);
      if (!data?.found) {
        setError(data?.message || 'College not found.');
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err.message || 'Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  // Colour based on days left
  const urgencyClass = (days) => {
    if (days > 90) return 'cs-status--safe';
    if (days > 30) return 'cs-status--warn';
    return 'cs-status--critical';
  };

  return (
    <div className="cr-form fade-in">
      <h3 className="cr-form-title">Check College Access Status</h3>
      <p className="cr-form-sub">
        Enter your college name exactly as registered to see when your AlumniConnect
        access expires.
      </p>

      <form className="cs-search-form" onSubmit={handleCheck}>
        <div className="cs-search-row">
          <input
            id="cs-college-name"
            className="form-input cs-search-input"
            placeholder="e.g. Jawaharlal Nehru Technological University"
            value={query}
            onChange={e => { setQuery(e.target.value); setResult(null); setError(''); }}
            autoComplete="off"
          />
          <button
            id="cs-check-btn"
            type="submit"
            className="btn btn-primary cs-check-btn"
            disabled={loading || !query.trim()}
          >
            {loading ? <><span className="spinner spinner-sm" /> Checking…</> : '🔍 Check Status'}
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="cr-error-banner cs-error">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`cs-result fade-in ${result.isExpired ? 'cs-result--expired' : 'cs-result--active'}`}>
          {/* Status Banner */}
          <div className={`cs-status-banner ${result.isExpired ? 'cs-banner--expired' : urgencyClass(result.daysRemaining)}`}>
            <span className="cs-status-icon">
              {result.isExpired ? '🔴' : result.daysRemaining > 90 ? '🟢' : result.daysRemaining > 30 ? '🟡' : '🔴'}
            </span>
            <div>
              <p className="cs-status-headline">
                {result.isExpired
                  ? 'Access Expired'
                  : result.daysRemaining > 90
                    ? 'Access Active'
                    : result.daysRemaining > 30
                      ? 'Expiring Soon'
                      : 'Expires Very Soon'}
              </p>
              <p className="cs-status-sub">
                {result.isExpired
                  ? 'Your college\'s subscription has expired. Renew now to restore access.'
                  : `${result.daysRemaining} day${result.daysRemaining !== 1 ? 's' : ''} remaining`}
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="cs-details">
            <div className="cs-detail-row">
              <span className="cs-detail-key">🏫 College</span>
              <span className="cs-detail-val">{result.collegeName}</span>
            </div>
            <div className="cs-detail-row">
              <span className="cs-detail-key">📅 Access Valid Until</span>
              <span className={`cs-detail-val cs-expiry-date ${result.isExpired ? 'cs-val--expired' : 'cs-val--active'}`}>
                {result.feePaidUntil ? formatDate(result.feePaidUntil) : '—'}
              </span>
            </div>
            <div className="cs-detail-row">
              <span className="cs-detail-key">🟢 Platform Status</span>
              <span className={`cs-detail-val cs-badge-status ${result.isActive && !result.isExpired ? 'cs-badge--live' : 'cs-badge--down'}`}>
                {result.isActive && !result.isExpired ? 'Live & Active' : 'Inactive'}
              </span>
            </div>
            <div className="cs-detail-row">
              <span className="cs-detail-key">💳 Fee Paid</span>
              <span className={`cs-detail-val ${result.feesPaid ? 'cs-val--paid' : 'cs-val--unpaid'}`}>
                {result.feesPaid ? '✓ Yes' : '✗ No'}
              </span>
            </div>
          </div>

          {/* CTA if expired or expiring */}
          {(result.isExpired || result.daysRemaining <= 30) && (
            <div className="cs-renew-cta">
              <p className="cs-renew-note">
                {result.isExpired
                  ? '⚠️ Your college has lost access. Students and alumni cannot log in until you renew.'
                  : `⚡ Your access expires in ${result.daysRemaining} days. Renew early to avoid disruption.`}
              </p>
              <a href="mailto:alumniconnectteam237@gmail.com?subject=Renewal for AlumniConnect" className="btn btn-primary cs-renew-btn">
                📧 Contact Us to Renew
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const CollegeRegister = () => {
  const [activeTab, setActiveTab] = useState('register'); // 'register' | 'status'
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const [form, setForm] = useState({
    collegeName: '', rollNumberPattern: '', exampleFormat: '',
    patternDescription: '', registrantEmail: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => { loadRazorpay(); }, []);

  const set = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    setFieldErrors(e => ({ ...e, [field]: '' }));
    setError('');
  };

  const validateStep1 = () => {
    const errs = {};
    if (!form.collegeName.trim()) errs.collegeName = 'College name is required.';
    if (!form.rollNumberPattern.trim()) {
      errs.rollNumberPattern = 'Roll number regex pattern is required.';
    } else {
      try {
        const re = new RegExp(form.rollNumberPattern);
        if (!form.exampleFormat || !re.test(form.exampleFormat))
          errs.exampleFormat = 'Example roll number must match the regex pattern.';
      } catch {
        errs.rollNumberPattern = 'Invalid regex pattern syntax.';
      }
    }
    if (!form.exampleFormat.trim()) errs.exampleFormat = 'An example roll number is required.';
    if (!form.registrantEmail.trim()) errs.registrantEmail = 'Contact email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.registrantEmail))
      errs.registrantEmail = 'Enter a valid email address.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePayment = async () => {
    setLoading(true); setError('');
    try {
      const sdkLoaded = await loadRazorpay();
      if (!sdkLoaded) throw new Error('Failed to load Razorpay SDK. Check your internet connection.');

      const orderData = await api.post('/payments/create-order', {
        collegeName: form.collegeName.trim(), rollNumberPattern: form.rollNumberPattern,
        exampleFormat: form.exampleFormat, patternDescription: form.patternDescription,
        registrantEmail: form.registrantEmail,
      });

      const options = {
        key: orderData.keyId || RAZORPAY_KEY,
        amount: orderData.amount, currency: orderData.currency,
        name: 'AlumniConnect',
        description: `Platform fee for ${form.collegeName.trim()} — ₹50,000/year`,
        order_id: orderData.orderId,
        prefill: { email: form.registrantEmail },
        theme: { color: '#6c63ff' },
        modal: { ondismiss: () => { setLoading(false); setError('Payment was cancelled. Please try again.'); } },
        handler: async (response) => {
          try {
            const verifyData = await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              collegeName: form.collegeName.trim(), rollNumberPattern: form.rollNumberPattern,
              exampleFormat: form.exampleFormat, patternDescription: form.patternDescription,
              registrantEmail: form.registrantEmail,
            });
            setSuccess({ collegeName: verifyData.college.name, feePaidUntil: verifyData.college.feePaidUntil, paymentId: response.razorpay_payment_id });
            setStep(3);
          } catch (e) {
            setError(e.message || 'Payment verified but college registration failed. Contact support.');
          } finally { setLoading(false); }
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => { setError(`Payment failed: ${resp.error.description}`); setLoading(false); });
      rzp.open();
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  // ── Success Screen ─────────────────────────────────────────────────────────
  if (step === 3 && success) {
    return (
      <div className="cr-page">
        <PublicNavbar />
        <div className="cr-container">
          <div className="cr-success-card">
            <div className="cr-success-icon">🎉</div>
            <h2 className="cr-success-title">College Registered!</h2>
            <p className="cr-success-sub"><strong>{success.collegeName}</strong> is now live on AlumniConnect.</p>
            <div className="cr-success-details">
              <div className="cr-success-row">
                <span className="cr-success-key">Payment ID</span>
                <span className="cr-success-val cr-mono">{success.paymentId}</span>
              </div>
              <div className="cr-success-row">
                <span className="cr-success-key">📅 You can use our website until</span>
                <span className="cr-success-val cs-val--active">
                  {success.feePaidUntil
                    ? new Date(success.feePaidUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                    : '1 year from today'}
                </span>
              </div>
              <div className="cr-success-row">
                <span className="cr-success-key">Amount Paid</span>
                <span className="cr-success-val cr-success-amount">₹50,000</span>
              </div>
            </div>
            <p className="cr-success-note">
              Students and alumni from <strong>{success.collegeName}</strong> can now register using
              their college roll numbers. You can check your access status anytime from{' '}
              <button className="cr-inline-link" onClick={() => { setStep(1); setActiveTab('status'); }}>
                Check Status
              </button>.
            </p>
            <div className="cr-success-actions">
              <Link to="/" className="btn btn-primary">Go to Home</Link>
              <Link to="/role-select" className="btn btn-outline">Register as User</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cr-page">
      <PublicNavbar />
      <div className="cr-container">
        {/* Header */}
        <div className="cr-header">
          <div className="badge badge-primary cr-badge">🏫 Institution Portal</div>
          <h1 className="cr-title">College <span className="text-gradient">Portal</span></h1>
          <p className="cr-subtitle">
            Register your institution or check your existing access status on AlumniConnect.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="cr-tabs">
          <button
            id="cr-tab-register"
            className={`cr-tab ${activeTab === 'register' ? 'cr-tab--active' : ''}`}
            onClick={() => { setActiveTab('register'); setStep(1); setError(''); }}
          >
            ✏️ Register College
          </button>
          <button
            id="cr-tab-status"
            className={`cr-tab ${activeTab === 'status' ? 'cr-tab--active' : ''}`}
            onClick={() => setActiveTab('status')}
          >
            📅 Check Access Status
          </button>
        </div>

        {/* Register Flow */}
        {activeTab === 'register' && (
          <>
            <StepIndicator current={step} />
            <div className="cr-card">
              {error && <div className="cr-error-banner"><span>⚠️</span> {error}</div>}

              {/* STEP 1 */}
              {step === 1 && (
                <div className="cr-form fade-in">
                  <h3 className="cr-form-title">College Details</h3>
                  <p className="cr-form-sub">Provide accurate details — these will be used to verify student roll numbers during registration.</p>
                  <div className="cr-form-grid">
                    <div className="form-group cr-span-full">
                      <label className="form-label">College / University Name *</label>
                      <input id="cr-college-name" className={`form-input ${fieldErrors.collegeName ? 'cr-field-error' : ''}`}
                        placeholder="e.g. Jawaharlal Nehru Technological University"
                        value={form.collegeName} onChange={e => set('collegeName', e.target.value)} />
                      {fieldErrors.collegeName && <p className="form-error">{fieldErrors.collegeName}</p>}
                    </div>
                    <div className="form-group cr-span-full">
                      <label className="form-label">Roll Number Regex Pattern *</label>
                      <input id="cr-roll-pattern" className={`form-input cr-mono-input ${fieldErrors.rollNumberPattern ? 'cr-field-error' : ''}`}
                        placeholder={`e.g. ^\\d{2}[A-Z]{2}\\d{2}[A-Z]\\d{4}$`}
                        value={form.rollNumberPattern} onChange={e => set('rollNumberPattern', e.target.value)} />
                      {fieldErrors.rollNumberPattern
                        ? <p className="form-error">{fieldErrors.rollNumberPattern}</p>
                        : <p className="cr-hint">Use a regular expression. Anchors like <code>^</code> and <code>$</code> are recommended.</p>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Example Roll Number *</label>
                      <input id="cr-example-roll" className={`form-input cr-mono-input ${fieldErrors.exampleFormat ? 'cr-field-error' : ''}`}
                        placeholder="e.g. 21A91A0101"
                        value={form.exampleFormat} onChange={e => set('exampleFormat', e.target.value)} />
                      {fieldErrors.exampleFormat && <p className="form-error">{fieldErrors.exampleFormat}</p>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Pattern Description <span className="cr-optional">(optional)</span></label>
                      <input id="cr-pattern-desc" className="form-input" placeholder="e.g. YY + Branch Code + Batch + Serial"
                        value={form.patternDescription} onChange={e => set('patternDescription', e.target.value)} />
                    </div>
                    <div className="form-group cr-span-full">
                      <label className="form-label">Your Contact Email *</label>
                      <input id="cr-email" type="email" className={`form-input ${fieldErrors.registrantEmail ? 'cr-field-error' : ''}`}
                        placeholder="principal@yourcollege.edu.in"
                        value={form.registrantEmail} onChange={e => set('registrantEmail', e.target.value)} />
                      {fieldErrors.registrantEmail && <p className="form-error">{fieldErrors.registrantEmail}</p>}
                    </div>
                    {form.rollNumberPattern && (
                      <div className="cr-span-full">
                        <RegexTester pattern={form.rollNumberPattern} example={form.exampleFormat} />
                      </div>
                    )}
                  </div>
                  <div className="cr-form-actions">
                    <Link to="/" className="btn btn-ghost">← Back to Home</Link>
                    <button id="cr-next-btn" className="btn btn-primary" onClick={() => { if (validateStep1()) setStep(2); }}>
                      Continue to Payment →
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div className="cr-form fade-in">
                  <h3 className="cr-form-title">Review & Complete Payment</h3>
                  <p className="cr-form-sub">Review your college details and complete the ₹50,000 annual platform fee.</p>
                  <div className="cr-summary">
                    <div className="cr-summary-row"><span className="cr-summary-key">🏫 College Name</span><span className="cr-summary-val">{form.collegeName}</span></div>
                    <div className="cr-summary-row"><span className="cr-summary-key">🔢 Roll Number Pattern</span><code className="cr-summary-val cr-mono">{form.rollNumberPattern}</code></div>
                    <div className="cr-summary-row"><span className="cr-summary-key">📄 Example Roll</span><code className="cr-summary-val cr-mono">{form.exampleFormat}</code></div>
                    {form.patternDescription && <div className="cr-summary-row"><span className="cr-summary-key">📝 Description</span><span className="cr-summary-val">{form.patternDescription}</span></div>}
                    <div className="cr-summary-row"><span className="cr-summary-key">📧 Contact Email</span><span className="cr-summary-val">{form.registrantEmail}</span></div>
                  </div>
                  <div className="cr-fee-box">
                    <div className="cr-fee-row"><span>Annual Platform Fee</span><span>₹50,000</span></div>
                    <div className="cr-fee-row cr-fee-row--gst"><span>GST (18%)</span><span>₹9,000</span></div>
                    <div className="cr-fee-divider" />
                    <div className="cr-fee-row cr-fee-total"><span>Total</span><span className="text-gradient">₹59,000</span></div>
                    <p className="cr-fee-note">
                      ✦ Your college will be active for 12 months from the date of payment.<br />
                      ✦ Powered by Razorpay — supports UPI, cards, net banking & more.
                    </p>
                  </div>
                  <div className="cr-rzp-badge"><span>🔒 Secured by</span><strong>Razorpay</strong></div>
                  <div className="cr-form-actions">
                    <button className="btn btn-ghost" onClick={() => setStep(1)} disabled={loading}>← Edit Details</button>
                    <button id="cr-pay-btn" className={`btn btn-primary cr-pay-btn ${loading ? 'cr-pay-loading' : ''}`}
                      onClick={handlePayment} disabled={loading}>
                      {loading ? <><span className="spinner spinner-sm" />  Processing…</> : <>💳 Pay ₹59,000 & Register</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Status Tab */}
        {activeTab === 'status' && (
          <div className="cr-card">
            <FeeStatusChecker />
          </div>
        )}

        {/* Info Strip */}
        <div className="cr-info-strip">
          <div className="cr-info-item">
            <span className="cr-info-icon">✅</span>
            <div><strong>Instant Activation</strong><p>Your college goes live as soon as payment is confirmed</p></div>
          </div>
          <div className="cr-info-item">
            <span className="cr-info-icon">🔒</span>
            <div><strong>Secure Payments</strong><p>Bank-grade encryption via Razorpay PCI-DSS compliance</p></div>
          </div>
          <div className="cr-info-item">
            <span className="cr-info-icon">📞</span>
            <div><strong>Dedicated Support</strong><p>Our team helps you onboard students and alumni</p></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollegeRegister;
