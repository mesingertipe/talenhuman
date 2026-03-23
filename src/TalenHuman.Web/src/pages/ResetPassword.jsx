import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, ArrowRight, Eye, EyeOff, Loader2, Check, ShieldAlert, Users, Shield } from 'lucide-react';
import api from '../services/api';
import './ResetPassword.css';

const ResetPassword = ({ user, onPasswordChanged }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Validation states
  const [validations, setValidations] = useState({
    minChar: false,
    hasLetter: false,
    hasNumber: false,
    match: false
  });

  useEffect(() => {
    setValidations({
      minChar: newPassword.length >= 6,
      hasLetter: /[a-zA-Z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      match: newPassword === confirmPassword && confirmPassword !== ''
    });
  }, [newPassword, confirmPassword]);

  const allValid = Object.values(validations).every(v => v);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allValid) {
      setError('Por favor cumple con todos los requisitos de seguridad.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.put('/users/change-password', { currentPassword, newPassword });
      
      const updatedUser = { ...user, mustChangePassword: false };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      onPasswordChanged(updatedUser);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const ValidationItem = ({ label, passed }) => (
    <div className={`validation-item ${passed ? 'passed' : ''}`}>
      <div className="validation-dot">
        {passed && <Check size={10} strokeWidth={4} />}
      </div>
      <span>{label}</span>
    </div>
  );

  return (
    <div className="reset-container">
      <div className="reset-bg-decoration-1"></div>
      <div className="reset-bg-decoration-2"></div>

      <div className="reset-card">
        {/* Left Side: Illustration & Branding */}
        <div className="reset-sidebar">
          <div>
            <div className="reset-brand">
              <div className="reset-brand-icon">
                <Users size={24} color="white" />
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: '700' }}>TalenHuman</span>
            </div>
            
            <h2 className="reset-hero-title">
              Tu seguridad es <br />
              <span style={{ color: '#c7d2fe' }}>nuestra prioridad.</span>
            </h2>
            <p className="reset-hero-subtitle">
              Configura una contraseña robusta para proteger tu cuenta y la información de tu empresa.
            </p>
          </div>

          <div className="reset-protection-badge">
            <div className="reset-badge-icon">
              <ShieldCheck size={24} color="white" />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: '700', margin: 0 }}>Protección Activa</p>
              <p style={{ fontSize: '0.75rem', opacity: 0.6, margin: 0 }}>Cifrado SSL de punto a punto.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Reset Form */}
        <div className="reset-form-side">
          <div className="reset-header-mobile">
             <div style={{ background: '#f5f7ff', padding: '1rem', borderRadius: '1rem', color: '#4f46e5' }}>
                <Lock size={28} />
             </div>
          </div>

          <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
            <h1 className="reset-title">Restablecer Clave</h1>
            <p className="reset-subtitle">
              Usuario: <span style={{ color: '#4f46e5', fontWeight: '700' }}>{user?.email}</span>
            </p>
          </div>

          {error && (
            <div className="reset-error">
              <ShieldAlert size={20} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="reset-form-group">
                <label className="reset-label">Contraseña Actual</label>
                <div className="reset-input-wrapper">
                    <Lock className="reset-input-icon" size={18} />
                    <input 
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="reset-input"
                        placeholder="Ingresa tu clave actual"
                    />
                </div>
            </div>

            <div className="reset-form-group">
                <label className="reset-label">Nueva Contraseña</label>
                <div className="reset-input-wrapper">
                    <ShieldCheck className="reset-input-icon" size={18} />
                    <input 
                        type={showPass ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="reset-input"
                        placeholder="Crea una clave fuerte"
                    />
                    <button 
                        type="button" 
                        onClick={() => setShowPass(!showPass)}
                        className="reset-toggle-btn"
                    >
                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>

            <div className="reset-form-group">
                <label className="reset-label">Confirmar Contraseña</label>
                <div className="reset-input-wrapper">
                    <Shield className="reset-input-icon" size={18} />
                    <input 
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="reset-input"
                        placeholder="Repite tu nueva clave"
                    />
                </div>
            </div>

            {/* Validation Panel */}
            <div className="reset-validation-panel">
                <ValidationItem label="Mínimo 6 caracteres" passed={validations.minChar} />
                <ValidationItem label="Letras y Números" passed={validations.hasLetter && validations.hasNumber} />
                <ValidationItem label="Claves coinciden" passed={validations.match} />
                <ValidationItem label="Seguridad OK" passed={allValid} />
            </div>

            <button 
                type="submit" 
                disabled={loading || !allValid}
                className="reset-submit-btn"
            >
                {loading ? (
                    <Loader2 className="animate-spin" size={24} />
                ) : (
                    <>
                        <span>Actualizar Acceso</span>
                        <ArrowRight size={20} />
                    </>
                )}
            </button>
          </form>

          <p className="reset-footer-text">
            TalenHuman Security Engine &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
