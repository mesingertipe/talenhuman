import React from 'react';
import { Home, Clock, User, Info } from 'lucide-react';

const MobileBottomNav = ({ activePage, setPage, theme }) => {
  const isDark = theme === 'dark';
  
  const tabs = [
    { id: 'Dashboard', icon: Home, label: 'Turnos' },
    { id: 'Novedades', icon: Info, label: 'Novedades' },
    { id: 'Marcaciones', icon: Clock, label: 'Marcas' },
    { id: 'Perfil', icon: User, label: 'Perfil' },
  ];

  const handleTabClick = (tabId) => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate([15]); 
    }
    setPage(tabId);
  };

  return (
    <nav style={{ 
        display: 'flex', justifyContent: 'space-around', alignItems: 'center', 
        width: '100%', height: '100%', padding: '0 8px', position: 'relative', overflow: 'hidden' 
    }} className="no-select">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activePage === tab.id;
        
        // Dynamic colors based on theme/branding
        const activeColor = isBranded ? '#ffffff' : '#4f46e5'; 
        const inactiveColor = isBranded ? 'rgba(255, 255, 255, 0.4)' : (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(30, 41, 59, 0.4)');

        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            style={{ 
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
              width: '100%', height: '100%', border: 'none', background: 'transparent', outline: 'none',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative', zIz: 10,
              color: isActive ? activeColor : inactiveColor,
              transform: isActive ? 'scale(1.05)' : 'scale(1)'
            }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '16px' }}>
              {isActive && (
                <div style={{ 
                    position: 'absolute', inset: 0, 
                    background: isBranded ? 'rgba(255, 255, 255, 0.12)' : (isDark ? 'rgba(79, 70, 229, 0.15)' : 'rgba(79, 70, 229, 0.08)'), 
                    borderRadius: '50%', transform: 'scale(1.2)' 
                }} />
              )}
              
              <Icon 
                size={22} 
                strokeWidth={isActive ? 2.5 : 2} 
                style={{ position: 'relative', zIndex: 20 }}
              />
            </div>
            
            <span style={{ 
              fontSize: '10px', marginTop: '4px', fontWeight: '700', 
              opacity: isActive ? 1 : 0.7, transition: 'all 0.4s ease'
            }}>
              {tab.label}
            </span>

            {/* Active Top Bar Indicator */}
            {isActive && !isBranded && (
              <div style={{ 
                  position: 'absolute', top: '0', width: '24px', height: '3px', 
                  background: activeColor, borderRadius: '0 0 4px 4px',
                  boxShadow: `0 2px 8px ${activeColor}44`
              }} />
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;
