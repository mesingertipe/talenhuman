import React, { useState } from 'react';
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

      {/* 🏔️ ELITE DASHBOARD HEADER (V63.6 - CLEAN) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
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

       {/* 📅 FEATURE CARD: TURNOS */}
       <div style={{ 
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          borderRadius: '40px', padding: '40px 32px', color: 'white',
          boxShadow: '0 20px 50px rgba(79, 70, 229, 0.3)',
          marginBottom: '32px', position: 'relative', overflow: 'hidden'
       }}>
          <div style={{ position: 'absolute', top: '-10%', right: '-10%', opacity: 0.1 }}>
             <CalendarDays size={200} />
          </div>
          
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
             <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <CalendarDays size={32} />
             </div>
             <h3 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 8px' }}>Día de Descanso</h3>
             <p style={{ fontSize: '15px', fontWeight: '600', opacity: 0.8, margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Disfruta tu jornada ✨
             </p>
          </div>
       </div>

       {/* 🧩 QUICK ACTIONS GRID */}
       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <ActionCard 
             icon={<CheckCircle2 size={24} />} 
             label="ASISTENCIA" 
             color="#10b981" 
             isDark={isDark} 
             onClick={() => setPage('Marcaciones')}
          />
          <ActionCard 
             icon={<MessageSquare size={24} />} 
             label="COMUNICADOS" 
             color="#f59e0b" 
             isDark={isDark} 
             onClick={() => setPage('Novedades')}
          />
       </div>

       <div style={{ marginTop: '32px' }}>
          <SectionHeader title="NOTIFICACIONES" isDark={isDark} />
          <div style={{ 
             background: cardBg, borderRadius: '30px', padding: '24px', 
             border: `1px solid ${cardBorder}`, display: 'flex', alignItems: 'center', gap: '16px' 
          }}>
             <div style={{ width: '48px', height: '48px', borderRadius: '15px', background: 'rgba(79, 70, 229, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
                <Sparkles size={20} />
             </div>
             <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: '700', color: primaryText, margin: '0 0 2px' }}>Actualización Elite V63.6</p>
                <p style={{ fontSize: '12px', color: mutedText, margin: 0 }}>Jerarquía de Tienda y Header Central.</p>
             </div>
          </div>
       </div>
    </div>
  );
};

const ActionCard = ({ icon, label, color, isDark, onClick }) => (
    <div 
        onClick={onClick}
        style={{ 
            background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff',
            borderRadius: '32px', padding: '32px 24px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
            boxShadow: isDark ? 'none' : '0 10px 25px rgba(0,0,0,0.04)',
            cursor: 'pointer'
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
