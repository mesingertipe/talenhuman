import React, { useState } from 'react';
import { 
  User, ShieldCheck, LogOut, ChevronRight, 
  Fingerprint, MapPin, Calendar, CreditCard,
  Key, Settings, Bell, Shield
} from 'lucide-react';
import BiometricEnrollModal from '../../components/Biometrics/BiometricEnrollModal';

const MobileProfile = ({ user, theme }) => {
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const isDark = theme === 'dark';

  const handleLogout = () => {
    localStorage.clear();
    window.location.replace('/');
  };

  const hasBiometrics = user?.biometricsEnrolled || false;

  // Visual Tokens
  const cardBg = isDark ? 'rgba(30, 41, 59, 0.5)' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
  const primaryText = isDark ? '#ffffff' : '#0f172a';
  const mutedText = isDark ? 'rgba(255, 255, 255, 0.4)' : '#64748b';
  const accentColor = '#4f46e5';

  return (
    <div className="animate-in fade-in slide-in-from-bottom-5 duration-700 pb-32">
      
      {/* 💎 PREMIUM IDENTITY CARD */}
      <div style={{
        background: isDark ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
        borderRadius: '35px', padding: '32px 24px', marginBottom: '24px',
        border: `1px solid ${cardBorder}`, boxShadow: '0 20px 40px rgba(0,0,0,0.04)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
      }}>
         <div style={{
            width: '100px', height: '100px', borderRadius: '40px',
            background: accentColor, marginBottom: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '42px', fontWeight: '900',
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
            {user?.roleName || 'Empleado'}
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
            <div style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: mutedText, marginBottom: '4px' }}>
                    <CreditCard size={12} />
                    <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>Identificación</span>
                </div>
                <p style={{ fontSize: '13px', fontWeight: '700', color: primaryText }}>{user?.userName || '00000000'}</p>
            </div>
            <div style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: mutedText, marginBottom: '4px' }}>
                    <Shield size={12} />
                    <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>Estado</span>
                </div>
                <p style={{ fontSize: '13px', fontWeight: '700', color: '#10b981' }}>Activo</p>
            </div>
         </div>
      </div>

      {/* 🔐 SECURITY SETTINGS SEGMENT */}
      <div style={{ marginBottom: '16px', padding: '0 8px' }}>
         <span style={{ fontSize: '10px', fontWeight: '800', color: mutedText, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Seguridad y Configuración</span>
      </div>

      <div style={{ 
          background: cardBg, borderRadius: '30px', border: `1px solid ${cardBorder}`, 
          overflow: 'hidden', display: 'flex', flexDirection: 'column' 
      }}>
         {/* Biometric Toggle Switch */}
         <div style={{ 
             display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
             padding: '24px', borderBottom: `1px solid ${cardBorder}` 
         }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
               <div style={{ 
                   width: '48px', height: '48px', borderRadius: '14px', 
                   background: hasBiometrics ? 'rgba(16, 185, 129, 0.1)' : 'rgba(79, 70, 229, 0.05)', 
                   display: 'flex', alignItems: 'center', justifyContent: 'center',
                   color: hasBiometrics ? '#10b981' : accentColor 
               }}>
                  <Fingerprint size={24} />
               </div>
               <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: primaryText }}>Acceso Biométrico</span>
                  <span style={{ fontSize: '11px', color: mutedText }}>{hasBiometrics ? 'Rostro / Huella Activo' : 'Protege tu cuenta'}</span>
               </div>
            </div>
            <button 
                onClick={() => hasBiometrics ? window.location.reload() : setShowBiometricSetup(true)}
                style={{
                    width: '52px', height: '30px', borderRadius: '20px', padding: '3px',
                    background: hasBiometrics ? '#10b981' : (isDark ? '#334155' : '#e2e8f0'),
                    border: 'none', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative'
                }}
            >
                <div style={{ 
                    width: '24px', height: '24px', borderRadius: '50%', background: 'white',
                    transform: hasBiometrics ? 'translateX(22px)' : 'translateX(0)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }} />
            </button>
         </div>

         {/* Change Password Action */}
         <button style={{ 
             display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
             padding: '24px', border: 'none', background: 'none', width: '100%', textAlign: 'left'
         }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
               <div style={{ 
                   width: '48px', height: '48px', borderRadius: '14px', 
                   background: 'rgba(245, 158, 11, 0.05)', 
                   display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' 
               }}>
                  <Key size={24} />
               </div>
               <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: primaryText }}>Cambiar Contraseña</span>
                  <span style={{ fontSize: '11px', color: mutedText }}>Último cambio hace 3 meses</span>
               </div>
            </div>
            <ChevronRight size={20} color={mutedText} />
         </button>
      </div>

      {/* 🚪 LOGOUT ACTION */}
      <button 
        onClick={handleLogout}
        style={{ 
            marginTop: '32px', width: '100%', padding: '24px', borderRadius: '30px',
            background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)',
            display: 'flex', alignItems: 'center', gap: '16px', color: '#ef4444'
        }}
      >
         <div style={{ 
             width: '44px', height: '44px', borderRadius: '12px', 
             background: 'rgba(239, 68, 68, 0.1)', display: 'flex', 
             alignItems: 'center', justifyContent: 'center' 
         }}>
            <LogOut size={20} />
         </div>
         <span style={{ fontSize: '16px', fontWeight: '800' }}>Cerrar Sesión</span>
      </button>

      {showBiometricSetup && (
        <BiometricEnrollModal 
          onComplete={() => {
            const newUser = { ...user, biometricsEnrolled: true };
            localStorage.setItem('user', JSON.stringify(newUser));
            window.location.reload();
          }} 
          onCancel={() => setShowBiometricSetup(false)} 
          theme={theme}
        />
      )}

    </div>
  );
};

export default MobileProfile;
