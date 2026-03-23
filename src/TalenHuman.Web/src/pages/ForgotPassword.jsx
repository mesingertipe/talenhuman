import React, { useState } from 'react';
import { Mail, ArrowLeft, ArrowRight, ShieldCheck, Users } from 'lucide-react';
import api from '../services/api';
import './Login.css';

const ForgotPassword = ({ onBack, onTokenRequested }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data.message);
      // Wait a bit then move to next step
      setTimeout(() => {
        onTokenRequested(email);
      }, 2000);
    } catch (err) {
      setError('Error al procesar la solicitud. Verifica el correo e intenta de nuevo.');
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
              Recupera <br /> tu acceso.
            </h2>
            <p className="login-hero-subtitle">
              Ingresa tu correo corporativo y te enviaremos las instrucciones para restablecer tu clave.
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
              <ArrowLeft size={18} /> Volver al Inicio
            </button>

            <div className="login-header" style={{ marginBottom: '2rem' }}>
              <h2 className="login-title">Olvidé mi clave</h2>
              <p className="login-subtitle">Enviaremos un código de seguridad a tu email.</p>
            </div>

            {error && <div className="login-error">{error}</div>}
            {message && (
              <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '1rem', borderRadius: '12px', fontSize: '0.875rem', marginBottom: '1.5rem', border: '1px solid #dcfce7', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                 <ShieldCheck size={20} />
                 <span>{message}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email de la cuenta</label>
                <div className="input-wrapper">
                  <Mail className="input-icon" size={18} />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="login-input"
                    placeholder="nombre@empresa.com"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="login-submit">
                {loading ? <div className="loader"></div> : (
                  <>
                    <span>Enviar instrucciones</span>
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

export default ForgotPassword;
