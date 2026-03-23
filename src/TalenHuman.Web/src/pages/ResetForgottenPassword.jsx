import React, { useState } from 'react';
import { Lock, ArrowLeft, ArrowRight, ShieldCheck, KeyRound, Eye, EyeOff, Users, ShieldAlert } from 'lucide-react';
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

    setLoading(true);
    setError('');
    setMessage('');
    try {
      await api.post('/auth/reset-password-with-token', { 
        email, 
        token: token.trim(), 
        newPassword 
      });
      setMessage('Contraseña restablecida con éxito. Redirigiendo...');
      setTimeout(() => {
        onBack(); // Go back to login
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al restablecer la contraseña. Verifica el token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card" style={{ maxWidth: '800px' }}>
        <div className="login-sidebar" style={{ padding: '2.5rem' }}>
          <div>
            <div className="login-brand" style={{ marginBottom: '2rem' }}>
              <div className="login-brand-icon">
                <Users size={24} />
              </div>
              <span className="login-brand-name">TalenHuman</span>
            </div>
            <h2 className="login-hero-title" style={{ fontSize: '2.5rem' }}>
              Nueva <br /> Contraseña.
            </h2>
            <p className="login-hero-subtitle">
              Ingresa el código que recibiste y define tu nueva clave de acceso.
            </p>
          </div>
          <div className="login-decoration-2"></div>
        </div>

        <div className="login-form-side" style={{ padding: '3rem' }}>
          <div className="login-form-container">
            <button onClick={onBack} className="back-link" style={{ 
                display: 'flex', alignItems: 'center', gap: '0.5rem', 
                background: 'none', border: 'none', color: 'var(--text-muted)', 
                cursor: 'pointer', marginBottom: '2rem', padding: 0,
                fontSize: '0.875rem', fontWeight: '600'
            }}>
              <ArrowLeft size={18} /> Cancelar
            </button>

            <div className="login-header" style={{ marginBottom: '2rem' }}>
              <h2 className="login-title">Restablecer</h2>
              <p className="login-subtitle">Verificando cuenta para <span style={{ color: '#4f46e5', fontWeight: '700' }}>{email}</span></p>
            </div>

            {error && (
                <div className="login-error" style={{ fontSize: '0.8rem' }}>
                    <ShieldAlert size={16} />
                    <span>{error}</span>
                </div>
            )}
            {message && (
              <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '1rem', borderRadius: '12px', fontSize: '0.875rem', marginBottom: '1.5rem', border: '1px solid #dcfce7', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                 <ShieldCheck size={20} />
                 <span>{message}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Código / Token de recuperación</label>
                <div className="input-wrapper">
                  <KeyRound className="input-icon" size={18} />
                  <input 
                    type="text" 
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="login-input"
                    placeholder="Pega el token aquí"
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
                    placeholder="••••••••"
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
                    placeholder="Repite la clave"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="login-submit">
                {loading ? <div className="loader"></div> : (
                  <>
                    <span>Cambiar Contraseña</span>
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
