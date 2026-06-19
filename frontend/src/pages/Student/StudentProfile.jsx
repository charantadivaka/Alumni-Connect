import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profileService';
import { collegeService } from '../../services/collegeService';
import '../../styles/Student/StudentProfile.css';

const StudentProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Colleges list for dropdown
  const [colleges, setColleges] = useState([]);

  // Form state
  const [form, setForm] = useState({
    name: '',
    department: '',
    bio: '',
    skills: '',
    college: '',       // college ObjectId
    collegeRollNumber: '',
  });

  // Selected college object (for showing pattern hint)
  const [selectedCollege, setSelectedCollege] = useState(null);
  // Live roll number validation result
  const [rollValidation, setRollValidation] = useState(null); // null | true | false

  // ── Load profile + colleges on mount ────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const [data, cols] = await Promise.all([
          profileService.getMyProfile(),
          collegeService.getAll(),
        ]);
        setProfile(data);
        setColleges(cols);

        const currentCollege = data.college?._id || data.college || '';
        setForm({
          name: data.name || '',
          department: data.department || '',
          bio: data.bio || '',
          skills: (data.skills || []).join(', '),
          college: currentCollege,
          collegeRollNumber: data.collegeRollNumber || '',
        });

        // Set the selected college object so hint shows immediately
        if (currentCollege) {
          const found = cols.find(c => c._id === currentCollege);
          setSelectedCollege(found || null);
        }
      } catch (err) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // ── Live roll number validation ──────────────────────────────────────────────
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

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleCollegeChange = (e) => {
    const id = e.target.value;
    setForm(prev => ({ ...prev, college: id }));
    setSelectedCollege(colleges.find(c => c._id === id) || null);
    setRollValidation(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side guard: block if college is selected but roll number doesn't match
    if (selectedCollege && rollValidation === false) {
      setError(`Roll number doesn't match the ${selectedCollege.name} format. Expected: ${selectedCollege.exampleFormat}`);
      return;
    }

    try {
      setSaving(true);
      const updates = {
        ...form,
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        // Send college as ObjectId string, or null to clear it
        college: form.college || null,
      };
      const updated = await profileService.update(updates);
      setProfile(updated);
      // Refresh selected college object from updated profile
      if (updated.college) {
        const found = colleges.find(c => c._id === (updated.college?._id || updated.college));
        setSelectedCollege(found || null);
      } else {
        setSelectedCollege(null);
      }
      setSuccess('Profile updated successfully! Your college alumni will now appear in Find Alumni.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Roll number border feedback color
  const rollBorder =
    rollValidation === true  ? '1.5px solid var(--clr-success)' :
    rollValidation === false ? '1.5px solid var(--clr-danger)'  :
    undefined;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">
        <div className="page-header">
          <h1>My Profile</h1>
          <p>Manage your student profile information.</p>
        </div>

        {/* Feedback banners */}
        {success && (
          <div style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 'var(--r-md)', padding: '12px 16px', color: 'var(--clr-success)', marginBottom: 'var(--sp-md)', fontWeight: 600 }}>
            ✅ {success}
          </div>
        )}
        {error && (
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 'var(--r-md)', padding: '12px 16px', color: 'var(--clr-danger)', marginBottom: 'var(--sp-md)' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /> Loading...</div>
        ) : (
          <div className="card" style={{ maxWidth: 620 }}>
            {/* Avatar + name banner */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
              <div className="avatar-placeholder" style={{ width: 80, height: 80, fontSize: '2rem' }}>
                {profile?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <h2 style={{ margin: '0 0 4px' }}>{profile?.name}</h2>
                <p className="text-muted" style={{ margin: 0 }}>{profile?.email}</p>
                <span className="badge badge-ghost" style={{ marginTop: 8, display: 'inline-block' }}>Student</span>
                {profile?.college?.name && (
                  <span style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--clr-primary-glow)', color: 'var(--clr-primary)', padding: '3px 10px', borderRadius: 'var(--r-full)', fontSize: '0.78rem', fontWeight: 700 }}>
                    🏛️ {profile.college.name}
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Full Name */}
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" name="name" className="form-input" value={form.name} onChange={handleChange} required />
              </div>

              {/* ── College Section ─────────────────────────────────────────── */}
              <div style={{ background: 'var(--clr-bg-elevated)', borderRadius: 'var(--r-md)', padding: '16px', border: '1px solid var(--clr-border)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--clr-text-muted)', marginBottom: 12 }}>
                  🏛️ College & Roll Number
                </div>

                {/* College dropdown */}
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">
                    College
                    <span style={{ marginLeft: 6, fontWeight: 400, color: 'var(--clr-text-muted)', fontSize: '0.8rem' }}>
                      — determines which alumni you see
                    </span>
                  </label>
                  {colleges.length === 0 ? (
                    <input className="form-input" value="No colleges added by admin yet" disabled style={{ opacity: 0.6 }} />
                  ) : (
                    <select className="form-input" value={form.college} onChange={handleCollegeChange}>
                      <option value="">— Select your college —</option>
                      {colleges.map(c => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* College Roll Number */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">
                    College Roll Number
                    {selectedCollege && (
                      <span style={{ marginLeft: 8, fontWeight: 400, color: 'var(--clr-text-muted)', fontSize: '0.8rem' }}>
                        Expected format: <code style={{ background: 'var(--clr-bg-card)', padding: '1px 6px', borderRadius: 4, color: 'var(--clr-primary)' }}>{selectedCollege.exampleFormat}</code>
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    name="collegeRollNumber"
                    className="form-input"
                    placeholder={selectedCollege ? selectedCollege.exampleFormat : 'e.g. S20230010237'}
                    value={form.collegeRollNumber}
                    onChange={handleChange}
                    style={{ border: rollBorder, transition: 'border-color 0.2s' }}
                  />
                  {rollValidation === true && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--clr-success)', marginTop: 4, fontWeight: 600 }}>✅ Roll number format is valid</div>
                  )}
                  {rollValidation === false && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--clr-danger)', marginTop: 4, fontWeight: 600 }}>
                      ❌ Doesn't match {selectedCollege?.name} pattern.
                      {selectedCollege?.patternDescription && <span style={{ fontWeight: 400, marginLeft: 4 }}>{selectedCollege.patternDescription}</span>}
                    </div>
                  )}
                  {!selectedCollege && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)', marginTop: 4 }}>
                      Select a college above to validate your roll number.
                    </div>
                  )}
                </div>
              </div>

              {/* Department */}
              <div className="form-group">
                <label className="form-label">Department / Major</label>
                <input type="text" name="department" className="form-input" value={form.department} onChange={handleChange} placeholder="e.g. Computer Science" />
              </div>

              {/* Bio */}
              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea name="bio" className="form-input" rows={4} value={form.bio} onChange={handleChange} placeholder="Tell alumni a bit about yourself..." />
              </div>

              {/* Skills */}
              <div className="form-group">
                <label className="form-label">Skills <span style={{ fontWeight: 400, color: 'var(--clr-text-muted)' }}>(comma-separated)</span></label>
                <input type="text" name="skills" className="form-input" value={form.skills} onChange={handleChange} placeholder="e.g. JavaScript, React, Python" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' }}>
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  style={{ color: 'var(--clr-danger)' }}
                  onClick={async () => {
                    if (window.confirm("WARNING: This will permanently delete your account, applications, and all data. This cannot be undone. Are you sure?")) {
                      try {
                        setSaving(true);
                        await profileService.deleteAccount();
                        alert("Your account has been deleted.");
                        window.location.href = '/login';
                      } catch (err) {
                        alert("Failed to delete account: " + (err.message || ""));
                        setSaving(false);
                      }
                    }
                  }}
                >
                  Delete Account
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentProfile;
