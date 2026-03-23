import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, Users, ArrowRight, ShieldAlert } from 'lucide-react';
import api from '../services/api';
import './Login.css';

const Login = ({ onLogin, onForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Admin123!');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load remembered email on mount
  React.useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    } else {
        setEmail('admin@talenhuman.com');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Handle "Remember Me" persistence
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      // Clear potentially stale session data before login attempt
      if (email === 'admin@talenhuman.com') {
        localStorage.setItem('tenantId', '11111111-1111-1111-1111-111111111111');
      }

      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('tenantId', res.data.user.companyId);
      onLogin(res.data.user);
    } catch (err) {
      setError('Credenciales inválidas. Por favor intenta de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        
        {/* Left Side: Sidebar */}
        <div className="login-sidebar">
          <div className="login-sidebar-content">
            <div className="login-brand">
              <div className="login-brand-icon">
                <Users size={28} />
              </div>
              <span className="login-brand-name">TalenHuman</span>
            </div>
            
            <h1 className="login-hero-title">
              Gestiona tu talento <br />
              <span style={{ color: '#c7d2fe', textDecoration: 'underline', textDecorationColor: '#818cf8' }}>sin fronteras.</span>
            </h1>
            <p className="login-hero-subtitle">
              La plataforma multitenant más avanzada para la gestión de personal y capital humano en tiempo real.
            </p>
          </div>

          <div className="login-stats">
             <div className="login-stat-item">
                <p className="login-stat-value">+1,200</p>
                <p className="login-stat-label">Usuarios activos</p>
             </div>
             <div className="login-stat-item">
                <p className="login-stat-value">99.9%</p>
                <p className="login-stat-label">Uptime Garantizado</p>
             </div>
          </div>

          <div className="login-decoration-1"></div>
          <div className="login-decoration-2"></div>
        </div>

        {/* Right Side: Login Form */}
        <div className="login-form-side">
          <div className="login-form-container">
            <div className="login-mobile-brand">
               <Users size={20} />
               <span>TalenHuman</span>
            </div>

            <div className="login-header">
              <h2 className="login-title">Bienvenido</h2>
              <p className="login-subtitle">Ingresa tus credenciales para acceder.</p>
            </div>

            {error && (
              <div className="login-error">
                <ShieldAlert size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label className="form-label">Email corporativo</label>
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
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle"
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
                  <span>Recordar email</span>
                </label>
                <button 
                  type="button" 
                  onClick={onForgotPassword} 
                  className="forgot-password"
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  ¿Olvidaste tu clave?
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
                    <span>Ingresar al Sistema</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>

            <div className="login-footer">
               <p>
                 ¿Necesitas ayuda? <a href="#">Contactar a Soporte</a>
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
