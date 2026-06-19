import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { adminService } from '../../services/adminService';
import '../../styles/Admin/Analytics.css';

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
          <div className="loading-state"><span className="spinner" /> Loading...</div>
        ) : stats ? (
          <>
            <h3 className="analytics-section-title">Engagement &amp; Networking</h3>
            <div className="grid-3 analytics-grid">
              {[
                { emoji: '🤝', value: stats.totalMentorships,         label: 'Mentorships Initiated' },
                { emoji: '🎙️', value: stats.totalMockInterviews || 0, label: 'Mock Interviews Scheduled' },
                { emoji: '💬', value: stats.totalForums,              label: 'Forum Discussions' },
              ].map(({ emoji, value, label }) => (
                <div key={label} className="card analytics-card-primary">
                  <div className="analytics-card-emoji">{emoji}</div>
                  <h2 className="analytics-card-stat">{value}</h2>
                  <p className="text-muted">{label}</p>
                </div>
              ))}
            </div>

            <h3 className="analytics-section-title">Career &amp; Opportunities</h3>
            <div className="grid-3 analytics-grid">
              {[
                { emoji: '💼', value: stats.totalJobs,                  label: 'Active Job Postings' },
                { emoji: '📄', value: stats.totalJobApplications || 0,  label: 'Applications Submitted' },
                { emoji: '🏆', value: stats.totalStories,               label: 'Success Stories Published' },
              ].map(({ emoji, value, label }) => (
                <div key={label} className="card analytics-card-success">
                  <div className="analytics-card-emoji">{emoji}</div>
                  <h2 className="analytics-card-stat">{value}</h2>
                  <p className="text-muted">{label}</p>
                </div>
              ))}
            </div>

            <h3 className="analytics-section-title">Growth Metrics</h3>
            <div className="grid-2">
              <div className="card analytics-growth-card">
                <div>
                  <h4 className="analytics-growth-label">Recent User Registrations (Last 7 Days)</h4>
                  <h2 className="analytics-growth-value">+{stats.recentRegistrations || 0}</h2>
                </div>
                <div className="analytics-growth-icon">📈</div>
              </div>
              <div className="card analytics-growth-card">
                <div>
                  <h4 className="analytics-growth-label">Pending Alumni Verifications</h4>
                  <h2 className="analytics-card-stat" style={{ color: stats.pendingVerifications > 0 ? 'var(--clr-danger)' : 'var(--clr-text)' }}>
                    {stats.pendingVerifications}
                  </h2>
                </div>
                <div className="analytics-growth-icon">⏳</div>
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
