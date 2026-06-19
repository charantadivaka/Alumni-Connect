import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import ManageJobs from './ManageJobs';
import ManageApplications from './ManageApplications';
import MentorshipRequests from './MentorshipRequests';
import ManageSlots from './ManageSlots';
import InterviewRequests from './InterviewRequests';
import ManageReferrals from './ManageReferrals';
import '../../styles/Alumni/JobsHub.css';

const SECTIONS = [
  { key: 'manage-jobs',  icon: '💼', label: 'Manage Jobs',  Component: ManageJobs },
  { key: 'applications', icon: '📋', label: 'Applications', Component: ManageApplications },
  { key: 'mentorship',   icon: '🎓', label: 'Mentorship',   Component: MentorshipRequests },
  { key: 'slots',        icon: '📅', label: 'My Slots',     Component: ManageSlots },
  { key: 'interviews',   icon: '🎤', label: 'Interviews',   Component: InterviewRequests },
  { key: 'referrals',    icon: '🤝', label: 'Referrals',    Component: ManageReferrals },
];

const InnerSidebar = ({ active, onChange }) => (
  <nav className="hub-inner-sidebar">
    <div className="hub-inner-sidebar-label">Job Hub</div>
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

const AlumniJobsHub = () => {
  const location = useLocation();
  const pathLast = location.pathname.split('/').pop();
  const validKeys = SECTIONS.map(s => s.key);
  const [active, setActive] = useState(
    validKeys.includes(pathLast) ? pathLast : 'manage-jobs'
  );

  const ActiveComponent = SECTIONS.find(s => s.key === active)?.Component || ManageJobs;

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

export default AlumniJobsHub;
