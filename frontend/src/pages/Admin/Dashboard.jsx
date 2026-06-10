import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { adminService } from '../../services/adminService';
import { api } from '../../services/api';

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
          <div style={{ padding: 'var(--sp-xl)', textAlign: 'center' }}><span className="spinner" /> Loading...</div>
        ) : stats ? (
          <div className="grid-3" style={{ gap: 'var(--sp-md)' }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem' }}>👥</div>
              <h3 style={{ margin: '8px 0 0' }}>{stats.totalUsers}</h3>
              <p className="text-muted">Total Users</p>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem' }}>👨‍🎓</div>
              <h3 style={{ margin: '8px 0 0' }}>{stats.totalStudents}</h3>
              <p className="text-muted">Students</p>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem' }}>🎓</div>
              <h3 style={{ margin: '8px 0 0' }}>{stats.totalAlumni}</h3>
              <p className="text-muted">Alumni</p>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem' }}>🤝</div>
              <h3 style={{ margin: '8px 0 0' }}>{stats.totalMentorships}</h3>
              <p className="text-muted">Mentorship Sessions</p>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem' }}>🎙️</div>
              <h3 style={{ margin: '8px 0 0' }}>{stats.totalMockInterviews}</h3>
              <p className="text-muted">Mock Interviews</p>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem' }}>💼</div>
              <h3 style={{ margin: '8px 0 0' }}>{stats.totalJobs}</h3>
              <p className="text-muted">Active Jobs</p>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem' }}>📄</div>
              <h3 style={{ margin: '8px 0 0' }}>{stats.totalJobApplications}</h3>
              <p className="text-muted">Job Applications</p>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem' }}>📅</div>
              <h3 style={{ margin: '8px 0 0' }}>{stats.totalEvents}</h3>
              <p className="text-muted">Events Hosted</p>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem' }}>✅</div>
              <h3 style={{ margin: '8px 0 0', color: stats.pendingVerifications > 0 ? 'var(--clr-danger)' : 'var(--clr-text)' }}>
                {stats.pendingVerifications}
              </h3>
              <p className="text-muted">Pending Verifications</p>
            </div>
          </div>
        ) : (
          <div className="card" style={{ color: 'var(--clr-danger)' }}>Failed to load analytics.</div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
