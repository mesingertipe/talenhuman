import React, { useState, useEffect } from 'react';
import { Sun, Moon, LogOut, Clock, Calendar, Bell, X, Info, AlertCircle, CheckCircle2, MessageSquare } from 'lucide-react';
import MobileBottomNav from '../Navigation/MobileBottomNav';
import TalenHumanLogo from '../Shared/TalenHumanLogo';
import { onMessageListener } from '../../firebase';
import TalenHumanToast from '../Shared/ElitePremiumToast';
import DebugPortal from '../Shared/DebugPortal';

const MobileLayout = ({ children, activePage, setPage, user, onLogout, version, theme, toggleTheme }) => {
  const isDark = theme === 'dark';
  const [time, setTime] = useState(new Date());
  const [showDebug, setShowDebug] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem(`notifs_${user?.id}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [notifCount, setNotifCount] = useState(() => {
    return notifications.filter(n => !n.read).length;
  });
  const [toast, setToast] = useState(null);

  // 🔔 REAL-TIME TOAST & HISTORY LISTENER (V65.1.7 VERBOSE)
  useEffect(() => {
    const currentId = user?.Id || user?.id || user?.userName || 'unknown';
    console.log('🔔 [SYSTEM] Iniciando puente de notificaciones para:', currentId);
    
    if (!user) {
        console.warn('⚠️ [SYSTEM] Usuario no detectado. Reintentando suscripción...');
        return;
    }

    console.log('📡 [SYSTEM] Suscribiendo al Bridge Real-time de FCM...');
    
    const handlePayload = (payload) => {
        console.log('📦 [FCM] Payload Recibido en App:', payload);
        const newNotif = {
          id: Date.now(),
          title: payload.notification?.title || 'Notificación Talenhuman',
          body: payload.notification?.body || 'Tienes un nuevo mensaje.',
          type: payload.data?.type || 'info',
          read: false,
          date: new Date().toISOString()
        };

        setNotifications(prev => {
          const updated = [newNotif, ...prev].slice(0, 50);
          console.log('💾 [LIST] Historial actualizado (+1). Total:', updated.length);
          localStorage.setItem(`notifs_${currentId}`, JSON.stringify(updated));
          return updated;
        });

        console.log('🎨 [UI] Lanzando Toast V65.1.7 (Portal)...');
        setToast({
          title: newNotif.title,
          body: newNotif.body,
          type: newNotif.type === 'shift_update' ? 'shift' : 
                newNotif.type === 'broadcast' ? 'broadcast' : 'info'
        });
        
        setNotifCount(prev => prev + 1);
    };

    const unsubscribe = onMessageListener(handlePayload);

    // 🚀 SIMULATOR BRIDGE (V65.1.7)
    const handleSimulated = (e) => {
        console.log('🕹️ [SIM] Evento de simulación capturado. Procesando...');
        handlePayload(e.detail);
    };
    window.addEventListener('simulate-fcm', handleSimulated);

    return () => {
        if (unsubscribe) {
            console.log('🛑 [SYSTEM] Desconectando Puente FCM');
            unsubscribe();
        }
        window.removeEventListener('simulate-fcm', handleSimulated);
    };
  }, [user]);

  const markAllAsRead = () => {
    const currentId = user?.Id || user?.id || user?.userName || 'unknown';
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem(`notifs_${currentId}`, JSON.stringify(updated));
    setNotifCount(0);
  };

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
    >
      {/* 🔔 REAL-TIME TOAST (V65.1 PREMIUM) */}
      {toast && (
        <TalenHumanToast 
          title={toast.title}
          body={toast.body}
          type={toast.type}
          theme={theme}
          onClose={() => setToast(null)}
        />
      )}
      
      {/* 🏔️ DUAL-LEVEL HEADER (V64.1) */}
      <header 
        id="mobile-header"
        style={{
          padding: 'env(safe-area-inset-top, 20px) 24px 20px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '180px', 
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          zIndex: 100,
          position: 'sticky',
          top: 0,
          boxShadow: '0 15px 40px rgba(79, 70, 229, 0.3)',
          borderBottomLeftRadius: '2.5rem',
          borderBottomRightRadius: '2.5rem',
          overflow: 'hidden'
      }}>
          {/* TOP ACTION LAYER (Fixed to top of padding) */}
          <div style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end', 
              width: '100%', marginBottom: '12px', gap: '10px' 
          }}>
                <button 
                    onClick={() => setShowNotifications(true)}
                    style={{
                        width: '44px', height: '44px', borderRadius: '14px',
                        background: 'rgba(255,255,255,0.15)', border: 'none', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                        position: 'relative'
                    }}
                >
                    <Bell size={20} />
                    {notifCount > 0 && (
                        <div style={{
                            position: 'absolute', top: '10px', right: '10px',
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
                        width: '44px', height: '44px', borderRadius: '14px',
                        background: 'rgba(255,255,255,0.1)', border: 'none', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                    }}
                >
                    {isDark ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button 
                    onClick={onLogout}
                    style={{
                        width: '44px', height: '44px', borderRadius: '14px',
                        background: 'rgba(255,255,255,0.18)', border: 'none', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                    }}
                >
                    <LogOut size={20} />
                </button>
          </div>

          {/* BRAND POSITIONING (Elevated in center-bottom) */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '4px' }}>
             <div 
                onClick={(e) => {
                    e.preventDefault(); e.stopPropagation();
                    console.log('🐞 LOGO TAPPED - TOGGLING DEBUG');
                    setShowDebug(prev => !prev);
                }}
                style={{ 
                    display: 'flex', alignItems: 'center', gap: '10px', 
                    position: 'relative', cursor: 'pointer',
                    padding: '10px 20px 10px 0', 
                    WebkitTapHighlightColor: 'transparent'
                }}
             >
                <TalenHumanLogo type="header" />
             </div>
             
             <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '4px' }}>
                <span style={{ 
                    fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.7)', 
                    textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.8 
                }}>
                    {user?.companyName || 'TalenHuman Global'}
                </span>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>{getFlag(user?.countryCode)}</span>
                        <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.25)' }} />
                        <span style={{ fontSize: '13px', fontWeight: '700', color: 'white', textTransform: 'capitalize', letterSpacing: '-0.3px' }}>
                            {getFormattedDate()}
                        </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 12px', background: 'rgba(0,0,0,0.18)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
                        <Clock size={12} color="rgba(255,255,255,0.9)" />
                        <span style={{ fontSize: '14px', fontWeight: '900', color: 'white' }}>
                            {getFormattedTime()}
                        </span>
                    </div>
                </div>
             </div>
          </div>
      </header>

      {/* 🔔 NOTIFICATION DRAWER (Right-to-Left) */}
      {showNotifications && (
        <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, left: 0,
            zIndex: 2000, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)',
            display: 'flex', justifyContent: 'flex-end'
        }} onClick={() => { setShowNotifications(false); markAllAsRead(); }}>
            <div 
                style={{
                    width: '85%', height: '100%', background: isDark ? '#0f172a' : '#ffffff',
                    boxShadow: '-15px 0 50px rgba(0,0,0,0.25)',
                    display: 'flex', flexDirection: 'column',
                    animation: 'slideInRight 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
                    borderTopLeftRadius: '2rem', borderBottomLeftRadius: '2rem'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ padding: '32px 24px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ fontSize: '24px', fontWeight: '800', color: isDark ? 'white' : '#1e293b', margin: 0, letterSpacing: '-0.5px' }}>Notificaciones</h3>
                    <button 
                        onClick={() => setShowNotifications(false)}
                        style={{ width: '40px', height: '40px', borderRadius: '12px', background: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 40px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {notifications.length > 0 ? (
                        notifications.map((n) => (
                            <NotifItem 
                                key={n.id}
                                icon={
                                    n.type === 'shift_update' ? <Calendar size={18} color="#4f46e5" /> :
                                    n.type === 'broadcast' ? <MessageSquare size={18} color="#f59e0b" /> :
                                    <Info size={18} color="#4f46e5" />
                                } 
                                title={n.title} 
                                desc={n.body} 
                                time={new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                                isDark={isDark} 
                                unread={!n.read}
                            />
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', py: '60px', opacity: 0.5 }}>
                            <Bell size={48} style={{ margin: '0 auto 16px' }} />
                            <p style={{ fontSize: '14px', fontWeight: '800' }}>Sin notificaciones</p>
                            <p style={{ fontSize: '11px' }}>Tu historial aparecerá aquí</p>
                        </div>
                    )}
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
          position: 'relative'
        }}
        className="animate-in fade-in slide-in-from-bottom-10 duration-700 no-scrollbar"
      >
        <div style={{ padding: '24px 20px' }}>
           {children}
        </div>
      </main>

      {/* Modern Fixed Navigation */}
      <footer 
        id="mobile-footer"
        style={{ 
          position: 'fixed', bottom: 0, left: 0, right: 0, 
          zIndex: 1000, 
          background: '#4f46e5', 
          borderTopLeftRadius: '32px', borderTopRightRadius: '32px',
          padding: '12px 20px env(safe-area-inset-bottom, 20px)',
          boxShadow: '0 -15px 40px rgba(79, 70, 229, 0.25)',
          transition: 'all 0.5s ease'
        }}
      >
         <MobileBottomNav activePage={activePage} setPage={setPage} theme={theme} isBranded={true} />
      </footer>

      <DebugPortal isOpen={showDebug} onClose={() => setShowDebug(false)} />

      <style>{`
        @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
        }
      `}</style>

    </div>
  );
};

const NotifItem = ({ icon, title, desc, time, isDark, unread }) => (
    <div style={{
       padding: '20px', borderRadius: '24px', 
       background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
       border: unread 
           ? `1px solid #4f46e5` 
           : `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
       display: 'flex', gap: '14px',
       boxShadow: unread ? '0 8px 20px rgba(79, 70, 229, 0.15)' : '0 4px 12px rgba(0,0,0,0.02)',
       position: 'relative'
    }}>
       {unread && (
           <div style={{ 
               position: 'absolute', top: '12px', right: '12px', 
               width: '8px', height: '8px', borderRadius: '50%', background: '#4f46e5' 
           }} />
       )}
       <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
       </div>
       <div style={{ flex: 1 }}>
          <p style={{ fontSize: '15px', fontWeight: '800', margin: '0 0 4px', color: isDark ? 'white' : '#1e293b', letterSpacing: '-0.3px' }}>{title}</p>
          <p style={{ fontSize: '12px', color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b', margin: '0 0 6px', lineHeight: '1.4' }}>{desc}</p>
          <p style={{ fontSize: '11px', color: '#4f46e5', fontWeight: '800', margin: 0 }}>{time}</p>
       </div>
    </div>
);

export default MobileLayout;
