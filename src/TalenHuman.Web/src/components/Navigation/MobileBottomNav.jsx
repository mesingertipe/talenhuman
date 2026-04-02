import React from 'react';
import { Home, Calendar, Clock, User, Bell } from 'lucide-react';

const MobileBottomNav = ({ activePage, setPage }) => {
  const tabs = [
    { id: 'Dashboard', icon: Home, label: 'Inicio' },
    { id: 'Turnos', icon: Calendar, label: 'Turnos' },
    { id: 'Marcaciones', icon: Clock, label: 'Marcas' },
    { id: 'Notificaciones', icon: Bell, label: 'Alertas' },
    { id: 'Perfil', icon: User, label: 'Perfil' },
  ];

  const handleTabClick = (tabId) => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate([15]); 
    }
    setPage(tabId);
  };

  return (
    <nav style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', width: '100%', height: '100%', padding: '0 8px', position: 'relative', overflow: 'hidden' }} className="no-select">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activePage === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            style={{ 
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
              width: '100%', height: '100%', border: 'none', background: 'transparent', outline: 'none',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative', zIndex: 10,
              color: isActive ? '#fff' : 'rgba(255,255,255,0.25)',
              transform: isActive ? 'scale(1.1)' : 'scale(1)'
            }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '16px' }}>
              {/* Active Glow Aura */}
              {isActive && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(99, 102, 241, 0.3)', filter: 'blur(15px)', borderRadius: '50%', transform: 'scale(1.4)' }} />
              )}
              
              <Icon 
                size={22} 
                strokeWidth={isActive ? 2.5 : 1.5} 
                className={isActive ? 'animate-pulse' : ''}
                style={{ position: 'relative', zIndex: 20 }}
              />
            </div>
            
            <span style={{ 
              fontSize: '8px', marginTop: '4px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.2em',
              opacity: isActive ? 1 : 0, transition: 'all 0.5s ease', transform: isActive ? 'translateY(0)' : 'translateY(4px)'
            }}>
              {tab.label}
            </span>

            {/* Active Bottom Indicator Dot */}
            {isActive && (
              <div style={{ position: 'absolute', bottom: '6px', width: '4px', height: '4px', background: '#fff', borderRadius: '50%', boxShadow: '0 0 10px rgba(255,255,255,1)' }} />
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;
