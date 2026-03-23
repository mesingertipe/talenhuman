import React, { useState } from 'react';
import { Shield, User, Calendar, Lock, ArrowLeft, CheckCircle, AlertCircle, Eye, EyeOff, Users } from 'lucide-react';
import api from '../services/api';
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
      <div className="login-card">
        
        {/* Left Side: Sidebar (Same as Login) */}
        <div className="login-sidebar">
          <div className="login-sidebar-content">
            <div className="login-brand">
              <div className="login-brand-icon">
                <Users size={28} />
              </div>
              <span className="login-brand-name">TalenHuman</span>
            </div>
            
            <h1 className="login-hero-title">
              Tu seguridad <br />
              <span style={{ color: '#c7d2fe', textDecoration: 'underline', textDecorationColor: '#818cf8' }}>es prioridad.</span>
            </h1>
            <p className="login-hero-subtitle">
              Recupera tu acceso de forma segura validando tus datos personales registrados en el sistema.
            </p>
          </div>

          <div className="login-stats">
             <div className="login-stat-item">
                <p className="login-stat-value">Encriptación</p>
                <p className="login-stat-label">AES-256 bits</p>
             </div>
             <div className="login-stat-item">
                <p className="login-stat-value">Privacidad</p>
                <p className="login-stat-label">Protección de datos</p>
             </div>
          </div>

          <div className="login-decoration-1"></div>
          <div className="login-decoration-2"></div>
        </div>

        {/* Right Side: Form */}
        <div className="login-form-side">
          <div className="login-form-container">
            <div className="login-mobile-brand">
               <Users size={20} />
               <span>TalenHuman</span>
            </div>

            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-6 font-semibold text-sm"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <ArrowLeft size={16} /> Volver al Inicio
            </button>

            <div className="login-header">
              <h2 className="login-title">Restablecer Clave</h2>
              <p className="login-subtitle">Valida tu identidad para definir una nueva contraseña.</p>
            </div>

            {success ? (
              <div className="text-center py-4 animate-in zoom-in duration-300">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">¡Completado!</h3>
                <p className="text-slate-500 text-sm mb-6">
                  Tu contraseña ha sido actualizada con éxito. Ya puedes ingresar al sistema.
                </p>
                <button 
                  onClick={onBack}
                  className="login-submit"
                >
                  Ir al Login
                </button>
              </div>
            ) : (
              <>
                {error && (
                  <div className="login-error">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                  <div className="form-group">
                    <label className="form-label">Número de Cédula</label>
                    <div className="input-wrapper">
                      <User className="input-icon" size={18} />
                      <input 
                        required
                        type="text"
                        className="login-input"
                        placeholder="Sin puntos ni espacios"
                        value={formData.identificationNumber}
                        onChange={(e) => setFormData({ ...formData, identificationNumber: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
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

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
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

                  <div className="form-group">
                    <label className="form-label">Confirmar Contraseña</label>
                    <div className="input-wrapper">
                      <Lock className="input-icon" size={18} />
                      <input 
                        required
                        type={showPassword ? "text" : "password"}
                        className="login-input"
                        placeholder="Repite tu nueva contraseña"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="login-submit"
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

            <div className="login-footer" style={{ marginTop: '2rem' }}>
               <p>
                 Si tienes problemas, <a href="#">contacta a soporte técnico.</a>
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelfServiceReset;
