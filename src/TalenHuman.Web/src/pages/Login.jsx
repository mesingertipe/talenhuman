import React, { useState, useEffect } from 'react';
import { Lock, Mail, Eye, EyeOff, ArrowRight, ShieldAlert, Bell, Calendar, Megaphone, Globe } from 'lucide-react';
import api from '../services/api';
import TalenHumanLogo from '../components/Shared/TalenHumanLogo';
import './Login.css';

const Login = ({ onLogin, onForgotPassword, onSelfServiceReset, version }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('rememberedEmail');
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      const res = await api.post('/auth/login', { email, password });
      
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('tenantId', res.data.user.companyId);
      
      onLogin(res.data.user, res.data.token);
    } catch (err) {
      setError('Credenciales inválidas. Por favor intenta de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
        {/* 🚀 V65.1.39 PREMIUM ELITE CARD */}
        <div className="login-card">
            
            {/* 🏔️ SIDEBAR LANDING (Hidden on Mobile) */}
            <div className="login-sidebar">
              <div className="login-sidebar-content">
                <div className="login-brand mb-12">
                  <TalenHumanLogo size={48} white={true} />
                </div>
                <h1 className="login-hero-title">
                  Gestiona tu talento <br />
                  <span className="text-indigo-200 underline">sin fronteras.</span>
                </h1>
                <p className="login-hero-subtitle">
                    Accede a la plataforma líder en gestión humana <br />
                    para equipos de alto rendimiento.
                </p>
                <div className="login-features">
                  <div className="login-feature-item">
                    <div className="login-feature-icon"><Bell size={18} /></div>
                    <span>Novedades en tiempo real</span>
                  </div>
                  <div className="login-feature-item">
                    <div className="login-feature-icon"><Calendar size={18} /></div>
                    <span>Gestión de Horarios</span>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements from CSS */}
              <div className="login-decoration-1"></div>
              <div className="login-decoration-2"></div>
            </div>

            {/* 📝 FORM AREA */}
            <div className="login-form-side">
                <div className="login-form-container">
                  {/* 🏠 Mobile Brand Header (Purple Gradient background in CSS) */}
                  <div className="login-mobile-brand">
                    <TalenHumanLogo size={36} white={true} />
                    <span className="login-mobile-brand-name">TalenHuman</span>
                  </div>

                  <div className="login-header">
                    <h2 className="login-title">¡Bienvenido!</h2>
                    <p className="login-subtitle">Ingresa tus credenciales para acceder.</p>
                  </div>

                  {error && (
                    <div className="login-error animate-in fade-in slide-in-from-top-2">
                      <ShieldAlert size={18} />
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                      <label className="form-label">Usuario o Correo Corporativo</label>
                      <div className="input-wrapper">
                        <Mail className="input-icon" size={18} />
                        <input 
                          type="text" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="login-input"
                          placeholder="Identificación o Usuario"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Contraseña</label>
                      <div className="input-wrapper">
                        <Lock className="input-icon" size={18} />
                        <input 
                          type={showPassword ? "text" : "password"} 
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="login-input"
                          placeholder="••••••••"
                        />
                        <button 
                          type="button" 
                          className="password-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="form-options">
                        <label className="remember-me">
                          <input 
                            type="checkbox" 
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                          />
                          <span>Recordarme</span>
                        </label>
                        <button 
                          type="button" 
                          className="forgot-password"
                          onClick={onForgotPassword}
                        >
                          ¿Olvidaste tu contraseña?
                        </button>
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
                          <span>Ingresar</span>
                          <ArrowRight size={20} />
                        </>
                      )}
                    </button>

                    <div className="text-center mt-6">
                        <button 
                          type="button" 
                          className="link-sutil"
                          onClick={onSelfServiceReset}
                        >
                          No tengo correo corporativo
                        </button>
                    </div>
                  </form>

                  <div className="login-footer">
                      <p>¿Necesitas ayuda? <a href="#">Soporte</a></p>
                      <div className="version-tag">
                         {version || 'V65.2.7-ELITE'}
                      </div>
                  </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Login;
