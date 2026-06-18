import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useState, useEffect } from 'react';

// Auth guards
import { ProtectedRoute, RoleGuard } from './components/auth/ProtectedRoute';

// Public pages
import Landing        from './pages/Home/Landing';
import Login          from './pages/Home/Login';
import RoleSelection  from './pages/Home/RoleSelection';
import StudentRegister from './pages/Home/StudentRegister';
import AlumniRegister from './pages/Home/AlumniRegister';
import About          from './pages/Home/About';

// Student pages
import StudentDashboard    from './pages/Student/Dashboard';
import StudentProfile      from './pages/Student/StudentProfile';
import Network             from './pages/Student/Network';
import AlumniProfile       from './pages/Student/AlumniProfile';
import MyCircle            from './pages/Student/MyCircle';
import JobsHub             from './pages/Student/JobsHub';
import CommunityHub        from './pages/Student/CommunityHub';
import StudentMessages     from './pages/Student/Messages';
import SavedItems          from './pages/Student/SavedItems';

// Alumni pages
import AlumniDashboard        from './pages/Alumni/Dashboard';
import AlumniProfilePage      from './pages/Alumni/AlumniProfile';
import AlumniJobsHub          from './pages/Alumni/JobsHub';
import AlumniCommunityHub     from './pages/Alumni/CommunityHub';
import AlumniMessages         from './pages/Alumni/Messages';

// Admin pages
import AdminDashboard       from './pages/Admin/Dashboard';
import UserManagement       from './pages/Admin/UserManagement';
import ManageColleges       from './pages/Admin/ManageColleges';
import VerificationQueue    from './pages/Admin/VerificationQueue';
import ContentModeration    from './pages/Admin/ContentModeration';
import Analytics            from './pages/Admin/Analytics';
import AdminLogin           from './pages/Admin/AdminLogin';

// Shared
import NotFound       from './pages/Shared/NotFound';
import Unauthorized   from './pages/Shared/Unauthorized';

