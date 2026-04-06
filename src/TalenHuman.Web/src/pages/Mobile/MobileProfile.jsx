import React, { useState } from 'react';
import { 
  User, Mail, Phone, Calendar, MapPin, 
  ChevronRight, ArrowLeft, Camera, Edit2,
  Bell, CreditCard, Droplets, LogOut, Key, Sun, Moon, Lock
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { formatDate } from '../../utils/formatters';

const MobileProfile = ({ user, setPage, onLogout }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const isDark = isDarkMode;
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem('notifications_enabled') !== 'false');
  
  const handleToggleNotifications = () => {
    const newState = !notificationsEnabled;
    localStorage.setItem('notifications_enabled', String(newState));
    setNotificationsEnabled(newState);
    if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(5);
    }
  };

  const primaryText = isDark ? '#ffffff' : '#1e293b';
  const mutedText = isDark ? 'rgba(255, 255, 255, 0.4)' : '#64748b';
  const cardBg = isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
  const accentColor = '#4f46e5';
  const shadow = isDark ? '0 20px 40px rgba(0,0,0,0.4)' : '0 10px 25px rgba(0,0,0,0.04)';

  return (
    <div className="animate-in fade-in slide-in-from-bottom-10 duration-700">
      
      {/* 🚀 PROFILE HEADER */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '32px 0 20px',
        marginBottom: '20px'
      }}>
         <div style={{
            width: '110px',
            height: '110px',
            borderRadius: '40px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '48px',
            fontWeight: '900',
            boxShadow: '0 20px 40px rgba(79, 70, 229, 0.3)',
            position: 'relative'
         }}>
            {user?.fullName?.charAt(0) || 'U'}
            <div style={{ 
                position: 'absolute', bottom: '-5px', right: '-5px', 
                width: '36px', height: '36px', borderRadius: '12px',
                background: '#10b981', border: `4px solid ${isDark ? '#060914' : '#f8fafc'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
            }}>
                <Camera size={16} />
            </div>
         </div>
         
         <h2 style={{ fontSize: '22px', fontWeight: '800', color: primaryText, margin: 0, letterSpacing: '-0.6px' }}>
            {user?.fullName || 'Colaborador'}
         </h2>
         <span style={{ 
            fontSize: '12px', fontWeight: '900', color: accentColor, 
            background: 'rgba(79, 70, 229, 0.1)', padding: '6px 18px', 
            borderRadius: '20px', marginTop: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' 
         }}>
            {user?.jobTitle || user?.roles?.[0] || 'Usuario'}
         </span>

         <div style={{ width: '80%', height: '1px', background: cardBorder, margin: '24px 0' }} />

         {/* Grid Info Details */}
         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', width: '100%' }}>
            <div style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: mutedText, marginBottom: '6px' }}>
                    <MapPin size={14} strokeWidth={2.5} />
                    <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tienda</span>
                </div>
                <p style={{ fontSize: '14px', fontWeight: '700', color: primaryText }}>{user?.storeName || 'Sede Central'}</p>
            </div>
            <div style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: mutedText, marginBottom: '6px' }}>
                    <Calendar size={14} strokeWidth={2.5} />
                    <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ingreso</span>
                </div>
                <p style={{ fontSize: '14px', fontWeight: '700', color: primaryText }}>{formatDate(user.joinDate)}</p>
            </div>
         </div>
      </div>

      {/* 🏔️ SETTINGS SECTIONS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SectionHeader title="Seguridad" isDark={isDark} />
          <div style={{ 
             background: cardBg, borderRadius: '28px', 
             border: `1px solid ${cardBorder}`, overflow: 'hidden',
             boxShadow: shadow
          }}>
             <ProfileItem 
                 icon={<Lock size={20} />} 
                 label="Contraseña" 
                 value="Cambiar clave actual" 
                 isDark={isDark} 
                 onClick={() => setPage('ResetPassword')} 
                 showChevron
                 showLast
             />
          </div>

          <SectionHeader title="Preferencias" isDark={isDark} />
          <div style={{ 
             background: cardBg, borderRadius: '28px', 
             border: `1px solid ${cardBorder}`, overflow: 'hidden',
             boxShadow: shadow, backdropFilter: 'blur(20px)'
          }}>
             <InteractiveItem 
                 icon={isDark ? <Moon size={20} /> : <Sun size={20} />} 
                 label="Modo Visual" 
                 value={isDark ? 'Oscuro' : 'Claro'} 
                 isDark={isDark} 
                 active={isDark}
                 onClick={toggleTheme}
             />
             <InteractiveItem 
                 icon={<Bell size={20} />} 
                 label="Notificaciones" 
                 value={notificationsEnabled ? 'Activado' : 'Desactivado'} 
                 isDark={isDark} 
                 active={notificationsEnabled}
                 onClick={handleToggleNotifications}
                 showLast
             />
          </div>
      </div>

      <button 
        onClick={onLogout}
        style={{
            width: '100%', marginTop: '40px', padding: '22px', borderRadius: '28px',
            background: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2',
            color: '#ef4444', border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'}`, 
            fontWeight: '900', fontSize: '15px', letterSpacing: '0.1em',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
            transition: 'all 0.3s'
        }}
      >
        <LogOut size={20} />
        CERRAR SESIÓN
      </button>

      <div style={{ textAlign: 'center', marginTop: '24px', opacity: 0.3 }}>
         <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.2em' }}>TALENHUMAN V65.2.5</span>
      </div>
    </div>
  );
};

