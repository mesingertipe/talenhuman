import React, { useState } from 'react';
import { Lock, ArrowLeft, ArrowRight, ShieldCheck, KeyRound, Eye, EyeOff, ShieldAlert, Smartphone, Bell, Calendar, Sparkles, Check, X } from 'lucide-react';
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

  // ⚡️ Elite Indicators (V12 Premium)
  const isMatch = newPassword && newPassword === confirmPassword;
  const isLongEnough = newPassword.length >= 6;
  const strengthPercent = Math.min((newPassword.length / 8) * 100, 100);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isMatch) {
      setError('Las contraseñas deben coincidir.');
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
      setMessage('¡Contraseña restablecida!');
      setTimeout(() => {
        onBack(); 
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Código inválido o expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-premium-flow-root animate-in fade-in duration-500">
        
        {/* 🏔️ ELITE STICKY HEADER */}
        <header className="elite-mobile-header">
            <button onClick={onBack} className="elite-back-btn">
                <ArrowLeft size={22} />
            </button>
            <div className="elite-header-title">
                <TalenHumanLogo size={24} white={true} />
                <span>NUEVA CLAVE</span>
            </div>
            <div style={{ width: 40 }} />
        </header>

        <main className="elite-mobile-content">
            <div className="premium-recovery-card-v2 animate-in slide-in-from-bottom-10">
                
                <div className="form-state-premium">
                    <div className="header-section-premium mb-10">
                        <div className="flex items-center gap-3 mb-2">
                           <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                               <KeyRound size={18} />
                           </div>
                           <h2 className="premium-title" style={{ margin: 0 }}>VALIDACIÓN PIN</h2>
                        </div>
                        <p className="premium-subtitle">Ingresa el código de 6 dígitos que enviamos a tu correo corporativo.</p>
                    </div>

                    {error && (
                    <div className="premium-error-toast mb-8">
                        <ShieldAlert size={18} />
                        <span>{error}</span>
                    </div>
                    )}

                    {message && (
                    <div className="success-state-premium text-center py-4 mb-6">
                        <div className="success-icon-box" style={{ width: '50px', height: '50px', borderRadius: '15px' }}>
                            <ShieldCheck size={28} />
                        </div>
                        <p className="text-sm font-black text-emerald-600 mt-2">{message}</p>
                    </div>
                    )}

                    <form onSubmit={handleSubmit} className="premium-form-layout">
                        {/* 🔢 CÓDIGO PIN */}
                        <div className="premium-field-group">
                            <label className="premium-field-label">CÓDIGO DE SEGURIDAD</label>
                            <div className="premium-input-box-v2">
                                <KeyRound className="field-icon-v2" size={20} />
                                <input 
                                    type="text" 
                                    required
                                    maxLength={6}
                                    value={token}
                                    onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                                    className="premium-field-input-v2"
                                    placeholder="000000"
                                    style={{ letterSpacing: '0.4em', textAlign: 'center', fontSize: '1.4rem', fontWeight: '900' }}
                                />
                            </div>
                        </div>

                        <div className="divider-premium" />

                        {/* 🔒 NUEVA CLAVE */}
                        <div className="premium-field-group">
                            <div className="flex justify-between items-center mb-1">
                                <label className="premium-field-label">NUEVA CONTRASEÑA</label>
                                {isLongEnough && <span className="text-[10px] text-emerald-600 font-bold tracking-widest flex items-center gap-1"><Check size={10} /> SEGURA</span>}
                            </div>
                            <div className="premium-input-box-v2">
                                <Lock className="field-icon-v2" size={20} />
                                <input 
                                    required
                                    type={showPass ? "text" : "password"}
                                    className="premium-field-input-v2"
                                    placeholder="Mínimo 6 caracteres"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                                <button type="button" onClick={() => setShowPass(!showPass)} className="field-toggle-btn-v2">
                                    {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {/* Strength Bar */}
                            <div className="w-full h-1 bg-slate-100 rounded-full mt-3 overflow-hidden">
                                <div 
                                   className="h-full bg-indigo-500 transition-all duration-500" 
                                   style={{ width: `${strengthPercent}%`, opacity: newPassword ? 1 : 0 }} 
                                />
                            </div>
                        </div>

                        {/* 🔒 CONFIRMAR CLAVE */}
                        <div className="premium-field-group">
                            <div className="flex justify-between items-center mb-1">
                                <label className="premium-field-label">CONFIRMAR CLAVE</label>
                                {confirmPassword && (
                                    isMatch ? 
                                    <span className="text-[10px] text-emerald-600 font-black flex items-center gap-1"><Check size={10} /> COINCIDE</span> : 
                                    <span className="text-[10px] text-rose-600 font-black flex items-center gap-1"><X size={10} /> NO COINCIDE</span>
                                )}
                            </div>
                            <div className={`premium-input-box-v2 ${confirmPassword && !isMatch ? 'border-rose-300' : ''}`}>
                                <Lock className="field-icon-v2" size={20} />
                                <input 
                                    required
                                    type={showPass ? "text" : "password"}
                                    className="premium-field-input-v2"
                                    placeholder="Repite la clave"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading || !isMatch || !isLongEnough} 
                            className="login-submit-premium-v2 w-full mt-10"
                        >
                            {loading ? <div className="loader-white"></div> : (
                                <div className="flex items-center gap-3">
                                    <span>ACTUALIZAR ACCESO</span>
                                    <ArrowRight size={22} />
                                </div>
                            )}
                        </button>
                    </form>
                </div>
            </div>
            
            <footer className="elite-mobile-footer">
                <p>PROTECCIÓN DE DATOS DE GRADO MILITAR</p>
                <div className="elite-version">V65.2.14-ELITE</div>
            </footer>
        </main>
    </div>
  );
};

export default ResetForgottenPassword;
