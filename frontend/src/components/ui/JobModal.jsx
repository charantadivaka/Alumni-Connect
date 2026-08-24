import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { applicationService } from '../../services/jobService';

export const JobModal = ({ selectedJob, closeModal }) => {
  const { user } = useAuth();
  const [isApplyMode, setIsApplyMode] = useState(false);
  const [applying, setApplying] = useState(false);

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

  return (
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
  );
};
