import { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { adminService } from '../../services/adminService';
import '../../styles/Admin/VerificationQueue.css';

const VerificationQueue = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

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
      if (selectedUser && selectedUser._id === id) {
        setSelectedUser(null);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredQueue = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return queue.filter(user => {
      const nameMatch = user.name?.toLowerCase().includes(term);
      const collegeMatch = user.college?.name?.toLowerCase().includes(term);
      return nameMatch || collegeMatch;
    });
  }, [queue, searchTerm]);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">
        <div className="page-header">
          <h1>Verification Queue</h1>
          <p>Review and verify new alumni registrations</p>
        </div>

        {error && <div className="feedback-banner feedback-banner--error">{error}</div>}

        <div className="page-header-row">
          <input 
            type="text" 
            placeholder="Search by name or college..." 
            className="form-input"
            style={{ maxWidth: '300px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="loading-state"><span className="spinner" /> Loading...</div>
        ) : filteredQueue.length === 0 ? (
          <div className="card verification-empty">
            <span className="verification-empty-icon">✅</span>
            <h3>All Caught Up!</h3>
            <p className="text-muted">No pending alumni verifications match your search.</p>
          </div>
        ) : (
          <div className="verification-list">
            {filteredQueue.map(user => (
              <div key={user._id} className="card verification-card">
                <div>
                  <h3 className="verification-name">{user.name}</h3>
                  <p className="text-muted verification-meta">
                    {user.email} • {user.college?.name || 'N/A'} • {user.department} • Class of {user.graduationYear}
                  </p>
                  <p className="text-sm"><strong>Company:</strong> {user.company}</p>
                </div>
                <div className="table-actions">
                  <button className="btn btn-secondary" onClick={() => setSelectedUser(user)}>Review</button>
                  <button className="btn btn-primary" onClick={() => handleVerify(user._id, 'Verified')}>Approve</button>
                  <button className="btn btn-ghost" style={{ color: 'var(--clr-danger)' }} onClick={() => handleVerify(user._id, 'Rejected')}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Review Modal */}
        {selectedUser && (
          <div className="modal-overlay-custom" onClick={() => setSelectedUser(null)}>
            <div className="card college-form-card" onClick={e => e.stopPropagation()}>
              <div className="college-form-header">
                <h2 className="college-form-title">Review Alumni Profile</h2>
                <button className="college-form-close" onClick={() => setSelectedUser(null)}>×</button>
              </div>
              <div className="form-group">
                <p><strong>Name:</strong> {selectedUser.name}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>College:</strong> {selectedUser.college?.name || 'N/A'}</p>
                <p><strong>Roll Number:</strong> {selectedUser.collegeRollNumber || 'N/A'}</p>
                <p><strong>Department:</strong> {selectedUser.department}</p>
                <p><strong>Graduation Year:</strong> {selectedUser.graduationYear}</p>
                <p><strong>Current Company:</strong> {selectedUser.company || 'N/A'}</p>
                <p><strong>Current Designation/Role:</strong> {selectedUser.designation || 'N/A'}</p>
                <p><strong>Registered At:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                {selectedUser.idProof && (
                  <p>
                    <strong>ID Proof: </strong>
                    <a href={selectedUser.idProof} target="_blank" rel="noreferrer" className="verification-id-link">
                      📄 View Document
                    </a>
                  </p>
                )}
              </div>
              <div className="form-actions" style={{ justifyContent: 'flex-end', marginTop: '20px' }}>
                <button className="btn btn-primary" onClick={() => handleVerify(selectedUser._id, 'Verified')}>Approve</button>
                <button className="btn btn-ghost" style={{ color: 'var(--clr-danger)' }} onClick={() => handleVerify(selectedUser._id, 'Rejected')}>Reject</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default VerificationQueue;
