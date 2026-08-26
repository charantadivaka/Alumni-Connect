import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { adminService } from '../../services/adminService';
import '../../styles/Admin/ContentModeration.css';

const ContentModeration = () => {
  const [activeTab, setActiveTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // selected item for review
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'jobs') {
        const data = await adminService.getReportedJobs();
        setJobs(data);
      } else {
        const data = await adminService.getReportedEvents();
        setEvents(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    setSelectedItem(null);
    fetchData(); 
  }, [activeTab]);

  const handleAction = async (reportId, action) => {
    try {
      await adminService.resolveReport(activeTab === 'jobs' ? 'job' : 'event', selectedItem._id, reportId, action);
      alert(`Report action '${action}' successful.`);
      setSelectedItem(null);
      fetchData(); // Refresh list
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to resolve report');
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status) => {
    switch(status) {
      case 'Pending': return <span className="badge" style={{ backgroundColor: 'transparent', border: '1px solid #eab308', color: '#eab308' }}>🟡 Pending</span>;
      case 'Under Review': return <span className="badge" style={{ backgroundColor: 'transparent', border: '1px solid #3b82f6', color: '#3b82f6' }}>🔵 Under Review</span>;
      case 'Resolved': return <span className="badge" style={{ backgroundColor: 'transparent', border: '1px solid #22c55e', color: '#22c55e' }}>🟢 Resolved</span>;
      case 'Dismissed': return <span className="badge" style={{ backgroundColor: 'transparent', border: '1px solid #94a3b8', color: '#94a3b8' }}>⚪ Dismissed</span>;
      default: return null;
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Pending': return '🟡';
      case 'Under Review': return '🔵';
      case 'Resolved': return '🟢';
      case 'Dismissed': return '⚪';
      default: return '';
    }
  }

  // Determine overall status for card based on reports
  const getOverallStatus = (item) => {
    const hasPending = item.reports?.some(r => r.status === 'Pending');
    const hasUnderReview = item.reports?.some(r => r.status === 'Under Review');
    if (hasPending) return 'Pending';
    if (hasUnderReview) return 'Under Review';
    return 'Resolved/Dismissed';
  };

  const renderReviewView = () => {
    if (!selectedItem) return null;

    return (
      <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <button className="btn btn-ghost" style={{ alignSelf: 'flex-start', padding: 0 }} onClick={() => setSelectedItem(null)}>
          ← Back to List
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          {/* Content Details */}
          <div style={{ padding: 'var(--sp-md)', backgroundColor: 'var(--clr-bg-alt)', borderRadius: 'var(--rad-md)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '5px', borderBottom: '1px solid var(--clr-border)', paddingBottom: '10px' }}>
              Reported {activeTab === 'jobs' ? 'Job' : 'Event'}
            </h3>
            
            <h2 style={{ marginBottom: '5px' }}>{selectedItem.title}</h2>
            {activeTab === 'jobs' ? (
              <>
                <p className="text-muted" style={{ marginBottom: '15px' }}>{selectedItem.company} • {selectedItem.location}</p>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', flexWrap: 'wrap' }}>
                  <span className="badge badge-ghost">{selectedItem.jobType}</span>
                  {selectedItem.ctc && <span className="badge badge-ghost">CTC: {selectedItem.ctc}</span>}
                </div>
              </>
            ) : (
              <>
                <p className="text-muted" style={{ marginBottom: '15px' }}>📅 {new Date(selectedItem.date).toLocaleString()} • 📍 {selectedItem.location || 'Online'}</p>
                <span className="badge badge-ghost" style={{ marginBottom: '15px' }}>{selectedItem.category}</span>
              </>
            )}

            <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '15px', padding: '10px', backgroundColor: 'var(--clr-bg)', borderRadius: 'var(--rad-sm)' }}>
              <p className="text-sm" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{selectedItem.description}</p>
            </div>

            <p className="text-sm">
              <strong>Posted by:</strong> {(activeTab === 'jobs' ? selectedItem.postedBy?.name : selectedItem.createdBy?.name) || 'Unknown'} 🎓
            </p>
          </div>

          {/* Reports Review */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '5px', borderBottom: '1px solid var(--clr-border)', paddingBottom: '10px' }}>
              Reports ({selectedItem.reports?.length || 0})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
              {selectedItem.reports?.map((report, idx) => (
                <div key={report._id} style={{ padding: 'var(--sp-md)', border: '1px solid var(--clr-border)', borderRadius: 'var(--rad-sm)', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span className="text-sm text-muted">REPORT #{report._id.substring(report._id.length - 6)}</span>
                    {getStatusBadge(report.status)}
                  </div>
                  
                  <p className="text-sm" style={{ marginBottom: '5px' }}>
                    <strong>Reason:</strong> {report.reason}
                  </p>
                  <p className="text-sm text-faint" style={{ marginBottom: '15px' }}>
                    Reported by {report.reportedBy?.name || 'Unknown'} on {new Date(report.createdAt).toLocaleDateString()}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px dashed var(--clr-border)', paddingTop: '15px' }}>
                    <span className="text-sm" style={{ fontWeight: 600 }}>ADMIN ACTION</span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button className="btn btn-sm btn-ghost" onClick={() => handleAction(report._id, 'dismiss')} disabled={report.status === 'Dismissed'}>
                        Dismiss Report
                      </button>
                      <button className="btn btn-sm" style={{ backgroundColor: 'var(--clr-danger)', borderColor: 'var(--clr-danger)' }} onClick={() => handleAction(report._id, 'remove')}>
                        Remove {activeTab === 'jobs' ? 'Job' : 'Event'}
                      </button>
                      <button className="btn btn-sm" style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b' }} onClick={() => handleAction(report._id, 'warn')} disabled={report.status === 'Resolved'}>
                        Warn User
                      </button>
                      <button className="btn btn-sm" style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }} onClick={() => handleAction(report._id, 'suspend')} disabled={report.status === 'Resolved'}>
                        Suspend User
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const currentList = activeTab === 'jobs' ? jobs : events;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">
        <div className="page-header">
          <h1>Content Moderation</h1>
          <p>Review and manage community-reported job postings and events</p>
        </div>

        <div className="moderation-tabs">
          <button
            className={`btn ${activeTab === 'jobs' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('jobs')}
          >
            Reported Jobs ({jobs.length})
          </button>
          <button
            className={`btn ${activeTab === 'events' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('events')}
          >
            Reported Events ({events.length})
          </button>
        </div>

        {loading ? (
          <div className="loading-state"><span className="spinner" /> Loading...</div>
        ) : selectedItem ? (
          renderReviewView()
        ) : (
          <div className="grid-2">
            {currentList.length === 0 ? (
              <p>No reported {activeTab} found.</p>
            ) : currentList.map(item => {
              const status = getOverallStatus(item);
              const isJob = activeTab === 'jobs';
              return (
                <div key={item._id} className="card reported-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div className="reported-card-header">
                    <div>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <h3 className="reported-card-title">{item.title}</h3>
                        <span title={status}>{getStatusIcon(status)}</span>
                      </div>
                      
                      {isJob ? (
                        <p className="text-muted reported-card-sub">{item.company} — {item.location}</p>
                      ) : (
                        <p className="text-muted reported-card-sub">{new Date(item.date).toLocaleDateString()} — {item.location}</p>
                      )}
                      
                      <p className="text-sm reported-info">
                        <strong>Posted by:</strong> {(isJob ? item.postedBy?.name : item.createdBy?.name) || 'Unknown User'}
                      </p>
                      <p className="text-sm reported-count">
                        <strong>Total Reports:</strong> {item.reports?.length || 0}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                    <div className="reported-date text-sm text-faint">
                      Posted: {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                    <button className="btn btn-sm btn-primary" onClick={() => setSelectedItem(item)}>
                      Review Content
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default ContentModeration;
