import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { collegeService } from '../../services/collegeService';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import OtpVerification from '../../components/auth/OtpVerification';
import '../../styles/Home/AlumniRegister.css';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i);
const INDUSTRIES = ['Technology','Finance','Healthcare','Education','Consulting','E-commerce','Media','Manufacturing','Other'];
const SKILLS_SUGGESTIONS = ['React','Node.js','Python','Java','MongoDB','SQL','AWS','Git','TypeScript','Machine Learning'];

const AlumniRegister = () => {
  const [form, setForm] = useState({
    name: '', email: '', password: '', collegeRollNumber: '',
    college: '', // college _id
    department: '', graduationYear: '', company: '',
    designation: '', industry: '', linkedin: '', bio: '',
    skills: [], idProof: '',
  });
  const [skillInput, setSkillInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  // OTP flow state
  const [otpSent, setOtpSent] = useState(false);

  // College state
  const [colleges, setColleges] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [rollValidation, setRollValidation] = useState(null); // null | true | false

  // Fetch colleges on mount
  useEffect(() => {
    collegeService.getAll().then(data => setColleges(data)).catch(() => {});
  }, []);

  // Live-validate roll number whenever roll no. or selected college changes
  useEffect(() => {
    if (!selectedCollege || !form.collegeRollNumber.trim()) {
      setRollValidation(null);
      return;
    }
    try {
      const regex = new RegExp(selectedCollege.rollNumberPattern);
      setRollValidation(regex.test(form.collegeRollNumber.trim()));
    } catch {
      setRollValidation(null);
    }
  }, [form.collegeRollNumber, selectedCollege]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const addSkill = (s) => { if (s && !form.skills.includes(s)) set('skills', [...form.skills, s]); setSkillInput(''); };
  const removeSkill = (s) => set('skills', form.skills.filter(x => x !== s));

  const handleCollegeChange = (e) => {
    const id = e.target.value;
    set('college', id);
    setSelectedCollege(colleges.find(c => c._id === id) || null);
    setRollValidation(null);
  };

  // Convert uploaded ID proof to base64
  const handleIdProof = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => set('idProof', ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    if (selectedCollege && rollValidation === false) {
      setError(`Invalid roll number format. Expected format for ${selectedCollege.name}: ${selectedCollege.exampleFormat}`);
      setLoading(false);
      return;
    }
    try {
      await authService.sendOtp({
        ...form,
        role: 'alumni',
        graduationYear: Number(form.graduationYear),
        college: form.college || undefined,
      });
      setOtpSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Roll number input border — one of the rare justified inline styles (dynamic value)
  const rollBorderClass =
    rollValidation === true  ? 'roll-input--valid' :
    rollValidation === false ? 'roll-input--invalid' :
    '';

  // ── OTP Screen ────────────────────────────────────────────────────────────
  if (otpSent) {
    return (
      <>
        <PublicNavbar />
        <OtpVerification
          email={form.email}
          role="alumni"
          onBack={() => setOtpSent(false)}
        />
      </>
    );
  }

  // ── Registration Form ─────────────────────────────────────────────────────
  return (
    <div>
      <PublicNavbar />
      <div className="auth-page auth-page--register">
        <div className="card auth-card auth-card--register">
          <div className="auth-card-header">
            <div className="auth-card-icon">💼</div>
            <h2 className="auth-card-title">Alumni Registration</h2>
            <p className="auth-card-sub">Your profile will be reviewed and verified by admin</p>
          </div>

          {error && <div className="auth-error-banner">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">

            {/* Name */}
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" placeholder="Jane Smith" required value={form.name} onChange={e => set('name', e.target.value)} />
            </div>

            {/* College Selector */}
            <div className="form-group">
              <label className="form-label">
                College{' '}
                {colleges.length > 0 && <span className="roll-label-hint">(select to validate roll number)</span>}
              </label>
              {colleges.length === 0 ? (
                <input className="form-input" placeholder="No colleges configured yet — ask admin" disabled style={{ opacity: 0.6 }} />
              ) : (
                <select className="form-input" value={form.college} onChange={handleCollegeChange}>
                  <option value="">— Select your college (optional) —</option>
                  {colleges.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* College Roll Number */}
            <div className="form-group">
              <label className="form-label">
                College Roll No.
                {selectedCollege && (
                  <span className="roll-label-hint">
                    Expected: <code className="roll-code-hint">{selectedCollege.exampleFormat}</code>
                  </span>
                )}
              </label>
              <input
                className={`form-input ${rollBorderClass}`}
                placeholder={selectedCollege ? selectedCollege.exampleFormat : '17CS042'}
                required
                value={form.collegeRollNumber}
                onChange={e => set('collegeRollNumber', e.target.value)}
              />
              {rollValidation === true && (
                <div className="roll-feedback roll-feedback--valid">✅ Roll number format is valid</div>
              )}
              {rollValidation === false && (
                <div className="roll-feedback roll-feedback--invalid">
                  ❌ Format doesn't match {selectedCollege?.name} pattern.
                  {selectedCollege?.patternDescription && <span> {selectedCollege.patternDescription}</span>}
                </div>
              )}
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="jane@company.com" required value={form.email} onChange={e => set('email', e.target.value)} />
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="password-field">
                <input className="form-input" type={showPassword ? 'text' : 'password'} placeholder="Min 6 characters" required minLength={6} value={form.password} onChange={e => set('password', e.target.value)} />
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

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Department</label>
                <input className="form-input" placeholder="Computer Science" value={form.department} onChange={e => set('department', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Graduation Year</label>
                <select className="form-input" value={form.graduationYear} onChange={e => set('graduationYear', e.target.value)}>
                  <option value="">Select year</option>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Current Company</label>
                <input className="form-input" placeholder="Google, Microsoft…" value={form.company} onChange={e => set('company', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Designation</label>
                <input className="form-input" placeholder="Software Engineer" value={form.designation} onChange={e => set('designation', e.target.value)} />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Industry</label>
                <select className="form-input" value={form.industry} onChange={e => set('industry', e.target.value)}>
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">LinkedIn URL</label>
                <input className="form-input" placeholder="linkedin.com/in/…" value={form.linkedin} onChange={e => set('linkedin', e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Skills</label>
              <div className="skill-tags-row">
                {form.skills.map(s => (
                  <span key={s} className="tag skill-tag-removable" onClick={() => removeSkill(s)}>{s} ✕</span>
                ))}
              </div>
              <div className="skill-input-row">
                <input className="form-input" placeholder="Add a skill…" value={skillInput} onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill(skillInput))} />
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => addSkill(skillInput)}>Add</button>
              </div>
              <div className="skill-suggestions-row">
                {SKILLS_SUGGESTIONS.filter(s => !form.skills.includes(s)).map(s => (
                  <span key={s} onClick={() => addSkill(s)} className="skill-suggestion-chip">
                    + {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea className="form-input" placeholder="Share your journey with students…" rows={3} value={form.bio} onChange={e => set('bio', e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">ID Proof <span className="text-faint">(for verification — college ID or degree)</span></label>
              <input type="file" accept="image/*,.pdf" onChange={handleIdProof} className="file-input" />
              {form.idProof && <span className="text-sm file-uploaded-text">✓ File uploaded</span>}
            </div>

            {/* Email OTP notice */}
            <div className="otp-notice">
              <span className="otp-notice-icon">📧</span>
              <span>A <strong className="otp-notice-strong">6-digit verification code</strong> will be sent to your email address after you click "Continue".</span>
            </div>

            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
              {loading ? 'Sending OTP…' : 'Continue →'}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/login" className="auth-footer-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AlumniRegister;
