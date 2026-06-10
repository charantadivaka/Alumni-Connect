import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { adminService } from '../../services/adminService';

// ── Live Regex Tester ─────────────────────────────────────────────────────────
const RegexTester = ({ pattern, example }) => {
  const [testInput, setTestInput] = useState(example || '');
  const [result, setResult] = useState(null);

  useEffect(() => {
    setTestInput(example || '');
  }, [example]);

  useEffect(() => {
    if (!pattern || !testInput) { setResult(null); return; }
    try {
      const regex = new RegExp(pattern);
      setResult(regex.test(testInput.trim()));
    } catch {
      setResult('invalid');
    }
  }, [pattern, testInput]);

  const borderColor =
    result === true ? 'var(--clr-success)' :
    result === false ? 'var(--clr-danger)' :
    result === 'invalid' ? 'var(--clr-warning)' :
    'var(--clr-border)';

  const msg =
    result === true ? '✅ Matches the pattern' :
    result === false ? '❌ Does not match the pattern' :
    result === 'invalid' ? '⚠️ Regex syntax error' :
    '';

  return (
    <div style={{ marginTop: 6 }}>
      <label className="form-label" style={{ fontSize: '0.78rem' }}>
        Live Test — type a roll number to check
      </label>
      <input
        className="form-input"
        placeholder="e.g. S20230010237"
        value={testInput}
        onChange={e => setTestInput(e.target.value)}
        style={{ border: `1.5px solid ${borderColor}`, transition: 'border-color 0.2s' }}
      />
      {msg && (
        <div style={{
          fontSize: '0.8rem', marginTop: 4, fontWeight: 600,
          color: result === true ? 'var(--clr-success)' : result === false ? 'var(--clr-danger)' : 'var(--clr-warning)'
        }}>
          {msg}
        </div>
      )}
    </div>
  );
};

