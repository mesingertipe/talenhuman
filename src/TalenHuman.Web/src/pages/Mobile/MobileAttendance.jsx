import React, { useState, useEffect } from 'react';
import { 
  Clock, ArrowUpRight, ArrowDownLeft, MapPin, 
  ChevronLeft, ChevronRight, 
  CalendarDays, CalendarRange, ListTodo, Sparkles 
} from 'lucide-react';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const MobileAttendance = ({ user }) => {
  const { isDarkMode } = useTheme();
  const isDark = isDarkMode;
  const [view, setView] = useState('day'); // 'day', 'week', 'month'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchAttendance();
  }, [view, currentDate]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      let start, end;
      const d = new Date(currentDate);
      
      if (view === 'day') {
        start = new Date(d.setHours(0,0,0,0)).toISOString();
        end = new Date(d.setHours(23,59,59,999)).toISOString();
      } else if (view === 'week') {
        const startOfWeek = new Date(d);
        const day = d.getDay();
        const offset = day === 0 ? 6 : day - 1; // MON=0, SUN=6
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

      const res = await api.get('/attendance/my-attendance', { params: { start, end } });
      setData(res.data);
    } catch (err) {
      console.error("Fetch attendance error", err);
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
  const shadow = isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 20px 40px rgba(0, 0, 0, 0.06)';

  return (
    <div style={{ paddingBottom: '100px' }} className="animate-in fade-in slide-in-from-right-10 duration-700 no-select">
      
      {/* 🏔️ PREMIUM HEADER */}
      <div style={{ padding: '24px 8px 32px' }}>
         <h2 style={{ fontSize: '32px', fontWeight: '950', letterSpacing: '-1.5px', color: primaryText, margin: 0 }}>Mi Actividad</h2>
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
            <Sparkles size={12} color="#10b981" />
            <p style={{ color: mutedText, fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '10px', margin: 0 }}>Historial Biometrizado</p>
         </div>

         {/* 📅 VIEW SWITCHER */}
         <div style={{ 
            display: 'flex', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', 
            padding: '6px', borderRadius: '24px', marginTop: '24px', gap: '4px' 
         }}>
            <TabButton active={view === 'day'} onClick={() => setView('day')} label="Día" isDark={isDark} color="#10b981" />
            <TabButton active={view === 'week'} onClick={() => setView('week')} label="Semana" isDark={isDark} color="#10b981" />
            <TabButton active={view === 'month'} onClick={() => setView('month')} label="Mes" isDark={isDark} color="#10b981" />
         </div>
      </div>

      {/* 📅 DATE SELECTOR */}
      <div style={{ 
          margin: '0 8px 32px', padding: '20px 24px', borderRadius: '32px',
          background: cardBg, ...glassEffect, boxShadow: shadow,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
         <button onClick={handlePrev} style={navButtonStyle}><ChevronLeft size={24} /></button>
         <p style={{ fontSize: '15px', fontWeight: '900', color: primaryText, margin: 0, textTransform: 'capitalize' }}>{formatDateLabel()}</p>
         <button onClick={handleNext} style={navButtonStyle}><ChevronRight size={24} /></button>
      </div>

      {/* 📜 ACTIVITY LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '0 8px' }}>
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid #10b981', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          </div>
        ) : data.length > 0 ? (
          data.map((item, idx) => (
            <AttendanceCard key={idx} item={item} isDark={isDark} primaryText={primaryText} mutedText={mutedText} cardBg={cardBg} glassEffect={glassEffect} shadow={shadow} cardBorder={cardBorder} />
          ))
        ) : (
          <div style={{ background: cardBg, borderRadius: '48px', padding: '64px 32px', ...glassEffect, boxShadow: shadow, textAlign: 'center' }}>
             <ListTodo size={32} color={mutedText} style={{ marginBottom: '16px' }} />
             <p style={{ fontSize: '16px', fontWeight: '900', color: primaryText, margin: '0 0 8px' }}>Sin registros en este periodo</p>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const TabButton = ({ active, onClick, label, isDark, color }) => (
   <button onClick={onClick} style={{
     flex: 1, padding: '12px 10px', borderRadius: '18px', border: 'none',
     background: active ? (isDark ? 'rgba(255,255,255,0.1)' : '#ffffff') : 'transparent',
     boxShadow: active ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
     color: active ? color : (isDark ? 'rgba(255,255,255,0.45)' : '#64748b'),
     fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer'
   }}>{label}</button>
);

const AttendanceCard = ({ item, isDark, primaryText, mutedText, cardBg, glassEffect, shadow, cardBorder }) => (
   <div style={{ 
       background: cardBg, borderRadius: '40px', padding: '32px', 
       ...glassEffect, boxShadow: shadow
   }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '18px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
               <Clock size={22} />
            </div>
            <div>
               <p style={{ fontSize: '15px', fontWeight: '900', color: primaryText, margin: 0 }}>{item.storeName || 'Sede Principal'}</p>
               <p style={{ fontSize: '9px', fontWeight: '800', color: mutedText, textTransform: 'uppercase', opacity: 0.6 }}>{new Date(item.clockIn).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
            </div>
         </div>
         <div style={{ 
             padding: '6px 14px', borderRadius: '30px', 
             background: item.status === 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
             color: item.status === 0 ? '#10b981' : '#f59e0b',
             fontSize: '9px', fontWeight: '950', textTransform: 'uppercase'
         }}>{item.statusText || 'Procesado'}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', padding: '24px', borderRadius: '32px', border: `1px solid ${cardBorder}` }}>
         <TimeBlock label="Entrada" time={item.clockIn} icon={<ArrowUpRight size={16} />} color="#10b981" mutedText={mutedText} primaryText={primaryText} />
         <TimeBlock label="Salida" time={item.clockOut} icon={<ArrowDownLeft size={16} />} color="#4f46e5" mutedText={mutedText} primaryText={primaryText} />
      </div>
   </div>
);

const TimeBlock = ({ label, time, icon, color, mutedText, primaryText }) => (
   <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: color }}>
         {icon}
         <span style={{ fontSize: '18px', fontWeight: '950' }}>{time ? new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
      </div>
      <p style={{ fontSize: '9px', fontWeight: '800', color: mutedText, textTransform: 'uppercase', marginLeft: '24px', margin: 0 }}>{label}</p>
   </div>
);

const navButtonStyle = {
  width: '44px', height: '44px', borderRadius: '14px', border: 'none',
  background: 'rgba(16, 185, 129, 0.05)', color: '#10b981',
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
};

export default MobileAttendance;
