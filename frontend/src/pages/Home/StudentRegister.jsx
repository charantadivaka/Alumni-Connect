import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { collegeService } from '../../services/collegeService';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import OtpVerification from '../../components/auth/OtpVerification';
import '../../styles/Home/StudentRegister.css';

const SKILLS_SUGGESTIONS = ['React','Node.js','Python','Java','MongoDB','SQL','AWS','Git','TypeScript','Machine Learning'];
const YEARS = [1, 2, 3, 4];

const StudentRegister = () => {
  const [form, setForm] = useState({
    name: '', email: '', password: '', collegeRollNumber: '',
    college: '', // college _id
    department: '', currentYear: '', gpa: '', bio: '',
    skills: [], careerInterests: '',
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

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    if (selectedCollege && rollValidation === false) {
      setError(`Invalid roll number format. Expected format for ${selectedCollege.name}: ${selectedCollege.exampleFormat}`);
      setLoading(false);
      return;
    }
    try {
      await authService.sendOtp({
        ...form, role: 'student',
        careerInterests: form.careerInterests.split(',').map(s => s.trim()).filter(Boolean),
        currentYear: Number(form.currentYear),
        gpa: form.gpa ? Number(form.gpa) : undefined,
        college: form.college || undefined,
      });
      setOtpSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
          role="student"
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
            <div className="auth-card-icon">👨‍🎓</div>
            <h2 className="auth-card-title">Student Registration</h2>
            <p className="auth-card-sub">Create your profile and start connecting</p>
          </div>

          {error && <div className="auth-error-banner">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">

            {/* Name */}
            <div className="form-group">
              <label htmlFor="name" className="form-label">Full Name</label>
              <input id="name" className="form-input" placeholder="John Doe" required aria-required="true" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>

            {/* College Selector */}
            <div className="form-group">
              <label htmlFor="college" className="form-label">
                College{' '}
                {colleges.length > 0 && <span className="roll-label-hint">(select to validate roll number)</span>}
              </label>
              {colleges.length === 0 ? (
                <input id="college" className="form-input" placeholder="No colleges configured yet — ask admin" disabled style={{ opacity: 0.6 }} />
              ) : (
                <select id="college" className="form-input" value={form.college} onChange={handleCollegeChange}>
                  <option value="">— Select your college (optional) —</option>
                  {colleges.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* College Roll Number */}
            <div className="form-group">
              <label htmlFor="collegeRollNumber" className="form-label">
                College Roll No.
                {selectedCollege && (
                  <span className="roll-label-hint">
                    Expected: <code className="roll-code-hint">{selectedCollege.exampleFormat}</code>
                  </span>
                )}
              </label>
              <input
                id="collegeRollNumber"
                className={`form-input ${rollBorderClass}`}
                placeholder={selectedCollege ? selectedCollege.exampleFormat : '21CS001'}
                required
                aria-required="true"
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
              <label htmlFor="email" className="form-label">Email</label>
              <input id="email" className="form-input" type="email" placeholder="you@college.edu" required aria-required="true" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <div className="password-field">
                <input id="password" className="form-input" type={showPassword ? 'text' : 'password'} placeholder="Min 6 characters" required aria-required="true" minLength={6} value={form.password} onChange={e => set('password', e.target.value)} />
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
                <label className="form-label">Current Year</label>
                <select className="form-input" value={form.currentYear} onChange={e => set('currentYear', e.target.value)}>
                  <option value="">Select year</option>
                  {YEARS.map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Skills</label>
              <div className="skill-tags-row">
                {form.skills.map(s => (
                  <span key={s} className="tag skill-tag-removable" onClick={() => removeSkill(s)}>
                    {s} ✕
                  </span>
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
              <label className="form-label">Career Interests <span className="text-faint">(comma-separated)</span></label>
              <input className="form-input" placeholder="Software Engineering, AI, Product Management" value={form.careerInterests} onChange={e => set('careerInterests', e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea className="form-input" placeholder="Tell alumni a bit about yourself…" rows={3} value={form.bio} onChange={e => set('bio', e.target.value)} />
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

export default StudentRegister;
