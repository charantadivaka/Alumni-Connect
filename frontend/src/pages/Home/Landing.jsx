import { Link } from 'react-router-dom';
import { PublicNavbar } from '../../components/layout/PublicNavbar';

const features = [
  { icon: '🔐', title: 'Dual-Role Auth',     desc: 'Separate onboarding for students and alumni with JWT + httpOnly cookies.' },
  { icon: '🎯', title: 'Smart Matching',      desc: 'Algorithm scores alumni by shared skills, industry, and career interests.' },
  { icon: '💼', title: 'Dynamic Job Board',   desc: 'Alumni post jobs; students apply and track through a 5-stage pipeline.' },
  { icon: '🎓', title: 'Mentorship System',   desc: 'Book mentorship slots, receive feedback, and grow your career.' },
  { icon: '🎤', title: 'Mock Interviews',     desc: 'Practice technical, HR, or case study interviews with real alumni.' },
  { icon: '🤝', title: 'Referral Network',    desc: 'Request and receive referrals from alumni at top companies.' },
  { icon: '💬', title: 'Real-time Chat',      desc: 'Socket.io powered 1-on-1 messaging with online presence indicators.' },
  { icon: '🤖', title: 'AI Career Assistant', desc: 'Get resume tips, career path advice, and interview preparation.' },
];

const Landing = () => (
  <div>
    <PublicNavbar />

    {/* Hero */}
    <section style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 60% 40%, rgba(108,99,255,0.15) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(0,212,255,0.1) 0%, transparent 50%)',
      textAlign: 'center', padding: '100px var(--sp-lg) var(--sp-2xl)',
    }}>
      <div style={{ maxWidth: 720 }}>
        <div className="badge badge-primary" style={{ marginBottom: 'var(--sp-lg)' }}>
          🎓 Campus × Career Platform
        </div>
        <h1 style={{ marginBottom: 'var(--sp-lg)', lineHeight: 1.15 }}>
          Where <span className="text-gradient">Students Meet Alumni</span>{' '}
          Who've Been There
        </h1>
        <p style={{ fontSize: '1.15rem', maxWidth: 560, margin: '0 auto var(--sp-xl)' }}>
          Get mentored, ace your interviews, land referrals, and find jobs —
          all from alumni who graduated from your university.
        </p>
        <div style={{ display: 'flex', gap: 'var(--sp-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/role-select" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '1rem' }}>
            Get Started Free
          </Link>
          <Link to="/about" className="btn btn-outline" style={{ padding: '14px 32px', fontSize: '1rem' }}>
            How It Works
          </Link>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex', gap: 'var(--sp-xl)', justifyContent: 'center',
          marginTop: 'var(--sp-2xl)', flexWrap: 'wrap',
        }}>
          {[['500+','Alumni Mentors'],['1.2k+','Students'],['200+','Jobs Posted'],['92%','Session Satisfaction']].map(([val, label]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, background: 'var(--grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{val}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Features */}
    <section style={{ padding: 'var(--sp-2xl) var(--sp-lg)', maxWidth: 1100, margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 'var(--sp-sm)' }}>Everything You Need</h2>
      <p style={{ textAlign: 'center', marginBottom: 'var(--sp-xl)' }}>
        One platform for every step of your career journey.
      </p>
      <div className="grid-4" style={{ gap: 'var(--sp-md)' }}>
        {features.map(f => (
          <div key={f.title} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 'var(--sp-sm)' }}>{f.icon}</div>
            <h4 style={{ marginBottom: 'var(--sp-xs)', color: 'var(--clr-text)' }}>{f.title}</h4>
            <p style={{ fontSize: '0.85rem' }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* CTA */}
    <section style={{
      textAlign: 'center', padding: 'var(--sp-2xl) var(--sp-lg)',
      background: 'linear-gradient(135deg, rgba(108,99,255,0.08), rgba(0,212,255,0.06))',
      margin: '0 var(--sp-lg) var(--sp-2xl)', borderRadius: 'var(--r-lg)',
      border: '1px solid var(--clr-border)',
    }}>
      <h2 style={{ marginBottom: 'var(--sp-sm)' }}>Ready to Accelerate Your Career?</h2>
      <p style={{ marginBottom: 'var(--sp-xl)' }}>Join thousands of students who found their path through alumni connections.</p>
      <Link to="/role-select" className="btn btn-primary" style={{ padding: '14px 40px', fontSize: '1rem' }}>
        Join AlumniConnect
      </Link>
    </section>
  </div>
);

export default Landing;
