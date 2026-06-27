import { Link } from 'react-router-dom';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { PublicFooter } from '../../components/layout/PublicFooter';
import '../../styles/Home/Landing.css';

const features = [
  { icon: '🏫', title: 'Verified Campus Connections', desc: 'Connect exclusively with verified alumni who graduated from your own university and want to pay it forward.' },
  { icon: '🤝', title: 'Fast-Track Referrals',        desc: 'Skip the resume black hole. Ask alumni working at your dream companies for direct job referrals.' },
  { icon: '🎯', title: 'Personal Career Guides',      desc: 'Schedule 1-on-1 mentorship sessions with alumni who have successfully walked the path you want to take.' },
  { icon: '🎤', title: 'Practice with Insiders',      desc: 'Do realistic mock interviews with alumni who actually interview candidates at top companies.' },
  { icon: '💼', title: 'Internal Job Postings',       desc: 'Apply to high-quality job opportunities posted directly by alumni looking to hire from their same college.' },
  { icon: '💬', title: 'Instant Mentorship Chat',     desc: 'Get quick career advice, resume reviews, or job guidance via instant messaging with online alumni.' },
  { icon: '👥', title: 'Campus Career Forum',         desc: 'Join discussions, ask questions, and read success stories shared by your university community.' },
  { icon: '📅', title: 'Alumni-Led Webinars',        desc: 'Attend live panels, Q&A sessions, and career workshops hosted by industry-leading alumni.' },
];

const Landing = () => {
  return (
    <div>
      <PublicNavbar />

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-wrapper">
          {/* Background Image Container */}
          <div className="landing-hero-bg" />

          <div className="landing-hero-content">
            <div className="badge badge-primary landing-hero-badge">
              🎓 Campus × Career Platform
            </div>
            <h1 className="landing-hero-title">
              Where <span className="text-gradient">Students Meet Alumni</span>{' '}
              Who've Been There
            </h1>
            <p className="landing-hero-desc">
              Get mentored, ace your interviews, land referrals, and find jobs —
              all from alumni who graduated from your university.
            </p>
            <div className="landing-hero-cta">
              <Link to="/role-select" className="btn btn-primary landing-hero-btn">
                Get Started Free
              </Link>
              <Link to="/about" className="btn btn-outline landing-hero-btn">
                How It Works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-features">
        <h2 className="landing-features-title">Everything You Need</h2>
        <p className="landing-features-sub">
          One platform for every step of your career journey.
        </p>
        <div className="grid-4 landing-features-grid">
          {features.map(f => (
            <div key={f.title} className="card landing-feature-card">
              <div className="landing-feature-icon">{f.icon}</div>
              <h4 className="landing-feature-title">{f.title}</h4>
              <p className="landing-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta">
        <h2 className="landing-cta-title">Ready to Accelerate Your Career?</h2>
        <p className="landing-cta-sub">Join thousands of students who found their path through alumni connections.</p>
        <Link to="/role-select" className="btn btn-primary landing-cta-btn">
          Join AlumniConnect
        </Link>
      </section>

      <PublicFooter />
    </div>
  );
};

export default Landing;
