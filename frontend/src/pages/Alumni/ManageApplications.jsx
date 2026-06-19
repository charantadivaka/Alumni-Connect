import { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { applicationService } from '../../services/jobService';
import '../../styles/Alumni/ManageApplications.css';

const ManageApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // desc = newest first
  
  // Selected Application for viewing details
  const [selectedApp, setSelectedApp] = useState(null);
  
  const STAGES = ['Applied', 'Under Review', 'Interview', 'Offer', 'Rejected'];

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await applicationService.getAlumni();
      setApplications(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleStageChange = async (appId, newStage) => {
    try {
      const updatedApp = await applicationService.updateStage(appId, { stage: newStage });
      setApplications(prev => prev.map(app => app._id === appId ? { ...app, stage: newStage, stageHistory: updatedApp.stageHistory } : app));
      
      if (selectedApp && selectedApp._id === appId) {
        setSelectedApp(prev => ({ ...prev, stage: newStage, stageHistory: updatedApp.stageHistory }));
      }
    } catch (err) {
      alert(err.message || 'Failed to update stage.');
    }
  };

  const filteredAndSortedApplications = useMemo(() => {
    let result = [...applications];

    // Filter by student name, rollNo, job title, job company
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(app => {
        const title = app.job?.title?.toLowerCase() || '';
        const company = app.job?.company?.toLowerCase() || '';
        const studentName = app.name?.toLowerCase() || app.applicant?.name?.toLowerCase() || '';
        const rollNo = app.rollNo?.toLowerCase() || '';
        const branch = app.branch?.toLowerCase() || '';
        return title.includes(q) || company.includes(q) || studentName.includes(q) || rollNo.includes(q) || branch.includes(q);
      });
    }

    // Sort by Date
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return result;
  }, [applications, searchQuery, sortOrder]);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1>Manage Applications</h1>
            <p>Review and manage student applications for your posted jobs.</p>
          </div>
        </div>

        {error && <div className="card" style={{ color: 'var(--clr-danger)', marginBottom: 'var(--sp-md)' }}>{error}</div>}

        <div className="card" style={{ marginBottom: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label className="form-label text-sm text-muted" style={{ marginBottom: '4px' }}>Filter Applications</label>
            <input 
              type="text" 
              placeholder="Search by student name, job title, branch, roll no..." 
              className="form-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ minWidth: '150px' }}>
            <label className="form-label text-sm text-muted" style={{ marginBottom: '4px' }}>Sort by Date</label>
            <select 
              className="form-input" 
              value={sortOrder} 
              onChange={e => setSortOrder(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 'var(--sp-xl)', textAlign: 'center' }}><span className="spinner" /> Loading...</div>
        ) : filteredAndSortedApplications.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--sp-xl)' }}>
            <span style={{ fontSize: '2rem' }}>📄</span>
            <h3>No Applications Found</h3>
            <p className="text-muted">No students have applied to your jobs matching this criteria.</p>
          </div>
        ) : (
          <div className="grid-2">
            {filteredAndSortedApplications.map(app => (
              <div key={app._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ margin: '0 0 4px 0' }}>{app.name || app.applicant?.name || 'Unknown Student'}</h3>
                    <span className={`badge ${app.stage === 'Applied' ? 'badge-primary' : app.stage === 'Rejected' ? 'badge-danger' : app.stage === 'Offer' ? 'badge-success' : 'badge-ghost'}`}>
                      {app.stage}
                    </span>
                  </div>
                  <p className="text-muted" style={{ margin: '0 0 8px 0', fontSize: '0.875rem' }}>
                    {app.branch && app.rollNo ? `${app.branch} • ${app.rollNo}` : 'Branch/Roll No Not Provided'}
                  </p>
                  
                  <div style={{ background: 'var(--clr-bg-elevated)', padding: '10px', borderRadius: 'var(--r-sm)', marginBottom: '10px' }}>
                    <p className="text-sm" style={{ margin: '0 0 4px 0' }}><strong>Applied For:</strong> {app.job?.title}</p>
                    <p className="text-sm" style={{ margin: 0 }}><strong>Company:</strong> {app.job?.company}</p>
                  </div>

                  <p className="text-sm text-faint" style={{ margin: 0 }}>
                    Applied on: {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--clr-border)' }}>
                  <select 
                    className="form-input" 
                    value={app.stage} 
                    onChange={(e) => handleStageChange(app._id, e.target.value)}
                    style={{ padding: '4px 8px', width: 'auto' }}
                  >
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>

                  <button className="btn btn-sm btn-ghost" onClick={() => setSelectedApp(app)}>
                    View Full Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Full Details Modal */}
        {selectedApp && (
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
                onClick={() => setSelectedApp(null)}
                style={{
                  position: 'absolute', top: '15px', right: '15px',
                  background: 'none', border: 'none', fontSize: '1.5rem',
                  cursor: 'pointer', color: 'var(--clr-text-muted)'
                }}
              >
                ✕
              </button>

              <h2 style={{ marginBottom: '5px', color: 'var(--clr-primary)' }}>Application Details</h2>
              <p className="text-muted" style={{ marginBottom: '20px' }}>
                Applied for: <strong>{selectedApp.job?.title} ({selectedApp.job?.company})</strong>
              </p>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--clr-border)' }}>
                    <td style={{ padding: '10px 0', fontWeight: 'bold', width: '35%' }}>Full Name</td>
                    <td style={{ padding: '10px 0' }}>{selectedApp.name || selectedApp.applicant?.name}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--clr-border)' }}>
                    <td style={{ padding: '10px 0', fontWeight: 'bold' }}>Roll Number</td>
                    <td style={{ padding: '10px 0' }}>{selectedApp.rollNo}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--clr-border)' }}>
                    <td style={{ padding: '10px 0', fontWeight: 'bold' }}>Branch</td>
                    <td style={{ padding: '10px 0' }}>{selectedApp.branch}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--clr-border)' }}>
                    <td style={{ padding: '10px 0', fontWeight: 'bold' }}>Email Address</td>
                    <td style={{ padding: '10px 0' }}>
                      <a href={`mailto:${selectedApp.email || selectedApp.applicant?.email}`} style={{ color: 'var(--clr-primary)' }}>
                        {selectedApp.email || selectedApp.applicant?.email}
                      </a>
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--clr-border)' }}>
                    <td style={{ padding: '10px 0', fontWeight: 'bold' }}>Mobile Number</td>
                    <td style={{ padding: '10px 0' }}>
                      <a href={`tel:${selectedApp.mobileNo}`} style={{ color: 'var(--clr-primary)' }}>{selectedApp.mobileNo}</a>
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--clr-border)' }}>
                    <td style={{ padding: '10px 0', fontWeight: 'bold' }}>CGPA</td>
                    <td style={{ padding: '10px 0' }}>{selectedApp.cgpa}</td>
                  </tr>
                  {selectedApp.majorProjects && (
                    <tr style={{ borderBottom: '1px solid var(--clr-border)' }}>
                      <td style={{ padding: '10px 0', fontWeight: 'bold', verticalAlign: 'top' }}>Major Projects</td>
                      <td style={{ padding: '10px 0', whiteSpace: 'pre-wrap' }}>{selectedApp.majorProjects}</td>
                    </tr>
                  )}
                  <tr style={{ borderBottom: '1px solid var(--clr-border)' }}>
                    <td style={{ padding: '10px 0', fontWeight: 'bold' }}>Application Stage</td>
                    <td style={{ padding: '10px 0' }}>
                      <span className={`badge ${selectedApp.stage === 'Applied' ? 'badge-primary' : selectedApp.stage === 'Rejected' ? 'badge-danger' : selectedApp.stage === 'Offer' ? 'badge-success' : 'badge-ghost'}`}>
                        {selectedApp.stage}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ borderBottom: '1px solid var(--clr-border)', paddingBottom: '8px', marginBottom: '10px' }}>Attached CV</h3>
                {selectedApp.cvFile ? (
                  <a href={selectedApp.cvFile} download={selectedApp.cvFileName || 'student_cv'} style={{ color: 'var(--clr-success)', fontWeight: 'bold' }}>
                    📄 Download CV ({selectedApp.cvFileName || 'Attachment'})
                  </a>
                ) : (
                  <p className="text-muted">No CV attached to this application.</p>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', alignItems: 'center', borderTop: '1px solid var(--clr-border)', paddingTop: '20px' }}>
                <span className="text-sm text-muted" style={{ marginRight: 'auto' }}>Update Stage:</span>
                <select 
                  className="form-input" 
                  value={selectedApp.stage} 
                  onChange={(e) => handleStageChange(selectedApp._id, e.target.value)}
                >
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button className="btn btn-ghost" onClick={() => setSelectedApp(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ManageApplications;
