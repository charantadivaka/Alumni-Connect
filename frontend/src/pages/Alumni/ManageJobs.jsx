import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { jobService } from '../../services/jobService';
import { useNavigate } from 'react-router-dom';
import '../../styles/Alumni/ManageJobs.css';

const ManageJobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState(null);
  
  const [expandedJobId, setExpandedJobId] = useState(null); // For table view

  const initialForm = {
    company: '', companyWebsite: '', companyLinkedin: '', companyAddress: '',
    location: 'Remote', title: '', jobType: 'Full-time',
    eligibilityCriteria: '', applicableBranch: '',
    stipend: '', ctc: '', otherBenefits: '',
    description: '', descriptionFile: '', descriptionFileName: '',
    aboutCompany: '', selectionProcess: '', deadline: '', status: 'Active'
  };

  const [form, setForm] = useState(initialForm);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await jobService.getMy();
      setJobs(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setForm(prev => ({
        ...prev,
        descriptionFile: event.target.result,
        descriptionFileName: file.name,
        description: prev.description || `Uploaded file: ${file.name}`
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await jobService.updateStatus(id, newStatus);
      setJobs(prev => prev.map(j => j._id === id ? { ...j, status: res.status } : j));
    } catch (err) {
      alert(err.message || 'Failed to update job status.');
    }
  };

  const handleDuplicate = async (id) => {
    try {
      const res = await jobService.duplicate(id);
      setJobs(prev => [res, ...prev]);
    } catch (err) {
      alert(err.message || 'Failed to duplicate job.');
    }
  };

  const handleEdit = (job) => {
    setForm({
      company: job.company || '', companyWebsite: job.companyWebsite || '',
      companyLinkedin: job.companyLinkedin || '', companyAddress: job.companyAddress || '',
      location: job.location || 'Remote', title: job.title || '',
      jobType: job.jobType || 'Full-time', eligibilityCriteria: job.eligibilityCriteria || '',
      applicableBranch: job.applicableBranch || '', stipend: job.stipend || '',
      ctc: job.ctc || '', otherBenefits: job.otherBenefits || '',
      description: job.description || '', descriptionFile: job.descriptionFile || '',
      descriptionFileName: job.descriptionFileName || '', aboutCompany: job.aboutCompany || '',
      selectionProcess: job.selectionProcess || '',
      deadline: job.deadline ? new Date(job.deadline).toISOString().slice(0, 10) : '',
      status: job.status || 'Active'
    });
    setEditingJobId(job._id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!form.company || !form.title) {
      setError('Company Name and Job Designation are required.');
      return;
    }
    if (!form.description && !form.descriptionFile) {
      setError('Please provide a job description text or upload a job description file.');
      return;
    }

    try {
      const payload = { ...form };
      if (editingJobId) {
        const updated = await jobService.update(editingJobId, payload);
        setJobs(prev => prev.map(j => j._id === editingJobId ? { ...updated, applicationCount: j.applicationCount } : j));
      } else {
        const newJob = await jobService.create(payload);
        setJobs(prev => [{ ...newJob, applicationCount: 0 }, ...prev]);
      }
      closeModal();
    } catch (err) {
      setError(err.message || 'Failed to save job.');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingJobId(null);
    setForm(initialForm);
    setError('');
  };

  const toggleExpand = (id) => {
    setExpandedJobId(prev => prev === id ? null : id);
  };

  const filteredJobs = jobs.filter(job => 
    job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status) => {
    if (status === 'Active') return '🟢';
    if (status === 'Paused') return '⏸️';
    if (status === 'Closed') return '🔴';
    if (status === 'Scheduled') return '📅';
    return '🟢';
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1>Manage Jobs</h1>
            <p>Post and manage job opportunities for students</p>
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            + Create New Job
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <input 
            type="text" 
            placeholder="Search by job designation, company or location..." 
            className="form-input"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', maxWidth: '400px' }}
          />
        </div>

        {loading ? (
          <div style={{ padding: 'var(--sp-xl)', textAlign: 'center' }}><span className="spinner" /> Loading...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--sp-xl)' }}>
            <span style={{ fontSize: '2rem' }}>💼</span>
            <h3>No Jobs Found</h3>
            <p className="text-muted">You haven't posted any jobs matching your criteria.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {filteredJobs.map(job => (
              <div key={job._id} className="card" style={{ padding: '20px', transition: 'all 0.2s', border: expandedJobId === job._id ? '1px solid var(--clr-primary)' : '1px solid var(--clr-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                  
                  {/* Left Column: Job Overview */}
                  <div style={{ flex: '1 1 300px', cursor: 'pointer' }} onClick={() => toggleExpand(job._id)}>
                    <h3 style={{ margin: '0 0 5px' }}>{job.title}</h3>
                    <p style={{ margin: '0 0 10px', fontSize: '0.9rem', color: 'var(--clr-text-muted)' }}>
                      {job.company} • {job.location}
                    </p>
                    
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--clr-text)' }}>
                         {job.applicationCount} Applications
                      </span>
                      <span>•</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                        {getStatusIcon(job.status || 'Active')} {job.status || 'Active'}
                      </span>
                      <span>•</span>
                      <span className="text-faint">
                        Posted {new Date(job.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      {job.deadline && (
                        <>
                          <span>•</span>
                          <span style={{ color: 'var(--clr-warning)', fontWeight: 500 }}>
                            Deadline: {new Date(job.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => navigate('/alumni/applications')}
                      title="Manage applications for all jobs"
                    >
                      View Applications
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(job)}>Edit</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDuplicate(job._id)}>Duplicate</button>
                    
                    {/* Status Dropdown/Actions */}
                    {job.status !== 'Closed' && (
                      <button 
                        className="btn btn-ghost btn-sm" 
                        style={{ color: 'var(--clr-danger)' }}
                        onClick={() => handleUpdateStatus(job._id, 'Closed')}
                      >
                        Close Job
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Details Table */}
                {expandedJobId === job._id && (
                  <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--clr-border)', animation: 'fadeIn 0.2s' }}>
                    <h4 style={{ margin: '0 0 15px', color: 'var(--clr-primary)' }}>Job Details</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid var(--clr-border)' }}>
                          <td style={{ padding: '8px 0', width: '30%', color: 'var(--clr-text-muted)', fontWeight: 500 }}>Job Type</td>
                          <td style={{ padding: '8px 0' }}>{job.jobType}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--clr-border)' }}>
                          <td style={{ padding: '8px 0', color: 'var(--clr-text-muted)', fontWeight: 500 }}>CTC / Salary</td>
                          <td style={{ padding: '8px 0' }}>{job.ctc || job.salary || 'Not specified'}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--clr-border)' }}>
                          <td style={{ padding: '8px 0', color: 'var(--clr-text-muted)', fontWeight: 500 }}>Stipend</td>
                          <td style={{ padding: '8px 0' }}>{job.stipend || 'Not specified'}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--clr-border)' }}>
                          <td style={{ padding: '8px 0', color: 'var(--clr-text-muted)', fontWeight: 500 }}>Applicable Branch</td>
                          <td style={{ padding: '8px 0' }}>{job.applicableBranch || 'Any'}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--clr-border)' }}>
                          <td style={{ padding: '8px 0', color: 'var(--clr-text-muted)', fontWeight: 500 }}>Eligibility</td>
                          <td style={{ padding: '8px 0' }}>{job.eligibilityCriteria || 'Not specified'}</td>
                        </tr>
                        <tr>
                          <td colSpan="2" style={{ padding: '15px 0 5px', color: 'var(--clr-text-muted)', fontWeight: 500 }}>Description</td>
                        </tr>
                        <tr>
                          <td colSpan="2" style={{ padding: '0 0 15px' }}>
                             {job.descriptionFile ? (
                                <a href={job.descriptionFile} download={job.descriptionFileName} style={{ color: 'var(--clr-primary)', fontWeight: 500 }}>
                                  📎 Download attached file ({job.descriptionFileName})
                                </a>
                             ) : (
                                <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{job.description}</p>
                             )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Create / Edit Job Modal */}
        {isModalOpen && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            padding: '20px'
          }}>
            <div className="card" style={{
              width: '100%', maxWidth: '700px', maxHeight: '90vh',
              overflowY: 'auto', padding: '30px', position: 'relative'
            }}>
              <button 
                onClick={closeModal}
                style={{
                  position: 'absolute', top: '15px', right: '15px',
                  background: 'none', border: 'none', fontSize: '1.5rem',
                  cursor: 'pointer', color: 'var(--clr-text-muted)'
                }}
              >
                ✕
              </button>

              <h2 style={{ marginBottom: '20px', borderBottom: '1px solid var(--clr-border)', paddingBottom: '10px' }}>
                {editingJobId ? 'Edit Job' : 'Post a New Job'}
              </h2>

              {error && (
                <div style={{
                  background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
                  borderRadius: 'var(--r-md)', padding: '10px', color: 'var(--clr-danger)',
                  marginBottom: '15px', fontSize: '0.875rem'
                }}>{error}</div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {/* Company Details Section */}
                <h3 style={{ margin: '10px 0 5px', fontSize: '1.1rem', color: 'var(--clr-primary)' }}>Company Details</h3>
                
                <div className="grid-2" style={{ gap: '15px' }}>
                  <div className="form-group">
                    <label className="form-label">Company Name *</label>
                    <input type="text" name="company" className="form-input" required value={form.company} onChange={handleChange} placeholder="e.g. Google" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Company Website</label>
                    <input type="url" name="companyWebsite" className="form-input" value={form.companyWebsite} onChange={handleChange} placeholder="https://google.com" />
                  </div>
                </div>

                <div className="grid-2" style={{ gap: '15px' }}>
                  <div className="form-group">
                    <label className="form-label">LinkedIn Link</label>
                    <input type="url" name="companyLinkedin" className="form-input" value={form.companyLinkedin} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Address</label>
                    <input type="text" name="companyAddress" className="form-input" value={form.companyAddress} onChange={handleChange} placeholder="City, Country" />
                  </div>
                </div>

                {/* Job Details Section */}
                <h3 style={{ margin: '10px 0 5px', fontSize: '1.1rem', color: 'var(--clr-primary)' }}>Job Details</h3>

                <div className="grid-2" style={{ gap: '15px' }}>
                  <div className="form-group">
                    <label className="form-label">Job Designation *</label>
                    <input type="text" name="title" className="form-input" required value={form.title} onChange={handleChange} placeholder="e.g. Frontend Engineer" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Work Location</label>
                    <input type="text" name="location" className="form-input" value={form.location} onChange={handleChange} placeholder="e.g. Remote, Bangalore" />
                  </div>
                </div>

                <div className="grid-2" style={{ gap: '15px' }}>
                  <div className="form-group">
                    <label className="form-label">Type of Employment</label>
                    <select name="jobType" className="form-input" value={form.jobType} onChange={handleChange}>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Internship">Internship</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select name="status" className="form-input" value={form.status} onChange={handleChange}>
                      <option value="Active">🟢 Active</option>
                      <option value="Paused">⏸️ Paused</option>
                      <option value="Closed">🔴 Closed</option>
                      <option value="Scheduled">📅 Scheduled</option>
                    </select>
                  </div>
                </div>

                <div className="grid-2" style={{ gap: '15px' }}>
                  <div className="form-group">
                    <label className="form-label">Applicable Branch</label>
                    <input type="text" name="applicableBranch" className="form-input" value={form.applicableBranch} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Application Deadline (Optional)</label>
                    <input type="date" name="deadline" className="form-input" value={form.deadline} onChange={handleChange} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Eligibility Criteria</label>
                  <input type="text" name="eligibilityCriteria" className="form-input" value={form.eligibilityCriteria} onChange={handleChange} />
                </div>

                <div className="grid-3" style={{ gap: '15px' }}>
                  <div className="form-group">
                    <label className="form-label">Stipend (Monthly)</label>
                    <input type="text" name="stipend" className="form-input" value={form.stipend} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CTC (Annual)</label>
                    <input type="text" name="ctc" className="form-input" value={form.ctc} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Other Benefits</label>
                    <input type="text" name="otherBenefits" className="form-input" value={form.otherBenefits} onChange={handleChange} />
                  </div>
                </div>

                <h3 style={{ margin: '15px 0 5px', fontSize: '1.1rem', color: 'var(--clr-primary)', borderTop: '1px solid var(--clr-border)', paddingTop: '15px' }}>
                  Job description
                </h3>

                <div className="form-group">
                  <label className="form-label">Upload Job Description File (PDF/Doc/Image)</label>
                  <input type="file" accept="image/*,application/pdf,.doc,.docx" onChange={handleFileUpload} style={{ width: '100%', padding: '10px', background: 'var(--clr-bg-elevated)', borderRadius: 'var(--r-md)', border: '1px solid var(--clr-border)' }} />
                  {form.descriptionFileName && <span className="text-sm" style={{ color: 'var(--clr-success)', display: 'block', marginTop: '5px' }}>✓ {form.descriptionFileName}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Or Write Details *</label>
                  <textarea name="description" className="form-input" rows={4} value={form.description} onChange={handleChange} />
                </div>

                <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingJobId ? 'Save Changes' : 'Submit Job Post'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ManageJobs;
