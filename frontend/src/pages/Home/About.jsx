import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { PublicFooter } from '../../components/layout/PublicFooter';
import { Link } from 'react-router-dom';
import '../../styles/Home/About.css';

const About = () => (
  <div>
    <PublicNavbar />
    <div className="about-page">
      <h1 className="about-title">About <span className="text-gradient">AlumniConnect</span></h1>
      <p className="about-sub">
        Bridging the gap between students and alumni for real career growth.
      </p>

      {[
        { title: '🎯 Our Mission', text: 'Create a structured, role-based platform where university students can access mentorship, mock interviews, job referrals, and community discussions — directly from alumni who walked the same halls.' },
        { title: '🚀 Fast-Track Career Growth', text: 'Gain insights into industry trends, get actionable advice for your career path, and receive referrals to top companies from alumni who have been there.' },
        { title: '⚡ Smart Matching', text: 'Our algorithm scores every alumnus against your skills and career interests. The more overlap, the higher the match score — so you always see the most relevant mentors first.' },
        { title: '💼 Job Board', text: 'Alumni post jobs at their companies. Students apply with a resume directly on the platform. Alumni manage applications through a 5-stage pipeline: Applied → Under Review → Interview → Offer → Rejected.' },
      ].map(({ title, text }) => (
        <div key={title} className="card about-card">
          <h3 className="about-card-title">{title}</h3>
          <p className="about-card-text">{text}</p>
        </div>
      ))}

      <div className="about-cta">
        <Link to="/role-select" className="btn btn-primary about-cta-btn">Join Now</Link>
      </div>
    </div>
    <PublicFooter />
  </div>
);

export default About;