const SectionHeader = ({ title, isDark }) => (
    <h3 style={{ 
        fontSize: '12px', fontWeight: '900', color: isDark ? 'rgba(255,255,255,0.4)' : '#64748b', 
        textTransform: 'uppercase', letterSpacing: '0.15em', paddingLeft: '12px', marginBottom: '12px' 
    }}>
        {title}
    </h3>
);

const ProfileItem = ({ icon, label, value, isDark, showChevron, onClick, showLast }) => (
    <div 
        onClick={onClick}
        style={{
            padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: showLast ? 'none' : `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`,
            cursor: onClick ? 'pointer' : 'default',
            transition: 'all 0.3s'
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
                width: '44px', height: '44px', borderRadius: '15px', 
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(79, 70, 229, 0.05)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' 
            }}>
                {icon}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.4)' : '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {label}
                </span>
                <span style={{ fontSize: '15px', color: isDark ? '#ffffff' : '#1e293b', fontWeight: '700' }}>
                    {value}
                </span>
            </div>
        </div>
        {showChevron && <ChevronRight size={18} strokeWidth={2.5} color={isDark ? 'rgba(255,255,255,0.2)' : '#cbd5e1'} />}
    </div>
);

const InteractiveItem = ({ icon, label, value, isDark, active, onClick, showLast }) => (
    <div 
        onClick={onClick}
        style={{
            padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: showLast ? 'none' : `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`,
            cursor: 'pointer',
            transition: 'all 0.3s'
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
                width: '44px', height: '44px', borderRadius: '15px', 
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(79, 70, 229, 0.05)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' 
            }}>
                {icon}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.4)' : '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {label}
                </span>
                <span style={{ fontSize: '15px', color: isDark ? '#ffffff' : '#1e293b', fontWeight: '700' }}>
                    {value}
                </span>
            </div>
        </div>
        
        {/* Toggle Switch UI */}
        <div style={{
            width: '52px', height: '28px', borderRadius: '14px',
            background: active ? '#4f46e5' : (isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'),
            position: 'relative', transition: 'all 0.4s'
        }}>
            <div style={{
                width: '20px', height: '20px', borderRadius: '50%', background: 'white',
                position: 'absolute', top: '4px', left: active ? '28px' : '4px',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }} />
        </div>
    </div>
);

export default MobileProfile;
