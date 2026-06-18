import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import JobBoard from './JobBoard';
import MyApplications from './MyApplications';
import MentorshipSessions from './MentorshipSessions';
import MockInterviews from './MockInterviews';
import MyReferrals from './MyReferrals';
import MyResumes from './MyResumes';

const SECTIONS = [
  { key: 'jobs',         icon: '💼', label: 'Job Board',       Component: JobBoard },
  { key: 'applications', icon: '📋', label: 'My Applications', Component: MyApplications },
  { key: 'mentorship',   icon: '🎓', label: 'Mentorship',      Component: MentorshipSessions },
  { key: 'interviews',   icon: '🎤', label: 'Mock Interviews',  Component: MockInterviews },
  { key: 'referrals',    icon: '🤝', label: 'Referrals',        Component: MyReferrals },
  { key: 'resumes',      icon: '📄', label: 'My Resumes',       Component: MyResumes },
];

const InnerSidebar = ({ active, onChange }) => (
  <nav style={{
    width: 220, flexShrink: 0,
    background: 'var(--clr-bg-card)',
    borderRight: '1px solid var(--clr-border)',
    padding: '20px 10px',
    display: 'flex', flexDirection: 'column', gap: 4,
    minHeight: '100%',
  }}>
    <div style={{
      fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
      color: 'var(--clr-text-faint)', padding: '0 10px',
      marginBottom: 10, letterSpacing: 1,
    }}>
      Jobs & Careers
    </div>
    {SECTIONS.map(s => (
      <button key={s.key} onClick={() => onChange(s.key)} style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px', borderRadius: 'var(--r-md)',
        border: 'none', textAlign: 'left', cursor: 'pointer', width: '100%',
        background: active === s.key ? 'var(--clr-primary-glow)' : 'transparent',
        color:      active === s.key ? 'var(--clr-text)' : 'var(--clr-text-muted)',
        fontWeight: active === s.key ? 600 : 400,
        fontSize: '0.875rem', transition: 'all var(--tr-fast)',
      }}
        onMouseEnter={e => { if (active !== s.key) e.currentTarget.style.background = 'var(--clr-bg-elevated)'; }}
        onMouseLeave={e => { if (active !== s.key) e.currentTarget.style.background = 'transparent'; }}
      >
        <span>{s.icon}</span><span>{s.label}</span>
      </button>
    ))}
  </nav>
);

/* Sub-pages render <div className="dashboard-layout"><Sidebar/><main …>
   We render them hidden and only show the one that's active.
   To avoid double sidebars we use a CSS trick: hide the sidebar inside
   the sub-page by overriding it via a wrapper class.              */
const JobsHub = () => {
  const location = useLocation();
  const pathLast = location.pathname.split('/').pop();
  const validKeys = SECTIONS.map(s => s.key);
  const [active, setActive] = useState(
    validKeys.includes(pathLast) ? pathLast : 'jobs'
  );

  const ActiveComponent = SECTIONS.find(s => s.key === active)?.Component || JobBoard;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Main outer sidebar */}
      <Sidebar />

      {/* Content area after outer sidebar */}
      <div style={{
        marginLeft: 'var(--sidebar-w)',
        display: 'flex', flex: 1, minHeight: '100vh',
        transition: 'margin-left 0.28s cubic-bezier(.4,0,.2,1)',
      }}>
        {/* Inner sidebar */}
        <InnerSidebar active={active} onChange={setActive} />

        {/* Sub-page content: we use a wrapper that hides the sub-page's own sidebar+margin */}
        <div style={{ flex: 1, overflowY: 'auto' }} className="hub-content-wrapper">
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
