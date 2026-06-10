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
import BrowseAlumni        from './pages/Student/BrowseAlumni';
import AlumniProfile       from './pages/Student/AlumniProfile';
import JobBoard            from './pages/Student/JobBoard';
import MyApplications      from './pages/Student/MyApplications';
import MentorshipSessions  from './pages/Student/MentorshipSessions';
import MockInterviews      from './pages/Student/MockInterviews';
import MyReferrals         from './pages/Student/MyReferrals';
import MyResumes           from './pages/Student/MyResumes';
import StudentMessages     from './pages/Student/Messages';
import StudentEvents       from './pages/Student/Events';
import StudentForum        from './pages/Student/Forum';
import StudentStories      from './pages/Student/Stories';
import SavedItems          from './pages/Student/SavedItems';
import AlumniMap           from './pages/Student/AlumniMap';

// Alumni pages
import AlumniDashboard        from './pages/Alumni/Dashboard';
import AlumniProfilePage      from './pages/Alumni/AlumniProfile';
import ManageJobs             from './pages/Alumni/ManageJobs';
import ManageApplications     from './pages/Alumni/ManageApplications';
import MentorshipRequests     from './pages/Alumni/MentorshipRequests';
import ManageSlots            from './pages/Alumni/ManageSlots';
import InterviewRequests      from './pages/Alumni/InterviewRequests';
import ManageReferrals        from './pages/Alumni/ManageReferrals';
import AlumniMessages         from './pages/Alumni/Messages';
import AlumniEvents           from './pages/Alumni/Events';
import AlumniStories          from './pages/Alumni/Stories';
import MyStartup              from './pages/Alumni/MyStartup';

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
        <Route path="/student/dashboard"   element={<RoleGuard role="student"><StudentDashboard /></RoleGuard>} />
        <Route path="/student/profile"     element={<RoleGuard role="student"><StudentProfile /></RoleGuard>} />
        <Route path="/student/browse"      element={<RoleGuard role="student"><BrowseAlumni /></RoleGuard>} />
        <Route path="/student/alumni/:id"  element={<RoleGuard role="student"><AlumniProfile /></RoleGuard>} />
        <Route path="/student/jobs"        element={<RoleGuard role="student"><JobBoard /></RoleGuard>} />
        <Route path="/student/applications" element={<RoleGuard role="student"><MyApplications /></RoleGuard>} />
        <Route path="/student/mentorship"  element={<RoleGuard role="student"><MentorshipSessions /></RoleGuard>} />
        <Route path="/student/interviews"  element={<RoleGuard role="student"><MockInterviews /></RoleGuard>} />
        <Route path="/student/referrals"   element={<RoleGuard role="student"><MyReferrals /></RoleGuard>} />
        <Route path="/student/resumes"     element={<RoleGuard role="student"><MyResumes /></RoleGuard>} />
        <Route path="/student/messages"    element={<RoleGuard role="student"><StudentMessages /></RoleGuard>} />
        <Route path="/student/events"      element={<RoleGuard role="student"><StudentEvents /></RoleGuard>} />
        <Route path="/student/forum"       element={<RoleGuard role="student"><StudentForum /></RoleGuard>} />
        <Route path="/student/stories"     element={<RoleGuard role="student"><StudentStories /></RoleGuard>} />
        <Route path="/student/saved"       element={<RoleGuard role="student"><SavedItems /></RoleGuard>} />
        <Route path="/student/map"         element={<RoleGuard role="student"><AlumniMap /></RoleGuard>} />

        {/* ── Alumni ── */}
        <Route path="/alumni/dashboard"    element={<RoleGuard role="alumni"><AlumniDashboard /></RoleGuard>} />
        <Route path="/alumni/profile"      element={<RoleGuard role="alumni"><AlumniProfilePage /></RoleGuard>} />
        <Route path="/alumni/jobs"         element={<RoleGuard role="alumni"><ManageJobs /></RoleGuard>} />
        <Route path="/alumni/applications" element={<RoleGuard role="alumni"><ManageApplications /></RoleGuard>} />
        <Route path="/alumni/mentorship"   element={<RoleGuard role="alumni"><MentorshipRequests /></RoleGuard>} />
        <Route path="/alumni/slots"        element={<RoleGuard role="alumni"><ManageSlots /></RoleGuard>} />
        <Route path="/alumni/interviews"   element={<RoleGuard role="alumni"><InterviewRequests /></RoleGuard>} />
        <Route path="/alumni/referrals"    element={<RoleGuard role="alumni"><ManageReferrals /></RoleGuard>} />
        <Route path="/alumni/messages"     element={<RoleGuard role="alumni"><AlumniMessages /></RoleGuard>} />
        <Route path="/alumni/events"       element={<RoleGuard role="alumni"><AlumniEvents /></RoleGuard>} />
        <Route path="/alumni/stories"      element={<RoleGuard role="alumni"><AlumniStories /></RoleGuard>} />
        <Route path="/alumni/startup"      element={<RoleGuard role="alumni"><MyStartup /></RoleGuard>} />

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