const ThemeToggle = () => {
  const [isLight, setIsLight] = useState(document.body.classList.contains('light-theme'));

  useEffect(() => {
    if (localStorage.getItem('theme') === 'light') {
      document.body.classList.add('light-theme');
      setIsLight(true);
    }
  }, []);

  const toggleTheme = () => {
    document.body.classList.toggle('light-theme');
    const lightNow = document.body.classList.contains('light-theme');
    setIsLight(lightNow);
    localStorage.setItem('theme', lightNow ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
        background: 'var(--grad-primary)', color: '#fff',
        border: 'none', borderRadius: '50%', width: 56, height: 56,
        fontSize: '1.5rem', cursor: 'pointer',
        boxShadow: 'var(--shadow-md)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'transform var(--tr-fast), box-shadow var(--tr-fast)'
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      title="Toggle Light/Dark Mode"
    >
      {isLight ? '🌙' : '☀️'}
    </button>
  );
};

const App = () => {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <ThemeToggle />
      <Routes>
        {/* ── Public ── */}
        <Route path="/"            element={<Landing />} />
        <Route path="/about"       element={<About />} />
        <Route path="/login"       element={user ? <Navigate to={`/${user.role}/dashboard`} /> : <Login />} />
        <Route path="/admin/login" element={user?.role === 'admin' ? <Navigate to="/admin/dashboard" /> : <AdminLogin />} />
        <Route path="/role-select" element={<RoleSelection />} />
        <Route path="/register/student" element={<StudentRegister />} />
        <Route path="/register/alumni"  element={<AlumniRegister />} />

        {/* ── Student ── */}
        <Route path="/student/dashboard"  element={<RoleGuard role="student"><StudentDashboard /></RoleGuard>} />
        <Route path="/student/profile"    element={<RoleGuard role="student"><StudentProfile /></RoleGuard>} />
        <Route path="/student/network"    element={<RoleGuard role="student"><Network /></RoleGuard>} />
        <Route path="/student/alumni/:id" element={<RoleGuard role="student"><AlumniProfile /></RoleGuard>} />
        <Route path="/student/circle"     element={<RoleGuard role="student"><MyCircle /></RoleGuard>} />
        <Route path="/student/jobs-hub"   element={<RoleGuard role="student"><JobsHub /></RoleGuard>} />
        <Route path="/student/jobs-hub/:section" element={<RoleGuard role="student"><JobsHub /></RoleGuard>} />
        <Route path="/student/community"  element={<RoleGuard role="student"><CommunityHub /></RoleGuard>} />
        <Route path="/student/messages"   element={<RoleGuard role="student"><StudentMessages /></RoleGuard>} />
        <Route path="/student/saved"      element={<RoleGuard role="student"><SavedItems /></RoleGuard>} />

        {/* Legacy redirects for old direct routes */}
        <Route path="/student/jobs"        element={<Navigate to="/student/jobs-hub" replace />} />
        <Route path="/student/applications" element={<Navigate to="/student/jobs-hub" replace />} />
        <Route path="/student/mentorship"  element={<Navigate to="/student/jobs-hub" replace />} />
        <Route path="/student/interviews"  element={<Navigate to="/student/jobs-hub" replace />} />
        <Route path="/student/referrals"   element={<Navigate to="/student/jobs-hub" replace />} />
        <Route path="/student/resumes"     element={<Navigate to="/student/jobs-hub" replace />} />
        <Route path="/student/events"      element={<Navigate to="/student/community" replace />} />
        <Route path="/student/forum"       element={<Navigate to="/student/community" replace />} />
        <Route path="/student/stories"     element={<Navigate to="/student/community" replace />} />
        <Route path="/student/browse"      element={<Navigate to="/student/network" replace />} />

        {/* ── Alumni ── */}
        <Route path="/alumni/dashboard"    element={<RoleGuard role="alumni"><AlumniDashboard /></RoleGuard>} />
        <Route path="/alumni/profile"      element={<RoleGuard role="alumni"><AlumniProfilePage /></RoleGuard>} />
        <Route path="/alumni/network"      element={<RoleGuard role="alumni"><Network /></RoleGuard>} />
        <Route path="/alumni/alumni/:id"   element={<RoleGuard role="alumni"><AlumniProfile /></RoleGuard>} />
        <Route path="/alumni/jobs-hub"     element={<RoleGuard role="alumni"><AlumniJobsHub /></RoleGuard>} />
        <Route path="/alumni/jobs-hub/:section" element={<RoleGuard role="alumni"><AlumniJobsHub /></RoleGuard>} />
        <Route path="/alumni/community"    element={<RoleGuard role="alumni"><AlumniCommunityHub /></RoleGuard>} />
        <Route path="/alumni/saved"        element={<RoleGuard role="alumni"><SavedItems /></RoleGuard>} />
        <Route path="/alumni/messages"     element={<RoleGuard role="alumni"><AlumniMessages /></RoleGuard>} />

        {/* Legacy Redirects for Alumni */}
        <Route path="/alumni/jobs"         element={<Navigate to="/alumni/jobs-hub" replace />} />
        <Route path="/alumni/applications" element={<Navigate to="/alumni/jobs-hub" replace />} />
        <Route path="/alumni/mentorship"   element={<Navigate to="/alumni/jobs-hub" replace />} />
        <Route path="/alumni/slots"        element={<Navigate to="/alumni/jobs-hub" replace />} />
        <Route path="/alumni/interviews"   element={<Navigate to="/alumni/jobs-hub" replace />} />
        <Route path="/alumni/referrals"    element={<Navigate to="/alumni/jobs-hub" replace />} />
        <Route path="/alumni/events"       element={<Navigate to="/alumni/community" replace />} />
        <Route path="/alumni/stories"      element={<Navigate to="/alumni/community" replace />} />

        {/* ── Admin ── */}
        <Route path="/admin/dashboard"     element={<RoleGuard role="admin"><AdminDashboard /></RoleGuard>} />
        <Route path="/admin/users"         element={<RoleGuard role="admin"><UserManagement /></RoleGuard>} />
        <Route path="/admin/colleges"      element={<RoleGuard role="admin"><ManageColleges /></RoleGuard>} />
        <Route path="/admin/verification"  element={<RoleGuard role="admin"><VerificationQueue /></RoleGuard>} />
        <Route path="/admin/moderation"    element={<RoleGuard role="admin"><ContentModeration /></RoleGuard>} />
        <Route path="/admin/analytics"     element={<RoleGuard role="admin"><Analytics /></RoleGuard>} />

        {/* ── Misc ── */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*"             element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