// ── Modal Form ────────────────────────────────────────────────────────────────
const CollegeForm = ({ initial, onSave, onClose, saving }) => {
  const [form, setForm] = useState({
    name: '',
    rollNumberPattern: '',
    exampleFormat: '',
    patternDescription: '',
    isActive: true,
    ...initial,
  });
  const [localErr, setLocalErr] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalErr('');
    if (!form.name.trim() || !form.rollNumberPattern.trim() || !form.exampleFormat.trim()) {
      setLocalErr('Name, pattern, and example format are all required.');
      return;
    }
    // Client-side: validate example matches pattern before sending
    try {
      const regex = new RegExp(form.rollNumberPattern.trim());
      if (!regex.test(form.exampleFormat.trim())) {
        setLocalErr('⚠️ The example format does not match your pattern. Fix either one before saving.');
        return;
      }
    } catch {
      setLocalErr('⚠️ The regex pattern has a syntax error. Please fix it.');
      return;
    }
    onSave(form);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card" style={{ width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-lg)' }}>
          <h2 style={{ margin: 0 }}>{initial ? 'Edit College' : 'Add New College'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem', color: 'var(--clr-text-muted)' }}>✕</button>
        </div>

        {localErr && (
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 'var(--r-md)', padding: '10px 14px', color: 'var(--clr-danger)', marginBottom: 'var(--sp-md)', fontSize: '0.875rem' }}>
            {localErr}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
          {/* College Name */}
          <div className="form-group">
            <label className="form-label">College Name <span style={{ color: 'var(--clr-danger)' }}>*</span></label>
            <input className="form-input" placeholder="e.g. IIIT Sri City" required value={form.name} onChange={e => set('name', e.target.value)} />
          </div>

          {/* Regex Pattern */}
          <div className="form-group">
            <label className="form-label">
              Roll Number Pattern (Regex) <span style={{ color: 'var(--clr-danger)' }}>*</span>
            </label>
            <input
              className="form-input"
              placeholder="e.g. ^S\d{4}\d{7}$"
              required
              value={form.rollNumberPattern}
              onChange={e => set('rollNumberPattern', e.target.value)}
              style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', marginTop: 4 }}>
              Use standard JavaScript regex. Example: <code style={{ background: 'var(--clr-bg-elevated)', padding: '1px 5px', borderRadius: 4 }}>{'^S\\d{4}\\d{7}$'}</code> matches <em>S20230010237</em>
            </div>
          </div>

          {/* Example Format */}
          <div className="form-group">
            <label className="form-label">Example Roll Number <span style={{ color: 'var(--clr-danger)' }}>*</span></label>
            <input className="form-input" placeholder="e.g. S20230010237" required value={form.exampleFormat} onChange={e => set('exampleFormat', e.target.value)} />
            <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', marginTop: 4 }}>
              This is shown to students as a hint during registration.
            </div>
          </div>

          {/* Live Regex Tester */}
          <div className="form-group" style={{ background: 'var(--clr-bg-elevated)', padding: '12px', borderRadius: 'var(--r-md)', border: '1px solid var(--clr-border)' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--clr-text-muted)', marginBottom: 6 }}>
              🧪 Live Pattern Tester
            </div>
            <RegexTester pattern={form.rollNumberPattern} example={form.exampleFormat} />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Pattern Description <span style={{ color: 'var(--clr-text-muted)', fontWeight: 400 }}>(optional)</span></label>
            <input className="form-input" placeholder="e.g. S + 4-digit year + 7-digit roll number" value={form.patternDescription} onChange={e => set('patternDescription', e.target.value)} />
          </div>

          {/* Active toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={e => set('isActive', e.target.checked)}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
            <label htmlFor="isActive" style={{ cursor: 'pointer', fontSize: '0.9rem' }}>
              Active (visible to students during registration)
            </label>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 'var(--sp-sm)' }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" style={{ flex: 2 }} type="submit" disabled={saving}>
              {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add College'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const ManageColleges = () => {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // college object to edit
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null); // id to confirm delete

  const flash = (msg, type = 'success') => {
    if (type === 'success') { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); }
    else { setError(msg); setTimeout(() => setError(''), 5000); }
  };

  const fetchColleges = async () => {
    setLoading(true);
    try {
      const data = await adminService.getColleges();
      setColleges(data);
    } catch (err) {
      flash(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchColleges(); }, []);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (editing) {
        const updated = await adminService.updateCollege(editing._id, form);
        setColleges(prev => prev.map(c => c._id === updated._id ? updated : c));
        flash('College updated successfully!');
      } else {
        const created = await adminService.createCollege(form);
        setColleges(prev => [...prev, created]);
        flash('College added successfully!');
      }
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      flash(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminService.deleteCollege(id);
      setColleges(prev => prev.filter(c => c._id !== id));
      setDeleteConfirm(null);
      flash('College deleted.');
    } catch (err) {
      flash(err.message, 'error');
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">

        {/* Header */}
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1>Manage Colleges</h1>
            <p>Define colleges and their roll number patterns. Students must match these patterns during registration.</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
            + Add College
          </button>
        </div>

        {/* Feedback banners */}
        {success && (
          <div style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 'var(--r-md)', padding: '10px 16px', color: 'var(--clr-success)', marginBottom: 'var(--sp-md)', fontWeight: 600 }}>
            {success}
          </div>
        )}
        {error && (
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 'var(--r-md)', padding: '10px 16px', color: 'var(--clr-danger)', marginBottom: 'var(--sp-md)' }}>
            {error}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div style={{ padding: 'var(--sp-xl)', textAlign: 'center' }}><span className="spinner" /> Loading colleges...</div>
        ) : colleges.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-icon">🏛️</div>
            <h3>No colleges yet</h3>
            <p>Click "Add College" to get started. Students won't see a college dropdown until at least one is added.</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
              <thead style={{ background: 'var(--clr-bg-elevated)', borderBottom: '1px solid var(--clr-border)' }}>
                <tr>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>College</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Pattern (Regex)</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Example</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {colleges.map(col => (
                  <tr key={col._id} style={{ borderBottom: '1px solid var(--clr-border)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600 }}>{col.name}</div>
                      {col.patternDescription && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', marginTop: 2 }}>{col.patternDescription}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <code style={{ background: 'var(--clr-bg-elevated)', padding: '2px 8px', borderRadius: 4, fontSize: '0.82rem', wordBreak: 'break-all' }}>
                        {col.rollNumberPattern}
                      </code>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: 'var(--clr-primary-glow)', color: 'var(--clr-primary)', padding: '3px 10px', borderRadius: 'var(--r-full)', fontSize: '0.85rem', fontWeight: 700, fontFamily: 'monospace' }}>
                        {col.exampleFormat}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`badge ${col.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {col.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-sm btn-ghost" onClick={() => { setEditing(col); setShowForm(true); }}>Edit</button>
                        {deleteConfirm === col._id ? (
                          <>
                            <button className="btn btn-sm btn-ghost" style={{ color: 'var(--clr-danger)' }} onClick={() => handleDelete(col._id)}>Confirm</button>
                            <button className="btn btn-sm btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                          </>
                        ) : (
                          <button className="btn btn-sm btn-ghost" style={{ color: 'var(--clr-danger)' }} onClick={() => setDeleteConfirm(col._id)}>Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tip box */}
        <div style={{ marginTop: 'var(--sp-lg)', padding: '14px 18px', background: 'var(--clr-bg-elevated)', borderRadius: 'var(--r-md)', border: '1px solid var(--clr-border)', fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>
          <strong style={{ color: 'var(--clr-text)' }}>💡 How it works:</strong>{' '}
          When a student or alumni selects a college during registration, their roll number is validated against that college's regex pattern.
          A pattern like <code style={{ background: 'var(--clr-bg-card)', padding: '1px 6px', borderRadius: 4 }}>{'^S\\d{4}\\d{7}$'}</code> matches
          roll numbers like <code style={{ background: 'var(--clr-bg-card)', padding: '1px 6px', borderRadius: 4 }}>S20230010237</code>.
          Students from colleges not yet in this list can still register — the college field will simply be empty.
        </div>

      </main>

      {/* Form Modal */}
      {showForm && (
        <CollegeForm
          initial={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
          saving={saving}
        />
      )}

      {/* Delete confirmation is inline in the table row above */}
    </div>
  );
};

export default ManageColleges;
