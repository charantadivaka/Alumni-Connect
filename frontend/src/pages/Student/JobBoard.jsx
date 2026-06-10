import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { jobService, applicationService } from '../../services/jobService';
import { bookmarkService } from '../../services/otherServices';
import { useAuth } from '../../context/AuthContext';

const JobBoard = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [bookmarks, setBookmarks] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Sort state
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('latest');
  
  // Modal states
  const [selectedJob, setSelectedJob] = useState(null);
  const [isApplyMode, setIsApplyMode] = useState(false);
  const [applying, setApplying] = useState(false);

  // Application form state
  const [form, setForm] = useState({
    rollNo: '',
    name: user?.name || '',
    branch: '',
    email: user?.email || '',
    mobileNo: '',
    cgpa: '',
    majorProjects: '',
    cvFile: '',
    cvFileName: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsData, bks] = await Promise.all([
          jobService.getAll(),
          bookmarkService.getAll('Job')
        ]);
        setJobs(jobsData);
        setBookmarks(new Set(bks.map(b => b.refId)));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleToggleBookmark = async (e, jobId) => {
    e.stopPropagation();
    try {
      await bookmarkService.toggle({ refModel: 'Job', refId: jobId });
      setBookmarks(prev => {
        const next = new Set(prev);
        if (next.has(jobId)) next.delete(jobId);
        else next.add(jobId);
        return next;
      });
    } catch (err) {
      alert('Failed to toggle bookmark');
    }
  };

  const handleCardClick = (job) => {
    setSelectedJob(job);
    setIsApplyMode(false);
  };

  const handleReportJob = async (e, jobId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to report this job as spam or inappropriate?")) {
      try {
        await jobService.report(jobId);
        alert('Job reported to admin successfully.');
      } catch (err) {
        alert(err.response?.data?.message || err.message || 'Failed to report job');
      }
    }
  };

  const closeModal = () => {
    setSelectedJob(null);
    setIsApplyMode(false);
    setForm({
      rollNo: '',
      name: user?.name || '',
      branch: '',
      email: user?.email || '',
      mobileNo: '',
      cgpa: '',
      majorProjects: '',
      cvFile: '',
      cvFileName: ''
    });
  };

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
        cvFile: event.target.result,
        cvFileName: file.name
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!form.cvFile) {
      alert("Please upload your CV before submitting.");
      return;
    }

    try {
      setApplying(true);
      await applicationService.apply({
        jobId: selectedJob._id,
        ...form
      });
      alert('Application submitted successfully!');
      closeModal();
    } catch (err) {
      alert(err.message || 'Failed to apply.');
    } finally {
      setApplying(false);
    }
  };

  const filteredJobs = jobs
    .filter(job => {
      if (!search) return true;
      const q = search.toLowerCase();
      return job.title?.toLowerCase().includes(q) || job.company?.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
    });

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">
        <div className="page-header">
          <h1>Job Board</h1>
          <p>Discover and apply for opportunities posted by alumni.</p>
        </div>

        <div className="card" style={{ marginBottom: 'var(--sp-lg)', display: 'flex', gap: 'var(--sp-md)', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 300px' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search by Designation or Company..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          <div style={{ width: '200px' }}>
            <select className="form-input" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
              <option value="latest">Sort by: Latest</option>
              <option value="oldest">Sort by: Oldest</option>
            </select>
          </div>
        </div>

        {error && <div className="card" style={{ color: 'var(--clr-danger)', marginBottom: 'var(--sp-md)' }}>{error}</div>}

        {loading ? (
          <div style={{ padding: 'var(--sp-xl)', textAlign: 'center' }}><span className="spinner" /> Loading...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--sp-xl)' }}>
            <span style={{ fontSize: '2rem' }}>💼</span>
            <h3>No Jobs Found</h3>
            <p className="text-muted">No opportunities match your search criteria.</p>
          </div>
        ) : (
          <div className="grid-2">
            {filteredJobs.map(job => (
              <div 
                key={job._id} 
                className="card" 
                onClick={() => handleCardClick(job)}
                style={{ cursor: 'pointer', transition: 'transform 0.2s', ':hover': { transform: 'translateY(-2px)' }, position: 'relative' }}
              >
                <button 
                  onClick={(e) => handleToggleBookmark(e, job._id)}
                  style={{ position: 'absolute', top: 15, right: 45, background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
                  title={bookmarks.has(job._id) ? "Remove Bookmark" : "Save Job"}
                >
                  {bookmarks.has(job._id) ? '🔖' : '🤍'}
                </button>
                <button 
                  onClick={(e) => handleReportJob(e, job._id)}
                  style={{ position: 'absolute', top: 15, right: 15, background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--clr-danger)' }}
                  title="Report Job"
                >
                  🚩
                </button>
                <h3 style={{ margin: '0 0 4px 0', paddingRight: '30px' }}>{job.title}</h3>
                <p style={{ margin: '0 0 12px 0', color: 'var(--clr-text-muted)' }}>{job.company} • {job.location}</p>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <span className="badge badge-ghost">{job.jobType}</span>
                  {job.ctc && <span className="badge badge-ghost">CTC: {job.ctc}</span>}
                  {job.stipend && <span className="badge badge-ghost">Stipend: {job.stipend}</span>}
                </div>
                <p className="text-sm" style={{ marginBottom: '16px' }}>
                  {job.description?.substring(0, 120)}...
                </p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <span className="text-sm text-faint">Posted by: {job.postedBy?.name || 'Alumni'} • {new Date(job.createdAt).toLocaleDateString()}</span>
                  <button className="btn btn-primary btn-sm">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Overlay */}
        {selectedJob && (
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

              {!isApplyMode ? (
                /* Job Details View */
                <div>
                  <h2 style={{ marginBottom: '5px', color: 'var(--clr-primary)' }}>{selectedJob.title}</h2>
                  <p className="text-muted" style={{ marginBottom: '20px', fontSize: '1.1rem' }}>
                    {selectedJob.company} • {selectedJob.location}
                  </p>

                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid var(--clr-border)' }}>
                        <td style={{ padding: '10px 0', fontWeight: 'bold', width: '35%' }}>Company Name</td>
                        <td style={{ padding: '10px 0' }}>{selectedJob.company}</td>
                      </tr>
                      {selectedJob.companyWebsite && (
                        <tr style={{ borderBottom: '1px solid var(--clr-border)' }}>
                          <td style={{ padding: '10px 0', fontWeight: 'bold' }}>Website</td>
                          <td style={{ padding: '10px 0' }}>
                            <a href={selectedJob.companyWebsite} target="_blank" rel="noreferrer" style={{ color: 'var(--clr-primary)' }}>{selectedJob.companyWebsite}</a>
                          </td>
                        </tr>
                      )}
                      <tr style={{ borderBottom: '1px solid var(--clr-border)' }}>
                        <td style={{ padding: '10px 0', fontWeight: 'bold' }}>Job Designation</td>
                        <td style={{ padding: '10px 0' }}>{selectedJob.title}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--clr-border)' }}>
                        <td style={{ padding: '10px 0', fontWeight: 'bold' }}>Work Location</td>
                        <td style={{ padding: '10px 0' }}>{selectedJob.location}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--clr-border)' }}>
                        <td style={{ padding: '10px 0', fontWeight: 'bold' }}>Type of Employment</td>
                        <td style={{ padding: '10px 0' }}>{selectedJob.jobType}</td>
                      </tr>
                      {selectedJob.applicableBranch && (
                        <tr style={{ borderBottom: '1px solid var(--clr-border)' }}>
                          <td style={{ padding: '10px 0', fontWeight: 'bold' }}>Applicable Branch</td>
                          <td style={{ padding: '10px 0' }}>{selectedJob.applicableBranch}</td>
                        </tr>
                      )}
                      {selectedJob.eligibilityCriteria && (
                        <tr style={{ borderBottom: '1px solid var(--clr-border)' }}>
                          <td style={{ padding: '10px 0', fontWeight: 'bold' }}>Eligibility Criteria</td>
                          <td style={{ padding: '10px 0' }}>{selectedJob.eligibilityCriteria}</td>
                        </tr>
                      )}
                      {selectedJob.ctc && (
                        <tr style={{ borderBottom: '1px solid var(--clr-border)' }}>
                          <td style={{ padding: '10px 0', fontWeight: 'bold' }}>CTC</td>
                          <td style={{ padding: '10px 0' }}>{selectedJob.ctc}</td>
                        </tr>
                      )}
                      {selectedJob.stipend && (
                        <tr style={{ borderBottom: '1px solid var(--clr-border)' }}>
                          <td style={{ padding: '10px 0', fontWeight: 'bold' }}>Stipend</td>
                          <td style={{ padding: '10px 0' }}>{selectedJob.stipend}</td>
                        </tr>
                      )}
                      {selectedJob.otherBenefits && (
                        <tr style={{ borderBottom: '1px solid var(--clr-border)' }}>
                          <td style={{ padding: '10px 0', fontWeight: 'bold' }}>Other Benefits</td>
                          <td style={{ padding: '10px 0' }}>{selectedJob.otherBenefits}</td>
                        </tr>
                      )}
                      {selectedJob.selectionProcess && (
                        <tr style={{ borderBottom: '1px solid var(--clr-border)' }}>
                          <td style={{ padding: '10px 0', fontWeight: 'bold' }}>Selection Process</td>
                          <td style={{ padding: '10px 0' }}>{selectedJob.selectionProcess}</td>
                        </tr>
                      )}
                      {selectedJob.aboutCompany && (
                        <tr style={{ borderBottom: '1px solid var(--clr-border)' }}>
                          <td style={{ padding: '10px 0', fontWeight: 'bold' }}>About Company</td>
                          <td style={{ padding: '10px 0' }}>{selectedJob.aboutCompany}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ borderBottom: '1px solid var(--clr-border)', paddingBottom: '8px', marginBottom: '10px' }}>Job Description</h3>
                    <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{selectedJob.description}</p>
                    {selectedJob.descriptionFile && (
                      <div style={{ marginTop: '10px' }}>
                        <a href={selectedJob.descriptionFile} download={selectedJob.descriptionFileName || 'job_description'} style={{ color: 'var(--clr-primary)', fontWeight: 'bold' }}>
                          📄 Download Job Description File ({selectedJob.descriptionFileName || 'Attachment'})
                        </a>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-primary" onClick={() => setIsApplyMode(true)}>
                      Apply for this Job
                    </button>
                  </div>
                </div>
              ) : (
                /* Application Form View */
                <div>
                  <h2 style={{ marginBottom: '10px', color: 'var(--clr-primary)' }}>Apply for {selectedJob.title}</h2>
                  <p className="text-muted" style={{ marginBottom: '20px' }}>
                    Please fill out the details below to submit your application to {selectedJob.company}.
                  </p>

                  <form onSubmit={handleApplySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    
                    <div className="grid-2" style={{ gap: '15px' }}>
                      <div className="form-group">
                        <label className="form-label">Full Name *</label>
                        <input 
                          type="text" name="name" className="form-input" required
                          value={form.name} onChange={handleChange}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Roll No *</label>
                        <input 
                          type="text" name="rollNo" className="form-input" required
                          value={form.rollNo} onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="grid-2" style={{ gap: '15px' }}>
                      <div className="form-group">
                        <label className="form-label">Email ID *</label>
                        <input 
                          type="email" name="email" className="form-input" required
                          value={form.email} onChange={handleChange}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Mobile No *</label>
                        <input 
                          type="tel" name="mobileNo" className="form-input" required
                          value={form.mobileNo} onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="grid-2" style={{ gap: '15px' }}>
                      <div className="form-group">
                        <label className="form-label">Branch *</label>
                        <input 
                          type="text" name="branch" className="form-input" required
                          value={form.branch} onChange={handleChange}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">CGPA *</label>
                        <input 
                          type="text" name="cgpa" className="form-input" required
                          value={form.cgpa} onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Major Projects *</label>
                      <textarea 
                        name="majorProjects" className="form-input" rows={3} required
                        value={form.majorProjects} onChange={handleChange}
                        placeholder="Briefly describe your major projects..."
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Upload CV (PDF/Doc) *</label>
                      <input 
                        type="file" 
                        accept="application/pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        required
                        style={{
                          background: 'var(--clr-bg-elevated)', padding: '10px',
                          borderRadius: 'var(--r-md)', border: '1px solid var(--clr-border)',
                          width: '100%', color: 'var(--clr-text-muted)'
                        }}
                      />
                      {form.cvFileName && (
                        <span className="text-sm" style={{ color: 'var(--clr-success)', display: 'block', marginTop: '5px' }}>
                          ✓ CV Attached: {form.cvFileName}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '10px' }}>
                      <button type="button" className="btn btn-ghost" onClick={() => setIsApplyMode(false)}>
                        Back to Details
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={applying}>
                        {applying ? 'Submitting...' : 'Submit Application'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default JobBoard;
