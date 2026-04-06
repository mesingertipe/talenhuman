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
    <div className="login-container">
        {/* 🚀 ELITE V12 PREMIUM CARD */}
        <div className="login-card">
            
            {/* 🏔️ SIDEBAR LANDING (Hidden on Mobile) */}
            <div className="login-sidebar">
              <div className="login-sidebar-content">
                <div className="login-brand mb-12">
                  <TalenHumanLogo size={48} white={true} />
                </div>
                <h1 className="login-hero-title">
                  Tu seguridad <br />
                  <span className="text-indigo-200 underline">es prioridad.</span>
                </h1>
                <p className="login-hero-subtitle">
                    Recupera tu acceso validando tus datos personales registrados en el sistema de forma segura.
                </p>
                <div className="login-features">
                  <div className="login-feature-item">
                    <div className="login-feature-icon"><ShieldCheck size={18} /></div>
                    <span>Validación de Identidad</span>
                  </div>
                  <div className="login-feature-item">
                    <div className="login-feature-icon"><Bell size={18} /></div>
                    <span>Actualización inmediata</span>
                  </div>
                </div>
              </div>
              <div className="login-decoration-1"></div>
              <div className="login-decoration-2"></div>
            </div>

            {/* 📝 FORM AREA */}
            <div className="login-form-side">
                <div className="login-form-container">
                    
                  {/* 🏠 Mobile Brand Header */}
                  <div className="login-mobile-brand">
                    <TalenHumanLogo size={36} white={true} />
                    <span className="login-mobile-brand-name">TalenHuman</span>
                  </div>

                  <button 
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-all mb-8 font-black text-[10px] uppercase tracking-[0.2em]"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <ArrowLeft size={16} /> Volver al Inicio
                  </button>

                  {success ? (
                    <div className="text-center py-8 animate-in zoom-in duration-500">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mb-6 shadow-sm shadow-emerald-200">
                            <CheckCircle size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">¡Completado!</h3>
                        <p className="text-slate-500 text-sm mb-10 leading-relaxed px-4">
                            Tu contraseña ha sido actualizada con éxito utilizando el método de auto-servicio. Ya puedes ingresar al sistema.
                        </p>
                        <button 
                            onClick={onBack}
                            className="login-submit w-full"
                        >
                            <span>Ir al Login</span>
                            <ArrowRight size={20} />
                        </button>
                    </div>
                  ) : (
                    <>
                      <div className="login-header">
                        <h2 className="login-title">Auto-Servicio</h2>
                        <p className="login-subtitle">Valida tu identidad para definir una nueva contraseña sin depender de un correo corporativo.</p>
                      </div>

                      {error && (
                        <div className="login-error animate-in fade-in slide-in-from-bottom-2">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                      )}

                      <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group mb-4">
                          <label className="form-label">Número de Cédula</label>
                          <div className="input-wrapper">
                            <User className="input-icon" size={18} />
                            <input 
                              required
                              type="text"
                              className="login-input"
                              placeholder="Identificación del empleado"
                              value={formData.identificationNumber}
                              onChange={(e) => setFormData({ ...formData, identificationNumber: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="form-group mb-6">
                          <label className="form-label">Fecha de Nacimiento</label>
                          <div className="input-wrapper">
                            <Calendar className="input-icon" size={18} />
                            <input 
                              required
                              type="date"
                              className="login-input"
                              value={formData.birthDate}
                              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="form-group mb-4">
                          <label className="form-label">Nueva Contraseña</label>
                          <div className="input-wrapper">
                            <Lock className="input-icon" size={18} />
                            <input 
                              required
                              type={showPassword ? "text" : "password"}
                              className="login-input"
                              placeholder="Mínimo 6 caracteres"
                              value={formData.newPassword}
                              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                            />
                            <button 
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="password-toggle"
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>

                        <div className="form-group mb-8">
                          <label className="form-label">Confirmar Contraseña</label>
                          <div className="input-wrapper">
                            <Lock className="input-icon" size={18} />
                            <input 
                              required
                              type={showPassword ? "text" : "password"}
                              className="login-input"
                              placeholder="Repite la nueva contraseña"
                              value={formData.confirmPassword}
                              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            />
                          </div>
                        </div>

                        <button 
                          type="submit" 
                          disabled={loading}
                          className="login-submit w-full"
                        >
                          {loading ? (
                            <div className="loader"></div>
                          ) : (
                            <>
                              <span>Actualizar Contraseña</span>
                              <Shield size={20} />
                            </>
                          )}
                        </button>
                      </form>
                    </>
                  )}

                  <div className="login-footer mt-12 text-center opacity-60">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                         Protección de datos bajo estándares internacionales.
                      </p>
                  </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default SelfServiceReset;
