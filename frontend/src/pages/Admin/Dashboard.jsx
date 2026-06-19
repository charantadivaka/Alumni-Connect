import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { adminService } from '../../services/adminService';
import '../../styles/Admin/Dashboard.css';

const Dashboard = () => {
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
          <h1>Admin Dashboard</h1>
          <p>Platform overview and real-time statistics</p>
        </div>

        {loading ? (
          <div className="loading-state"><span className="spinner" /> Loading...</div>
        ) : stats ? (
          <div className="grid-3">
            {[
              { emoji: '👥', value: stats.totalUsers,           label: 'Total Users' },
              { emoji: '👨‍🎓', value: stats.totalStudents,       label: 'Students' },
              { emoji: '🎓', value: stats.totalAlumni,          label: 'Alumni' },
              { emoji: '🤝', value: stats.totalMentorships,     label: 'Mentorship Sessions' },
              { emoji: '🎙️', value: stats.totalMockInterviews,  label: 'Mock Interviews' },
              { emoji: '💼', value: stats.totalJobs,            label: 'Active Jobs' },
              { emoji: '📄', value: stats.totalJobApplications, label: 'Job Applications' },
              { emoji: '📅', value: stats.totalEvents,          label: 'Events Hosted' },
              { emoji: '✅', value: stats.pendingVerifications, label: 'Pending Verifications', danger: stats.pendingVerifications > 0 },
            ].map(({ emoji, value, label, danger }) => (
              <div key={label} className="card admin-stat-card">
                <div className="stat-card-emoji">{emoji}</div>
                <h3 className="admin-stat-card-title" style={danger ? { color: 'var(--clr-danger)' } : undefined}>{value}</h3>
                <p className="text-muted">{label}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ color: 'var(--clr-danger)' }}>Failed to load analytics.</div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
