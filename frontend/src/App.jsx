import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Spinner } from './components/ui';
import { VideoCallProvider } from './context/VideoCallContext';
import VideoCallModal from './components/ui/VideoCallModal';

// Auth guards
import { ProtectedRoute, RoleGuard } from './components/auth/ProtectedRoute';

// Public pages
const Landing         = lazy(() => import('./pages/Home/Landing'));
const Login           = lazy(() => import('./pages/Home/Login'));
const RoleSelection   = lazy(() => import('./pages/Home/RoleSelection'));
const StudentRegister = lazy(() => import('./pages/Home/StudentRegister'));
const AlumniRegister  = lazy(() => import('./pages/Home/AlumniRegister'));
const About           = lazy(() => import('./pages/Home/About'));
const ForgotPassword  = lazy(() => import('./pages/Home/ForgotPassword'));
const ResetPassword   = lazy(() => import('./pages/Home/ResetPassword'));

// Student pages
const StudentDashboard    = lazy(() => import('./pages/Student/Dashboard'));
const StudentProfile      = lazy(() => import('./pages/Student/StudentProfile'));
const Network             = lazy(() => import('./pages/Student/Network'));
const AlumniProfile       = lazy(() => import('./pages/Student/AlumniProfile'));
const MyCircle            = lazy(() => import('./pages/Student/MyCircle'));
const JobsHub             = lazy(() => import('./pages/Student/JobsHub'));
const CommunityHub        = lazy(() => import('./pages/Student/CommunityHub'));
const StudentMessages     = lazy(() => import('./pages/Student/Messages'));
const SavedItems          = lazy(() => import('./pages/Student/SavedItems'));
const StudentPublicProfile = lazy(() => import('./pages/Student/StudentPublicProfile'));

// Alumni pages
const AlumniDashboard        = lazy(() => import('./pages/Alumni/Dashboard'));
const AlumniProfilePage      = lazy(() => import('./pages/Alumni/AlumniProfile'));
const AlumniJobsHub          = lazy(() => import('./pages/Alumni/JobsHub'));
const AlumniCommunityHub     = lazy(() => import('./pages/Alumni/CommunityHub'));
const AlumniMessages         = lazy(() => import('./pages/Alumni/Messages'));

// Admin pages
const AdminDashboard       = lazy(() => import('./pages/Admin/Dashboard'));
const UserManagement       = lazy(() => import('./pages/Admin/UserManagement'));
const ManageColleges       = lazy(() => import('./pages/Admin/ManageColleges'));
const VerificationQueue    = lazy(() => import('./pages/Admin/VerificationQueue'));
const ContentModeration    = lazy(() => import('./pages/Admin/ContentModeration'));
const Analytics            = lazy(() => import('./pages/Admin/Analytics'));
const AdminLogin           = lazy(() => import('./pages/Admin/AdminLogin'));

// Shared
const NotFound       = lazy(() => import('./pages/Shared/NotFound'));
const Unauthorized   = lazy(() => import('./pages/Shared/Unauthorized'));

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
    <VideoCallProvider>
      <VideoCallModal />
      <BrowserRouter>
        <ThemeToggle />
        <Suspense fallback={<Spinner />}>
          <Routes>
          {/* ── Public ── */}
          <Route path="/"            element={<Landing />} />
          <Route path="/about"       element={<About />} />
          <Route path="/login"       element={user ? <Navigate to={`/${user.role}/dashboard`} /> : <Login />} />
          <Route path="/admin/login" element={user?.role === 'admin' ? <Navigate to="/admin/dashboard" /> : <AdminLogin />} />
          <Route path="/role-select" element={<RoleSelection />} />
          <Route path="/register/student"  element={<StudentRegister />} />
          <Route path="/register/alumni"   element={<AlumniRegister />} />
          <Route path="/forgot-password"   element={<ForgotPassword />} />
          <Route path="/reset-password"    element={<ResetPassword />} />

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
          <Route path="/student/student/:id" element={<RoleGuard role="student"><StudentPublicProfile /></RoleGuard>} />

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
          <Route path="/alumni/student/:id"  element={<RoleGuard role="alumni"><StudentPublicProfile /></RoleGuard>} />
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
        </Suspense>
      </BrowserRouter>
    </VideoCallProvider>
  );
};

export default App;
