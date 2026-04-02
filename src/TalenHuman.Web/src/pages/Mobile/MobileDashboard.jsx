import React from 'react';
import { 
  Calendar, MapPin, Clock, ChevronRight, 
  CheckCircle2, AlertCircle, Info, Fingerprint 
} from 'lucide-react';
import api from '../../services/api';
import BiometricEnrollModal from '../../components/Biometrics/BiometricEnrollModal';

const MobileDashboard = ({ user, theme }) => {
  const [loading, setLoading] = React.useState(true);
  const [todayShift, setTodayShift] = React.useState(null);
  const [news, setNews] = React.useState([]);
  const [showBiometrics, setShowBiometrics] = React.useState(false);

  const isDark = theme === 'dark';

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        try {
          const shiftsRes = await api.get('/shifts/my-shifts');
          const today = new Date().toISOString().split('T')[0];
          const currentShift = shiftsRes.data.find(s => s.startTime.startsWith(today));
          setTodayShift(currentShift);
        } catch (e) {
          console.error("Dashboard Shifts Error", e);
        }

        try {
          const newsRes = await api.get('/novedades/my-news');
          setNews(newsRes.data);
        } catch (e) {
          console.warn("News service offline", e);
          setNews([]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: isDark ? 'white' : '#1e293b' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid rgba(0,0,0,0.05)', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  // Common styles
  const cardBg = isDark ? 'rgba(15, 23, 42, 0.6)' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
  const shadow = isDark ? '0 20px 40px rgba(0,0,0,0.4)' : '0 10px 25px rgba(0,0,0,0.04)';
  const primaryText = isDark ? '#ffffff' : '#1e293b';
  const mutedText = isDark ? 'rgba(255, 255, 255, 0.4)' : '#64748b';

  return (
    <div className="animate-in fade-in slide-in-from-bottom-10 duration-700">
      
      {/* 🚀 BIOMETRIC MODAL */}
      {showBiometrics && <BiometricEnrollModal onComplete={() => setShowBiometrics(false)} onCancel={() => setShowBiometrics(false)} />}

      {/* 🏔️ CLEAN NATIVE HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
         <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '30px', fontWeight: '800', letterSpacing: '-0.8px', color: primaryText, margin: 0 }}>
               Hola, <span style={{ color: '#4f46e5' }}>{user?.fullName?.split(' ')[0] || 'Edna'}</span>
            </h2>
            <div style={{ marginTop: '4px' }}>
               <span style={{ fontSize: '11px', fontWeight: '600', color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{user?.tenantName || 'TalenHuman Global'}</span>
            </div>
         </div>
         
         <button 
            onClick={() => setShowBiometrics(true)}
            style={{ 
                width: '52px', height: '52px', borderRadius: '18px', 
                background: isDark ? 'rgba(79, 70, 229, 0.1)' : 'rgba(79, 70, 229, 0.05)', 
                border: `1px solid ${isDark ? 'rgba(79, 70, 229, 0.2)' : 'rgba(79, 70, 229, 0.1)'}`, 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                color: '#4f46e5', boxShadow: shadow, transition: 'all 0.3s' 
            }}
         >
            <Fingerprint size={28} strokeWidth={1.5} />
         </button>
      </div>

      {/* 🗓️ TURNOS DASHBOARD CARD */}
      <section style={{ marginBottom: '32px' }}>
         {todayShift ? (
           <div style={{ 
               position: 'relative', background: cardBg, borderRadius: '32px', 
               padding: '28px', border: `1px solid ${cardBorder}`, 
               overflow: 'hidden', boxShadow: shadow 
           }}>
              <div style={{ position: 'absolute', top: 0, right: 0, padding: '20px' }}>
                 <div style={{ padding: '4px 12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '20px' }}>
                    <span style={{ fontSize: '9px', fontWeight: '800', color: '#10b981', textTransform: 'uppercase' }}>Presente</span>
                 </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                 <div style={{ 
                     width: '48px', height: '48px', 
                     background: 'rgba(79, 70, 229, 0.05)', 
                     borderRadius: '16px', border: '1px solid rgba(79, 70, 229, 0.1)', 
                     display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' 
                 }}>
                    <Clock size={24} strokeWidth={1.5} />
                 </div>
                 <div>
                    <p style={{ fontSize: '10px', fontWeight: '800', color: mutedText, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px' }}>Entrada Programada</p>
                    <h3 style={{ fontSize: '32px', fontWeight: '800', color: primaryText, letterSpacing: '-1px' }}>
                       {new Date(todayShift.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </h3>
                 </div>
              </div>

              <div style={{ 
                  padding: '16px 20px', background: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', 
                  borderRadius: '20px', border: `1px solid ${cardBorder}`, 
                  display: 'flex', alignItems: 'center', gap: '12px' 
              }}>
                 <MapPin size={16} style={{ color: '#4f46e5' }} />
                 <span style={{ fontSize: '13px', fontWeight: '700', color: primaryText }}>{todayShift.storeName || 'Sede Central'}</span>
              </div>
           </div>
         ) : (
            <div style={{ 
                background: cardBg, borderRadius: '32px', padding: '40px', 
                border: `1px solid ${cardBorder}`, textAlign: 'center', boxShadow: shadow 
            }}>
               <div style={{ 
                   width: '64px', height: '64px', background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', 
                   borderRadius: '22px', margin: '0 auto 20px', display: 'flex', 
                   alignItems: 'center', justifyContent: 'center', color: mutedText 
               }}>
                  <Calendar size={32} strokeWidth={1.5} />
               </div>
               <p style={{ fontSize: '18px', fontWeight: '800', color: primaryText, marginBottom: '4px', letterSpacing: '-0.5px' }}>Día de Descanso</p>
               <p style={{ fontSize: '12px', fontWeight: '600', color: mutedText, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Disfruta tu jornada ✨</p>
            </div>
         )}
      </section>

      {/* ⚡ NATIVE ACTION GRID */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
         <button style={{ 
             background: cardBg, padding: '24px 16px', borderRadius: '28px', 
             border: `1px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', 
             alignItems: 'center', gap: '12px', boxShadow: shadow, transition: 'all 0.3s' 
         }}>
            <div style={{ 
                width: '56px', height: '56px', background: 'rgba(34, 197, 94, 0.08)', 
                borderRadius: '18px', border: '1px solid rgba(34, 197, 94, 0.1)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' 
            }}>
               <CheckCircle2 size={28} strokeWidth={1.5} />
            </div>
            <span style={{ fontSize: '11px', fontWeight: '800', color: primaryText, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Asistencia</span>
         </button>

         <button style={{ 
             background: cardBg, padding: '24px 16px', borderRadius: '28px', 
             border: `1px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', 
             alignItems: 'center', gap: '12px', boxShadow: shadow, transition: 'all 0.3s' 
         }}>
            <div style={{ 
                width: '56px', height: '56px', background: 'rgba(245, 158, 11, 0.08)', 
                borderRadius: '18px', border: '1px solid rgba(245, 158, 11, 0.1)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' 
            }}>
               <Info size={28} strokeWidth={1.5} />
            </div>
            <span style={{ fontSize: '11px', fontWeight: '800', color: primaryText, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Novedades</span>
         </button>
      </section>

      {/* 🔔 ALERTS AREA */}
      {news.length > 0 && (
         <section style={{ marginTop: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', padding: '0 8px' }}>
               <span style={{ fontSize: '10px', fontWeight: '800', color: mutedText, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Notificaciones</span>
               <div style={{ flex: 1, height: '1px', background: cardBorder }} />
            </div>
            <div style={{ 
                background: isDark ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(15,23,42,0.6) 100%)' : '#ffffff', 
                padding: '20px', borderRadius: '28px', border: `1px solid ${cardBorder}`, 
                display: 'flex', alignItems: 'center', gap: '16px', boxShadow: shadow, position: 'relative', overflow: 'hidden' 
            }}>
               <div style={{ 
                   width: '44px', height: '44px', background: 'rgba(79, 70, 229, 0.05)', 
                   borderRadius: '14px', border: '1px solid rgba(79, 70, 229, 0.1)', 
                   display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' 
               }}>
                  <AlertCircle size={22} strokeWidth={1.5} />
               </div>
               <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: '800', color: primaryText, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{news[0].title}</p>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: mutedText }}>Toque para ver detalles</span>
               </div>
               <ChevronRight size={18} style={{ color: mutedText }} />
            </div>
         </section>
      )}

    </div>
  );
};

export default MobileDashboard;
