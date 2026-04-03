import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, MapPin, 
  ChevronLeft, ChevronRight, 
  CalendarDays, CalendarRange, CalendarCheck,
  LayoutGrid, List, Sparkles, Filter
} from 'lucide-react';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const MobileShifts = ({ user }) => {
  const { isDarkMode } = useTheme();
  const isDark = isDarkMode;
  const [view, setView] = useState('day'); // 'day', 'week', 'month'
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchShifts();
  }, [view, currentDate]);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      let start, end;
      const d = new Date(currentDate);
      
      if (view === 'day') {
        const d_day = new Date(d);
        start = new Date(d_day.setHours(0,0,0,0)).toISOString();
        end = new Date(d_day.setHours(23,59,59,999)).toISOString();
      } else if (view === 'week') {
        const startOfWeek = new Date(d);
        const day = d.getDay();
        const offset = day === 0 ? 6 : day - 1; // 🟢 MON=0, SUN=6
        startOfWeek.setDate(d.getDate() - offset);
        startOfWeek.setHours(0,0,0,0);
        start = startOfWeek.toISOString();

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23,59,59,999);
        end = endOfWeek.toISOString();
      } else {
        start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
        end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();
      }

      const res = await api.get('/shifts/my-shifts', { params: { start, end } });
      setShifts(res.data);
    } catch (err) {
      console.error("Fetch shifts error", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    const d = new Date(currentDate);
    if (view === 'day') d.setDate(d.getDate() - 1);
    else if (view === 'week') d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (view === 'day') d.setDate(d.getDate() + 1);
    else if (view === 'week') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const formatDateLabel = () => {
    if (view === 'day') return currentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    if (view === 'week') {
      const startOfWeek = new Date(currentDate);
      const day = currentDate.getDay();
      const offset = day === 0 ? 6 : day - 1; 
      startOfWeek.setDate(currentDate.getDate() - offset);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      const options = { month: 'short' };
      if (startOfWeek.getMonth() !== endOfWeek.getMonth()) {
         return `${startOfWeek.getDate()} ${startOfWeek.toLocaleDateString('es-ES', options)} - ${endOfWeek.getDate()} ${endOfWeek.toLocaleDateString('es-ES', options)}`;
      }
      return `${startOfWeek.getDate()} - ${endOfWeek.getDate()} ${endOfWeek.toLocaleDateString('es-ES', options)}`;
    }
    return currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  };

  // Premium Visual Tokens
  const primaryText = isDark ? '#ffffff' : '#1e293b';
  const mutedText = isDark ? 'rgba(255, 255, 255, 0.45)' : '#64748b';
  const cardBg = isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(255, 255, 255, 0.8)';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
  const glassEffect = { backdropFilter: 'blur(20px)', border: `1px solid ${cardBorder}` };
  const shadow = isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 20px 40px rgba(0, 0, 0, 0.04)';

  return (
    <div style={{ paddingBottom: '100px' }} className="animate-in fade-in slide-in-from-right-10 duration-700 no-select">
      
      {/* 🏔️ PREMIUM HEADER */}
      <div style={{ padding: '24px 8px 32px' }}>
         <h2 style={{ fontSize: '32px', fontWeight: '950', letterSpacing: '-1.5px', color: primaryText, margin: 0 }}>Mis Turnos</h2>
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
            <Sparkles size={12} color="#4f46e5" />
            <p style={{ color: mutedText, fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '10px', margin: 0 }}>Programación Operativa</p>
         </div>

         {/* 📅 VIEW SWITCHER (ULTRA-MODERN) */}
         <div style={{ 
            display: 'flex', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', 
            padding: '6px', borderRadius: '24px', marginTop: '24px', gap: '4px' 
         }}>
            <TabButton active={view === 'day'} onClick={() => setView('day')} label="Día" isDark={isDark} />
            <TabButton active={view === 'week'} onClick={() => setView('week')} label="Semana" isDark={isDark} />
            <TabButton active={view === 'month'} onClick={() => setView('month')} label="Mes" isDark={isDark} />
         </div>
      </div>

      {/* 📅 FLOATING DATE SELECTOR */}
      <div style={{ 
          margin: '0 8px 32px', padding: '20px 24px', borderRadius: '32px',
          background: cardBg, ...glassEffect, boxShadow: shadow,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
         <button 
           onClick={handlePrev} 
           style={{ 
             width: '44px', height: '44px', borderRadius: '14px', border: 'none',
             background: 'rgba(79, 70, 229, 0.05)', color: '#4f46e5',
             display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
           }}
         >
            <ChevronLeft size={24} strokeWidth={2.5} />
         </button>
         
         <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '15px', fontWeight: '900', color: primaryText, margin: 0, textTransform: 'capitalize', letterSpacing: '-0.3px' }}>
              {formatDateLabel()}
            </p>
         </div>

         <button 
           onClick={handleNext} 
           style={{ 
             width: '44px', height: '44px', borderRadius: '14px', border: 'none',
             background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5',
             display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
           }}
         >
            <ChevronRight size={24} strokeWidth={2.5} />
         </button>
      </div>

      {/* 📜 SHIFT LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '0 8px' }}>
         {loading ? (
            <div style={{ py: '60px', textAlign: 'center' }}>
               <div style={{ width: '40px', height: '40px', border: '4px solid #4f46e5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
               <p style={{ fontSize: '10px', fontWeight: '900', color: mutedText, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Sincronizando...</p>
            </div>
         ) : shifts.length > 0 ? (
            shifts.map((shift, idx) => (
               <ShiftCard 
                  key={idx} 
                  shift={shift} 
                  isDark={isDark} 
                  primaryText={primaryText}
                  mutedText={mutedText}
                  cardBg={cardBg}
                  glassEffect={glassEffect}
                  shadow={shadow}
                  cardBorder={cardBorder}
               />
            ))
         ) : (
            <div style={{ 
               background: cardBg, borderRadius: '40px', padding: '64px 32px', 
               ...glassEffect, boxShadow: shadow, textAlign: 'center', opacity: 0.8 
            }}>
               <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: mutedText }}>
                  <CalendarDays size={32} />
               </div>
               <p style={{ fontSize: '16px', fontWeight: '900', color: primaryText, margin: '0 0 8px' }}>Sin turnos asignados</p>
               <p style={{ fontSize: '11px', color: mutedText, fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Consulta con tu supervisor</p>
            </div>
         )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const TabButton = ({ active, onClick, label, isDark }) => (
   <button 
      onClick={onClick}
      style={{
        flex: 1, padding: '12px 10px', borderRadius: '18px', border: 'none',
        background: active ? (isDark ? 'rgba(255,255,255,0.1)' : '#ffffff') : 'transparent',
        boxShadow: active ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
        color: active ? '#4f46e5' : (isDark ? 'rgba(255,255,255,0.4)' : '#64748b'),
        fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em',
        cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
   >
      {label}
   </button>
);

const ShiftCard = ({ shift, isDark, primaryText, mutedText, cardBg, glassEffect, shadow, cardBorder }) => {
   const isDescanso = shift.isDescanso;
   const startTime = new Date(shift.startTime);
   const endTime = new Date(shift.endTime);

   return (
      <div style={{ 
          background: cardBg, borderRadius: '40px', padding: '32px', 
          ...glassEffect, boxShadow: shadow, overflow: 'hidden', position: 'relative'
      }}>
         {isDescanso && (
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', color: '#f59e0b', opacity: 0.05 }}>
               <Sparkles size={160} />
            </div>
         )}

         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
               <div style={{ 
                  width: '52px', height: '52px', borderRadius: '18px', 
                  background: isDescanso ? 'rgba(245, 158, 11, 0.1)' : 'rgba(79, 70, 229, 0.1)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  color: isDescanso ? '#f59e0b' : '#4f46e5'
               }}>
                  {isDescanso ? <Sparkles size={24} /> : <Clock size={24} />}
               </div>
               <div>
                  <p style={{ fontSize: '15px', fontWeight: '900', color: primaryText, margin: 0, letterSpacing: '-0.3px' }}>
                     {isDescanso ? 'Día de Descanso' : 'Turno Operativo'}
                  </p>
                  <p style={{ fontSize: '10px', color: mutedText, fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '2px 0 0' }}>
                     {startTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })}
                  </p>
               </div>
            </div>
            
            {!isDescanso && (
               <div style={{ 
                  padding: '6px 14px', borderRadius: '30px', 
                  background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5', 
                  fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' 
               }}>
                  Programado
               </div>
            )}
         </div>

         {!isDescanso ? (
            <div style={{ 
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', 
                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', 
                padding: '24px', borderRadius: '30px', border: `1px solid ${cardBorder}`
            }}>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <p style={{ fontSize: '9px', fontWeight: '800', color: mutedText, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Entrada</p>
                  <span style={{ fontSize: '20px', fontWeight: '950', color: primaryText, letterSpacing: '-0.5px' }}>
                     {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <p style={{ fontSize: '9px', fontWeight: '800', color: mutedText, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Salida</p>
                  <span style={{ fontSize: '20px', fontWeight: '950', color: primaryText, letterSpacing: '-0.5px' }}>
                     {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
               </div>
            </div>
         ) : (
            <div style={{ 
               background: 'rgba(245, 158, 11, 0.08)', padding: '24px', 
               borderRadius: '30px', textAlign: 'center', border: '1px solid rgba(245, 158, 11, 0.1)' 
            }}>
               <p style={{ fontSize: '13px', fontWeight: '900', color: '#f59e0b', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ¡Disfruta tu día libre! ✨
               </p>
            </div>
         )}

         {/* 🧹 Observation block removed by user request (CLEAN V63.6.4) */}
      </div>
   );
};

export default MobileShifts;
