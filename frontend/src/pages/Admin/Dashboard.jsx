import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { adminService } from '../../services/adminService';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../../styles/Admin/Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [growthData, setGrowthData] = useState([]);
  const [growthTimeframe, setGrowthTimeframe] = useState(30);
  const [growthLoading, setGrowthLoading] = useState(false);

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

  useEffect(() => {
    const fetchGrowth = async () => {
      try {
        setGrowthLoading(true);
        const data = await adminService.getGrowth(growthTimeframe);
        setGrowthData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setGrowthLoading(false);
      }
    };
    fetchGrowth();
  }, [growthTimeframe]);

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
          <>
            {/* Needs Attention Section */}
            {(stats.pendingVerifications > 0 || stats.reportedPosts > 0 || stats.reportedUsers > 0 || stats.jobsApproachingDeadline > 0) && (
              <section className="needs-attention-section">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  ⚠️ Needs Attention
                </h2>
                <div className="needs-attention-grid">
                  {stats.pendingVerifications > 0 && (
                    <div className="attention-card error">
                      <div className="attention-info">
                        <span className="attention-icon">🔴</span>
                        <span><strong>{stats.pendingVerifications}</strong> pending verifications</span>
                      </div>
                      <button className="btn btn-sm btn-outline" onClick={() => navigate('/admin/verification')}>View →</button>
                    </div>
                  )}
                  {stats.reportedPosts > 0 && (
                    <div className="attention-card warning">
                      <div className="attention-info">
                        <span className="attention-icon">🟠</span>
                        <span><strong>{stats.reportedPosts}</strong> reported posts</span>
                      </div>
                      <button className="btn btn-sm btn-outline" onClick={() => navigate('/admin/moderation')}>View →</button>
                    </div>
                  )}
                  {stats.reportedUsers > 0 && (
                    <div className="attention-card warning">
                      <div className="attention-info">
                        <span className="attention-icon">🟠</span>
                        <span><strong>{stats.reportedUsers}</strong> reported users</span>
                      </div>
                      <button className="btn btn-sm btn-outline" onClick={() => navigate('/admin/users')}>View →</button>
                    </div>
                  )}
                  {stats.jobsApproachingDeadline > 0 && (
                    <div className="attention-card caution">
                      <div className="attention-info">
                        <span className="attention-icon">🟡</span>
                        <span><strong>{stats.jobsApproachingDeadline}</strong> jobs approaching deadline</span>
                      </div>
                      <button className="btn btn-sm btn-outline" onClick={() => navigate('/admin/analytics')}>View →</button>
                    </div>
                  )}
                  {stats.expiringColleges > 0 && (
                    <div className="attention-card warning">
                      <div className="attention-info">
                        <span className="attention-icon">⚠️</span>
                        <span><strong>{stats.expiringColleges}</strong> expiring or unpaid colleges</span>
                      </div>
                      <button className="btn btn-sm btn-outline" onClick={() => navigate('/admin/colleges')}>View →</button>
                    </div>
                  )}
                </div>
              </section>
            )}

            <div className="grid-3" style={{ marginTop: '2rem' }}>
              {[
                { emoji: '👥', value: stats.totalUsers,           label: 'Total Users' },
                { emoji: '👨‍🎓', value: stats.totalStudents,       label: 'Students' },
                { emoji: '🎓', value: stats.totalAlumni,          label: 'Alumni' },
                { emoji: '🏛️', value: stats.totalColleges,        label: 'Total Colleges' },
                { emoji: '🤝', value: stats.totalMentorships,     label: 'Mentorship Sessions' },
                { emoji: '🎙️', value: stats.totalMockInterviews,  label: 'Mock Interviews' },
                { emoji: '💼', value: stats.totalJobs,            label: 'Active Jobs' },
                { emoji: '📄', value: stats.totalJobApplications, label: 'Job Applications' },
                { emoji: '📅', value: stats.totalEvents,          label: 'Events Hosted' },
              ].map(({ emoji, value, label, danger }) => (
                <div key={label} className="card admin-stat-card">
                  <div className="stat-card-emoji">{emoji}</div>
                  <h3 className="admin-stat-card-title" style={danger ? { color: 'var(--clr-danger)' } : undefined}>{value || 0}</h3>
                  <p className="text-muted">{label}</p>
                </div>
              ))}
            </div>

            {/* User Growth Chart */}
            <section className="growth-section" style={{ marginTop: '3rem' }}>
              <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>User Growth</h2>
                <div className="timeframe-filters" style={{ display: 'flex', gap: '0.5rem' }}>
                  {[7, 30, 90, 365].map(days => (
                    <button 
                      key={days} 
                      className={`btn btn-sm ${growthTimeframe === days ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setGrowthTimeframe(days)}
                    >
                      {days === 7 ? '7 Days' : days === 30 ? '30 Days' : days === 90 ? '3 Months' : '1 Year'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="card" style={{ height: '400px', padding: '1.5rem', paddingBottom: '2rem' }}>
                {growthLoading && growthData.length === 0 ? (
                  <div className="loading-state"><span className="spinner" /></div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={growthData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="date" tick={{ fill: 'var(--clr-text-muted)' }} />
                      <YAxis tick={{ fill: 'var(--clr-text-muted)' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--clr-surface)', borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                        itemStyle={{ fontWeight: 600 }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Line type="monotone" dataKey="students" stroke="#3b82f6" name="Students" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="alumni" stroke="#10b981" name="Alumni" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>
          </>
        ) : (
          <div className="card" style={{ color: 'var(--clr-danger)' }}>Failed to load analytics.</div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
