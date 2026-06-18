import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { collegeService } from '../../services/collegeService';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import OtpVerification from '../../components/auth/OtpVerification';

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
      // Step 1: send OTP to email
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

  // Roll number input border color
  const rollBorder =
    rollValidation === true  ? '1.5px solid var(--clr-success)' :
    rollValidation === false ? '1.5px solid var(--clr-danger)' :
    undefined;

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
      <div style={{ minHeight: '100vh', padding: '90px var(--sp-lg) var(--sp-2xl)', display: 'flex', justifyContent: 'center' }}>
        <div className="card" style={{ width: '100%', maxWidth: 560 }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--sp-xl)' }}>
            <div style={{ fontSize: '2rem' }}>💼</div>
            <h2 style={{ marginTop: 'var(--sp-sm)' }}>Alumni Registration</h2>
            <p style={{ fontSize: '0.875rem' }}>Your profile will be reviewed and verified by admin</p>
          </div>

          {error && <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 'var(--r-md)', padding: '10px 14px', color: 'var(--clr-danger)', marginBottom: 'var(--sp-md)', fontSize: '0.875rem' }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>

            {/* Name */}
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" placeholder="Jane Smith" required value={form.name} onChange={e => set('name', e.target.value)} />
            </div>

            {/* College Selector */}
            <div className="form-group">
              <label className="form-label">College {colleges.length > 0 && <span style={{ color: 'var(--clr-text-muted)', fontWeight: 400 }}>(select to validate roll number)</span>}</label>
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
                  <span style={{ marginLeft: 8, fontWeight: 400, color: 'var(--clr-text-muted)', fontSize: '0.82rem' }}>
                    Expected: <code style={{ background: 'var(--clr-bg-elevated)', padding: '1px 6px', borderRadius: 4, color: 'var(--clr-primary)' }}>{selectedCollege.exampleFormat}</code>
                  </span>
                )}
              </label>
              <input
                className="form-input"
                placeholder={selectedCollege ? selectedCollege.exampleFormat : '17CS042'}
                required
                value={form.collegeRollNumber}
                onChange={e => set('collegeRollNumber', e.target.value)}
                style={{ border: rollBorder, transition: 'border-color 0.2s' }}
              />
              {rollValidation === true && (
                <div style={{ fontSize: '0.8rem', color: 'var(--clr-success)', marginTop: 4, fontWeight: 600 }}>✅ Roll number format is valid</div>
              )}
              {rollValidation === false && (
                <div style={{ fontSize: '0.8rem', color: 'var(--clr-danger)', marginTop: 4, fontWeight: 600 }}>
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
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input className="form-input" type={showPassword ? "text" : "password"} placeholder="Min 6 characters" required minLength={6} value={form.password} onChange={e => set('password', e.target.value)} style={{ paddingRight: '40px', width: '100%' }} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-text-muted)' }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="grid-2" style={{ gap: 'var(--sp-md)' }}>
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

            <div className="grid-2" style={{ gap: 'var(--sp-md)' }}>
              <div className="form-group">
                <label className="form-label">Current Company</label>
                <input className="form-input" placeholder="Google, Microsoft…" value={form.company} onChange={e => set('company', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Designation</label>
                <input className="form-input" placeholder="Software Engineer" value={form.designation} onChange={e => set('designation', e.target.value)} />
              </div>
            </div>

            <div className="grid-2" style={{ gap: 'var(--sp-md)' }}>
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
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                {form.skills.map(s => (
                  <span key={s} className="tag" style={{ cursor: 'pointer' }} onClick={() => removeSkill(s)}>{s} ✕</span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input className="form-input" placeholder="Add a skill…" value={skillInput} onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill(skillInput))} />
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => addSkill(skillInput)}>Add</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                {SKILLS_SUGGESTIONS.filter(s => !form.skills.includes(s)).map(s => (
                  <span key={s} onClick={() => addSkill(s)} style={{ cursor: 'pointer', fontSize: '0.75rem', padding: '2px 8px', background: 'var(--clr-bg-elevated)', borderRadius: 'var(--r-full)', color: 'var(--clr-text-muted)', border: '1px solid var(--clr-border)' }}>
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
              <input type="file" accept="image/*,.pdf" onChange={handleIdProof}
                style={{ background: 'var(--clr-bg-elevated)', padding: 10, borderRadius: 'var(--r-md)', border: '1px solid var(--clr-border)', color: 'var(--clr-text-muted)', width: '100%' }} />
              {form.idProof && <span className="text-sm" style={{ color: 'var(--clr-success)' }}>✓ File uploaded</span>}
            </div>

            {/* Email OTP notice */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: 'var(--r-md)', padding: '10px 14px', fontSize: '0.83rem',
              color: 'var(--clr-text-muted)',
            }}>
              <span style={{ fontSize: '1rem', marginTop: 1 }}>📧</span>
              <span>A <strong style={{ color: 'var(--clr-text)' }}>6-digit verification code</strong> will be sent to your email address after you click "Continue".</span>
            </div>

            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
              {loading ? 'Sending OTP…' : 'Continue →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 'var(--sp-lg)', fontSize: '0.875rem', color: 'var(--clr-text-muted)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--clr-primary)', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AlumniRegister;
