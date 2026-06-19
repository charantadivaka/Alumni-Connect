import { Link } from 'react-router-dom';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import '../../styles/Home/RoleSelection.css';

const RoleSelection = () => (
  <div>
    <PublicNavbar />
    <div className="role-selection-page">
      <div className="role-selection-inner">
        <h1 className="role-selection-title">I am a...</h1>
        <p className="role-selection-sub">Choose your role to get a tailored experience</p>

        <div className="grid-2">
          <Link to="/register/student" className="role-card-link">
            <div className="card role-card">
              <div className="role-card-icon">👨‍🎓</div>
              <h3 className="role-card-title">Student</h3>
              <p className="role-card-desc">
                Find mentors, apply for jobs, book mock interviews, and build your network with alumni.
              </p>
              <div className="btn btn-primary btn-full role-card-btn">Register as Student</div>
            </div>
          </Link>

          <Link to="/register/alumni" className="role-card-link">
            <div className="card role-card">
              <div className="role-card-icon">💼</div>
              <h3 className="role-card-title">Alumni</h3>
              <p className="role-card-desc">
                Mentor juniors, post jobs, conduct interviews, and give back to your community.
              </p>
              <div className="btn btn-primary btn-full role-card-btn">Register as Alumni</div>
            </div>
          </Link>
        </div>

        <p className="role-footer">
          Already have an account? <Link to="/login" className="auth-footer-link">Sign in</Link>
        </p>
      </div>
    </div>
  </div>
);

export default RoleSelection;
