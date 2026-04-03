import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, ArrowLeft, Eye, EyeOff, Loader2, Check, ShieldAlert, Shield, Key } from 'lucide-react';
import api from '../services/api';

const ResetPassword = ({ user, setPage, theme }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const isDark = theme === 'dark';

  // Validation states
  const [validations, setValidations] = useState({
    minChar: false,
    hasLetter: false,
    hasNumber: false,
    match: false
  });

  useEffect(() => {
    setValidations({
      minChar: newPassword.length >= 6,
      hasLetter: /[a-zA-Z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      match: newPassword === confirmPassword && confirmPassword !== ''
    });
  }, [newPassword, confirmPassword]);

  const allValid = Object.values(validations).every(v => v);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allValid) {
      setError('Por favor cumple con todos los requisitos de seguridad.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.put('/users/change-password', { currentPassword, newPassword });
      
      const updatedUser = { ...user, mustChangePassword: false };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Navigate back to profile
      if (setPage) setPage('Perfil');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const ValidationItem = ({ label, passed }) => (
    <div style={{ 
        display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', 
        borderRadius: '12px', background: passed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0,0,0,0.03)',
        border: `1px solid ${passed ? 'rgba(16, 185, 129, 0.2)' : 'transparent'}`,
        transition: 'all 0.3s'
    }}>
      <div style={{ 
          width: '14px', height: '14px', borderRadius: '50%', 
          background: passed ? '#10b981' : '#cbd5e1',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
      }}>
        {passed && <Check size={10} strokeWidth={4} />}
      </div>
      <span style={{ fontSize: '11px', fontWeight: '800', color: passed ? '#047857' : '#64748b' }}>{label}</span>
    </div>
  );

  return (
    <div style={{ 
        minHeight: '80vh', display: 'flex', flexDirection: 'column', 
        padding: '0 0 40px', position: 'relative'
    }}>
      
      {/* 🚀 ELITE HEADER NAVIGATION */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <button 
            onClick={() => setPage('Perfil')}
            style={{ 
                width: '48px', height: '48px', borderRadius: '16px', 
                background: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff', 
                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)', color: isDark ? 'white' : '#1e293b'
            }}
          >
              <ArrowLeft size={20} />
          </button>
          <div>
              <h1 style={{ fontSize: '24px', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>Seguridad</h1>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Actualiza tus credenciales de acceso.</p>
          </div>
      </div>

      {/* 🔐 SECURITY CARD (Glassmorphism) */}
      <div style={{ 
          background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
          borderRadius: '32px', padding: '32px 24px',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`,
          boxShadow: '0 20px 40px rgba(0,0,0,0.03)'
      }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
             <div style={{ 
                 width: '64px', height: '64px', borderRadius: '20px', 
                 background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                 margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                 color: 'white', boxShadow: '0 10px 25px rgba(79, 70, 229, 0.3)'
             }}>
                <Key size={30} />
             </div>
             <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>Cambiar Clave</h2>
             <p style={{ fontSize: '13px', color: '#64748b' }}>Para <span style={{ fontWeight: '800', color: '#4f46e5' }}>{user?.fullName}</span></p>
          </div>

          {error && (
            <div style={{ 
                padding: '16px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.1)', 
                color: '#ef4444', display: 'flex', alignItems: 'center', gap: '12px',
                marginBottom: '24px', fontSize: '13px', fontWeight: '700'
            }}>
              <ShieldAlert size={20} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Input Group */}
            <EliteInput 
                label="Clave Actual" 
                icon={<Lock size={18} />} 
                value={currentPassword} 
                onChange={setCurrentPassword} 
                type="password" 
                placeholder="Indispensable para cambios"
                isDark={isDark}
            />

            <EliteInput 
                label="Nueva Contraseña" 
                icon={<ShieldCheck size={18} />} 
                value={newPassword} 
                onChange={setNewPassword} 
                type={showPass ? "text" : "password"} 
                placeholder="Mínimo 6 caracteres"
                suffix={
                    <button type="button" onClick={() => setShowPass(!showPass)} style={{ border: 'none', background: 'none', color: '#64748b' }}>
                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                }
                isDark={isDark}
            />

            <EliteInput 
                label="Confirmar Nueva Clave" 
                icon={<Shield size={18} />} 
                value={confirmPassword} 
                onChange={setConfirmPassword} 
                type="password" 
                placeholder="Repite la clave nueva"
                isDark={isDark}
            />

            {/* Validation Panel */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                <ValidationItem label="Mínimo 6" passed={validations.minChar} />
                <ValidationItem label="Alfa / Num" passed={validations.hasLetter && validations.hasNumber} />
                <ValidationItem label="Coinciden" passed={validations.match} />
            </div>

            <button 
                type="submit" 
                disabled={loading || !allValid}
                style={{
                    width: '100%', marginTop: '12px', padding: '20px', borderRadius: '20px',
                    background: allValid ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' : '#cbd5e1',
                    color: 'white', border: 'none', fontWeight: '900', fontSize: '15px',
                    boxShadow: allValid ? '0 15px 30px rgba(79, 70, 229, 0.3)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                    cursor: allValid ? 'pointer' : 'not-allowed', transition: 'all 0.3s'
                }}
            >
                {loading ? (
                    <Loader2 className="animate-spin" size={24} />
                ) : (
                    <>
                        <span>ACTUALIZAR ACCESO</span>
                        <ShieldCheck size={20} />
                    </>
                )}
            </button>
          </form>
      </div>

      <p style={{ textAlign: 'center', marginTop: '32px', opacity: 0.3, fontSize: '11px', fontWeight: '800', letterSpacing: '0.1em' }}>
        TALENHUMAN SECURITY ENGINE
      </p>
    </div>
  );
};

const EliteInput = ({ label, icon, value, onChange, type, placeholder, suffix, isDark }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', paddingLeft: '4px' }}>
            {label}
        </label>
        <div style={{ 
            display: 'flex', alignItems: 'center', gap: '12px', padding: '0 16px',
            height: '60px', borderRadius: '18px', background: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0'}`,
            transition: 'all 0.3s'
        }}>
            <div style={{ color: '#4f46e5' }}>{icon}</div>
            <input 
                type={type}
                required
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                style={{ 
                    background: 'none', border: 'none', outline: 'none', 
                    color: isDark ? 'white' : '#1e293b', fontSize: '15px', 
                    fontWeight: '600', width: '100%' 
                }}
            />
            {suffix}
        </div>
    </div>
);

export default ResetPassword;
