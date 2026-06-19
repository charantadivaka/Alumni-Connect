import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { adminService } from '../../services/adminService';
import '../../styles/Admin/VerificationQueue.css';

const VerificationQueue = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchQueue = async () => {
    try {
      const data = await adminService.getVerificationQueue();
      setQueue(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQueue(); }, []);

  const handleVerify = async (id, status) => {
    try {
      await adminService.verifyAlumni(id, status);
      setQueue(queue.filter(user => user._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">
        <div className="page-header">
          <h1>Verification Queue</h1>
          <p>Review and verify new alumni registrations</p>
        </div>

        {error && <div className="feedback-banner feedback-banner--error">{error}</div>}

        {loading ? (
          <div className="loading-state"><span className="spinner" /> Loading...</div>
        ) : queue.length === 0 ? (
          <div className="card verification-empty">
            <span className="verification-empty-icon">✅</span>
            <h3>All Caught Up!</h3>
            <p className="text-muted">No pending alumni verifications.</p>
          </div>
        ) : (
          <div className="verification-list">
            {queue.map(user => (
              <div key={user._id} className="card verification-card">
                <div>
                  <h3 className="verification-name">{user.name}</h3>
                  <p className="text-muted verification-meta">
                    {user.email} • {user.department} • Class of {user.graduationYear}
                  </p>
                  <p className="text-sm"><strong>Company:</strong> {user.company}</p>
                  {user.idProof && (
                    <a href={user.idProof} target="_blank" rel="noreferrer" className="verification-id-link">
                      📄 View ID Proof
                    </a>
                  )}
                </div>
                <div className="table-actions">
                  <button className="btn btn-primary" onClick={() => handleVerify(user._id, 'Verified')}>Approve</button>
                  <button className="btn btn-ghost" style={{ color: 'var(--clr-danger)' }} onClick={() => handleVerify(user._id, 'Rejected')}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default VerificationQueue;
