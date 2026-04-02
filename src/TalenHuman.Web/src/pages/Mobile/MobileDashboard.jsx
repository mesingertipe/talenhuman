import React from 'react';
import { 
  Calendar, MapPin, Clock, Bell, ChevronRight, 
  CheckCircle2, AlertCircle, Info, Fingerprint 
} from 'lucide-react';
import api from '../../services/api';
import BiometricEnrollModal from '../../components/Biometrics/BiometricEnrollModal';

const MobileDashboard = ({ user }) => {
  const [loading, setLoading] = React.useState(true);
  const [todayShift, setTodayShift] = React.useState(null);
  const [news, setNews] = React.useState([]);
  const [showBiometrics, setShowBiometrics] = React.useState(false);

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
      <div style={{ display: 'flex', flexDirection: 'column', itemsCenter: 'center', justifyContent: 'center', height: '60vh', color: 'white' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '60px', paddingTop: '20px' }} className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
      
      {/* 🚀 BIOMETRIC MODAL */}
      {showBiometrics && <BiometricEnrollModal onComplete={() => setShowBiometrics(false)} onCancel={() => setShowBiometrics(false)} />}

      {/* 👑 ELITE HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 15px #4ade80' }} />
               <span style={{ fontSize: '10px', fontBlack: '900', textTransform: 'uppercase', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.4)' }}>Elite Active</span>
            </div>
            <h2 style={{ fontSize: '38px', fontWeight: '900', letterSpacing: '-0.05em', color: 'white', lineHeight: '1', marginTop: '8px' }}>
               Hola, <span style={{ background: 'linear-gradient(to right, #fff, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.fullName?.split(' ')[0] || 'Edna'}</span>
            </h2>
            <div style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', width: 'fit-content', marginTop: '12px' }}>
               <span style={{ fontSize: '9px', fontWeight: '700', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{user?.tenantName || 'TalenHuman Global'}</span>
            </div>
         </div>
         
         <button 
            onClick={() => setShowBiometrics(true)}
            style={{ width: '60px', height: '60px', borderRadius: '22px', background: 'rgba(129, 140, 248, 0.1)', border: '1px solid rgba(129, 140, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}
         >
            <Fingerprint size={32} strokeWidth={1.5} />
         </button>
      </div>

      {/* 🗓️ TURNOS PREMIUM CARD */}
      <section style={{ marginBottom: '40px' }}>
         {todayShift ? (
           <div style={{ position: 'relative', background: 'rgba(255,255,255,0.05)', borderRadius: '40px', padding: '32px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', boxShadow: '0 30px 60px -12px rgba(0,0,0,0.6)' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, padding: '24px' }}>
                 <div style={{ padding: '4px 12px', background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.2)', borderRadius: '20px' }}>
                    <span style={{ fontSize: '9px', fontWeight: '900', color: '#4ade80', textTransform: 'uppercase' }}>En Horario</span>
                 </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
                 <div style={{ width: '56px', height: '56px', background: 'rgba(129, 140, 248, 0.1)', borderRadius: '18px', border: '1px solid rgba(129, 140, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                    <Clock size={28} />
                 </div>
                 <div>
                    <p style={{ fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '4px' }}>Entrada Hoy</p>
                    <h3 style={{ fontSize: '36px', fontWeight: '900', color: 'white', letterSpacing: '-0.02em' }}>
                       {new Date(todayShift.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </h3>
                 </div>
              </div>

              <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                 <MapPin size={18} style={{ color: '#818cf8' }} />
                 <span style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>{todayShift.storeName || 'Sede Central'}</span>
              </div>
           </div>
         ) : (
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '40px', padding: '48px', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>
               <div style={{ width: '70px', height: '70px', background: 'rgba(255,255,255,0.05)', borderRadius: '28px', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)' }}>
                  <Calendar size={36} strokeWidth={1} />
               </div>
               <p style={{ fontSize: '18px', fontWeight: '900', color: 'white', marginBottom: '4px' }}>Día de Descanso</p>
               <p style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Disfruta tu jornada ✨</p>
            </div>
         )}
      </section>

      {/* ⚡ NATIVE ACTION GRID */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
         <button style={{ background: 'rgba(255,255,255,0.04)', padding: '32px 20px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', transition: 'all 0.3s', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
            <div style={{ width: '60px', height: '60px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '22px', border: '1px solid rgba(34, 197, 94, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}>
               <CheckCircle2 size={32} />
            </div>
            <span style={{ fontSize: '11px', fontWeight: '900', color: 'white', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Asistencia</span>
         </button>

         <button style={{ background: 'rgba(255,255,255,0.04)', padding: '32px 20px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', transition: 'all 0.3s', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
            <div style={{ width: '60px', height: '60px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '22px', border: '1px solid rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
               <Info size={32} />
            </div>
            <span style={{ fontSize: '11px', fontWeight: '900', color: 'white', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Novedades</span>
         </button>
      </section>

      {/* 🔔 ALERTS AREA */}
      {news.length > 0 && (
         <section style={{ marginTop: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', padding: '0 8px' }}>
               <span style={{ fontSize: '10px', fontWeight: '900', color: '#fb7185', textTransform: 'uppercase', letterSpacing: '0.3em' }}>Alertas</span>
               <div style={{ flex: 1, height: '1px', background: 'rgba(251, 113, 133, 0.2)' }} />
            </div>
            <div style={{ background: 'linear-gradient(135deg, rgba(251,113,133,0.15) 0%, rgba(15,23,42,0.6) 100%)', padding: '24px', borderRadius: '32px', border: '1px solid rgba(251,113,133,0.2)', display: 'flex', alignItems: 'center', gap: '20px', position: 'relative', overflow: 'hidden' }}>
               <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <AlertCircle size={24} />
               </div>
               <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '16px', fontWeight: '900', color: 'white', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{news[0].title}</p>
                  <span style={{ fontSize: '9px', fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ver Detalles Agregados</span>
               </div>
               <ChevronRight size={20} style={{ color: 'rgba(255,255,255,0.2)' }} />
            </div>
         </section>
      )}

    </div>
  );
};

export default MobileDashboard;
