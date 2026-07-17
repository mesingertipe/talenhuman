import React, { useState } from 'react';
import { 
  Lock, Mail, Phone, MapPin, Calendar, Bell, Megaphone, 
  ShieldCheck, Fingerprint, BarChart3, Clock, Menu, X, 
  ArrowRight, ShieldAlert, Send, CheckCircle2, Globe
} from 'lucide-react';
import TalenHumanLogo from '../components/Shared/TalenHumanLogo';
import './Landing.css';

const Landing = ({ onLoginClick }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    Nombre: '',
    Apellido: '',
    Email: '',
    Telefono: '',
    Interes: '',
    Mensaje: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', null

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitStatus(null);
    
    // Simulate sending contact request
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSubmitStatus('success');
      setFormData({
        Nombre: '',
        Apellido: '',
        Email: '',
        Telefono: '',
        Interes: '',
        Mensaje: ''
      });
    } catch (err) {
      setSubmitStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="landing-body">
      {/* 🧭 NAVBAR */}
      <nav className="landing-navbar">
        <div className="landing-nav-container">
          <a href="#" className="landing-nav-brand">
            <TalenHumanLogo size={36} white={false} />
            <span>TalenHuman</span>
          </a>

          <ul className="landing-nav-links">
            <li><a href="#features" className="landing-nav-link">Plataforma</a></li>
            <li><a href="#security" className="landing-nav-link">Seguridad</a></li>
            <li><a href="#contacto" className="landing-nav-link">Contacto</a></li>
            <li>
              <button onClick={onLoginClick} className="landing-btn-login">
                <span>Iniciar Sesión</span>
                <ArrowRight size={16} />
              </button>
            </li>
          </ul>

          <button onClick={toggleMobileMenu} className="landing-mobile-toggle">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* 📱 MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="landing-mobile-menu">
          <a href="#features" onClick={() => setMobileMenuOpen(false)} className="landing-nav-link">Plataforma</a>
          <a href="#security" onClick={() => setMobileMenuOpen(false)} className="landing-nav-link">Seguridad</a>
          <a href="#contacto" onClick={() => setMobileMenuOpen(false)} className="landing-nav-link">Contacto</a>
          <button 
            onClick={() => {
              setMobileMenuOpen(false);
              onLoginClick();
            }} 
            className="landing-btn-login w-full justify-center"
          >
            <span>Iniciar Sesión</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      <main className="landing-main">
        {/* 🏔️ HERO SECTION */}
        <section className="landing-hero">
          <div className="landing-hero-container">
            <div className="landing-hero-content">
              <span className="landing-badge">
                <ShieldCheck size={16} />
                <span>Arquitectura Multi-Tenant Segura</span>
              </span>
              <h1 className="landing-hero-title">
                La Gestión de Talento y Horarios en <span>Piloto Automático.</span>
              </h1>
              <p className="landing-hero-description">
                <strong>TalenHuman</strong> unifica la planificación de turnos de tus equipos, geoubica las marcaciones de asistencia en tiempo real, y automatiza las solicitudes de novedades de nómina. Todo bajo un ecosistema corporativo de alto rendimiento.
              </p>
              <button onClick={onLoginClick} className="landing-btn-corporate">
                <span>Iniciar Sesión Operativa</span>
                <ArrowRight size={20} />
              </button>
            </div>
            <div className="landing-hero-visual">
              <div className="landing-hero-img-wrapper">
                <TalenHumanLogo size={140} className="landing-hero-icon-large" />
              </div>
            </div>
          </div>
        </section>

        {/* 📊 STATS STRIP */}
        <section className="landing-stats-strip">
          <div className="landing-stats-container">
            <div>
              <div className="landing-stat-value">99.9%</div>
              <div className="landing-stat-label">Uptime Garantizado</div>
            </div>
            <div>
              <div className="landing-stat-value">&lt; 50ms</div>
              <div className="landing-stat-label">Latencia del Servidor</div>
            </div>
            <div>
              <div className="landing-stat-value">100%</div>
              <div className="landing-stat-label">Geocercas Activas</div>
            </div>
            <div>
              <div className="landing-stat-value">SaaS</div>
              <div className="landing-stat-label">Aislamiento de Datos</div>
            </div>
          </div>
        </section>

        {/* 🛠️ FEATURES GRID */}
        <section id="features" className="landing-features-section">
          <div className="landing-features-container">
            <div className="landing-section-header">
              <span className="landing-section-tag">Capacidades de TalenHuman</span>
              <h2 className="landing-section-title">Tecnología Inteligente para Operaciones Modernas</h2>
              <p className="landing-section-subtitle">
                Nuestra plataforma cuenta con herramientas integradas de nivel empresarial para programar, monitorear y optimizar el rendimiento y la asistencia de tu equipo de trabajo.
              </p>
            </div>

            <div className="landing-features-grid">
              {/* Card 1 */}
              <div className="landing-feature-card">
                <div className="landing-feature-icon-wrapper">
                  <MapPin size={24} />
                </div>
                <h3 className="landing-feature-title">Asistencia Geocercada</h3>
                <p className="landing-feature-desc">
                  Validación de ubicación en tiempo real mediante geocercas en las sedes o tiendas. Registra marcaciones de entrada y salida (Clock-In / Clock-Out) con precisión satelital.
                </p>
              </div>

              {/* Card 2 */}
              <div className="landing-feature-card">
                <div className="landing-feature-icon-wrapper">
                  <Calendar size={24} />
                </div>
                <h3 className="landing-feature-title">Planificador de Turnos</h3>
                <p className="landing-feature-desc">
                  Diseño interactivo de horarios semanales y mensuales. Controla solapamientos, límites de jornadas laborales, turnos de descanso y distribuciones de carga de trabajo.
                </p>
              </div>

              {/* Card 3 */}
              <div className="landing-feature-card">
                <div className="landing-feature-icon-wrapper">
                  <Bell size={24} />
                </div>
                <h3 className="landing-feature-title">Novedades de Nómina</h3>
                <p className="landing-feature-desc">
                  Flujo digital completo para reportar novedades como licencias, incapacidades, ausencias justificadas y horas extras. Facilita la aprobación por parte de gerentes.
                </p>
              </div>

              {/* Card 4 */}
              <div className="landing-feature-card">
                <div className="landing-feature-icon-wrapper">
                  <Megaphone size={24} />
                </div>
                <h3 className="landing-feature-title">Centro de Comunicados</h3>
                <p className="landing-feature-desc">
                  Transmite noticias, normativas y notificaciones en tiempo real directamente al buzón o aplicación móvil de tus colaboradores por sede, rol o empresa.
                </p>
              </div>

              {/* Card 5 */}
              <div className="landing-feature-card">
                <div className="landing-feature-icon-wrapper">
                  <Fingerprint size={24} />
                </div>
                <h3 className="landing-feature-title">Seguridad Biométrica</h3>
                <p className="landing-feature-desc">
                  Acceso robusto con validación de identidad avanzada que evita suplantaciones. Diseñado para garantizar la veracidad de los registros en terminales físicas y móviles.
                </p>
              </div>

              {/* Card 6 */}
              <div className="landing-feature-card">
                <div className="landing-feature-icon-wrapper">
                  <BarChart3 size={24} />
                </div>
                <h3 className="landing-feature-title">Analítica BI Operativa</h3>
                <p className="landing-feature-desc">
                  Dashboards ejecutivos con reportes consolidados en Excel y PDF. Visualiza métricas de absentismo, puntualidad, horas laboradas y costos proyectados.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 🔒 SECURITY SECTION */}
        <section id="security" class="landing-security-section">
          <div className="landing-security-container">
            <div className="landing-security-card">
              <div className="landing-security-details">
                <span className="landing-security-badge">
                  <Lock size={14} style={{ marginRight: '6px', color: '#fbbf24' }} /> Nivel Enterprise
                </span>
                <h2 className="landing-security-details-title">Infraestructura SaaS de Clase Mundial</h2>
                <p className="landing-security-details-desc">
                  La arquitectura Multi-Tenant de TalenHuman garantiza el aislamiento lógico absoluto de los datos de tu empresa a través de filtros a nivel de base de datos y múltiples capas de encriptación.
                </p>

                <div className="landing-security-features-list">
                  <div className="landing-security-feature-item">
                    <Globe className="landing-security-item-icon" />
                    <div>
                      <h4 className="landing-security-item-title">Aislamiento Lógico</h4>
                      <p className="landing-security-item-desc">
                        Filtros de consulta globales en Entity Framework Core previenen que una compañía acceda a información de otra.
                      </p>
                    </div>
                  </div>

                  <div className="landing-security-feature-item">
                    <Lock className="landing-security-item-icon" />
                    <div>
                      <h4 className="landing-security-item-title">Cifrado End-to-End</h4>
                      <p className="landing-security-item-desc">
                        Todos los flujos de información clínica u operativa son transmitidos mediante canales HTTPS con TLS 1.3 y cifrados en reposo.
                      </p>
                    </div>
                  </div>

                  <div className="landing-security-feature-item">
                    <Clock className="landing-security-item-icon" />
                    <div>
                      <h4 className="landing-security-item-title">Backups Redundantes</h4>
                      <p className="landing-security-item-desc">
                        Respaldo automático incremental diario y planes robustos de recuperación ante desastres en múltiples zonas geográficas.
                      </p>
                    </div>
                  </div>

                  <div className="landing-security-feature-item">
                    <ShieldCheck className="landing-security-item-icon" />
                    <div>
                      <h4 className="landing-security-item-title">Auditoría Completa</h4>
                      <p className="landing-security-item-desc">
                        Registro de logs inmutables que rastrea cada acción sensible, modificación de turnos o intentos de marcación.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="landing-security-codeblock">
                <div className="landing-code-header">
                  <Clock size={14} />
                  <span>Seguridad en el Núcleo (SaaS Isolation)</span>
                </div>
                <pre className="landing-code-pre">
                  <span className="landing-code-comment">// 🔐 Multi-Tenant Data Isolation</span><br />
                  <span className="landing-code-keyword">protected override void</span> OnModelCreating(...) &#123;<br />
                  &nbsp;&nbsp;builder.Entity&lt;<span className="landing-code-class">Empleado</span>&gt;()<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.HasQueryFilter(e =&gt; e.CompanyId == _tenant);<br /><br />
                  &nbsp;&nbsp;builder.Entity&lt;<span className="landing-code-class">Marcacion</span>&gt;()<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.HasQueryFilter(m =&gt; m.CompanyId == _tenant);<br />
                  &#125;<br /><br />
                  <span className="landing-code-comment">// 🛡️ Security Strategy</span><br />
                  services.AddIdentity&lt;<span className="landing-code-class">User</span>, <span className="landing-code-class">Role</span>&gt;()<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.AddEntityFrameworkStores&lt;<span className="landing-code-class">AppDbContext</span>&gt;();
                </pre>
                <div style={{ marginTop: '2.5rem', padding: '1.25rem', background: 'rgba(79, 70, 229, 0.1)', border: '1px solid rgba(79, 70, 229, 0.2)', borderRadius: '16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <ShieldCheck size={20} style={{ color: '#818cf8', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.825rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                    Nuestra infraestructura cumple plenamente con los estándares de tratamiento y protección de datos personales.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 📬 CONTACT SECTION */}
        <section id="contacto" className="landing-contact-section">
          <div className="landing-contact-container">
            <div>
              <h2 className="landing-contact-info-title">¡Lleva tu gestión al siguiente nivel!</h2>
              <p className="landing-contact-info-desc">
                ¿Tienes dudas o te gustaría recibir una demostración personalizada? Nuestro equipo de consultores está listo para ayudarte a optimizar la planificación de turnos y el control de asistencia de tu negocio.
              </p>

              <div className="landing-contact-card">
                <div className="landing-contact-sidebar">
                  <div>
                    <h4 className="landing-contact-sidebar-title">Contacto Rápido</h4>
                    <p className="landing-contact-sidebar-desc">
                      Completa el formulario y un especialista se pondrá en contacto contigo en menos de 24 horas hábiles.
                    </p>
                  </div>
                  <div className="landing-contact-sidebar-logo">
                    <TalenHumanLogo size={48} white={true} />
                  </div>
                </div>

                <div className="landing-contact-form-wrapper">
                  {submitStatus === 'success' && (
                    <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '16px', padding: '1.25rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
                      <CheckCircle2 size={20} />
                      <span>¡Mensaje enviado con éxito! Te contactaremos pronto.</span>
                    </div>
                  )}

                  {submitStatus === 'error' && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px', padding: '1.25rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
                      <ShieldAlert size={20} />
                      <span>Error al enviar el mensaje. Inténtalo de nuevo.</span>
                    </div>
                  )}

                  <form onSubmit={handleContactSubmit}>
                    <div className="landing-form-row">
                      <div className="landing-form-group">
                        <label className="landing-form-label">Nombre *</label>
                        <input 
                          type="text" 
                          name="Nombre" 
                          required 
                          value={formData.Nombre}
                          onChange={handleInputChange}
                          className="landing-form-input" 
                          placeholder="Tu nombre" 
                        />
                      </div>
                      <div className="landing-form-group">
                        <label className="landing-form-label">Apellido *</label>
                        <input 
                          type="text" 
                          name="Apellido" 
                          required 
                          value={formData.Apellido}
                          onChange={handleInputChange}
                          className="landing-form-input" 
                          placeholder="Tu apellido" 
                        />
                      </div>
                    </div>

                    <div className="landing-form-group">
                      <label className="landing-form-label">Email Corporativo *</label>
                      <input 
                        type="email" 
                        name="Email" 
                        required 
                        value={formData.Email}
                        onChange={handleInputChange}
                        className="landing-form-input" 
                        placeholder="ejemplo@empresa.com" 
                      />
                    </div>

                    <div className="landing-form-group">
                      <label className="landing-form-label">Teléfono *</label>
                      <input 
                        type="tel" 
                        name="Telefono" 
                        required 
                        value={formData.Telefono}
                        onChange={handleInputChange}
                        className="landing-form-input" 
                        placeholder="+57 300 000 0000" 
                      />
                    </div>

                    <div className="landing-form-group">
                      <label className="landing-form-label">¿En qué te podemos ayudar? *</label>
                      <select 
                        name="Interes" 
                        required 
                        value={formData.Interes}
                        onChange={handleInputChange}
                        className="landing-form-input"
                        style={{ height: '45px' }}
                      >
                        <option value="" disabled>Selecciona una opción</option>
                        <option value="Demo">Solicitar Demostración</option>
                        <option value="Soporte">Soporte Técnico</option>
                        <option value="Ventas">Información de Planes</option>
                      </select>
                    </div>

                    <div className="landing-form-group" style={{ marginBottom: '2rem' }}>
                      <label className="landing-form-label">Mensaje</label>
                      <textarea 
                        name="Mensaje" 
                        rows="3" 
                        value={formData.Mensaje}
                        onChange={handleInputChange}
                        className="landing-form-input" 
                        placeholder="Escribe tu consulta..."
                        style={{ resize: 'none' }}
                      />
                    </div>

                    <button type="submit" disabled={loading} className="landing-btn-submit">
                      {loading ? (
                        <div className="loader" style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white' }}></div>
                      ) : (
                        <>
                          <span>Enviar Mensaje</span>
                          <Send size={16} />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 📢 CALL TO ACTION */}
        <section className="landing-cta-section">
          <h2 className="landing-cta-title">¿Listo para modernizar tu gestión de talento?</h2>
          <p className="landing-cta-desc">
            Obtén visibilidad completa, reduce el ausentismo y optimiza la planificación de tus turnos desde hoy.
          </p>
          <button onClick={onLoginClick} className="landing-btn-corporate" style={{ padding: '1.2rem 3rem' }}>
            <span>Comenzar Ahora</span>
            <ArrowRight size={20} />
          </button>
        </section>
      </main>

      {/* 👣 FOOTER */}
      <footer className="landing-footer">
        <div className="landing-footer-container">
          <div>
            <h3 className="landing-footer-brand-title">TalenHuman</h3>
            <p className="landing-footer-brand-desc">
              Plataforma SaaS líder para la planificación horaria, control de asistencia geocercada y gestión del talento operativo.
            </p>
            <div className="landing-footer-socials">
              <a href="https://wa.me/573000000000" target="_blank" rel="noreferrer" className="landing-footer-social-link whatsapp">
                <Phone size={20} />
              </a>
              <a href="mailto:soporte@talenhuman.com" className="landing-footer-social-link email">
                <Mail size={20} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="landing-footer-links-title">Contacto y Soporte</h4>
            <div className="landing-footer-links-item">
              <Phone size={14} />
              <span>+57 300 000 0000</span>
            </div>
            <div className="landing-footer-links-item">
              <Mail size={14} />
              <a href="mailto:soporte@talenhuman.com">soporte@talenhuman.com</a>
            </div>
            <div className="landing-footer-links-item">
              <Globe size={14} />
              <a href="https://talenhuman.com" target="_blank" rel="noreferrer">www.talenhuman.com</a>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div></div>
            <div className="landing-footer-copyright">
              <p>&copy; {new Date().getFullYear()} TalenHuman SaaS.</p>
              <p style={{ marginTop: '0.25rem', opacity: 0.7 }}>Todos los derechos reservados.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
