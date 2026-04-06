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
    <div className="mobile-premium-flow-root animate-in fade-in duration-500">
        
        {/* 🏔️ ELITE STICKY HEADER */}
        <header className="elite-mobile-header">
            <button onClick={onBack} className="elite-back-btn">
                <ArrowLeft size={22} />
            </button>
            <div className="elite-header-title">
                <TalenHumanLogo size={24} white={true} />
                <span>TALENHUMAN</span>
            </div>
            <div style={{ width: 40 }} /> {/* Spacer for balance */}
        </header>

        <main className="elite-mobile-content">
            <div className="premium-recovery-card-v2">
                
                {success ? (
                <div className="success-state-premium text-center py-8">
                    <div className="success-icon-box">
                        <CheckCircle size={44} />
                    </div>
                    <h3 className="premium-title">¡Contraseña Actualizada!</h3>
                    <p className="premium-subtitle">
                        Tu acceso ha sido restablecido con éxito. Ya puedes ingresar al sistema.
                    </p>
                    <button onClick={onBack} className="login-submit-premium w-full mt-6">
                        <span>IR AL LOGIN</span>
                        <ArrowRight size={20} />
                    </button>
                </div>
                ) : (
                <div className="form-state-premium">
                    <div className="header-section-premium">
                        <h2 className="premium-title">Auto-Servicio</h2>
                        <p className="premium-subtitle">Valida tu identidad para definir una nueva contraseña sin depender de un correo corporativo.</p>
                    </div>

                    {error && (
                    <div className="premium-error-toast">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                    )}

                    <form onSubmit={handleSubmit} className="premium-form-layout">
                        <div className="premium-field-group">
                            <label className="premium-field-label">NÚMERO DE CÉDULA</label>
                            <div className="premium-input-box-v2">
                                <User className="field-icon-v2" size={20} />
                                <input 
                                    required
                                    type="text"
                                    className="premium-field-input-v2"
                                    placeholder="Identificación del empleado"
                                    value={formData.identificationNumber}
                                    onChange={(e) => setFormData({ ...formData, identificationNumber: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="premium-field-group">
                            <label className="premium-field-label">FECHA DE NACIMIENTO</label>
                            <div className="premium-input-box-v2">
                                <Calendar className="field-icon-v2" size={20} />
                                <input 
                                    required
                                    type="date"
                                    className="premium-field-input-v2"
                                    value={formData.birthDate}
                                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
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
                                    type={showPassword ? "text" : "password"}
                                    className="premium-field-input-v2"
                                    placeholder="Mínimo 6 caracteres"
                                    value={formData.newPassword}
                                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="field-toggle-btn-v2">
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="premium-field-group">
                            <label className="premium-field-label">CONFIRMAR CONTRASEÑA</label>
                            <div className="premium-input-box-v2">
                                <Lock className="field-icon-v2" size={20} />
                                <input 
                                    required
                                    type={showPassword ? "text" : "password"}
                                    className="premium-field-input-v2"
                                    placeholder="Repite la nueva clave"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                />
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="login-submit-premium-v2 w-full mt-8">
                            {loading ? <div className="loader-white"></div> : <span>ACTUALIZAR CONTRASEÑA</span>}
                        </button>
                    </form>
                </div>
                )}
            </div>
            
            <footer className="elite-mobile-footer">
                <p>GESTIÓN HUMANA DE ÚLTIMA GENERACIÓN</p>
                <div className="elite-version">V65.2.13-ELITE</div>
            </footer>
        </main>
    </div>
  );
};

export default SelfServiceReset;
