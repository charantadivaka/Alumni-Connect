import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { adminService } from '../../services/adminService';

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

  useEffect(() => {
    fetchQueue();
  }, []);

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

        {error && <div className="card" style={{ color: 'var(--clr-danger)', marginBottom: 'var(--sp-md)' }}>{error}</div>}

        {loading ? (
          <div style={{ padding: 'var(--sp-xl)', textAlign: 'center' }}><span className="spinner" /> Loading...</div>
        ) : queue.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--sp-xl)' }}>
            <span style={{ fontSize: '2rem' }}>✅</span>
            <h3>All Caught Up!</h3>
            <p className="text-muted">No pending alumni verifications.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--sp-md)' }}>
            {queue.map(user => (
              <div key={user._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{user.name}</h3>
                  <p className="text-muted" style={{ margin: '4px 0' }}>{user.email} • {user.department} • Class of {user.graduationYear}</p>
                  <p className="text-sm"><strong>Company:</strong> {user.company}</p>
                  {user.idProof && (
                    <a href={user.idProof} target="_blank" rel="noreferrer" style={{ fontSize: '0.875rem', color: 'var(--clr-primary)' }}>
                      📄 View ID Proof
                    </a>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-primary" onClick={() => handleVerify(user._id, 'Verified')}>Approve</button>
                  <button className="btn btn-ghost" onClick={() => handleVerify(user._id, 'Rejected')} style={{ color: 'var(--clr-danger)' }}>Reject</button>
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
