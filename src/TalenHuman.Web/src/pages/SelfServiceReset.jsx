import React, { useState, useEffect } from 'react';
import { Shield, User, Calendar, Lock, ArrowLeft, CheckCircle, AlertCircle, Eye, EyeOff, ShieldCheck, ArrowRight, Bell, Key, Check } from 'lucide-react';
import api from '../services/api';
import TalenHumanLogo from '../components/Shared/TalenHumanLogo';
import './Login.css';

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

  // ⚡️ Elite Validations (V12 Premium)
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
    if (!allValid) {
      setError('Por favor cumple con todos los requisitos de seguridad.');
      return;
    }

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
      setError(err.response?.data || 'No se pudo validar la información. Verifique sus datos.');
    } finally {
      setLoading(false);
    }
  };

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
                <span>ACCESO ELITE</span>
            </div>
            <div style={{ width: 40 }} />
        </header>

        <main className="elite-mobile-content">
            <div className="premium-recovery-card-v2 animate-in slide-in-from-bottom-10">
                
                {success ? (
                <div className="success-state-premium text-center py-8">
                    <div className="success-icon-box">
                        <CheckCircle size={44} />
                    </div>
                    <h2 className="premium-title">¡Éxito Total!</h2>
                    <p className="premium-subtitle">Tu contraseña ha sido actualizada. Ya puedes ingresar al sistema.</p>
                    <button onClick={onBack} className="login-submit-premium-v2 w-full mt-6">
                        <span>IR AL LOGIN</span>
                        <ArrowRight size={20} />
                    </button>
                </div>
                ) : (
                <div className="form-state-premium">
                    <div className="header-section-premium mb-8 text-center">
                        <div className="key-icon-box">
                            <Key size={30} />
                        </div>
                        <h2 className="premium-title">Auto-Servicio</h2>
                        <p className="premium-subtitle">Restablece tu contraseña validando tu identidad.</p>
                    </div>

                    {error && (
                    <div className="premium-error-toast mb-6">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        
                        <EliteInput 
                            label="Cédula de Ciudadanía"
                            icon={<User size={18} />}
                            value={formData.identificationNumber}
                            onChange={(val) => setFormData({...formData, identificationNumber: val})}
                            type="text"
                            placeholder="Número de identificación"
                        />

                        <EliteInput 
                            label="Fecha de Nacimiento"
                            icon={<Calendar size={18} />}
                            value={formData.birthDate}
                            onChange={(val) => setFormData({...formData, birthDate: val})}
                            type="date"
                            placeholder="DD/MM/AAAA"
                        />

                        <div className="divider-premium" style={{ margin: '10px 0' }} />

                        <EliteInput 
                            label="Nueva Contraseña"
                            icon={<Lock size={18} />}
                            value={formData.newPassword}
                            onChange={(val) => setFormData({...formData, newPassword: val})}
                            type={showPassword ? "text" : "password"}
                            placeholder="Mínimo 6 caracteres"
                            suffix={
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="field-toggle-btn-v2">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            }
                        />

                        <EliteInput 
                            label="Confirmar Nueva Clave"
                            icon={<ShieldCheck size={18} />}
                            value={formData.confirmPassword}
                            onChange={(val) => setFormData({...formData, confirmPassword: val})}
                            type="password"
                            placeholder="Repite la clave nueva"
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
                           className={`login-submit-premium-v2 w-full mt-6 ${!allValid ? 'btn-disabled' : ''}`}
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
                )}
            </div>
            
            <p className="security-engine-footer">
                TALENHUMAN SECURITY ENGINE
            </p>
        </main>
    </div>
  );
};

export default SelfServiceReset;
