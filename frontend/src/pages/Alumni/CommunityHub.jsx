import { useState } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import Events from './Events';
import Forum from '../Student/Forum'; // Reusing the shared generic Forum
import Stories from './Stories';
import '../../styles/Alumni/CommunityHub.css';

const SECTIONS = [
  { key: 'events',  icon: '📅', label: 'Events',  Component: Events },
  { key: 'forum',   icon: '🗣️', label: 'Forum',   Component: Forum },
  { key: 'stories', icon: '✨', label: 'Stories',  Component: Stories },
];

const InnerSidebar = ({ active, onChange }) => (
  <nav className="hub-inner-sidebar">
    <div className="hub-inner-sidebar-label">Community</div>
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

const AlumniCommunityHub = () => {
  const [active, setActive] = useState('events');
  const ActiveComponent = SECTIONS.find(s => s.key === active)?.Component || Events;

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

export default AlumniCommunityHub;
