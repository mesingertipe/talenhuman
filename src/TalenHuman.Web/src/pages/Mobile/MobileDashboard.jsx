import React from 'react';
import { 
  Calendar, MapPin, Clock, ChevronRight, 
  CheckCircle2, AlertCircle, Info, Fingerprint, Map, ShieldCheck
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
          const currentShift = shiftsRes.data.find(s => s.startTime && s.startTime.startsWith(today));
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
      
      {/* 🚀 BIOMETRIC MODAL (V63.1 SECURE) */}
      {showBiometrics && (
        <BiometricEnrollModal 
          theme={theme}
          onComplete={() => setShowBiometrics(false)} 
          onCancel={() => setShowBiometrics(false)} 
        />
      )}

      {/* 🏔️ ELITE DASHBOARD HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
             <h2 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.8px', color: primaryText, margin: 0 }}>
                <span style={{ color: '#4f46e5', opacity: 0.8 }}>Hola,</span> {user?.fullName?.split(' ')[0] || 'Tito'}
             </h2>
             <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                   {user?.roleName || 'Colaborador'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: mutedText }}>
                   <MapPin size={10} />
                   <span style={{ fontSize: '11px', fontWeight: '600' }}>
                      {user?.storeName || todayShift?.storeName || 'Sede Principal'}
                   </span>
                </div>
             </div>
          </div>
          
          {/* 🕒 IDENTITY & TIME WIDGET */}
          <div style={{ 
              display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px',
              padding: '12px 16px', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(79, 70, 229, 0.03)',
              borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(79, 70, 229, 0.1)'}`,
              boxShadow: isDark ? 'none' : '0 10px 20px rgba(79, 70, 229, 0.05)'
          }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4f46e5' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.05em' }}>🇲🇽 MÉXICO</span>
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: primaryText }}>
                <Clock size={12} strokeWidth={2.5} />
                <span style={{ fontSize: '13px', fontWeight: '900' }}>
                   {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </span>
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: mutedText }}>
                <Calendar size={10} />
                <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>
                   {new Date().toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })}
                </span>
             </div>
          </div>
       </div>

      {/* 🗓️ TURNOS DASHBOARD CARD */}
      <section style={{ marginBottom: '32px' }}>
         {todayShift ? (
            <div style={{ 
              background: cardBg, borderRadius: '32px', padding: '30px', 
              boxShadow: shadow, border: `1px solid ${cardBorder}`,
              position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: 0, right: 0, padding: '20px', opacity: 0.05 }}>
                 <Calendar size={120} />
              </div>
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(79, 70, 229, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                   <Calendar size={32} style={{ color: '#4f46e5' }} />
                </div>
                <h3 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '4px', color: primaryText }}>
                   {todayShift.shiftName || 'Turno Asignado'}
                </h3>
                <p style={{ fontSize: '14px', fontWeight: '700', color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                   {new Date(todayShift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                   {new Date(todayShift.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <div style={{ marginTop: '20px', padding: '8px 16px', background: isDark ? 'rgba(16, 185, 129, 0.1)' : '#f0fdf4', borderRadius: '12px', color: '#16a34a', fontSize: '12px', fontWeight: '700' }}>
                   ESTADO: ACTIVO
                </div>
              </div>
            </div>
         ) : (
            <div style={{ 
              background: cardBg, borderRadius: '32px', padding: '40px 30px', 
              boxShadow: shadow, border: `1px solid ${cardBorder}`,
              textAlign: 'center'
            }}>
               <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(79, 70, 229, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <Calendar size={32} style={{ color: '#4f46e5' }} />
               </div>
               <h3 style={{ fontSize: '20px', fontWeight: '800', color: primaryText, marginBottom: '8px' }}>Día de Descanso</h3>
               <p style={{ fontSize: '14px', fontWeight: '700', color: mutedText, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Disfruta tu jornada ✨
               </p>
            </div>
         )}
      </section>

      {/* ⚡ QUICK ACTIONS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
         <button 
           onClick={() => setShowBiometrics(true)}
           style={{ 
            background: cardBg, borderRadius: '24px', padding: '24px', 
            border: `1px solid ${cardBorder}`, boxShadow: shadow,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px'
          }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(34, 197, 94, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <CheckCircle2 size={24} style={{ color: '#22c55e' }} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: '800', color: primaryText, textTransform: 'uppercase' }}>Asistencia</span>
         </button>
         
         <button style={{ 
            background: cardBg, borderRadius: '24px', padding: '24px', 
            border: `1px solid ${cardBorder}`, boxShadow: shadow,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px'
          }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(245, 158, 11, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Info size={24} style={{ color: '#f59e0b' }} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: '800', color: primaryText, textTransform: 'uppercase' }}>Novedades</span>
         </button>
      </div>

      {/* 🔔 NOVEDADES / NOTIFICACIONES SECTION */}
      <section style={{ marginBottom: '24px' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
             <div style={{ height: '3px', width: '24px', background: '#4f46e5', borderRadius: '4px' }} />
             <h4 style={{ fontSize: '13px', fontWeight: '800', color: mutedText, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
               Notificaciones
             </h4>
         </div>

         <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {news.length > 0 ? news.map(item => (
               <div key={item.id} style={{ 
                 background: cardBg, padding: '16px', borderRadius: '20px', 
                 border: `1px solid ${cardBorder}`, display: 'flex', alignItems: 'center', gap: '16px' 
               }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(79, 70, 229, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                     <Info size={20} style={{ color: '#4f46e5' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                     <h5 style={{ fontSize: '14px', fontWeight: '700', color: primaryText, margin: 0 }}>{item.title}</h5>
                     <p style={{ fontSize: '12px', color: mutedText, margin: '2px 0 0' }}>{item.description}</p>
                  </div>
                  <ChevronRight size={18} style={{ color: mutedText }} />
               </div>
            )) : (
               <div style={{ textAlign: 'center', padding: '32px 20px', color: mutedText }}>
                  <p style={{ fontSize: '13px', fontWeight: '600' }}>Sin notificaciones pendientes</p>
               </div>
            )}
         </div>
      </section>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default MobileDashboard;
