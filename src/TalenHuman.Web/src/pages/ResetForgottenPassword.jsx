import React, { useState } from 'react';
import { Lock, ArrowLeft, ArrowRight, ShieldCheck, KeyRound, Eye, EyeOff, ShieldAlert, Smartphone, Bell, Calendar } from 'lucide-react';
import api from '../services/api';
import TalenHumanLogo from '../components/Shared/TalenHumanLogo';
import './Login.css';

const ResetForgottenPassword = ({ email, onBack }) => {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (token.length !== 6) {
        setError('El código debe ser de 6 dígitos.');
        return;
    }

    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password-with-token', { 
        email, 
        token: token.trim(), 
        newPassword 
      });
      setMessage('Contraseña restablecida con éxito. Ya puedes ingresar con tu nueva clave.');
      setTimeout(() => {
        onBack(); // Go back to login
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al restablecer la contraseña. Verifica el código.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
        {/* 🚀 ELITE V12 PREMIUM CARD */}
        <div className="login-card">
            
            {/* 🏔️ SIDEBAR LANDING (Hidden on Mobile) */}
            <div className="login-sidebar">
              <div className="login-sidebar-content">
                <div className="login-brand mb-12">
                  <TalenHumanLogo size={48} white={true} />
                </div>
                <h1 className="login-hero-title">
                  Define tu <br />
                  <span className="text-indigo-200 underline">nueva clave.</span>
                </h1>
                <p className="login-hero-subtitle">
                    Ingresa el código de 6 dígitos que hemos enviado a tu correo corporativo.
                </p>
                
                <div className="login-features mt-12">
                   <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#818cf8', marginBottom: '0.5rem' }}>
                            <Smartphone size={20} />
                            <span style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Proceso Seguro</span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: '1.6' }}>
                            El código es válido por 15 minutos. Si no lo recibes, revisa tu carpeta de SPAM.
                        </p>
                   </div>
                </div>
              </div>
              <div className="login-decoration-1"></div>
              <div className="login-decoration-2"></div>
            </div>

            {/* 📝 FORM AREA */}
            <div className="login-form-side">
                <div className="login-form-container">
                    
                  {/* 🏠 Mobile Brand Header */}
                  <div className="login-mobile-brand">
                    <TalenHumanLogo size={36} white={true} />
                    <span className="login-mobile-brand-name">TalenHuman</span>
                  </div>

                  <button 
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-all mb-8 font-black text-[10px] uppercase tracking-[0.2em]"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <ArrowLeft size={16} /> Cancelar y volver
                  </button>

                  <div className="login-header">
                    <h2 className="login-title">Restablecer</h2>
                    <p className="login-subtitle">Verificando identidad para <span style={{ color: '#4f46e5', fontWeight: '800' }}>{email}</span></p>
                  </div>

                  {error && (
                    <div className="login-error animate-in fade-in slide-in-from-bottom-2">
                        <ShieldAlert size={18} />
                        <span>{error}</span>
                    </div>
                  )}

                  {message && (
                    <div className="animate-in zoom-in duration-300 mb-6" style={{ background: 'rgba(16, 185, 129, 0.05)', color: '#10b981', padding: '1.25rem', borderRadius: '24px', border: '1px solid rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <ShieldCheck size={20} />
                        </div>
                        <span className="text-xs font-bold leading-snug">{message}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group mb-4">
                      <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Código de Seguridad</span>
                          <span style={{ color: '#4f46e5', fontWeight: '900' }}>6 Dígitos</span>
                      </label>
                      <div className="input-wrapper">
                        <KeyRound className="input-icon" size={18} />
                        <input 
                          type="text" 
                          required
                          maxLength={6}
                          value={token}
                          onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                          className="login-input"
                          placeholder="000000"
                          style={{ letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.25rem' }}
                        />
                      </div>
                    </div>

                    <div className="form-group mb-4">
                      <label className="form-label">Nueva Contraseña</label>
                      <div className="input-wrapper">
                        <Lock className="input-icon" size={18} />
                        <input 
                          type={showPass ? "text" : "password"}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="login-input"
                          placeholder="Mínimo 6 caracteres"
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowPass(!showPass)}
                          className="password-toggle"
                        >
                          {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="form-group mb-8">
                      <label className="form-label">Confirmar Contraseña</label>
                      <div className="input-wrapper">
                        <Lock className="input-icon" size={18} />
                        <input 
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="login-input"
                          placeholder="Repite la nueva clave"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={loading}
                      className="login-submit w-full"
                    >
                      {loading ? (
                        <div className="loader"></div>
                      ) : (
                        <>
                          <span>Actualizar Contraseña</span>
                          <ArrowRight size={20} />
                        </>
                      )}
                    </button>
                  </form>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ResetForgottenPassword;
