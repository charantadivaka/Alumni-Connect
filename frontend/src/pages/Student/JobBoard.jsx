import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { Sidebar } from '../../components/layout/Sidebar';
import { jobService } from '../../services/jobService';
import { bookmarkService } from '../../services/otherServices';
import { useAuth } from '../../context/AuthContext';
import Pagination from '../../components/ui/Pagination';
import { JobModal } from '../../components/ui/JobModal';
import '../../styles/Student/JobBoard.css';

const JobBoard = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [bookmarks, setBookmarks] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const JOBS_PER_PAGE = 10;

  // Search & Sort state
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('latest');
  const debouncedSearch = useDebounce(search, 300);
  
  // Modal states
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [jobsData, bks] = await Promise.all([
          jobService.getAll({ search: debouncedSearch, page: currentPage, limit: JOBS_PER_PAGE }),
          bookmarkService.getAll('Job')
        ]);
        setJobs(jobsData.jobs || jobsData || []);
        setTotalPages(jobsData.totalPages || 1);
        setBookmarks(new Set(bks.map(b => b.refId)));
      } catch (err) {
        console.error('[JobBoard] Fetch failed:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentPage, debouncedSearch]);

  // When search term changes, reset to page 1 (tracked via ref to avoid double-fetch)
  const prevSearchRef = useRef(debouncedSearch);
  useEffect(() => {
    if (prevSearchRef.current !== debouncedSearch) {
      prevSearchRef.current = debouncedSearch;
      setCurrentPage(1);
    }
  }, [debouncedSearch]);

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
  };

  const [reportingJobId, setReportingJobId] = useState(null);
  const [reportReason, setReportReason] = useState('');

  const handleReportJobClick = (e, jobId) => {
    e.stopPropagation();
    setReportingJobId(jobId);
    setReportReason('');
  };

  const submitReportJob = async () => {
    if (!reportReason) {
      alert('Please select a reason for reporting.');
      return;
    }
    try {
      await jobService.report(reportingJobId, { reason: reportReason });
      alert('Job reported to admin successfully.');
      setReportingJobId(null);
    } catch (err) {
      alert(err.message || 'Failed to report job');
    }
  };


  // Sort jobs client-side (search is now server-side)
  const displayedJobs = [...jobs].sort((a, b) => {
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
        ) : displayedJobs.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--sp-xl)' }}>
            <span style={{ fontSize: '2rem' }}>💼</span>
            <h3>No Jobs Found</h3>
            <p className="text-muted">No opportunities match your search criteria.</p>
          </div>
        ) : (
          <div className="grid-2">
            {displayedJobs.map(job => (
              <div 
                key={job._id} 
                className="card" 
                onClick={() => handleCardClick(job)}
                style={{ cursor: 'pointer', transition: 'transform 0.2s', position: 'relative' }}
              >
                <button 
                  onClick={(e) => handleToggleBookmark(e, job._id)}
                  style={{ position: 'absolute', top: 15, right: 45, background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
                  title={bookmarks.has(job._id) ? "Remove Bookmark" : "Save Job"}
                >
                  {bookmarks.has(job._id) ? '🔖' : '🤍'}
                </button>
                <button 
                  onClick={(e) => handleReportJobClick(e, job._id)}
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
                  {job.description && job.description.length > 120
                    ? `${job.description.substring(0, 120)}...`
                    : job.description}
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

        {/* Pagination Controls */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        />

        {/* Modal Overlay for Job Details */}
        {selectedJob && (
          <JobModal selectedJob={selectedJob} closeModal={() => setSelectedJob(null)} />
        )}

        {/* Report Job Modal */}
        {reportingJobId && (
          <div className="modal-overlay-custom" onClick={() => setReportingJobId(null)}>
            <div className="card" style={{ maxWidth: '400px', width: '100%', padding: 'var(--sp-lg)' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ marginTop: 0 }}>Report Job</h3>
              <p className="text-muted text-sm" style={{ marginBottom: 'var(--sp-md)' }}>Please select a reason for reporting this job. This helps our admin team take appropriate action.</p>
              
              <select 
                className="form-input" 
                value={reportReason} 
                onChange={(e) => setReportReason(e.target.value)}
                style={{ marginBottom: 'var(--sp-md)', width: '100%' }}
              >
                <option value="">Select a reason...</option>
                <option value="Fake/scam job">Fake/scam job</option>
                <option value="Incorrect information">Incorrect information</option>
                <option value="Expired job">Expired job</option>
                <option value="Inappropriate content">Inappropriate content</option>
                <option value="Duplicate job">Duplicate job</option>
                <option value="Other">Other</option>
              </select>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setReportingJobId(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={submitReportJob} disabled={!reportReason} style={{ backgroundColor: 'var(--clr-danger)', borderColor: 'var(--clr-danger)' }}>Report</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default JobBoard;
