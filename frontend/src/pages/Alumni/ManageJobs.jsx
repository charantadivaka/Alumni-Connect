import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { jobService } from '../../services/jobService';

const ManageJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [form, setForm] = useState({
    company: '',
    companyWebsite: '',
    companyLinkedin: '',
    companyAddress: '',
    location: 'Remote',
    title: '',
    jobType: 'Full-time',
    eligibilityCriteria: '',
    applicableBranch: '',
    stipend: '',
    ctc: '',
    otherBenefits: '',
    description: '', // This will hold either text description or a note about the uploaded file
    descriptionFile: '', // Base64 data
    descriptionFileName: '',
    aboutCompany: '',
    selectionProcess: ''
  });

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
        // If text description is empty, populate it with filename
        description: prev.description || `Uploaded file: ${file.name}`
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleToggleActive = async (id) => {
    try {
      const res = await jobService.toggle(id);
      setJobs(prev => prev.map(j => j._id === id ? { ...j, isActive: res.isActive } : j));
    } catch (err) {
      alert(err.message || 'Failed to update job status.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Simple validation
    if (!form.company || !form.title) {
      setError('Company Name and Job Designation are required.');
      return;
    }
    if (!form.description && !form.descriptionFile) {
      setError('Please provide a job description text or upload a job description file.');
      return;
    }

    try {
      const payload = {
        ...form,
        description: form.description || `Job Description File: ${form.descriptionFileName}`
      };
      const newJob = await jobService.create(payload);
      setJobs(prev => [newJob, ...prev]);
      setIsModalOpen(false);
      // Reset form
      setForm({
        company: '',
        companyWebsite: '',
        companyLinkedin: '',
        companyAddress: '',
        location: 'Remote',
        title: '',
        jobType: 'Full-time',
        eligibilityCriteria: '',
        applicableBranch: '',
        stipend: '',
        ctc: '',
        otherBenefits: '',
        description: '',
        descriptionFile: '',
        descriptionFileName: '',
        aboutCompany: '',
        selectionProcess: ''
      });
    } catch (err) {
      setError(err.message || 'Failed to create job.');
    }
  };

  const filteredJobs = jobs.filter(job => 
    job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <div className="grid-2">
            {filteredJobs.map(job => (
              <div key={job._id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ margin: 0 }}>{job.title}</h3>
                    <span className={`badge ${job.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {job.isActive ? 'Active' : 'Closed'}
                    </span>
                  </div>
                  <p className="text-muted" style={{ margin: '5px 0 15px' }}>{job.company} • {job.location}</p>
                  
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', flexWrap: 'wrap' }}>
                    <span className="badge badge-ghost">{job.jobType}</span>
                    {job.ctc && <span className="badge badge-ghost">CTC: {job.ctc}</span>}
                    {job.stipend && <span className="badge badge-ghost">Stipend: {job.stipend}</span>}
                  </div>

                  <p className="text-sm text-muted">
                    {job.descriptionFile ? (
                      <span style={{ color: 'var(--clr-success)' }}>
                        📄 Job Description File: {job.descriptionFileName || 'Attached'}
                      </span>
                    ) : (
                      job.description?.substring(0, 150) + (job.description?.length > 150 ? '...' : '')
                    )}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid var(--clr-border)' }}>
                  <span className="text-sm text-faint">
                    Posted on: {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                  <button 
                    className={`btn btn-sm ${job.isActive ? 'btn-ghost' : 'btn-primary'}`}
                    onClick={() => handleToggleActive(job._id)}
                    style={{ color: job.isActive ? 'var(--clr-danger)' : 'var(--clr-success)' }}
                  >
                    {job.isActive ? 'Close Job' : 'Open Job'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Job Modal */}
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
                onClick={() => setIsModalOpen(false)}
                style={{
                  position: 'absolute', top: '15px', right: '15px',
                  background: 'none', border: 'none', fontSize: '1.5rem',
                  cursor: 'pointer', color: 'var(--clr-text-muted)'
                }}
              >
                ✕
              </button>

              <h2 style={{ marginBottom: '20px', borderBottom: '1px solid var(--clr-border)', paddingBottom: '10px' }}>
                Post a New Job
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
                    <input 
                      type="text" name="company" className="form-input" required
                      value={form.company} onChange={handleChange} placeholder="e.g. Google"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Company Website</label>
                    <input 
                      type="url" name="companyWebsite" className="form-input"
                      value={form.companyWebsite} onChange={handleChange} placeholder="https://google.com"
                    />
                  </div>
                </div>

                <div className="grid-2" style={{ gap: '15px' }}>
                  <div className="form-group">
                    <label className="form-label">LinkedIn Link</label>
                    <input 
                      type="url" name="companyLinkedin" className="form-input"
                      value={form.companyLinkedin} onChange={handleChange} placeholder="https://linkedin.com/company/..."
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Address</label>
                    <input 
                      type="text" name="companyAddress" className="form-input"
                      value={form.companyAddress} onChange={handleChange} placeholder="City, Country"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">About the Company</label>
                  <textarea 
                    name="aboutCompany" className="form-input" rows={2}
                    value={form.aboutCompany} onChange={handleChange} placeholder="Describe the company..."
                  />
                </div>

                {/* Job Details Section */}
                <h3 style={{ margin: '10px 0 5px', fontSize: '1.1rem', color: 'var(--clr-primary)' }}>Job Details</h3>

                <div className="grid-2" style={{ gap: '15px' }}>
                  <div className="form-group">
                    <label className="form-label">Job Designation *</label>
                    <input 
                      type="text" name="title" className="form-input" required
                      value={form.title} onChange={handleChange} placeholder="e.g. Frontend Engineer"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Work Location</label>
                    <input 
                      type="text" name="location" className="form-input"
                      value={form.location} onChange={handleChange} placeholder="e.g. Remote, Bangalore, Hybrid"
                    />
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
                    <label className="form-label">Applicable Branch</label>
                    <input 
                      type="text" name="applicableBranch" className="form-input"
                      value={form.applicableBranch} onChange={handleChange} placeholder="e.g. CSE, ECE, Mechanical"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Eligibility Criteria</label>
                  <input 
                    type="text" name="eligibilityCriteria" className="form-input"
                    value={form.eligibilityCriteria} onChange={handleChange} placeholder="e.g. B.Tech 2025 passout, CGPA > 7.5"
                  />
                </div>

                <div className="grid-3" style={{ gap: '15px' }}>
                  <div className="form-group">
                    <label className="form-label">Stipend (Monthly)</label>
                    <input 
                      type="text" name="stipend" className="form-input"
                      value={form.stipend} onChange={handleChange} placeholder="e.g. ₹50,000"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CTC (Annual)</label>
                    <input 
                      type="text" name="ctc" className="form-input"
                      value={form.ctc} onChange={handleChange} placeholder="e.g. 12 LPA"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Other Benefits</label>
                    <input 
                      type="text" name="otherBenefits" className="form-input"
                      value={form.otherBenefits} onChange={handleChange} placeholder="e.g. Health Insurance, Gym"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Selection Process</label>
                  <textarea 
                    name="selectionProcess" className="form-input" rows={2}
                    value={form.selectionProcess} onChange={handleChange} placeholder="e.g. 1 online test, 2 technical rounds, 1 HR round"
                  />
                </div>

                {/* Job Description Heading Section */}
                <h3 style={{ margin: '15px 0 5px', fontSize: '1.1rem', color: 'var(--clr-primary)', borderTop: '1px solid var(--clr-border)', paddingTop: '15px' }}>
                  Job description
                </h3>

                <div className="form-group">
                  <label className="form-label">Upload Job Description File (PDF/Doc/Image)</label>
                  <input 
                    type="file" 
                    accept="image/*,application/pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    style={{
                      background: 'var(--clr-bg-elevated)', padding: '10px',
                      borderRadius: 'var(--r-md)', border: '1px solid var(--clr-border)',
                      width: '100%', color: 'var(--clr-text-muted)'
                    }}
                  />
                  {form.descriptionFileName && (
                    <span className="text-sm" style={{ color: 'var(--clr-success)', display: 'block', marginTop: '5px' }}>
                      ✓ File selected: {form.descriptionFileName}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Or Write Job Description Details *</label>
                  <textarea 
                    name="description" className="form-input" rows={4}
                    value={form.description} onChange={handleChange} 
                    placeholder="Provide details about role, responsibilities, requirements..."
                  />
                </div>

                <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Submit Job Post
                  </button>
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
