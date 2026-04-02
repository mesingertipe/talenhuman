import React from 'react';
import { Sun, Moon, LogOut, Bell } from 'lucide-react';
import MobileBottomNav from '../Navigation/MobileBottomNav';
import TalenHumanLogo from '../Shared/TalenHumanLogo';

const MobileLayout = ({ children, activePage, setPage, user, onLogout, version, theme, toggleTheme }) => {
  const isDark = theme === 'dark';

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
      
      {/* 🏔️ CLEAN BRAND HEADER (NATIVE FEEL) */}
      <header style={{
        padding: 'env(safe-area-inset-top, 20px) 24px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: isDark ? 'rgba(12, 18, 34, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
        zIndex: 100,
        position: 'sticky',
        top: 0
      }}>
         <div style={{ transform: 'scale(0.85)', transformOrigin: 'left' }}>
            <TalenHumanLogo />
         </div>
         
         <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Theme Toggle Button */}
            <button 
                onClick={toggleTheme}
                style={{
                    width: '44px', height: '44px', borderRadius: '15px',
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isDark ? '#fbbf24' : '#4f46e5', cursor: 'pointer', transition: 'all 0.3s'
                }}
            >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button 
                onClick={onLogout}
                style={{
                    width: '44px', height: '44px', borderRadius: '15px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#ef4444', cursor: 'pointer'
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

      {/* 🏝️ BRANDED NAVIGATION ZONE (PURPLE CORPORATE) */}
      <footer style={{ 
        position: 'fixed', bottom: 0, left: 0, right: 0, 
        zIndex: 1000, 
        background: '#4f46e5', 
        borderTopLeftRadius: '32px', borderTopRightRadius: '32px',
        padding: '12px 20px env(safe-area-inset-bottom, 20px)',
        boxShadow: '0 -10px 30px rgba(79, 70, 229, 0.2)',
        display: 'flex', flexDirection: 'column', gap: '16px',
        transition: 'all 0.5s ease'
      }}>
         {/* Navigation Tabs */}
         <div style={{ width: '100%', height: '60px' }}>
            <MobileBottomNav activePage={activePage} setPage={setPage} theme={theme} isBranded={true} />
         </div>

         {/* Corporate Logo & Tenant Branding */}
         <div style={{ 
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)' 
         }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
                <TalenHumanLogo size={18} white={true} />
                <span style={{ fontSize: '15px', fontWeight: '900', letterSpacing: '0.05em' }}>TALENHUMAN</span>
            </div>
            <span style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
               {user?.tenantName || 'Global Management'}
            </span>
         </div>
      </footer>

    </div>
  );
};

export default MobileLayout;
