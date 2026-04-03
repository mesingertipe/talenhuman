import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Calendar, Clock, MapPin, 
  ChevronRight, ArrowRight, Bell, 
  Search, Filter, Plus, Fingerprint, CalendarDays,
  CheckCircle2, AlertCircle, Sparkles, MessageSquare, MessageCircle
} from 'lucide-react';
import BiometricEnrollModal from '../../components/Biometrics/BiometricEnrollModal';

const MobileDashboard = ({ user, theme, setPage }) => {
  const isDark = theme === 'dark';
  const [showBiometrics, setShowBiometrics] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shiftData, setShiftData] = useState(null);
  const [lastMarking, setLastMarking] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Today's Shift
        const now = new Date();
        const start = new Date(now.setHours(0,0,0,0)).toISOString();
        const end = new Date(now.setHours(23,59,59,999)).toISOString();
        
        const [shiftRes, attRes] = await Promise.all([
          api.get('/shifts/my-shifts', { params: { start, end } }),
          api.get('/attendance/my-attendance')
        ]);

        if (shiftRes.data?.length > 0) {
          setShiftData(shiftRes.data[0]);
        }
        
        if (attRes.data?.length > 0) {
          setLastMarking(attRes.data[0]);
        }
      } catch (err) {
        console.error("Dashboard data fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Premium Visual Tokens (V65.0)
  const cardBg = isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(255, 255, 255, 0.8)';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';
  const glassEffect = { backdropFilter: 'blur(20px)', border: `1px solid ${cardBorder}` };
  const shadow = isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 20px 40px rgba(0, 0, 0, 0.06)';
  const primaryText = isDark ? '#ffffff' : '#1e293b';
  const mutedText = isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748b';
  const accentGradient = 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%)';

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

      {/* 🏔️ DASHBOARD HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', padding: '0 8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
             <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.6px', color: primaryText, margin: 0 }}>
                <span style={{ color: '#4f46e5', opacity: 0.8 }}>Hola,</span> {user?.fullName || 'TalenHuman'}
             </h2>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: '900', color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                   {user?.jobTitle || user?.roles?.[0] || 'Gerente General'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: mutedText }}>
                   <MapPin size={12} strokeWidth={2.5} />
                   <span style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '-0.2px' }}>
                      {user?.storeName || 'Sede Principal'}
                   </span>
                </div>
             </div>
          </div>
          
          <button 
             onClick={() => setShowBiometrics(true)}
             style={{
                width: '50px', height: '50px', borderRadius: '18px',
                background: isDark ? 'rgba(79, 70, 229, 0.1)' : 'rgba(79, 70, 229, 0.05)',
                border: `1px solid ${isDark ? 'rgba(79, 70, 229, 0.2)' : 'rgba(79, 70, 229, 0.1)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5'
             }}
          >
             <Fingerprint size={24} />
          </button>
       </div>

       {/* 📅 DYNAMIC SHIFT CARD (PREMIUM GLASS) */}
       <div 
          onClick={() => setPage('Turnos')}
          style={{ 
             background: accentGradient,
             borderRadius: '40px', padding: '48px 32px', color: 'white',
             boxShadow: '0 30px 60px rgba(79, 70, 229, 0.4)',
             marginBottom: '32px', position: 'relative', overflow: 'hidden',
             cursor: 'pointer',
             border: '1px solid rgba(255,255,255,0.1)'
          }}
       >
          <div style={{ position: 'absolute', top: '-15%', right: '-15%', opacity: 0.15, transform: 'rotate(-15deg)' }}>
             <CalendarDays size={240} />
          </div>
          
          {/* Inner Glow Effect */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top left, rgba(255,255,255,0.2) 0%, transparent 70%)' }} />
          
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
             <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                {shiftData?.isDescanso ? <Sparkles size={32} /> : <CalendarDays size={32} />}
             </div>
             
             {loading ? (
                <div style={{ height: '40px', width: '120px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />
             ) : (
                <>
                   <h3 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 8px' }}>
                      {shiftData?.isDescanso ? 'Día de Descanso' : 
                       shiftData ? `${new Date(shiftData.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 
                       'Sin Turno Hoy'}
                   </h3>
                   <p style={{ fontSize: '15px', fontWeight: '600', opacity: 0.8, margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {shiftData?.isDescanso ? 'Disfruta tu jornada ✨' : 
                       shiftData ? 'Tu próximo turno comienza pronto' : 
                       'Valida con tu gerente'}
                   </p>
                </>
             )}
          </div>
       </div>

       {lastMarking && (
          <div style={{ 
             marginBottom: '32px', padding: '24px', borderRadius: '32px', 
             background: cardBg, ...glassEffect,
             display: 'flex', alignItems: 'center', justifyContent: 'space-between',
             boxShadow: shadow
          }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                    <CheckCircle2 size={20} />
                </div>
                <div>
                   <p style={{ fontSize: '13px', fontWeight: '800', margin: '0 0 2px' }}>Último Registro</p>
                   <p style={{ fontSize: '11px', color: mutedText, margin: 0 }}>{lastMarking.storeName} • {new Date(lastMarking.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
             </div>
             <ChevronRight size={18} color="#cbd5e1" />
          </div>
       )}

       {/* 🧩 QUICK ACTIONS GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
           <ActionCard 
              icon={<CheckCircle2 size={24} />} 
              label="ASISTENCIA" 
              color="#10b981" 
              isDark={isDark} 
              cardBg={cardBg}
              glassEffect={glassEffect}
              shadow={shadow}
              onClick={() => setPage('Marcaciones')}
           />
           <ActionCard 
              icon={<MessageSquare size={24} />} 
              label="COMUNICADOS" 
              color="#f59e0b" 
              isDark={isDark} 
              cardBg={cardBg}
              glassEffect={glassEffect}
              shadow={shadow}
              onClick={() => setPage('Novedades')}
           />
        </div>

       <div style={{ marginTop: '32px' }}>
          <SectionHeader title="NOTIFICACIONES" isDark={isDark} />
          <div style={{ 
             background: cardBg, borderRadius: '32px', padding: '28px', 
             ...glassEffect, boxShadow: shadow,
             display: 'flex', alignItems: 'center', gap: '16px' 
          }}>
             <div style={{ width: '52px', height: '52px', borderRadius: '18px', background: 'rgba(79, 70, 229, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
                <Sparkles size={22} />
             </div>
             <div style={{ flex: 1 }}>
                <p style={{ fontSize: '15px', fontWeight: '800', color: primaryText, margin: '0 0 4px', letterSpacing: '-0.3px' }}>Nueva Actualización</p>
                <p style={{ fontSize: '12px', color: mutedText, margin: 0, lineHeight: '1.4' }}>Sede Central y Gestión de Turnos.</p>
             </div>
          </div>
       </div>
    </div>
  );
};
const ActionCard = ({ icon, label, color, isDark, onClick, cardBg, glassEffect, shadow }) => (
    <div 
        onClick={onClick}
        style={{ 
            background: cardBg,
            borderRadius: '32px', padding: '36px 24px', 
            ...glassEffect,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
            boxShadow: shadow,
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
    >
        <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
            {icon}
        </div>
        <span style={{ fontSize: '13px', fontWeight: '900', color: isDark ? '#ffffff' : '#1e293b', letterSpacing: '0.05em' }}>{label}</span>
    </div>
);

const SectionHeader = ({ title, isDark }) => (
    <h3 style={{ 
        fontSize: '12px', fontWeight: '900', color: isDark ? 'rgba(255,255,255,0.4)' : '#64748b', 
        textTransform: 'uppercase', letterSpacing: '0.1em', paddingLeft: '8px', marginBottom: '16px' 
    }}>
        {title}
    </h3>
);

export default MobileDashboard;
