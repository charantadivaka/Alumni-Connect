import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import JobBoard from './JobBoard';
import MyApplications from './MyApplications';
import MentorshipSessions from './MentorshipSessions';
import MockInterviews from './MockInterviews';
import MyReferrals from './MyReferrals';
import MyResumes from './MyResumes';
import '../../styles/Student/JobsHub.css';

const SECTIONS = [
  { key: 'jobs',         icon: '💼', label: 'Job Board',       Component: JobBoard },
  { key: 'applications', icon: '📋', label: 'My Applications', Component: MyApplications },
  { key: 'mentorship',   icon: '🎓', label: 'Mentorship',      Component: MentorshipSessions },
  { key: 'interviews',   icon: '🎤', label: 'Mock Interviews',  Component: MockInterviews },
  { key: 'referrals',    icon: '🤝', label: 'Referrals',        Component: MyReferrals },
  { key: 'resumes',      icon: '📄', label: 'My Resumes',       Component: MyResumes },
];

const InnerSidebar = ({ active, onChange }) => (
  <nav className="hub-inner-sidebar">
    <div className="hub-inner-sidebar-label">Jobs &amp; Careers</div>
    {SECTIONS.map(s => (
      <button
        key={s.key}
        onClick={() => onChange(s.key)}
        className={`hub-nav-btn ${active === s.key ? 'hub-nav-btn--active' : ''}`}
      >
        <span>{s.icon}</span><span>{s.label}</span>
      </button>
    ))}
  </nav>
);

const JobsHub = () => {
  const location = useLocation();
  const pathLast = location.pathname.split('/').pop();
  const validKeys = SECTIONS.map(s => s.key);
  const [active, setActive] = useState(
    validKeys.includes(pathLast) ? pathLast : 'jobs'
  );

  const ActiveComponent = SECTIONS.find(s => s.key === active)?.Component || JobBoard;

  return (
    <div className="hub-layout">
      <Sidebar />
      <div className="hub-body">
        <InnerSidebar active={active} onChange={setActive} />
        <div className="hub-content hub-content-wrapper">
          <style>{`
            .hub-content-wrapper .dashboard-layout { display: block !important; }
            .hub-content-wrapper aside { display: none !important; }
            .hub-content-wrapper .dashboard-main { margin-left: 0 !important; }
          `}</style>
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
};

export default JobsHub;
