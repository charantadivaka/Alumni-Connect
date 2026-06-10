import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { startupService } from '../../services/otherServices';

const STAGES = ['Idea', 'MVP', 'Growth', 'Scale'];

const MyStartup = () => {
  const [startup, setStartup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', tagline: '', description: '', website: '',
    industry: '', stage: 'Idea', skillsNeeded: ''
  });

  useEffect(() => {
    const fetchStartup = async () => {
      try {
        const data = await startupService.getMy();
        if (data) {
          setStartup(data);
          setForm({
            name: data.name || '',
            tagline: data.tagline || '',
            description: data.description || '',
            website: data.website || '',
            industry: data.industry || '',
            stage: data.stage || 'Idea',
            skillsNeeded: (data.skillsNeeded || []).join(', '),
          });
        }
      } catch (err) {
        setError(err.message || 'Failed to load startup.');
      } finally {
        setLoading(false);
      }
    };
    fetchStartup();
  }, []);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.description) { alert('Name and Description are required.'); return; }
    try {
      setSaving(true);
      const payload = { ...form, skillsNeeded: form.skillsNeeded.split(',').map(s => s.trim()).filter(Boolean) };
      const saved = await startupService.createOrUpdate(payload);
      setStartup(saved);
      setIsEditing(false);
    } catch (err) {
      alert(err.message || 'Failed to save startup.');
    } finally {
      setSaving(false);
    }
  };

  const handleRespondCollab = async (reqId, status) => {
    if (!startup) return;
    try {
      await startupService.respondCollaboration(startup._id, reqId, { status });
      setStartup(prev => ({
        ...prev,
        collaborationRequests: prev.collaborationRequests.map(r => r._id === reqId ? { ...r, status } : r),
      }));
    } catch (err) {
      alert(err.message || 'Failed to respond.');
    }
  };

  const STAGE_BADGE = { Idea: 'badge-ghost', MVP: 'badge-primary', Growth: 'badge-success', Scale: 'badge-success' };
  const pendingCollabs = startup?.collaborationRequests?.filter(r => r.status === 'Pending') || [];
  const resolvedCollabs = startup?.collaborationRequests?.filter(r => r.status !== 'Pending') || [];

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 15 }}>
          <div>
            <h1>My Startup</h1>
            <p>Showcase your startup and find collaborators from the student community.</p>
          </div>
          {startup && !isEditing && (
            <button className="btn btn-primary" onClick={() => setIsEditing(true)}>Edit Startup</button>
          )}
        </div>

        {error && <div className="card" style={{ color: 'var(--clr-danger)', marginBottom: 20 }}>{error}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /> Loading...</div>
        ) : (!startup || isEditing) ? (
          /* Create / Edit Form */
          <div className="card" style={{ maxWidth: 700 }}>
            <h3 style={{ marginBottom: 20 }}>{startup ? 'Edit Startup Details' : 'Register Your Startup'}</h3>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <div className="grid-2" style={{ gap: 15 }}>
                <div className="form-group">
                  <label className="form-label">Startup Name *</label>
                  <input type="text" name="name" className="form-input" required value={form.name} onChange={handleChange} placeholder="e.g. EduMentor" />
                </div>
                <div className="form-group">
                  <label className="form-label">Stage</label>
                  <select name="stage" className="form-input" value={form.stage} onChange={handleChange}>
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Tagline</label>
                <input type="text" name="tagline" className="form-input" value={form.tagline} onChange={handleChange} placeholder="One-line pitch for your startup" />
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea name="description" className="form-input" rows={4} required value={form.description} onChange={handleChange} placeholder="What problem are you solving? Who is your target audience?" />
              </div>
              <div className="grid-2" style={{ gap: 15 }}>
                <div className="form-group">
                  <label className="form-label">Industry</label>
                  <input type="text" name="industry" className="form-input" value={form.industry} onChange={handleChange} placeholder="e.g. EdTech, FinTech, HealthTech" />
                </div>
                <div className="form-group">
                  <label className="form-label">Website</label>
                  <input type="url" name="website" className="form-input" value={form.website} onChange={handleChange} placeholder="https://..." />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Skills Needed (comma-separated)</label>
                <input type="text" name="skillsNeeded" className="form-input" value={form.skillsNeeded} onChange={handleChange} placeholder="e.g. React, Node.js, UI/UX Design" />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                {isEditing && <button type="button" className="btn btn-ghost" onClick={() => setIsEditing(false)}>Cancel</button>}
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : (startup ? 'Update Startup' : 'Register Startup')}</button>
              </div>
            </form>
          </div>
        ) : (
          /* Startup Profile View */
          <>
            <div className="card" style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h2 style={{ margin: '0 0 4px' }}>{startup.name}</h2>
                  {startup.tagline && <p style={{ margin: '0 0 8px', color: 'var(--clr-primary)', fontStyle: 'italic' }}>{startup.tagline}</p>}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className={`badge ${STAGE_BADGE[startup.stage] || 'badge-ghost'}`}>{startup.stage}</span>
                    {startup.industry && <span className="badge badge-ghost">{startup.industry}</span>}
                  </div>
                </div>
                {startup.website && (
                  <a href={startup.website} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">🔗 Website</a>
                )}
              </div>
              <p style={{ lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 16 }}>{startup.description}</p>
              {startup.skillsNeeded && startup.skillsNeeded.length > 0 && (
                <div>
                  <p style={{ fontWeight: 600, marginBottom: 8, fontSize: '0.875rem' }}>Skills Needed:</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {startup.skillsNeeded.map(s => <span key={s} className="badge badge-ghost">{s}</span>)}
                  </div>
                </div>
              )}
            </div>

            {/* Collaboration Requests */}
            <h2 style={{ fontSize: '1.1rem', marginBottom: 16 }}>Collaboration Requests ({startup.collaborationRequests?.length || 0})</h2>

            {pendingCollabs.length === 0 && resolvedCollabs.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 32 }}>
                <p className="text-muted">No collaboration requests yet. Students who are interested will reach out here.</p>
              </div>
            ) : (
              <>
                {pendingCollabs.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: 12, color: 'var(--clr-primary)' }}>Pending ({pendingCollabs.length})</h3>
                    <div style={{ display: 'grid', gap: 'var(--sp-md)' }}>
                      {pendingCollabs.map(req => (
                        <div key={req._id} className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <p style={{ margin: '0 0 4px', fontWeight: 600 }}>{req.student?.name || 'Student'}</p>
                            {req.message && <p className="text-sm text-muted" style={{ margin: 0 }}>"{req.message}"</p>}
                          </div>
                          <div style={{ display: 'flex', gap: 10 }}>
                            <button className="btn btn-primary btn-sm" onClick={() => handleRespondCollab(req._id, 'Accepted')}>Accept</button>
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--clr-danger)' }} onClick={() => handleRespondCollab(req._id, 'Rejected')}>Reject</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {resolvedCollabs.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '1rem', marginBottom: 12 }}>Resolved ({resolvedCollabs.length})</h3>
                    <div style={{ display: 'grid', gap: 'var(--sp-md)' }}>
                      {resolvedCollabs.map(req => (
                        <div key={req._id} className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <p style={{ margin: '0 0 4px', fontWeight: 600 }}>{req.student?.name || 'Student'}</p>
                            {req.message && <p className="text-sm text-muted" style={{ margin: 0 }}>"{req.message}"</p>}
                          </div>
                          <span className={`badge ${req.status === 'Accepted' ? 'badge-success' : 'badge-danger'}`}>{req.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default MyStartup;
