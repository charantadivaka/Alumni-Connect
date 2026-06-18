import { Link } from 'react-router-dom';
import { PublicNavbar } from '../../components/layout/PublicNavbar';

const RoleSelection = () => (
  <div>
    <PublicNavbar />
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px var(--sp-lg)' }}>
      <div style={{ textAlign: 'center', maxWidth: 700 }}>
        <h1 style={{ marginBottom: 'var(--sp-sm)' }}>I am a...</h1>
        <p style={{ marginBottom: 'var(--sp-xl)' }}>Choose your role to get a tailored experience</p>

        <div className="grid-2" style={{ gap: 'var(--sp-lg)' }}>
          <Link to="/register/student" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ padding: 'var(--sp-xl)', cursor: 'pointer', textAlign: 'center', border: '2px solid transparent', transition: 'border-color 0.2s' }}
              onMouseOver={e => e.currentTarget.style.borderColor = 'var(--clr-primary)'}
              onMouseOut={e => e.currentTarget.style.borderColor = 'transparent'}>
              <div style={{ fontSize: '3.5rem', marginBottom: 'var(--sp-md)' }}>👨‍🎓</div>
              <h3 style={{ marginBottom: 'var(--sp-sm)', color: 'var(--clr-text)' }}>Student</h3>
              <p style={{ fontSize: '0.9rem' }}>
                Find mentors, apply for jobs, book mock interviews, and build your network with alumni.
              </p>
              <div className="btn btn-primary btn-full" style={{ marginTop: 'var(--sp-lg)' }}>Register as Student</div>
            </div>
          </Link>

          <Link to="/register/alumni" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ padding: 'var(--sp-xl)', cursor: 'pointer', textAlign: 'center', border: '2px solid transparent', transition: 'border-color 0.2s' }}
              onMouseOver={e => e.currentTarget.style.borderColor = 'var(--clr-primary)'}
              onMouseOut={e => e.currentTarget.style.borderColor = 'transparent'}>
              <div style={{ fontSize: '3.5rem', marginBottom: 'var(--sp-md)' }}>💼</div>
              <h3 style={{ marginBottom: 'var(--sp-sm)', color: 'var(--clr-text)' }}>Alumni</h3>
              <p style={{ fontSize: '0.9rem' }}>
                Mentor juniors, post jobs, conduct interviews, and give back to your community.
              </p>
              <div className="btn btn-primary btn-full" style={{ marginTop: 'var(--sp-lg)' }}>Register as Alumni</div>
            </div>
          </Link>
        </div>

        <p style={{ marginTop: 'var(--sp-lg)', fontSize: '0.875rem', color: 'var(--clr-text-muted)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--clr-primary)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  </div>
);

export default RoleSelection;
