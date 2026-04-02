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

      {/* 🏝️ FLOATING NATIVE ISLAND NAVIGATION (THEME-AWARE) */}
      <footer style={{ 
        position: 'fixed', bottom: '24px', left: '20px', right: '20px', 
        zIndex: 1000, height: '80px', borderRadius: '40px', 
        background: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)', 
        backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', 
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}`, 
        boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.8)' : '0 20px 40px -10px rgba(0, 0, 0, 0.15)', 
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px',
        transition: 'all 0.5s ease'
      }}>
         <div style={{ width: '100%', height: '100%', borderRadius: '36px', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
            <MobileBottomNav activePage={activePage} setPage={setPage} theme={theme} />
         </div>
      </footer>

    </div>
  );
};

export default MobileLayout;
