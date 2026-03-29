import React, { useState } from 'react';
import { Lock, ArrowLeft, ArrowRight, ShieldCheck, KeyRound, Eye, EyeOff, Users, ShieldAlert, Smartphone } from 'lucide-react';
import api from '../services/api';
import './Login.css';

const ResetForgottenPassword = ({ email, onBack }) => {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (token.length !== 6) {
        setError('El código debe ser de 6 dígitos.');
        return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    try {
      await api.post('/auth/reset-password-with-token', { 
        email, 
        token: token.trim(), 
        newPassword 
      });
      setMessage('Contraseña restablecida con éxito. Ya puedes ingresar con tu nueva clave.');
      setTimeout(() => {
        onBack(); // Go back to login
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al restablecer la contraseña. Verifica el código.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card" style={{ maxWidth: '850px' }}>
        <div className="login-sidebar" style={{ padding: '2.5rem' }}>
          <div>
            <div className="login-brand" style={{ marginBottom: '2.5rem' }}>
              <div className="login-brand-icon">
                <Users size={24} />
              </div>
              <span className="login-brand-name">TalenHuman</span>
            </div>
            <h2 className="login-hero-title" style={{ fontSize: '2.5rem', lineHeight: '1.1' }}>
              Define tu <br /> nueva clave.
            </h2>
            <p className="login-hero-subtitle" style={{ marginTop: '1.5rem' }}>
              Hemos enviado un código de seguridad de 6 dígitos a tu correo corporativo.
            </p>
            
            <div style={{ marginTop: '3rem', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#818cf8', marginBottom: '0.5rem' }}>
                    <Smartphone size={20} />
                    <span style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Proceso Seguro</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: '1.6' }}>
                    El código es válido por 15 minutos. Si no lo recibes, revisa tu carpeta de SPAM.
                </p>
            </div>
          </div>
          <div className="login-decoration-2"></div>
        </div>

        <div className="login-form-side" style={{ padding: '3.5rem' }}>
          <div className="login-form-container">
            <button onClick={onBack} className="back-link" style={{ 
                display: 'flex', alignItems: 'center', gap: '0.5rem', 
                background: 'none', border: 'none', color: 'var(--text-muted)', 
                cursor: 'pointer', marginBottom: '2.5rem', padding: 0,
                fontSize: '0.875rem', fontWeight: '600'
            }}>
              <ArrowLeft size={18} /> Cancelar y volver
            </button>

            <div className="login-header" style={{ marginBottom: '2.5rem' }}>
              <h2 className="login-title">Restablecer</h2>
              <p className="login-subtitle">Verificando identidad para <span style={{ color: '#4f46e5', fontWeight: '800' }}>{email}</span></p>
            </div>

            {error && (
                <div className="login-error animate-in fade-in slide-in-from-top-2" style={{ fontSize: '0.8rem', padding: '1rem' }}>
                    <ShieldAlert size={16} />
                    <span>{error}</span>
                </div>
            )}
            {message && (
              <div className="animate-in fade-in slide-in-from-top-2" style={{ background: '#f0fdf4', color: '#16a34a', padding: '1.25rem', borderRadius: '16px', fontSize: '0.875rem', marginBottom: '2rem', border: '1px solid #dcfce7', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                 <ShieldCheck size={22} />
                 <span style={{ fontWeight: '600' }}>{message}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Código de Seguridad (6 dígitos)</span>
                    <span style={{ color: '#4f46e5', fontWeight: '900' }}>OTP</span>
                </label>
                <div className="input-wrapper">
                  <KeyRound className="input-icon" size={18} />
                  <input 
                    type="text" 
                    required
                    maxLength={6}
                    value={token}
                    onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                    className="login-input"
                    placeholder="000000"
                    style={{ letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.25rem' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nueva Contraseña</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={18} />
                  <input 
                    type={showPass ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="login-input"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPass(!showPass)}
                    className="password-toggle"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirmar Contraseña</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={18} />
                  <input 
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="login-input"
                    placeholder="Repite la nueva clave"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="login-submit" style={{ marginTop: '2rem' }}>
                {loading ? <div className="loader"></div> : (
                  <>
                    <span>Actualizar Contraseña</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetForgottenPassword;
