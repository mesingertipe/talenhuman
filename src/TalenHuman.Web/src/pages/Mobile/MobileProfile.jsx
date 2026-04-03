import React from 'react';
import { 
  User, Mail, Phone, Calendar, MapPin, 
  ChevronRight, ArrowLeft, Camera, Edit2,
  Shield, Bell, CreditCard, Droplets
} from 'lucide-react';

const MobileProfile = ({ user, setPage, theme }) => {
  const isDark = theme === 'dark';
  
  const primaryText = isDark ? '#ffffff' : '#1e293b';
  const mutedText = isDark ? 'rgba(255, 255, 255, 0.4)' : '#64748b';
  const cardBg = isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
  const accentColor = '#4f46e5';

  return (
    <div className="animate-in fade-in slide-in-from-bottom-10 duration-700">
      
      {/* 🚀 ELITE PROFILE HEADER */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '32px 0',
        marginBottom: '20px'
      }}>
         <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '35px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '42px',
            fontWeight: '900',
            boxShadow: '0 15px 30px rgba(79, 70, 229, 0.3)'
         }}>
            {user?.fullName?.charAt(0) || 'U'}
         </div>
         
         <h2 style={{ fontSize: '26px', fontWeight: '800', color: primaryText, margin: 0, letterSpacing: '-0.5px' }}>
            {user?.fullName || 'Colaborador'}
         </h2>
         <span style={{ 
            fontSize: '12px', fontWeight: '800', color: accentColor, 
            background: 'rgba(79, 70, 229, 0.1)', padding: '4px 16px', 
            borderRadius: '20px', marginTop: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' 
         }}>
            {user?.jobTitle || user?.roles?.[0] || 'Gerente General'}
         </span>

         <div style={{ width: '100%', height: '1px', background: cardBorder, margin: '24px 0' }} />

         {/* Grid Info Details */}
         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', width: '100%' }}>
            <div style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: mutedText, marginBottom: '4px' }}>
                    <MapPin size={12} />
                    <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>Tienda</span>
                </div>
                <p style={{ fontSize: '13px', fontWeight: '700', color: primaryText }}>{user?.storeName || 'Sede Central'}</p>
            </div>
            <div style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: mutedText, marginBottom: '4px' }}>
                    <Calendar size={12} />
                    <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>Ingreso</span>
                </div>
                <p style={{ fontSize: '13px', fontWeight: '700', color: primaryText }}>{user?.joinDate ? new Date(user.joinDate).toLocaleDateString() : 'N/A'}</p>
            </div>
         </div>
      </div>

      {/* 🏔️ SETTINGS SECTIONS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
         <SectionHeader title="Cuenta" isDark={isDark} />
         
         <div style={{ 
            background: cardBg, borderRadius: '24px', 
            border: `1px solid ${cardBorder}`, overflow: 'hidden' 
         }}>
            <ProfileItem 
                icon={<Mail size={18} />} 
                label="Email" 
                value={user?.email || 'No disponible'} 
                isDark={isDark} 
            />
            <ProfileItem 
                icon={<Shield size={18} />} 
                label="Seguridad" 
                value="Vincular Biometría" 
                isDark={isDark} 
                onClick={() => setPage('home')} // Will trigger enrollment prompt if needed
                showChevron
            />
         </div>

         <SectionHeader title="Preferencias" isDark={isDark} />
         <div style={{ 
            background: cardBg, borderRadius: '24px', 
            border: `1px solid ${cardBorder}`, overflow: 'hidden' 
         }}>
            <ProfileItem 
                icon={<Droplets size={18} />} 
                label="Modo Visual" 
                value={isDark ? 'Oscuro' : 'Claro'} 
                isDark={isDark} 
                showChevron
            />
            <ProfileItem 
                icon={<Bell size={18} />} 
                label="Notificaciones" 
                value="Activado" 
                isDark={isDark} 
                showLast
            />
         </div>
      </div>

      <button 
        style={{
            width: '100%', marginTop: '40px', padding: '20px', borderRadius: '24px',
            background: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
            color: '#ef4444', border: 'none', fontWeight: '800', fontSize: '14px',
            cursor: 'pointer'
        }}
      >
        Cerrar Sesión
      </button>
    </div>
  );
};

const SectionHeader = ({ title, isDark }) => (
    <h3 style={{ 
        fontSize: '11px', fontWeight: '900', color: isDark ? 'rgba(255,255,255,0.4)' : '#64748b', 
        textTransform: 'uppercase', letterSpacing: '0.1em', paddingLeft: '8px', marginBottom: '8px' 
    }}>
        {title}
    </h3>
);

const ProfileItem = ({ icon, label, value, isDark, showChevron, onClick, showLast }) => (
    <div 
        onClick={onClick}
        style={{
            padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: showLast ? 'none' : `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`,
            cursor: onClick ? 'pointer' : 'default'
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ color: '#4f46e5' }}>{icon}</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.4)' : '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {label}
                </span>
                <span style={{ fontSize: '15px', color: isDark ? '#ffffff' : '#1e293b', fontWeight: '700' }}>
                    {value}
                </span>
            </div>
        </div>
        {showChevron && <ChevronRight size={16} color={isDark ? 'rgba(255,255,255,0.2)' : '#cbd5e1'} />}
    </div>
);

export default MobileProfile;
