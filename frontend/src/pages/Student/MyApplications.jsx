import { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { applicationService } from '../../services/jobService';
import '../../styles/Student/MyApplications.css';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // desc = newest first

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const data = await applicationService.getMy();
        setApplications(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch applications.');
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  const handleWithdraw = async (id) => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) return;
    try {
      await applicationService.withdraw(id);
      // Remove from list or mark as withdrawn
      setApplications(prev => prev.map(app => app._id === id ? { ...app, isWithdrawn: true } : app));
    } catch (err) {
      alert(err.message || 'Failed to withdraw application.');
    }
  };

  const filteredAndSortedApplications = useMemo(() => {
    let result = [...applications];

    // Filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(app => {
        const title = app.job?.title?.toLowerCase() || '';
        const company = app.job?.company?.toLowerCase() || '';
        return title.includes(q) || company.includes(q);
      });
    }

    // Sort
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
            <h1>My Applications</h1>
            <p>Track the status of jobs you have applied for.</p>
          </div>
        </div>

        {error && <div className="card" style={{ color: 'var(--clr-danger)', marginBottom: 'var(--sp-md)' }}>{error}</div>}

        <div className="card" style={{ marginBottom: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label className="form-label text-sm text-muted" style={{ marginBottom: '4px' }}>Filter Applications</label>
            <input 
              type="text" 
              placeholder="Search by company or designation..." 
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
            <p className="text-muted">You haven't applied to any jobs that match your criteria.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--sp-md)' }}>
            {filteredAndSortedApplications.map(app => (
              <div key={app._id} className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: '250px' }}>
                  <h3 style={{ margin: '0 0 4px 0' }}>{app.job?.title || 'Unknown Job'}</h3>
                  <p className="text-muted" style={{ margin: '0 0 8px 0', fontSize: '0.875rem' }}>
                    {app.job?.company || 'Unknown Company'} • {app.job?.location || 'Unknown Location'}
                  </p>
                  <p className="text-sm text-faint" style={{ margin: 0 }}>
                    Applied on: {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                  {app.isWithdrawn ? (
                    <span className="badge badge-ghost">Withdrawn</span>
                  ) : (
                    <span className={`badge ${app.stage === 'Applied' ? 'badge-primary' : app.stage === 'Rejected' ? 'badge-danger' : app.stage === 'Offer' ? 'badge-success' : 'badge-ghost'}`}>
                      {app.stage}
                    </span>
                  )}

                  {!app.isWithdrawn && app.stage === 'Applied' && (
                    <button 
                      className="btn btn-sm btn-ghost" 
                      style={{ color: 'var(--clr-danger)', padding: 0 }}
                      onClick={() => handleWithdraw(app._id)}
                    >
                      Withdraw Application
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyApplications;
