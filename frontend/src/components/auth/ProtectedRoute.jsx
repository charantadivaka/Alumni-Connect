import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CollegeLocked from '../../pages/Student/CollegeLocked';

// Blocks unauthenticated users, and handles expired student colleges
export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  
  if (user.role === 'student' && user.college && user.college.subscriptionStatus && user.college.subscriptionStatus !== 'Active') {
    return <CollegeLocked />;
  }
  
  return children;
};

// Blocks users with wrong role, and handles expired student colleges
export const RoleGuard = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role && user.role !== 'admin') return <Navigate to="/unauthorized" replace />;
  
  if (user.role === 'student' && user.college && user.college.subscriptionStatus && user.college.subscriptionStatus !== 'Active') {
    return <CollegeLocked />;
  }

  return children;
};
