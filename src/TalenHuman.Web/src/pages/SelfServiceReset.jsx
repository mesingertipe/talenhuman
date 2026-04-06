import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Eye, EyeOff, ShieldCheck, ArrowRight, Key, Check, ArrowLeft, User, Calendar, Lock } from 'lucide-react';
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

const SelfServiceReset = ({ onBack }) => {
  const [formData, setFormData] = useState({
    identificationNumber: '',
    birthDate: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // ⚡️ Elite Validations
  const [validations, setValidations] = useState({
    minChar: false,
    hasAlphaNum: false,
    match: false
  });

  useEffect(() => {
    setValidations({
      minChar: formData.newPassword.length >= 6,
      hasAlphaNum: /[a-zA-Z]/.test(formData.newPassword) && /[0-9]/.test(formData.newPassword),
      match: formData.newPassword === formData.confirmPassword && formData.confirmPassword !== ''
    });
  }, [formData.newPassword, formData.confirmPassword]);

  const allValid = validations.minChar && validations.hasAlphaNum && validations.match;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allValid) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/self-service-reset', {
        identificationNumber: formData.identificationNumber,
        birthDate: formData.birthDate,
        newPassword: formData.newPassword
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data || 'No se pudo validar la información.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-premium-flow-root animate-in fade-in duration-500">
        <header className="elite-mobile-header">
            <button onClick={onBack} className="elite-back-btn"><ArrowLeft size={22} /></button>
            <div className="elite-header-title">
                <TalenHumanLogo size={24} white={true} />
                <span>ACCESO ELITE</span>
            </div>
            <div style={{ width: 40 }} />
        </header>

        <main className="elite-mobile-content">
            <div className="premium-recovery-card-v2 animate-in slide-in-from-bottom-10">
                {success ? (
                <div className="success-state-premium text-center py-8">
                    <div className="success-icon-box"><CheckCircle size={44} /></div>
                    <h2 className="premium-title">¡Éxito Total!</h2>
                    <p className="premium-subtitle">Clave actualizada.</p>
                    <button onClick={onBack} className="login-submit-premium-v2 w-full mt-6">ENTRAR</button>
                </div>
                ) : (
                <div className="form-state-premium">
                    <div className="header-section-premium mb-8 text-center">
                        <div className="key-icon-box"><Key size={30} /></div>
                        <h2 className="premium-title">Auto-Servicio</h2>
                        <p className="premium-subtitle">Restablece tu sesión.</p>
                    </div>

                    {error && <div className="premium-error-toast mb-6"><AlertCircle size={18} /><span>{error}</span></div>}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <EliteInput label="Cédula" icon={<User size={18} />} value={formData.identificationNumber} onChange={(v) => setFormData({...formData, identificationNumber:v})} type="text" placeholder="ID" />
                        <EliteInput label="Nacimiento" icon={<Calendar size={18} />} value={formData.birthDate} onChange={(v) => setFormData({...formData, birthDate:v})} type="date" />
                        <div className="divider-premium" />
                        <EliteInput label="Nueva Clave" icon={<Lock size={18} />} value={formData.newPassword} onChange={(v) => setFormData({...formData, newPassword:v})} type={showPassword ? "text" : "password"} placeholder="Min 6" suffix={<button type="button" onClick={() => setShowPassword(!showPassword)} className="field-toggle-btn-v2">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button>} />
                        <EliteInput label="Confirmar" icon={<ShieldCheck size={18} />} value={formData.confirmPassword} onChange={(v) => setFormData({...formData, confirmPassword:v})} type="password" />
                        
                        <div className="validation-panel">
                            <ValidationItem label="Mínimo 6" passed={validations.minChar} />
                            <ValidationItem label="Alfa / Num" passed={validations.hasAlphaNum} />
                            <ValidationItem label="Coinciden" passed={validations.match} />
                        </div>

                        <button type="submit" disabled={loading || !allValid} className={`login-submit-premium-v2 w-full mt-6 ${!allValid ? 'btn-disabled' : ''}`}>
                            {loading ? <div className="loader-white" /> : <div className="flex items-center gap-3"><span>ACTUALIZAR</span><ShieldCheck size={20} /></div>}
                        </button>
                    </form>
                </div>
                )}
            </div>
            <p className="security-engine-footer">TALENHUMAN SECURITY ENGINE</p>
        </main>
    </div>
  );
};

export default SelfServiceReset;
