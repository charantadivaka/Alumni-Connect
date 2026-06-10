import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { Link } from 'react-router-dom';

const About = () => (
  <div>
    <PublicNavbar />
    <div style={{ minHeight: '100vh', padding: '100px var(--sp-lg) var(--sp-2xl)', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 'var(--sp-sm)' }}>About <span className="text-gradient">AlumniConnect</span></h1>
      <p style={{ marginBottom: 'var(--sp-xl)', fontSize: '1.1rem' }}>
        Bridging the gap between students and alumni for real career growth.
      </p>

      {[
        { title: '🎯 Our Mission', text: 'Create a structured, role-based platform where university students can access mentorship, mock interviews, job referrals, and community discussions — directly from alumni who walked the same halls.' },
        { title: '🔐 How Authentication Works', text: 'Students and alumni go through separate onboarding flows. Alumni are verified by admin via ID proof review. JWT tokens are stored in httpOnly cookies — fully XSS resistant.' },
        { title: '⚡ Smart Matching', text: 'Our algorithm scores every alumnus against your skills and career interests. The more overlap, the higher the match score — so you always see the most relevant mentors first.' },
        { title: '💼 Job Board', text: 'Alumni post jobs at their companies. Students apply with a resume directly on the platform. Alumni manage applications through a 5-stage pipeline: Applied → Under Review → Interview → Offer → Rejected.' },
      ].map(({ title, text }) => (
        <div key={title} className="card" style={{ marginBottom: 'var(--sp-md)' }}>
          <h3 style={{ marginBottom: 'var(--sp-sm)', color: 'var(--clr-text)' }}>{title}</h3>
          <p style={{ fontSize: '0.9rem' }}>{text}</p>
        </div>
      ))}

      <div style={{ textAlign: 'center', marginTop: 'var(--sp-xl)' }}>
        <Link to="/role-select" className="btn btn-primary" style={{ padding: '14px 40px' }}>Join Now</Link>
      </div>
    </div>
  </div>
);

export default About;
