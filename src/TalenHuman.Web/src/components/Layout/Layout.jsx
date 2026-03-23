import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Clock, Calendar, FileText, Settings, 
  LogOut, Store, Sun, Moon, Pin, PinOff, ChevronLeft, ChevronRight,
  Briefcase, Boxes, Building, Link, ChevronDown, ChevronUp
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

const Sidebar = ({ isCollapsed, setIsCollapsed, isPinned, setIsPinned, activePage, setPage, onLogout, user, companies, selectedTenant, onTenantChange }) => {
  const isSuperAdmin = user?.roles?.includes('SuperAdmin');
  const [expandedHeaders, setExpandedHeaders] = useState(['Configuración Core', 'Operaciones', 'Administración']);

  const toggleHeader = (label) => {
    setExpandedHeaders(prev => 
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };
  
  const menuStructure = [
    { 
      label: 'Configuración Core', 
      isHeader: true,
      children: [
        { icon: <Boxes size={20} />, label: 'Marcas', roles: ['SuperAdmin', 'Admin'] },
        { icon: <Briefcase size={20} />, label: 'Cargos', roles: ['SuperAdmin', 'Admin'] },
        { icon: <Store size={20} />, label: 'Tiendas', roles: ['SuperAdmin', 'Admin'] },
        { icon: <Users size={20} />, label: 'Empleados' },
      ]
    },
    { 
      label: 'Operaciones', 
      isHeader: true,
      children: [
        { icon: <Calendar size={20} />, label: 'Turnos' },
        { icon: <Clock size={20} />, label: 'Marcaciones' },
        { icon: <FileText size={20} />, label: 'Novedades' },
      ]
    },
    { 
      label: 'Administración', 
      isHeader: true,
      children: [
        { icon: <Settings size={20} />, label: 'Usuarios', roles: ['SuperAdmin', 'Admin'] },
        { icon: <Building size={20} />, label: 'Empresas', roles: ['SuperAdmin'] },
      ]
    },
  ];

  const filteredStructure = menuStructure.map(section => ({
    ...section,
    children: section.children.filter(item => {
      if (!item.roles) return true;
      return item.roles.some(r => user?.roles?.includes(r));
    })
  })).filter(section => section.children.length > 0);

  const renderNavButton = (item, isSubItem = false) => (
    <button 
      key={item.label} 
      onClick={() => setPage(item.label)}
      className={`nav-link-btn ${activePage === item.label ? 'active' : ''}`}
      title={isCollapsed ? item.label : ''}
      style={{ 
        background: 'none', border: 'none', width: '100%', 
        display: 'flex', alignItems: 'center', gap: '0.75rem', 
        padding: isSubItem ? '0.6rem 1rem 0.6rem 2rem' : '0.75rem 1rem', 
        color: '#9ca3af', cursor: 'pointer',
        borderRadius: '8px', marginBottom: '0.25rem', textAlign: 'left',
        transition: 'all 0.2s'
      }}
    >
      <span className={activePage === item.label ? 'text-white' : ''}>{item.icon}</span>
      {!isCollapsed && <span style={{ color: activePage === item.label ? 'white' : 'inherit' }}>{item.label}</span>}
    </button>
  );

  return (
    <div 
      className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}
      onMouseEnter={() => !isPinned && setIsCollapsed(false)}
      onMouseLeave={() => !isPinned && setIsCollapsed(true)}
    >
      <div className="brand" style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
        <div style={{ background: 'var(--primary)', padding: '0.5rem', borderRadius: '8px', minWidth: '40px' }}>
          <Users size={24} color="white" />
        </div>
        {!isCollapsed && <span style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.5px', color: 'white' }}>TalenHuman</span>}
      </div>
      
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0 0.5rem' }}>
        {renderNavButton({ icon: <LayoutDashboard size={20} />, label: 'Dashboard' })}
        
        {filteredStructure.map((section, idx) => (
          <div key={idx} style={{ marginBottom: '0.5rem' }}>
            {!isCollapsed && (
              <div 
                onClick={() => toggleHeader(section.label)}
                style={{ 
                  fontSize: '0.7rem', textTransform: 'uppercase', color: '#4b5563', 
                  margin: '1.25rem 0.5rem 0.5rem 0.5rem', fontWeight: '700',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer', userSelect: 'none'
                }}
              >
                <span>{section.label}</span>
                {expandedHeaders.includes(section.label) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </div>
            )}
            
            {(isCollapsed || expandedHeaders.includes(section.label)) && (
              <div className="section-content">
                {section.children.map(item => renderNavButton(item, !isCollapsed))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', paddingBottom: '1rem' }}>
        {isSuperAdmin && !isCollapsed && (
          <div style={{ padding: '0 1rem 1rem 1rem' }}>
            <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#4b5563', marginBottom: '0.5rem', fontWeight: '700' }}>Empresa Actual</p>
            <select 
              value={selectedTenant}
              onChange={onTenantChange}
              style={{ 
                width: '100%',
                background: '#1f2937', 
                border: '1px solid #374151', 
                borderRadius: '8px', 
                padding: '0.6rem 0.75rem', 
                fontSize: '0.8rem',
                color: 'white',
                outline: 'none',
                cursor: 'pointer',
                marginTop: '0.25rem'
              }}
            >
              {companies.map(c => <option key={c.id} value={c.id} style={{ color: 'black' }}>{c.name}</option>)}
            </select>
          </div>
        )}
        
        <button 
          onClick={() => setIsPinned(!isPinned)} 
          style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%' }}
        >
          {isPinned ? <Pin size={20} /> : <PinOff size={20} />}
          {!isCollapsed && <span>{isPinned ? 'Desanclar' : 'Anclar'}</span>}
        </button>
        <button 
          onClick={onLogout}
          className="nav-link-btn" style={{ background: 'none', border: 'none', width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', color: '#9ca3af', cursor: 'pointer' }}>
          <LogOut size={20} />
          {!isCollapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );
};

const getPageInfo = (page) => {
  switch (page) {
    case 'Marcas': return { title: 'Marcas', subtitle: 'Administra las marcas comerciales registradas en este tenant' };
    case 'Cargos': return { title: 'Cargos', subtitle: 'Define la estructura jerárquica y perfiles de cargo laborales' };
    case 'Tiendas': return { title: 'Tiendas', subtitle: 'Gestiona los puntos de venta físicos y su ubicación logística' };
    case 'Empleados': return { title: 'Colaboradores', subtitle: 'Gestión de personal, perfiles de acceso y vinculación a sedes' };
    case 'Usuarios': return { title: 'Gestión de Usuarios', subtitle: 'Administración global de accesos, roles y estados de cuenta' };
    default: return { title: page, subtitle: '' };
  }
};

const Header = ({ user, activePage, currentCompanyName }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  // Show tenant info for SuperAdmin or any other administrative/tenant level role
  const showTenantInfo = !!user;

  const pageInfo = getPageInfo(activePage);

  return (
    <header className="header" style={{ padding: '0 1.5rem', display: 'flex', alignItems: 'center', minHeight: '80px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
      <div className="header-left" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800" style={{ margin: 0, lineHeight: 1.2 }}>
            {activePage === 'Dashboard' 
              ? (currentCompanyName || 'Panel de Control') 
              : pageInfo.title}
          </h1>
          {activePage !== 'Dashboard' && showTenantInfo && currentCompanyName && (
            <span className="text-xs text-slate-500 font-bold px-2 py-0.5 bg-slate-100 rounded-md uppercase tracking-wider">
              @ {currentCompanyName}
            </span>
          )}
        </div>
        {pageInfo.subtitle && (
            <p className="text-sm text-slate-500 font-medium" style={{ margin: '0.15rem 0 0 0' }}>{pageInfo.subtitle}</p>
        )}
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
          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>{user?.fullName || 'Usuario'}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user?.roles?.join(', ')}</div>
        </div>
        <div style={{ width: '38px', height: '38px', background: 'var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)' }}>
          <Users size={18} color="white" />
        </div>
      </div>
    </header>
  );
};

const Layout = ({ children, activePage, setPage, user, onLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPinned, setIsPinned] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(localStorage.getItem('tenantId') || '');
  const isSuperAdmin = user?.roles?.includes('SuperAdmin');

  useEffect(() => {
    const fetchCompanies = async () => {
      if (!isSuperAdmin) return;
      try {
        const response = await api.get('/companies');
        setCompanies(response.data);
        const storedId = localStorage.getItem('tenantId');
        
        if (storedId) {
            setSelectedTenant(storedId);
        } else if (response.data.length > 0) {
            const firstId = response.data[0].id;
            setSelectedTenant(firstId);
            localStorage.setItem('tenantId', firstId);
        }
      } catch (error) {
        console.error('Error fetching companies', error);
      }
    };
    fetchCompanies();
  }, []);

  const handleTenantChange = (e) => {
    const newId = e.target.value;
    setSelectedTenant(newId);
    localStorage.setItem('tenantId', newId);
    window.location.reload();
  };

  const effectiveTenantId = selectedTenant || user?.companyId;
  const currentCompanyName = companies.find(c => 
    c.id?.toString().toLowerCase() === effectiveTenantId?.toString().toLowerCase()
  )?.name || user?.companyName;

  return (
    <div className="app-container">
      <Sidebar 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed}
        isPinned={isPinned}
        setIsPinned={setIsPinned}
        activePage={activePage}
        setPage={setPage}
        onLogout={onLogout}
        user={user}
        companies={companies}
        selectedTenant={selectedTenant}
        onTenantChange={handleTenantChange}
      />
      <div className="main-content">
        <Header user={user} activePage={activePage} currentCompanyName={currentCompanyName} />
        <main className="content-body" style={{ flex: 1 }}>
          {children}
        </main>
        <footer className="main-footer" style={{ 
            padding: '1.5rem', 
            borderTop: '1px solid var(--border)', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            marginTop: 'auto'
        }}>
            <div>
                <strong>TalenHuman</strong> &copy; {new Date().getFullYear()} - Gestión de Capital Humano
            </div>
            {currentCompanyName && (
                <div style={{ fontWeight: '600', color: 'var(--primary)' }}>
                    {currentCompanyName}
                </div>
            )}
        </footer>
      </div>
    </div>
  );
};

export default Layout;
