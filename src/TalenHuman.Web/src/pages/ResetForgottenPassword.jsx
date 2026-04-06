import React, { useState, useEffect } from 'react';
import { Lock, ArrowLeft, ArrowRight, ShieldCheck, KeyRound, Eye, EyeOff, ShieldAlert, Smartphone, Bell, Calendar, Key, Check } from 'lucide-react';
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

  // ⚡️ Elite Validations (V12 Premium)
  const [validations, setValidations] = useState({
    minChar: false,
    hasAlphaNum: false,
    match: false
  });

  useEffect(() => {
    setValidations({
      minChar: newPassword.length >= 6,
      hasAlphaNum: /[a-zA-Z]/.test(newPassword) && /[0-9]/.test(newPassword),
      match: newPassword === confirmPassword && confirmPassword !== ''
    });
  }, [newPassword, confirmPassword]);

  const allValid = validations.minChar && validations.hasAlphaNum && validations.match;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allValid) {
      setError('Por favor cumple con todos los requisitos de seguridad.');
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
      setMessage('¡Contraseña restablecida con éxito!');
      setTimeout(() => {
        onBack(); 
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Código inválido o expirado.');
    } finally {
      setLoading(false);
    }
  };

  const ValidationItem = ({ label, passed }) => (
    <div className={`validation-pill \${passed ? 'passed' : 'pending'}`}>
      <div className="status-dot">
        {passed && <Check size={10} strokeWidth={4} />}
      </div>
      <span className="pill-label">{label}</span>
    </div>
  );

  const EliteInput = ({ label, icon, value, onChange, type, placeholder, suffix }) => (
    <div className="elite-field-group">
        <label className="elite-field-label">{label}</label>
        <div className="elite-input-container">
            <div className="elite-input-icon">{icon}</div>
            <input 
                type={type}
                required
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="elite-native-input"
                style={{ color: '#1E293B', WebkitTextFillColor: '#1E293B' }}
            />
            {suffix}
        </div>
    </div>
  );

  return (
    <div className="mobile-premium-flow-root animate-in fade-in duration-500">
        
        {/* 🏔️ ELITE STICKY HEADER */}
        <header className="elite-mobile-header">
            <button onClick={onBack} className="elite-back-btn">
                <ArrowLeft size={22} />
            </button>
            <div className="elite-header-title">
                <TalenHumanLogo size={24} white={true} />
                <span>SEGURIDAD ELITE</span>
            </div>
            <div style={{ width: 40 }} />
        </header>

        <main className="elite-mobile-content">
            <div className="premium-recovery-card-v2 animate-in slide-in-from-bottom-10">
                
                <div className="form-state-premium">
                    <div className="header-section-premium mb-8 text-center">
                        <div className="key-icon-box">
                            <KeyRound size={30} />
                        </div>
                        <h2 className="premium-title">Nueva Clave</h2>
                        <p className="premium-subtitle">Ingresa el PIN de 6 dígitos enviado a tu correo.</p>
                    </div>

                    {error && (
                    <div className="premium-error-toast mb-6">
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

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        
                        <input 
                            type="text" 
                            required
                            maxLength={6}
                            value={token}
                            onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                            className="premium-field-input-v2"
                            placeholder="000000"
                            style={{ 
                                letterSpacing: '0.4em', 
                                textAlign: 'center', 
                                fontSize: '1.4rem', 
                                fontWeight: '900',
                                color: '#1E293B',
                                WebkitTextFillColor: '#1E293B'
                            }}
                        />

                        <div className="divider-premium" style={{ margin: '10px 0' }} />

                        <EliteInput 
                            label="Nueva Contraseña"
                            icon={<Lock size={18} />}
                            value={newPassword}
                            onChange={(val) => setNewPassword(val)}
                            type={showPass ? "text" : "password"}
                            placeholder="Crea tu nueva clave"
                            suffix={
                                <button type="button" onClick={() => setShowPass(!showPass)} className="field-toggle-btn-v2">
                                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            }
                        />

                        <EliteInput 
                            label="Confirmar Nueva Clave"
                            icon={<ShieldCheck size={18} />}
                            value={confirmPassword}
                            onChange={(val) => setConfirmPassword(val)}
                            type="password"
                            placeholder="Repite la clave"
                        />

                        {/* Validation Panel */}
                        <div className="validation-panel">
                            <ValidationItem label="Mínimo 6" passed={validations.minChar} />
                            <ValidationItem label="Alfa / Num" passed={validations.hasAlphaNum} />
                            <ValidationItem label="Coinciden" passed={validations.match} />
                        </div>

                        <button 
                           type="submit" 
                           disabled={loading || !allValid} 
                           className={`login-submit-premium-v2 w-full mt-8 \${!allValid ? 'btn-disabled' : ''}`}
                        >
                            {loading ? <div className="loader-white"></div> : (
                                <div className="flex items-center gap-3">
                                    <span>ACTUALIZAR ACCESO</span>
                                    <ShieldCheck size={20} />
                                </div>
                            )}
                        </button>
                    </form>
                </div>
            </div>
            
            <p className="security-engine-footer">
                TALENHUMAN SECURITY ENGINE
            </p>
        </main>
    </div>
  );
};

export default ResetForgottenPassword;
