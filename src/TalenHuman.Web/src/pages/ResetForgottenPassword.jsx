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
      setMessage('Contraseña restablecida con éxito.');
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
            <div className="premium-recovery-card-v2">
                
                <div className="form-state-premium">
                    <div className="header-section-premium">
                        <h2 className="premium-title">Ingresa el código</h2>
                        <p className="premium-subtitle">Hemos enviado un PIN de 6 dígitos a su correo corporativo.</p>
                    </div>

                    {error && (
                    <div className="premium-error-toast">
                        <ShieldAlert size={18} />
                        <span>{error}</span>
                    </div>
                    )}

                    {message && (
                    <div className="success-state-premium text-center py-4 mb-6">
                        <div className="success-icon-box" style={{ width: '44px', height: '44px', borderRadius: '14px' }}>
                            <ShieldCheck size={24} />
                        </div>
                        <p className="text-sm font-bold text-emerald-600 mt-2">{message}</p>
                    </div>
                    )}

                    <form onSubmit={handleSubmit} className="premium-form-layout">
                        <div className="premium-field-group">
                            <label className="premium-field-label">CÓDIGO DE 6 DÍGITOS</label>
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

                        <div className="premium-field-group">
                            <label className="premium-field-label">NUEVA CONTRASEÑA</label>
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
                        </div>

                        <div className="premium-field-group">
                            <label className="premium-field-label">CONFIRMAR CLAVE</label>
                            <div className="premium-input-box-v2">
                                <Lock className="field-icon-v2" size={20} />
                                <input 
                                    required
                                    type={showPass ? "text" : "password"}
                                    className="premium-field-input-v2"
                                    placeholder="Repite tu nueva clave"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="login-submit-premium-v2 w-full mt-10"
                        >
                            {loading ? <div className="loader-white"></div> : <span>ACTUALIZAR ACCESO</span>}
                        </button>
                    </form>
                </div>
            </div>
            
            <footer className="elite-mobile-footer">
                <p>EL CÓDIGO EXPIRA EN POCOS MINUTOS</p>
                <div className="elite-version">V65.2.13-ELITE</div>
            </footer>
        </main>
    </div>
  );
};

export default ResetForgottenPassword;
