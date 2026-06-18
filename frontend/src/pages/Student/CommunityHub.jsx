import { useState } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import StudentEvents from './Events';
import StudentForum from './Forum';
import StudentStories from './Stories';

const SECTIONS = [
  { key: 'events',  icon: '📅', label: 'Events',  Component: StudentEvents },
  { key: 'forum',   icon: '🗣️', label: 'Forum',   Component: StudentForum },
  { key: 'stories', icon: '✨', label: 'Stories',  Component: StudentStories },
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
      Community
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

const CommunityHub = () => {
  const [active, setActive] = useState('events');
  const ActiveComponent = SECTIONS.find(s => s.key === active)?.Component || StudentEvents;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{
        marginLeft: 'var(--sidebar-w)',
        display: 'flex', flex: 1, minHeight: '100vh',
        transition: 'margin-left 0.28s cubic-bezier(.4,0,.2,1)',
      }}>
        <InnerSidebar active={active} onChange={setActive} />
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

export default CommunityHub;
