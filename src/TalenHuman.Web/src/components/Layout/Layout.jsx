import React from 'react';
import { LayoutDashboard, Users, Clock, Calendar, FileText, Settings, LogOut, Store } from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', active: true },
    { icon: <Store size={20} />, label: 'Tiendas' },
    { icon: <Users size={20} />, label: 'Empleados' },
    { icon: <Calendar size={20} />, label: 'Turnos' },
    { icon: <Clock size={20} />, label: 'Marcaciones' },
    { icon: <FileText size={20} />, label: 'Novedades' },
    { icon: <Settings size={20} />, label: 'Configuración' },
  ];

  return (
    <div className="sidebar">
      <div className="brand" style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ background: 'var(--primary)', padding: '0.5rem', borderRadius: '8px' }}>
          <Store size={28} color="white" />
        </div>
        <span style={{ fontSize: '1.5rem', fontWeight: '700', letterSpacing: '-0.5px' }}>HumanCore</span>
      </div>
      
      <nav style={{ flex: 1 }}>
        {menuItems.map((item, idx) => (
          <a key={idx} href="#" className={`nav-link ${item.active ? 'active' : ''}`}>
            {item.icon}
            <span>{item.label}</span>
          </a>
        ))}
      </nav>

      <div className="sidebar-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
        <a href="#" className="nav-link">
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </a>
      </div>
    </div>
  );
};

const Header = () => {
  return (
    <header className="header">
      <div className="header-left">
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Panel de Control</h2>
      </div>
      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>Tito Alejandro</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gerente General</div>
        </div>
        <div style={{ width: '40px', height: '40px', background: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
          <Users size={20} color="#64748b" />
        </div>
      </div>
    </header>
  );
};

const Layout = ({ children }) => {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Header />
        <main className="content-body">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
