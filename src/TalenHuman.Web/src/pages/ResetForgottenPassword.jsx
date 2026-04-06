import React, { useState, useEffect } from 'react';
import { Lock, ArrowLeft, CheckCircle, KeyRound, Eye, EyeOff, ShieldAlert, Key, Check, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import TalenHumanLogo from '../components/Shared/TalenHumanLogo';
import './Login.css';

// 🏗️ ELITE SUB-COMPONENTS (Defined OUTSIDE to prevent focus loss)
const ValidationItem = ({ label, passed }) => (
  <div className={`validation-pill ${passed ? 'passed' : 'pending'}`}>
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

const ResetForgottenPassword = ({ email, onBack }) => {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const pinLength = 6;
  const pinArray = Array(pinLength).fill('');

  // ⚡️ Elite Validations
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
    if (token.length !== 6 || !allValid) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password-with-token', { email, token: token.trim(), newPassword });
      setMessage('¡Éxito!');
      setTimeout(() => onBack(), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Código inválido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-premium-flow-root animate-in fade-in duration-500">
        <header className="elite-mobile-header">
            <button onClick={onBack} className="elite-back-btn">
                <ArrowLeft size={22} />
            </button>
            <div className="elite-header-title">
                <TalenHumanLogo size={24} white={true} />
                <span>Seguridad TalenHuman</span>
            </div>
            <div style={{ width: 40 }} />
        </header>

        <main className="elite-mobile-content">
            <div className="premium-recovery-card-v2 animate-in slide-in-from-bottom-10">
                <div className="form-state-premium">
                    <div className="header-section-premium mb-8 text-center">
                        <div className="key-icon-box"><KeyRound size={30} /></div>
                        <h2 className="premium-title">Nueva clave</h2>
                        <p className="premium-subtitle">Ingresa el PIN de 6 dígitos enviado.</p>
                    </div>

                    {error && <div className="premium-error-toast mb-6"><ShieldAlert size={18} /><span>{error}</span></div>}
                    {message && <div className="success-state-premium py-4 mb-6"><ShieldCheck size={28} /><p className="text-sm font-black text-emerald-600 mt-2">{message}</p></div>}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="elite-field-group">
                            <label className="elite-field-label">Código PIN</label>
                            <div className="pin-segmented-container">
                                {pinArray.map((_, i) => (
                                    <div 
                                        key={i} 
                                        className={`pin-box ${token.length === i ? 'active' : ''} ${token.length > i ? 'filled' : ''}`}
                                    >
                                        {token[i] || ''}
                                    </div>
                                ))}
                                <input 
                                    type="tel"
                                    pattern="[0-9]*"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    required 
                                    maxLength={6} 
                                    value={token}
                                    onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="hidden-pin-input"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="divider-premium" />

                        <EliteInput label="Nueva clave" icon={<Lock size={18} />} value={newPassword} onChange={(v) => setNewPassword(v)} type={showPass ? "text" : "password"} placeholder="Mínimo 6" suffix={<button type="button" onClick={() => setShowPass(!showPass)} className="field-toggle-btn-v2">{showPass ? <EyeOff size={18}/> : <Eye size={18}/>}</button>} />
                        <EliteInput label="Confirmar clave" icon={<ShieldCheck size={18} />} value={confirmPassword} onChange={(v) => setConfirmPassword(v)} type="password" />

                        <div className="validation-panel">
                            <ValidationItem label="Mínimo 6" passed={validations.minChar} />
                            <ValidationItem label="Alfa / Num" passed={validations.hasAlphaNum} />
                            <ValidationItem label="Coinciden" passed={validations.match} />
                        </div>

                        <button type="submit" disabled={loading || !allValid || token.length !== 6} className={`login-submit-premium-v2 w-full mt-8 ${(!allValid || token.length !== 6) ? 'btn-disabled' : ''}`}>
                            {loading ? <div className="loader-white" /> : <span>Actualizar acceso</span>}
                        </button>
                    </form>
                </div>
            </div>
            <footer className="elite-mobile-footer text-center mt-4">
                <div className="elite-version">V12.19</div>
            </footer>
        </main>
    </div>
  );
};

export default ResetForgottenPassword;
