import React, { useState, useEffect } from 'react';
import { Lock, Mail, Eye, EyeOff, ArrowRight, ShieldAlert, Bell, Calendar, Megaphone, Globe, UserCheck, ShieldCheck, HelpCircle, ChevronRight } from 'lucide-react';
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
      console.error(err);    } finally {
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
                  {/* 🏠 Mobile Brand Header */}
                  <div className="login-mobile-brand">
                    <TalenHumanLogo size={36} white={true} />
                    <span className="login-mobile-brand-name">TalenHuman</span>
                  </div>

                  <div className="login-header">
                    <h2 className="login-title">¡Bienvenido!</h2>
                    <p className="login-subtitle">Ingresa tus credenciales para acceder.</p>
                  </div>

                  {error && (
                    <div className="login-error animate-in fade-in slide-in-from-bottom-2">
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

                    <div className="form-options mb-12">
                        <label className="remember-me">
                          <input 
                            type="checkbox" 
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                          />
                          <span>Recordarme</span>
                        </label>
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
                          <span>Ingresar</span>
                          <ArrowRight size={20} />
                        </>
                      )}
                    </button>
                  </form>

                  {/* 🛡️ PREMIUM HELP CARDS (V65.2.8) */}
                  <div className="login-help-section mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <h3 className="section-title text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-4 px-2 text-center">Ayuda con el Acceso</h3>
                    
                    <div className="help-cards-stack flex flex-col gap-3">
                        <LoginHelpItem 
                            icon={<ShieldCheck size={20} />}
                            title="¿Olvidaste tu contraseña?"
                            subtitle="Recuperación síncrona por correo"
                            onClick={onForgotPassword}
                        />

                        <LoginHelpItem 
                            icon={<HelpCircle size={20} />}
                            title="No tengo correo corporativo"
                            subtitle="Gestión mediante auto-servicio"
                            onClick={onSelfServiceReset}
                        />
                    </div>
                  </div>

                  <div className="login-footer mt-12">
                      <div className="version-tag text-center opacity-30 text-[8px] font-black tracking-widest">
                         {version || 'V65.2.8-ELITE'}
                      </div>
                  </div>
                </div>
            </div>
        </div>
    </div>
  );
};

const LoginHelpItem = ({ icon, title, subtitle, onClick }) => (
    <button 
        type="button"
        onClick={onClick}
        className="login-help-card group"
    >
        <div className="help-card-icon-box">
            {icon}
        </div>
        <div className="help-card-content">
            <span className="help-card-title">{title}</span>
            <span className="help-card-subtitle">{subtitle}</span>
        </div>
        <ChevronRight size={16} className="help-card-chevron transition-transform group-hover:translate-x-1" />
    </button>
);

export default Login;
