import { useState, useEffect, useRef } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profileService';
import { collegeService } from '../../services/collegeService';
import '../../styles/Alumni/AlumniProfile.css';

const INDUSTRIES = ['Technology','Finance','Healthcare','Education','Consulting','E-commerce','Media','Manufacturing','Other'];

const AlumniProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Colleges for dropdown
  const [colleges, setColleges] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [rollValidation, setRollValidation] = useState(null); // null | true | false

  const [form, setForm] = useState({
    name: '',
    department: '',
    graduationYear: '',
    company: '',
    designation: '',
    industry: '',
    location: '',
    bio: '',
    skills: '',
    mentorshipAvailability: 'Available',
    college: '',
    collegeRollNumber: '',
  });

  // ── Load profile + colleges ──────────────────────────────────────────────────
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
          graduationYear: data.graduationYear || '',
          company: data.company || '',
          designation: data.designation || '',
          industry: data.industry || '',
          location: data.location || '',
          bio: data.bio || '',
          skills: (data.skills || []).join(', '),
          mentorshipAvailability: data.mentorshipAvailability || 'Available',
          college: currentCollege,
          collegeRollNumber: data.collegeRollNumber || '',
        });

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // ── Profile picture upload ────────────────────────────────────────────────────
  const handlePictureChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB.');
      return;
    }
    try {
      setUploading(true);
      setError('');
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const result = await profileService.uploadPicture({ imageData: reader.result });
          setProfile(prev => ({ ...prev, profilePicture: result.profilePicture }));
          setSuccess('Profile picture updated!');
          setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
          setError(err.message || 'Failed to upload picture.');
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(err.message || 'Failed to read image.');
      setUploading(false);
    }
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

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

    // Block submit if college selected but roll number doesn't match
    if (selectedCollege && rollValidation === false) {
      setError(`Roll number doesn't match the ${selectedCollege.name} format. Expected: ${selectedCollege.exampleFormat}`);
      return;
    }

    try {
      setSaving(true);
      const updates = {
        ...form,
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        college: form.college || null,
      };
      const updated = await profileService.update(updates);
      setProfile(updated);

      if (updated.college) {
        const found = colleges.find(c => c._id === (updated.college?._id || updated.college));
        setSelectedCollege(found || null);
      } else {
        setSelectedCollege(null);
      }

      setSuccess('Profile updated! Students from your college will now be able to find you.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

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
          <p>Manage your alumni profile information.</p>
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
          <div className="card" style={{ maxWidth: 700 }}>

            {/* Avatar + name banner */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
              {/* ── Clickable profile picture ───────────────────────────── */}
              <div
                className="avatar-upload-wrapper"
                onClick={() => !uploading && fileInputRef.current?.click()}
                title="Click to change profile picture"
                style={{ cursor: uploading ? 'wait' : 'pointer' }}
              >
                {profile?.profilePicture ? (
                  <img
                    src={profile.profilePicture}
                    alt={profile?.name}
                    className="avatar-upload-img"
                  />
                ) : (
                  <div className="avatar-placeholder" style={{ width: 80, height: 80, fontSize: '2rem' }}>
                    {profile?.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="avatar-edit-overlay">
                  {uploading ? (
                    <span className="spinner" style={{ width: 22, height: 22, borderWidth: 3 }} />
                  ) : (
                    <span style={{ fontSize: '1.4rem' }}>📷</span>
                  )}
                </div>
              </div>
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ display: 'none' }}
                onChange={handlePictureChange}
              />
              <div>
                <h2 style={{ margin: '0 0 4px' }}>{profile?.name}</h2>
                <p className="text-muted" style={{ margin: 0 }}>{profile?.email}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  <span className="badge badge-primary">Alumni</span>
                  {profile?.verificationStatus && (
                    <span className={`badge ${profile.verificationStatus === 'Verified' ? 'badge-success' : profile.verificationStatus === 'Rejected' ? 'badge-danger' : 'badge-ghost'}`}>
                      {profile.verificationStatus}
                    </span>
                  )}
                  {profile?.college?.name && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--clr-primary-glow)', color: 'var(--clr-primary)', padding: '3px 10px', borderRadius: 'var(--r-full)', fontSize: '0.78rem', fontWeight: 700 }}>
                      🏛️ {profile.college.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Name + Mentorship availability */}
              <div className="grid-2" style={{ gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" name="name" className="form-input" value={form.name} onChange={handleChange} required />
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label htmlFor="mentorshipAvailability" className="form-label" style={{ margin: 0 }}>Mentorship Availability</label>
                  <select name="mentorshipAvailability" id="mentorshipAvailability" className="form-input" value={form.mentorshipAvailability} onChange={handleChange}>
                    <option value="Available">Available (Green)</option>
                    <option value="Limited">Limited (Yellow)</option>
                    <option value="Fully Booked">Fully Booked (Red)</option>
                  </select>
                </div>
              </div>

              {/* ── College & Roll Number section ──────────────────────────── */}
              <div style={{ background: 'var(--clr-bg-elevated)', borderRadius: 'var(--r-md)', padding: '16px', border: '1px solid var(--clr-border)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--clr-text-muted)', marginBottom: 12 }}>
                  🏛️ College & Roll Number
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--clr-text-muted)', marginBottom: 14 }}>
                  Setting your college links you to your institution's students. They will be able to find you in their alumni list.
                </div>

                {/* College dropdown */}
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">College</label>
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

                {/* Roll number */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">
                    College Roll Number
                    {selectedCollege && (
                      <span style={{ marginLeft: 8, fontWeight: 400, color: 'var(--clr-text-muted)', fontSize: '0.8rem' }}>
                        Expected: <code style={{ background: 'var(--clr-bg-card)', padding: '1px 6px', borderRadius: 4, color: 'var(--clr-primary)' }}>{selectedCollege.exampleFormat}</code>
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    name="collegeRollNumber"
                    className="form-input"
                    placeholder={selectedCollege ? selectedCollege.exampleFormat : 'e.g. S20190010042'}
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

              {/* Company & Designation */}
              <div className="grid-2" style={{ gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Company</label>
                  <input type="text" name="company" className="form-input" value={form.company} onChange={handleChange} placeholder="e.g. Google" />
                </div>
                <div className="form-group">
                  <label className="form-label">Designation</label>
                  <input type="text" name="designation" className="form-input" value={form.designation} onChange={handleChange} placeholder="e.g. Software Engineer" />
                </div>
              </div>

              {/* Industry & Location */}
              <div className="grid-2" style={{ gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Industry</label>
                  <select name="industry" className="form-input" value={form.industry} onChange={handleChange}>
                    <option value="">Select industry</option>
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input type="text" name="location" className="form-input" value={form.location} onChange={handleChange} placeholder="e.g. Bengaluru, India" />
                </div>
              </div>

              {/* Department & Graduation Year */}
              <div className="grid-2" style={{ gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Department / Major</label>
                  <input type="text" name="department" className="form-input" value={form.department} onChange={handleChange} placeholder="e.g. Computer Science" />
                </div>
                <div className="form-group">
                  <label className="form-label">Graduation Year</label>
                  <input type="number" name="graduationYear" className="form-input" value={form.graduationYear} onChange={handleChange} placeholder="e.g. 2022" />
                </div>
              </div>

              {/* Bio */}
              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea name="bio" className="form-input" rows={4} value={form.bio} onChange={handleChange} placeholder="Tell students a bit about your journey..." />
              </div>

              {/* Skills */}
              <div className="form-group">
                <label className="form-label">Skills <span style={{ fontWeight: 400, color: 'var(--clr-text-muted)' }}>(comma-separated)</span></label>
                <input type="text" name="skills" className="form-input" value={form.skills} onChange={handleChange} placeholder="e.g. Management, Java, UI/UX" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' }}>
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  style={{ color: 'var(--clr-danger)' }}
                  onClick={async () => {
                    if (window.confirm("WARNING: This will permanently delete your account, jobs, events, and all data. This cannot be undone. Are you sure?")) {
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

export default AlumniProfile;
