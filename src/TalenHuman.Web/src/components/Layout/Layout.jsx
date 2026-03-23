import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, Clock, Calendar, FileText, Settings, 
  LogOut, Store, Sun, Moon, Pin, PinOff, ChevronLeft, ChevronRight,
  Briefcase, Boxes
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const Sidebar = ({ isCollapsed, setIsCollapsed, isPinned, setIsPinned, activePage, setPage }) => {
  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { 
      label: 'Configuración Core', 
      isHeader: true 
    },
    { icon: <Boxes size={20} />, label: 'Marcas' },
    { icon: <Store size={20} />, label: 'Tiendas' },
    { icon: <Briefcase size={20} />, label: 'Cargos' },
    { icon: <Users size={20} />, label: 'Empleados' },
    { 
      label: 'Operaciones', 
      isHeader: true 
    },
    { icon: <Calendar size={20} />, label: 'Turnos' },
    { icon: <Clock size={20} />, label: 'Marcaciones' },
    { icon: <FileText size={20} />, label: 'Novedades' },
  ];

  return (
    <div 
      className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}
      onMouseEnter={() => !isPinned && setIsCollapsed(false)}
      onMouseLeave={() => !isPinned && setIsCollapsed(true)}
    >
      <div className="brand" style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
        <div style={{ background: 'var(--primary)', padding: '0.5rem', borderRadius: '8px', minWidth: '40px' }}>
          <Store size={24} color="white" />
        </div>
        {!isCollapsed && <span style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.5px', color: 'white' }}>TalenHuman</span>}
      </div>
      
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {menuItems.map((item, idx) => (
          item.isHeader ? (
            !isCollapsed && <div key={idx} style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#4b5563', margin: '1.5rem 0 0.5rem 1rem', fontWeight: '700' }}>{item.label}</div>
          ) : (
            <button 
              key={idx} 
              onClick={() => setPage(item.label)}
              className={`nav-link-btn ${activePage === item.label ? 'active' : ''}`}
              title={isCollapsed ? item.label : ''}
              style={{ 
                background: 'none', border: 'none', width: '100%', 
                display: 'flex', alignItems: 'center', gap: '0.75rem', 
                padding: '0.75rem 1rem', color: '#9ca3af', cursor: 'pointer',
                borderRadius: '8px', marginBottom: '0.25rem', textAlign: 'left'
              }}
            >
              <span className={activePage === item.label ? 'text-white' : ''}>{item.icon}</span>
              {!isCollapsed && <span style={{ color: activePage === item.label ? 'white' : 'inherit' }}>{item.label}</span>}
            </button>
          )
        ))}
      </nav>

      <div className="sidebar-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
        <button 
          onClick={() => setIsPinned(!isPinned)} 
          style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%' }}
        >
          {isPinned ? <Pin size={20} /> : <PinOff size={20} />}
          {!isCollapsed && <span>{isPinned ? 'Desanclar' : 'Anclar'}</span>}
        </button>
        <button className="nav-link-btn" style={{ background: 'none', border: 'none', width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', color: '#9ca3af', cursor: 'pointer' }}>
          <LogOut size={20} />
          {!isCollapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );
};

const Header = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  // Mock companies for tenant switcher
  const companies = [
    { id: '1', name: 'TalenHuman Corp' },
    { id: '2', name: 'RestoBar Group' }
  ];

  return (
    <header className="header" style={{ padding: '0 1.5rem' }}>
      <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-main)' }}>Panel de Control</h2>
        
        {/* Tenant Switcher */}
        <select 
          style={{ 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border)', 
            borderRadius: '8px', 
            padding: '0.4rem 0.75rem', 
            fontSize: '0.85rem',
            color: 'var(--text-main)',
            outline: 'none'
          }}
        >
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <button 
          onClick={toggleTheme}
          style={{ 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border)', 
            borderRadius: '10px', 
            padding: '0.5rem', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            color: 'var(--text-main)',
            boxShadow: 'var(--shadow-sm)'
          }}
          title={isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div style={{ height: '24px', width: '1px', background: 'var(--border)' }}></div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>Tito Alejandro</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Gerente General</div>
        </div>
        <div style={{ width: '38px', height: '38px', background: 'var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)' }}>
          <Users size={18} color="white" />
        </div>
      </div>
    </header>
  );
};

const Layout = ({ children, activePage, setPage }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPinned, setIsPinned] = useState(true);

  return (
    <div className="app-container">
      <Sidebar 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed}
        isPinned={isPinned}
        setIsPinned={setIsPinned}
        activePage={activePage}
        setPage={setPage}
      />
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
