import React from 'react';
import { Clock, ArrowUpRight, ArrowDownLeft, MapPin, Calendar, ListTodo, Sparkles } from 'lucide-react';
import api from '../../services/api';

const MobileAttendance = ({ user }) => {
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const isDark = window.document.documentElement.classList.contains('dark');

  React.useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await api.get('/attendance/my-attendance');
        setData(res.data);
      } catch (err) {
        console.error("Fetch attendance error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  // Premium Visual Tokens
  const cardBg = isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(255, 255, 255, 0.8)';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';
  const glassEffect = { backdropFilter: 'blur(20px)', border: `1px solid ${cardBorder}` };
  const shadow = isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 20px 40px rgba(0, 0, 0, 0.06)';
  const primaryText = isDark ? '#ffffff' : '#1e293b';
  const mutedText = isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748b';

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0' }}>
        <div style={{ 
            width: '48px', height: '48px', border: '4px solid #10b981', 
            borderTopColor: 'transparent', borderRadius: '50%', 
            animation: 'spin 1s linear infinite' 
        }} />
        <p style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.2em', color: mutedText, marginTop: '20px' }}>
            Sincronizando Actividad...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '100px' }} className="animate-in fade-in slide-in-from-right-10 duration-700">
      
      {/* 📍 PAGE HEADER */}
      <div style={{ padding: '24px 8px 32px' }}>
         <h2 style={{ fontSize: '32px', fontWeight: '950', letterSpacing: '-1.5px', color: primaryText, margin: 0 }}>Mi Actividad</h2>
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
            <Sparkles size={12} color="#10b981" />
            <p style={{ color: mutedText, fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '10px', margin: 0 }}>Registros de Hoy</p>
         </div>
      </div>

      {/* 📜 ACTIVITY LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {data.length > 0 ? (
          data.map((item, idx) => (
            <div key={idx} style={{ 
                background: cardBg, borderRadius: '40px', padding: '32px', 
                ...glassEffect, boxShadow: shadow,
                transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
               
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                     <div style={{ 
                        width: '52px', height: '52px', borderRadius: '18px', 
                        background: 'rgba(16, 185, 129, 0.1)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981',
                        border: '1px solid rgba(16, 185, 129, 0.15)'
                     }}>
                        <Clock size={22} />
                     </div>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <p style={{ fontSize: '15px', fontWeight: '900', color: primaryText, margin: 0, letterSpacing: '-0.3px' }}>{item.storeName || 'Sede Principal'}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.6 }}>
                           <MapPin size={10} color={mutedText} />
                           <span style={{ fontSize: '9px', fontWeight: '800', color: mutedText, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Punto de Control Biométrico</span>
                        </div>
                     </div>
                  </div>
                  <div style={{ 
                      padding: '6px 14px', borderRadius: '30px', 
                      background: item.status === 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                      color: item.status === 0 ? '#10b981' : '#f59e0b',
                      fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em'
                  }}>
                    {item.statusText || 'Procesado'}
                  </div>
               </div>

               <div style={{ 
                   display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', 
                   background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', 
                   padding: '20px', borderRadius: '28px', border: `1px solid ${cardBorder}`
               }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
                        <ArrowUpRight size={16} strokeWidth={3} />
                        <span style={{ fontSize: '18px', fontWeight: '950', letterSpacing: '-0.5px' }}>{item.clockIn ? new Date(item.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                     </div>
                     <p style={{ fontSize: '9px', fontWeight: '800', color: mutedText, textTransform: 'uppercase', letterSpacing: '0.1em', marginLeft: '24px' }}>Entrada</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4f46e5' }}>
                        <ArrowDownLeft size={16} strokeWidth={3} />
                        <span style={{ fontSize: '18px', fontWeight: '950', letterSpacing: '-0.5px' }}>{item.clockOut ? new Date(item.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                     </div>
                     <p style={{ fontSize: '9px', fontWeight: '800', color: mutedText, textTransform: 'uppercase', letterSpacing: '0.1em', marginLeft: '24px' }}>Salida</p>
                  </div>
               </div>

            </div>
          ))
        ) : (
          <div style={{ 
              background: cardBg, borderRadius: '48px', padding: '64px 32px', 
              ...glassEffect, boxShadow: shadow,
              textAlign: 'center', border: `1px dashed ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
          }}>
             <div style={{ 
                 width: '72px', height: '72px', borderRadius: '24px', 
                 background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', 
                 margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                 color: mutedText, boxShadow: isDark ? 'none' : '0 10px 20px rgba(0,0,0,0.03)' 
             }}>
                <ListTodo size={32} />
             </div>
             <p style={{ fontSize: '16px', fontWeight: '900', color: primaryText, margin: '0 0 8px' }}>Sin registros hoy</p>
             <p style={{ fontSize: '11px', color: mutedText, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tu historial biometrizado aparecerá aquí</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default MobileAttendance;
