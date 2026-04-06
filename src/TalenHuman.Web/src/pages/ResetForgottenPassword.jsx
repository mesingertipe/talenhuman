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
    <div className="login-container mobile-premium-flow">
        {/* 🏔️ TOP BRAND BAR (Mobile Only) */}
        <div className="mobile-brand-bar">
            <TalenHumanLogo size={28} white={false} />
            <span className="brand-name-text">TalenHuman</span>
        </div>

        <div className="content-wrapper">
            {/* 🛡️ FLOATING PREMIUM CARD */}
            <div className="premium-recovery-card animate-in fade-in slide-in-from-bottom-12 duration-700">
                
                <button 
                onClick={onBack}
                className="back-control-premium"
                >
                <ArrowLeft size={18} />
                <span>CANCELAR PROCESO</span>
                </button>

                <div className="form-state-premium">
                    <div className="header-section-premium">
                        <h2 className="premium-title">Nueva Clave</h2>
                        <p className="premium-subtitle">Hemos enviado un código de 6 dígitos a <span style={{ color: '#4f46e5', fontWeight: '800' }}>{email}</span></p>
                    </div>

                    {error && (
                    <div className="premium-error-toast animate-in fade-in slide-in-from-top-2">
                        <ShieldAlert size={18} />
                        <span>{error}</span>
                    </div>
                    )}

                    {message && (
                    <div className="success-state-premium text-center py-4 mb-6">
                        <div className="success-icon-box" style={{ width: '40px', height: '40px', borderRadius: '12px' }}>
                            <ShieldCheck size={20} />
                        </div>
                        <p className="text-xs font-bold text-emerald-600 mt-2">{message}</p>
                    </div>
                    )}

                    <form onSubmit={handleSubmit} className="premium-form-layout">
                        <div className="premium-field-group">
                            <label className="premium-field-label">CÓDIGO DE SEGURIDAD</label>
                            <div className="premium-input-box">
                                <KeyRound className="field-icon" size={20} />
                                <input 
                                    type="text" 
                                    required
                                    maxLength={6}
                                    value={token}
                                    onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                                    className="premium-field-input"
                                    placeholder="000000"
                                    style={{ letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.2rem' }}
                                />
                            </div>
                        </div>

                        <div className="divider-premium" />

                        <div className="premium-field-group">
                            <label className="premium-field-label">NUEVA CONTRASEÑA</label>
                            <div className="premium-input-box">
                                <Lock className="field-icon" size={20} />
                                <input 
                                    required
                                    type={showPass ? "text" : "password"}
                                    className="premium-field-input"
                                    placeholder="Mínimo 6 caracteres"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="field-toggle-btn"
                                >
                                    {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="premium-field-group">
                            <label className="premium-field-label">CONFIRMAR CONTRASEÑA</label>
                            <div className="premium-input-box">
                                <Lock className="field-icon" size={20} />
                                <input 
                                    required
                                    type={showPass ? "text" : "password"}
                                    className="premium-field-input"
                                    placeholder="Repite la nueva contraseña"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="login-submit-premium w-full mt-10"
                        >
                            {loading ? (
                            <div className="loader-white"></div>
                            ) : (
                            <>
                                <span>ACTUALIZAR CONTRASEÑA</span>
                                <ArrowRight size={22} />
                            </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
            
            <div className="premium-footer-note text-center mt-12">
                <p className="footer-label">EL CÓDIGO ES VÁLIDO POR 15 MINUTOS</p>
                <div className="elite-tag">V65.2.12-ELITE-PWA</div>
            </div>
        </div>
    </div>
  );
};

export default ResetForgottenPassword;
