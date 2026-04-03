import React, { useState, useEffect } from 'react';
import { Sun, Moon, LogOut, Clock, Calendar, Bell, X, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import MobileBottomNav from '../Navigation/MobileBottomNav';
import TalenHumanLogo from '../Shared/TalenHumanLogo';

const MobileLayout = ({ children, activePage, setPage, user, onLogout, version, theme, toggleTheme }) => {
  const isDark = theme === 'dark';
  const [time, setTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifCount, setNotifCount] = useState(3); // Mock counter

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
      
      {/* 🏔️ ELITE GROUNDED HEADER (V64.0) */}
      <header style={{
        padding: 'env(safe-area-inset-top, 54px) 24px 24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end', // 🚀 V64.0: Grounded Content
        minHeight: '200px', // Extra height to allow bottom alignment
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        zIndex: 100,
        position: 'sticky',
        top: 0,
        boxShadow: '0 15px 40px rgba(79, 70, 229, 0.3)',
        borderBottomLeftRadius: '2.5rem',
        borderBottomRightRadius: '2.5rem'
      }}>
          {/* L1: BRAND & ACTIONS */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '16px' }}>
             <TalenHumanLogo type="header" />
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* 🔔 ELITE NOTIFICATION BELL */}
                <button 
                    onClick={() => setShowNotifications(true)}
                    style={{
                        width: '40px', height: '40px', borderRadius: '12px',
                        background: 'rgba(255,255,255,0.15)', border: 'none', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                        position: 'relative'
                    }}
                >
                    <Bell size={18} />
                    {notifCount > 0 && (
                        <div style={{
                            position: 'absolute', top: '8px', right: '8px',
                            width: '14px', height: '14px', borderRadius: '50%',
                            background: '#ef4444', border: '2px solid #5d4aea',
                            fontSize: '8px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {notifCount}
                        </div>
                    )}
                </button>

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

      {/* 🔔 ELITE NOTIFICATION DRAWER (Right-to-Left) */}
      {showNotifications && (
        <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, left: 0,
            zIndex: 2000, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', justifyContent: 'flex-end'
        }} onClick={() => setShowNotifications(false)}>
            <div 
                style={{
                    width: '85%', height: '100%', background: isDark ? '#0f172a' : '#ffffff',
                    boxShadow: '-10px 0 30px rgba(0,0,0,0.2)',
                    display: 'flex', flexDirection: 'column',
                    animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0'}` }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', color: isDark ? 'white' : '#1e293b', margin: 0 }}>Notificaciones</h3>
                    <button 
                        onClick={() => setShowNotifications(false)}
                        style={{ width: '36px', height: '36px', borderRadius: '10px', background: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <X size={18} />
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <NotifItem 
                        icon={<Info size={18} color="#4f46e5" />} 
                        title="Nueva Novedad" 
                        desc="Se ha aprobado tu solicitud de permiso." 
                        time="Hace 5 min" 
                        isDark={isDark} 
                    />
                    <NotifItem 
                        icon={<CheckCircle2 size={18} color="#10b981" />} 
                        title="Asistencia Exitosa" 
                        desc="Tu marcación de entrada fue registrada correctamente." 
                        time="Hoy, 08:00 AM" 
                        isDark={isDark} 
                    />
                    <NotifItem 
                        icon={<AlertCircle size={18} color="#f59e0b" />} 
                        title="Recordatorio" 
                        desc="No olvides subir el reporte de cierre hoy." 
                        time="Ayer" 
                        isDark={isDark} 
                    />
                </div>
            </div>
        </div>
      )}

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

      <style>{`
        @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
        }
      `}</style>

    </div>
  );
};

const NotifItem = ({ icon, title, desc, time, isDark }) => (
    <div style={{
       padding: '16px', borderRadius: '20px', 
       background: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc',
       border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0'}`,
       display: 'flex', gap: '12px'
    }}>
       <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
       </div>
       <div style={{ flex: 1 }}>
          <p style={{ fontSize: '14px', fontWeight: '800', margin: '0 0 2px', color: isDark ? 'white' : '#1e293b' }}>{title}</p>
          <p style={{ fontSize: '12px', color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b', margin: '0 0 4px' }}>{desc}</p>
          <p style={{ fontSize: '10px', color: '#4f46e5', fontWeight: '700', margin: 0 }}>{time}</p>
       </div>
    </div>
);

export default MobileLayout;
