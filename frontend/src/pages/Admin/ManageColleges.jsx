import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { adminService } from '../../services/adminService';
import '../../styles/Admin/ManageColleges.css';

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

  const resultClass =
    result === true    ? 'regex-tester-result regex-tester-result--pass' :
    result === false   ? 'regex-tester-result regex-tester-result--fail' :
    result === 'invalid' ? 'regex-tester-result regex-tester-result--warn' :
    'regex-tester-result';

  const borderStyle =
    result === true    ? { border: '1.5px solid var(--clr-success)' } :
    result === false   ? { border: '1.5px solid var(--clr-danger)' } :
    result === 'invalid' ? { border: '1.5px solid var(--clr-warning)' } :
    {};

  const msg =
    result === true    ? '✅ Matches the pattern' :
    result === false   ? '❌ Does not match the pattern' :
    result === 'invalid' ? '⚠️ Regex syntax error' :
    '';

  return (
    <div style={{ marginTop: 6 }}>
      <label className="form-label regex-tester-label">
        Live Test — type a roll number to check
      </label>
      <input
        className="form-input"
        placeholder="e.g. S20230010237"
        value={testInput}
        onChange={e => setTestInput(e.target.value)}
        style={{ transition: 'border-color 0.2s', ...borderStyle }}
      />
      {msg && <div className={resultClass}>{msg}</div>}
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
    <div className="modal-overlay-custom" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card college-form-card">
        <div className="college-form-header">
          <h2 className="college-form-title">{initial ? 'Edit College' : 'Add New College'}</h2>
          <button onClick={onClose} className="college-form-close">✕</button>
        </div>

        {localErr && <div className="auth-error-banner">{localErr}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* College Name */}
          <div className="form-group">
            <label className="form-label">College Name <span className="required-star">*</span></label>
            <input className="form-input" placeholder="e.g. IIIT Sri City" required value={form.name} onChange={e => set('name', e.target.value)} />
          </div>

          {/* Regex Pattern */}
          <div className="form-group">
            <label className="form-label">
              Roll Number Pattern (Regex) <span className="required-star">*</span>
            </label>
            <input
              className="form-input regex-input"
              placeholder="e.g. ^S\d{4}\d{7}$"
              required
              value={form.rollNumberPattern}
              onChange={e => set('rollNumberPattern', e.target.value)}
            />
            <div className="regex-hint">
              Use standard JavaScript regex. Example: <code className="regex-hint-code">{'^S\\d{4}\\d{7}$'}</code> matches <em>S20230010237</em>
            </div>
          </div>

          {/* Example Format */}
          <div className="form-group">
            <label className="form-label">Example Roll Number <span className="required-star">*</span></label>
            <input className="form-input" placeholder="e.g. S20230010237" required value={form.exampleFormat} onChange={e => set('exampleFormat', e.target.value)} />
            <div className="field-hint">This is shown to students as a hint during registration.</div>
          </div>

          {/* Live Regex Tester */}
          <div className="form-group regex-tester-box">
            <div className="regex-tester-label">🧪 Live Pattern Tester</div>
            <RegexTester pattern={form.rollNumberPattern} example={form.exampleFormat} />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Pattern Description <span className="optional-label">(optional)</span></label>
            <input className="form-input" placeholder="e.g. S + 4-digit year + 7-digit roll number" value={form.patternDescription} onChange={e => set('patternDescription', e.target.value)} />
          </div>

          {/* Active toggle */}
          <div className="checkbox-row">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={e => set('isActive', e.target.checked)}
              className="checkbox-input"
            />
            <label htmlFor="isActive" className="checkbox-label">
              Active (visible to students during registration)
            </label>
          </div>

          <div className="form-actions">
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
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

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
        <div className="page-header-row">
          <div>
            <h1>Manage Colleges</h1>
            <p>Define colleges and their roll number patterns. Students must match these patterns during registration.</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
            + Add College
          </button>
        </div>

        {/* Feedback banners */}
        {success && <div className="feedback-banner feedback-banner--success">{success}</div>}
        {error && <div className="feedback-banner feedback-banner--error">{error}</div>}

        {/* Table */}
        {loading ? (
          <div className="loading-state"><span className="spinner" /> Loading colleges...</div>
        ) : colleges.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-icon">🏛️</div>
            <h3>No colleges yet</h3>
            <p>Click "Add College" to get started. Students won't see a college dropdown until at least one is added.</p>
          </div>
        ) : (
          <div className="card table-wrapper">
            <table className="data-table data-table--min-700">
              <thead className="table-head">
                <tr>
                  <th className="table-cell table-cell--header">College</th>
                  <th className="table-cell table-cell--header">Pattern (Regex)</th>
                  <th className="table-cell table-cell--header">Example</th>
                  <th className="table-cell table-cell--header">Status</th>
                  <th className="table-cell table-cell--header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {colleges.map(col => (
                  <tr key={col._id} className="table-row">
                    <td className="table-cell">
                      <div className="college-name">{col.name}</div>
                      {col.patternDescription && (
                        <div className="college-desc">{col.patternDescription}</div>
                      )}
                    </td>
                    <td className="table-cell">
                      <code className="college-pattern-code">{col.rollNumberPattern}</code>
                    </td>
                    <td className="table-cell">
                      <span className="college-example-badge">{col.exampleFormat}</span>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${col.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {col.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="table-actions">
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
        <div className="tip-box">
          <strong className="tip-box-strong">💡 How it works:</strong>{' '}
          When a student or alumni selects a college during registration, their roll number is validated against that college's regex pattern.
          A pattern like <code className="tip-box-code">{'^S\\d{4}\\d{7}$'}</code> matches
          roll numbers like <code className="tip-box-code">S20230010237</code>.
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
    </div>
  );
};

export default ManageColleges;
