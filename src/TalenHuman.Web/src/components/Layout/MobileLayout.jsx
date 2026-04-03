import React, { useState, useEffect } from 'react';
import { Sun, Moon, LogOut, Clock, Calendar } from 'lucide-react';
import MobileBottomNav from '../Navigation/MobileBottomNav';
import TalenHumanLogo from '../Shared/TalenHumanLogo';

const MobileLayout = ({ children, activePage, setPage, user, onLogout, version, theme, toggleTheme }) => {
  const isDark = theme === 'dark';
  const [time, setTime] = useState(new Date());

  // 🕒 REAL-TIME COMMAND CENTER CLOCK (V63.6)
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 30000); // Update every 30s
    return () => clearInterval(timer);
  }, []);

  const getFlag = (code) => {
    if (!code) return '🌍';
    const flags = { 'CO': '🇨🇴', 'MX': '🇲🇽', 'US': '🇺🇸', 'ES': '🇪🇸' };
    return flags[code] || '📍';
  };

  const mapTimeZone = (tz) => {
    if (!tz) return undefined;
    const mapping = {
        'SA Pacific Standard Time': 'America/Bogota',
        'Central Standard Time (Mexico)': 'America/Mexico_City',
        'Mountain Standard Time (Mexico)': 'America/Chihuahua',
        'Pacific Standard Time (Mexico)': 'America/Tijuana',
        'Eastern Standard Time': 'America/New_York',
        'Central Standard Time': 'America/Chicago'
    };
    return mapping[tz] || tz;
  };

  const getFormattedTime = () => {
    try {
      return time.toLocaleTimeString('es-ES', { 
         hour: '2-digit', minute: '2-digit', 
         timeZone: mapTimeZone(user?.timeZoneId) 
      });
    } catch (e) {
      return time.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
  };

  const getFormattedDate = () => {
    try {
      return time.toLocaleDateString('es-ES', { 
         weekday: 'short', day: '2-digit', month: 'short',
         timeZone: mapTimeZone(user?.timeZoneId)
      });
    } catch (e) {
      return time.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' });
    }
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
        transition: 'background-color 0.5s ease',
        fontFamily: "'Inter', sans-serif"
      }}
      className="overscroll-none no-select"
    >
      
      {/* 🏔️ ELITE COMMAND CENTER HEADER (V63.6) */}
      <header style={{
        padding: 'env(safe-area-inset-top, 54px) 24px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px', // 🚀 V63.8: Compact brand gap
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        zIndex: 100,
        position: 'sticky',
        top: 0,
        boxShadow: '0 15px 40px rgba(79, 70, 229, 0.3)',
        borderBottomLeftRadius: '2.5rem',
        borderBottomRightRadius: '2.5rem'
      }}>
          {/* L1: BRAND & ACTIONS */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
             <TalenHumanLogo type="header" />
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button 
                    onClick={toggleTheme}
                    style={{
                        width: '40px', height: '40px', borderRadius: '12px',
                        background: 'rgba(255,255,255,0.1)', border: 'none', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                    }}
                >
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <button 
                    onClick={onLogout}
                    style={{
                        width: '40px', height: '40px', borderRadius: '12px',
                        background: 'rgba(255,255,255,0.15)', border: 'none', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                    }}
                >
                    <LogOut size={18} />
                </button>
             </div>
          </div>

          {/* L2 & L3: TENANT & META (COMMAND CENTER) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '4px' }}>
             <span style={{ 
                fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.7)', 
                textTransform: 'uppercase', letterSpacing: '0.1em' 
             }}>
                {user?.companyName || 'TalenHuman Global'}
             </span>
             
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                   <span style={{ fontSize: '16px' }}>{getFlag(user?.countryCode)}</span>
                   <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.2)' }} />
                   <span style={{ fontSize: '13px', fontWeight: '700', color: 'white', textTransform: 'capitalize' }}>
                      {getFormattedDate()}
                   </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: 'rgba(0,0,0,0.15)', borderRadius: '10px' }}>
                   <Clock size={12} color="rgba(255,255,255,0.8)" />
                   <span style={{ fontSize: '13px', fontWeight: '900', color: 'white' }}>
                      {getFormattedTime()}
                   </span>
                </div>
             </div>
          </div>
      </header>

      {/* Main Content Area */}
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

      {/* Minimalist Navigation */}
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
