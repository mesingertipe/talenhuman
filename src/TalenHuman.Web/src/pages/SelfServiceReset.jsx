import React, { useState } from 'react';
import { Shield, User, Calendar, Lock, ArrowLeft, CheckCircle, AlertCircle, Eye, EyeOff, ShieldCheck, ArrowRight, Bell } from 'lucide-react';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
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
                <span>VOLVER AL INICIO</span>
                </button>

                {success ? (
                <div className="success-state-premium text-center py-8 animate-in zoom-in duration-500">
                    <div className="success-icon-box">
                        <CheckCircle size={44} />
                    </div>
                    <h3 className="premium-title">¡Éxito Total!</h3>
                    <p className="premium-subtitle">
                        Tu contraseña ha sido actualizada. Ya puedes ingresar al sistema con tus nuevos accesos.
                    </p>
                    <button 
                        onClick={onBack}
                        className="login-submit-premium w-full mt-6"
                    >
                        <span>IR AL LOGIN</span>
                        <ArrowRight size={20} />
                    </button>
                </div>
                ) : (
                <div className="form-state-premium">
                    <div className="header-section-premium">
                        <h2 className="premium-title">Auto-Servicio</h2>
                        <p className="premium-subtitle">Valida tu identidad para definir una nueva contraseña de forma segura.</p>
                    </div>

                    {error && (
                    <div className="premium-error-toast animate-in fade-in slide-in-from-top-2">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                    )}

                    <form onSubmit={handleSubmit} className="premium-form-layout">
                    <div className="premium-field-group">
                        <label className="premium-field-label">NÚMERO DE CÉDULA</label>
                        <div className="premium-input-box">
                        <User className="field-icon" size={20} />
                        <input 
                            required
                            type="text"
                            className="premium-field-input"
                            placeholder="Identificación del empleado"
                            value={formData.identificationNumber}
                            onChange={(e) => setFormData({ ...formData, identificationNumber: e.target.value })}
                        />
                        </div>
                    </div>

                    <div className="premium-field-group">
                        <label className="premium-field-label">FECHA DE NACIMIENTO</label>
                        <div className="premium-input-box">
                        <Calendar className="field-icon" size={20} />
                        <input 
                            required
                            type="date"
                            className="premium-field-input"
                            value={formData.birthDate}
                            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
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
                            type={showPassword ? "text" : "password"}
                            className="premium-field-input"
                            placeholder="Mínimo 6 caracteres"
                            value={formData.newPassword}
                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="field-toggle-btn"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                        </div>
                    </div>

                    <div className="premium-field-group">
                        <label className="premium-field-label">CONFIRMAR CONTRASEÑA</label>
                        <div className="premium-input-box">
                        <Lock className="field-icon" size={20} />
                        <input 
                            required
                            type={showPassword ? "text" : "password"}
                            className="premium-field-input"
                            placeholder="Repite la nueva contraseña"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
                )}
            </div>
            
            <div className="premium-footer-note text-center mt-12">
                <p className="footer-label">PROTECCIÓN DE DATOS BAJO ESTÁNDARES INTERNACIONALES</p>
                <div className="elite-tag">V65.2.12-ELITE-PWA</div>
            </div>
        </div>
    </div>
  );
};

export default SelfServiceReset;
