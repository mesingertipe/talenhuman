import React from 'react';
import { Sun, Moon, LogOut, Bell } from 'lucide-react';
import MobileBottomNav from '../Navigation/MobileBottomNav';
import TalenHumanLogo from '../Shared/TalenHumanLogo';

const MobileLayout = ({ children, activePage, setPage, user, onLogout, version, theme, toggleTheme }) => {
  const isDark = theme === 'dark';

  const getFlag = (code) => {
    if (!code) return '🌍';
    const flags = { 'CO': '🇨🇴', 'MX': '🇲🇽', 'US': '🇺🇸', 'ES': '🇪🇸' };
    return flags[code] || '📍';
  };

  return (
    <div 
      style={{ 
        minHeight: '100dvh', 
        background: isDark ? '#060914' : '#f8fafc', 
        color: isDark ? '#ffffff' : '#1e293b', 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden', 
        position: 'relative',
        transition: 'background-color 0.5s ease, color 0.5s ease',
        fontFamily: "'Inter', sans-serif"
      }}
      className="overscroll-none no-select"
    >
      
      {/* 🏔️ CORPORATE PURPLE HEADER (V63.5 ELITE - ENLARGED) */}
      <header style={{
        padding: 'env(safe-area-inset-top, 30px) 24px 34px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid rgba(255,255,255,0.1)`,
        zIndex: 100,
        position: 'sticky',
        top: 0,
        boxShadow: '0 10px 40px rgba(79, 70, 229, 0.25)'
      }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
             <div style={{ marginBottom: '-2px' }}>
                <TalenHumanLogo type="header" />
             </div>
             <span style={{ 
                 fontSize: '11px', 
                 fontWeight: '600', 
                 color: 'rgba(255,255,255,0.8)', 
                 textTransform: 'uppercase', 
                 letterSpacing: '0.05em',
                 paddingLeft: '34px',
                 display: 'flex',
                 alignItems: 'center',
                 gap: '6px'
             }}>
                {user?.companyName || 'Global Management'}
                <span style={{ fontSize: '13px' }}>{getFlag(user?.countryCode)}</span>
             </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
                onClick={toggleTheme}
                style={{
                    width: '44px', height: '44px', borderRadius: '15px',
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#ffffff', cursor: 'pointer', transition: 'all 0.3s'
                }}
            >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button 
                onClick={onLogout}
                style={{
                    width: '44px', height: '44px', borderRadius: '15px',
                    background: 'rgba(255,255,255,0.15)',
                    border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#ffffff', cursor: 'pointer'
                }}
            >
                <LogOut size={20} />
            </button>
          </div>
      </header>

      {/* Main Content Area - Professional Native Scrolling */}
      <main 
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          paddingBottom: '120px', 
          position: 'relative', 
          zIndex: 10 
        }}
        className="animate-in fade-in slide-in-from-bottom-10 duration-700 no-scrollbar"
      >
        <div style={{ padding: '24px 20px' }}>
           {children}
        </div>
      </main>

      {/* 🏝️ MINIMALIST NAVIGATION (NO EXTRA TEXT) */}
      <footer style={{ 
        position: 'fixed', bottom: 0, left: 0, right: 0, 
        zIndex: 1000, 
        background: '#4f46e5', 
        borderTopLeftRadius: '32px', borderTopRightRadius: '32px',
        padding: '12px 20px env(safe-area-inset-bottom, 20px)',
        boxShadow: '0 -10px 30px rgba(79, 70, 229, 0.2)',
        transition: 'all 0.5s ease'
      }}>
         <MobileBottomNav activePage={activePage} setPage={setPage} theme={theme} isBranded={true} />
      </footer>

    </div>
  );
};

export default MobileLayout;
