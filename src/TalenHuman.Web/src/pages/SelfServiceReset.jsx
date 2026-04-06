import React, { useState, useEffect } from 'react';
import { Shield, User, Calendar, Lock, ArrowLeft, CheckCircle, AlertCircle, Eye, EyeOff, ShieldCheck, ArrowRight, Bell, Sparkles, Check, X } from 'lucide-react';
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
  
  // ⚡️ Elite Indicators Logic (V12 Premium)
  const isMatch = formData.newPassword && formData.newPassword === formData.confirmPassword;
  const isLongEnough = formData.newPassword.length >= 6;
  const strengthPercent = Math.min((formData.newPassword.length / 8) * 100, 100);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isMatch) {
      setError('Las contraseñas deben coincidir perfectamente.');
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
                    <p className="premium-subtitle">Tu contraseña ha sido actualizada. Ingresa con tus nuevos datos.</p>
                    <button onClick={onBack} className="login-submit-premium-v2 w-full mt-6">
                        <span>ENTRAR AL LOGIN</span>
                        <ArrowRight size={20} />
                    </button>
                </div>
                ) : (
                <div className="form-state-premium">
                    <div className="header-section-premium mb-10">
                        <div className="flex items-center gap-3 mb-2">
                           <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                               <Sparkles size={18} />
                           </div>
                           <h2 className="premium-title" style={{ margin: 0 }}>AUTO-SERVICIO</h2>
                        </div>
                        <p className="premium-subtitle">Valida tu identidad de forma segura para definir tu nueva clave.</p>
                    </div>

                    {error && (
                    <div className="premium-error-toast mb-8">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                    )}

                    <form onSubmit={handleSubmit} className="premium-form-layout">
                        {/* 🆔 IDENTIFICACIÓN */}
                        <div className="premium-field-group">
                            <label className="premium-field-label">NÚMERO DE CÉDULA</label>
                            <div className="premium-input-box-v2">
                                <User className="field-icon-v2" size={20} />
                                <input 
                                    required
                                    type="text"
                                    className="premium-field-input-v2"
                                    placeholder="ID del empleado"
                                    value={formData.identificationNumber}
                                    onChange={(e) => setFormData({ ...formData, identificationNumber: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* 📅 NACIMIENTO */}
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
                            {/* Strength Bar */}
                            <div className="w-full h-1 bg-slate-100 rounded-full mt-3 overflow-hidden">
                                <div 
                                   className="h-full bg-indigo-500 transition-all duration-500" 
                                   style={{ width: `${strengthPercent}%`, opacity: formData.newPassword ? 1 : 0 }} 
                                />
                            </div>
                        </div>

                        {/* 🔒 CONFIRMAR CLAVE */}
                        <div className="premium-field-group">
                            <div className="flex justify-between items-center mb-1">
                                <label className="premium-field-label">CONFIRMAR CLAVE</label>
                                {formData.confirmPassword && (
                                    isMatch ? 
                                    <span className="text-[10px] text-emerald-600 font-black flex items-center gap-1 animate-in zoom-in"><Check size={10} /> COINCIDE</span> : 
                                    <span className="text-[10px] text-rose-600 font-black flex items-center gap-1 animate-in zoom-in"><X size={10} /> NO COINCIDE</span>
                                )}
                            </div>
                            <div className={`premium-input-box-v2 ${formData.confirmPassword && !isMatch ? 'border-rose-300' : ''}`}>
                                <Lock className="field-icon-v2" size={20} />
                                <input 
                                    required
                                    type={showPassword ? "text" : "password"}
                                    className="premium-field-input-v2"
                                    placeholder="Repite la clave"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
                                    <ArrowRight size={20} />
                                </div>
                            )}
                        </button>
                    </form>
                </div>
                )}
            </div>
            
            <footer className="elite-mobile-footer">
                <p>PROTECCIÓN DE DATOS BAJO TLS 1.3</p>
                <div className="elite-version">V65.2.14-ELITE</div>
            </footer>
        </main>
    </div>
  );
};

export default SelfServiceReset;
