import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { resumeService } from '../../services/otherServices';

const MyResumes = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [newResumeName, setNewResumeName] = useState('');
  const [fileData, setFileData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const data = await resumeService.getMy();
        setResumes(data);
      } catch (err) {
        setError(err.message || 'Failed to load resumes.');
      } finally {
        setLoading(false);
      }
    };
    fetchResumes();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setFileData(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!newResumeName.trim()) { alert('Please enter a name for this resume.'); return; }
    if (!fileData) { alert('Please select a file.'); return; }
    try {
      setUploading(true);
      const newResume = await resumeService.upload({ name: newResumeName.trim(), fileData, fileType: 'application/pdf' });
      setResumes(prev => [newResume, ...prev]);
      setNewResumeName('');
      setFileData(null);
      setFileName('');
      setShowForm(false);
    } catch (err) {
      alert(err.message || 'Failed to upload resume.');
    } finally {
      setUploading(false);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await resumeService.setDefault(id);
      setResumes(prev => prev.map(r => ({ ...r, isDefault: r._id === id })));
    } catch (err) {
      alert(err.message || 'Failed to set default.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this resume?')) return;
    try {
      await resumeService.remove(id);
      setResumes(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete resume.');
    }
  };

  const handleDownload = async (id, name) => {
    try {
      const full = await resumeService.getById(id);
      if (!full?.fileData) { alert('No file data found.'); return; }
      const link = document.createElement('a');
      link.href = full.fileData;
      link.download = name + '.pdf';
      link.click();
    } catch (err) {
      alert(err.message || 'Failed to download.');
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 15 }}>
          <div>
            <h1>My Resumes</h1>
            <p>Manage and upload your resumes for job applications.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
            {showForm ? 'Cancel' : '+ Upload Resume'}
          </button>
        </div>

        {error && <div className="card" style={{ color: 'var(--clr-danger)', marginBottom: 20 }}>{error}</div>}

        {/* Upload Form */}
        {showForm && (
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Upload a New Resume</h3>
            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <div className="form-group">
                <label className="form-label">Resume Label *</label>
                <input type="text" className="form-input" required value={newResumeName} onChange={e => setNewResumeName(e.target.value)} placeholder="e.g. Software Engineer Resume v2" />
              </div>
              <div className="form-group">
                <label className="form-label">Resume File (PDF) *</label>
                <input
                  type="file" accept="application/pdf,.doc,.docx"
                  onChange={handleFileChange}
                  style={{ background: 'var(--clr-bg-elevated)', padding: 10, borderRadius: 'var(--r-md)', border: '1px solid var(--clr-border)', width: '100%', color: 'var(--clr-text-muted)' }}
                />
                {fileName && <span className="text-sm" style={{ color: 'var(--clr-success)', marginTop: 5, display: 'block' }}>✓ {fileName}</span>}
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload Resume'}</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /> Loading...</div>
        ) : resumes.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <span style={{ fontSize: '2rem' }}>📄</span>
            <h3>No Resumes Uploaded</h3>
            <p className="text-muted">Upload your resume to use it when applying for jobs.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--sp-md)' }}>
            {resumes.map(resume => (
              <div key={resume._id} className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 15, justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: '1.5rem' }}>📄</span>
                    <h3 style={{ margin: 0 }}>{resume.name}</h3>
                    {resume.isDefault && <span className="badge badge-success">Default</span>}
                  </div>
                  <p className="text-sm text-faint">Uploaded: {new Date(resume.createdAt).toLocaleDateString()}</p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDownload(resume._id, resume.name)}>⬇ Download</button>
                  {!resume.isDefault && (
                    <button className="btn btn-ghost btn-sm" onClick={() => handleSetDefault(resume._id)}>Set as Default</button>
                  )}
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--clr-danger)' }} onClick={() => handleDelete(resume._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyResumes;
