import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { adminService } from '../../services/adminService';

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await adminService.getAnalytics();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">
        <div className="page-header">
          <h1>Platform Analytics</h1>
          <p>Detailed insights into user engagement and platform activity</p>
        </div>

        {loading ? (
          <div style={{ padding: 'var(--sp-xl)', textAlign: 'center' }}><span className="spinner" /> Loading...</div>
        ) : stats ? (
          <>
            <h3 style={{ marginBottom: 'var(--sp-md)' }}>Engagement & Networking</h3>
            <div className="grid-3" style={{ gap: 'var(--sp-md)', marginBottom: 'var(--sp-lg)' }}>
              <div className="card" style={{ textAlign: 'center', borderTop: '4px solid var(--clr-primary)' }}>
                <div style={{ fontSize: '2rem' }}>🤝</div>
                <h2 style={{ margin: '8px 0 0' }}>{stats.totalMentorships}</h2>
                <p className="text-muted">Mentorships Initiated</p>
              </div>
              <div className="card" style={{ textAlign: 'center', borderTop: '4px solid var(--clr-primary)' }}>
                <div style={{ fontSize: '2rem' }}>🎙️</div>
                <h2 style={{ margin: '8px 0 0' }}>{stats.totalMockInterviews || 0}</h2>
                <p className="text-muted">Mock Interviews Scheduled</p>
              </div>
              <div className="card" style={{ textAlign: 'center', borderTop: '4px solid var(--clr-primary)' }}>
                <div style={{ fontSize: '2rem' }}>💬</div>
                <h2 style={{ margin: '8px 0 0' }}>{stats.totalForums}</h2>
                <p className="text-muted">Forum Discussions</p>
              </div>
            </div>

            <h3 style={{ marginBottom: 'var(--sp-md)' }}>Career & Opportunities</h3>
            <div className="grid-3" style={{ gap: 'var(--sp-md)', marginBottom: 'var(--sp-lg)' }}>
              <div className="card" style={{ textAlign: 'center', borderTop: '4px solid var(--clr-success)' }}>
                <div style={{ fontSize: '2rem' }}>💼</div>
                <h2 style={{ margin: '8px 0 0' }}>{stats.totalJobs}</h2>
                <p className="text-muted">Active Job Postings</p>
              </div>
              <div className="card" style={{ textAlign: 'center', borderTop: '4px solid var(--clr-success)' }}>
                <div style={{ fontSize: '2rem' }}>📄</div>
                <h2 style={{ margin: '8px 0 0' }}>{stats.totalJobApplications || 0}</h2>
                <p className="text-muted">Applications Submitted</p>
              </div>
              <div className="card" style={{ textAlign: 'center', borderTop: '4px solid var(--clr-success)' }}>
                <div style={{ fontSize: '2rem' }}>🏆</div>
                <h2 style={{ margin: '8px 0 0' }}>{stats.totalStories}</h2>
                <p className="text-muted">Success Stories Published</p>
              </div>
            </div>

            <h3 style={{ marginBottom: 'var(--sp-md)' }}>Growth Metrics</h3>
            <div className="grid-2" style={{ gap: 'var(--sp-md)' }}>
              <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, color: 'var(--clr-text-muted)' }}>Recent User Registrations (Last 7 Days)</h4>
                  <h2 style={{ margin: '8px 0 0', color: 'var(--clr-primary)' }}>+{stats.recentRegistrations || 0}</h2>
                </div>
                <div style={{ fontSize: '2.5rem' }}>📈</div>
              </div>
              <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, color: 'var(--clr-text-muted)' }}>Pending Alumni Verifications</h4>
                  <h2 style={{ margin: '8px 0 0', color: stats.pendingVerifications > 0 ? 'var(--clr-danger)' : 'var(--clr-text)' }}>
                    {stats.pendingVerifications}
                  </h2>
                </div>
                <div style={{ fontSize: '2.5rem' }}>⏳</div>
              </div>
            </div>
          </>
        ) : (
          <div className="card" style={{ color: 'var(--clr-danger)' }}>Failed to load analytics data.</div>
        )}
      </main>
    </div>
  );
};

export default Analytics;

