import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Clock, Calendar, FileText, Settings, 
  LogOut, Store, Sun, Moon, Pin, PinOff, ChevronLeft, ChevronRight,
  Briefcase, Boxes, Building, Link, ChevronDown, ChevronUp, User as UserIcon, MapPin, Cpu, Globe
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import SearchableSelect from '../Shared/SearchableSelect';

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
        { icon: <MapPin size={20} />, label: 'Ciudades', roles: ['SuperAdmin', 'Admin'] },
        { icon: <Briefcase size={20} />, label: 'Cargos', roles: ['SuperAdmin', 'Admin'] },
        { icon: <Calendar size={20} />, label: 'Jornadas', roles: ['SuperAdmin', 'Admin'] },
        { icon: <Building size={20} />, label: 'Distritos', roles: ['SuperAdmin', 'Admin'] },
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
        { icon: <Activity size={20} />, label: 'Monitoreo Asistencia', roles: ['SuperAdmin', 'Admin'] },
        { icon: <FileText size={20} />, label: 'Novedades' },
      ]
    },
    { 
      label: 'Administración', 
      isHeader: true,
      children: [
        { icon: <Settings size={20} />, label: 'Usuarios', roles: ['SuperAdmin', 'Admin'] },
        { icon: <FileText size={20} />, label: 'Configuración novedades', roles: ['SuperAdmin', 'Admin'] },
        { icon: <Globe size={20} />, label: 'Diseñador de Plantillas', roles: ['SuperAdmin'] },
        { icon: <Building size={20} />, label: 'Empresas', roles: ['SuperAdmin'] },
        { icon: <Cpu size={20} />, label: 'Configuración Sistema', roles: ['SuperAdmin'] },
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
      className={`nav-link-btn group ${activePage === item.label ? 'active bg-indigo-600/10 dark:bg-indigo-500/10 border-l-4 border-l-indigo-600 dark:border-l-indigo-400' : 'hover:bg-slate-800/50'}`}
      title={isCollapsed ? item.label : ''}
      style={{ 
        background: 'none', border: 'none', width: '100%', 
        display: 'flex', alignItems: 'center', gap: '0.75rem', 
        padding: isSubItem ? '0.6rem 1rem 0.6rem 2rem' : '0.85rem 1.25rem', 
        color: activePage === item.label ? '#fff' : '#94a3b8', cursor: 'pointer',
        borderRadius: '0 12px 12px 0', marginBottom: '0.25rem', textAlign: 'left',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        marginRight: '0.75rem'
      }}
    >
      <span className={`${activePage === item.label ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`}>{item.icon}</span>
      {!isCollapsed && <span style={{ fontWeight: activePage === item.label ? '700' : '500', fontSize: '0.875rem' }}>{item.label}</span>}
    </button>
  );

  return (
    <div 
      className={`sidebar border-r dark:border-slate-800 ${isCollapsed ? 'collapsed' : ''}`}
      style={{ background: '#0f172a' }}
      onMouseEnter={() => !isPinned && setIsCollapsed(false)}
      onMouseLeave={() => !isPinned && setIsCollapsed(true)}
    >
      <div className="brand" style={{ padding: '1.5rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
        <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)', padding: '0.6rem', borderRadius: '12px', minWidth: '42px', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }}>
          <Users size={22} color="white" />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col justify-center">
            <span style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'white' }}>TalenHuman</span>
          </div>
        )}
      </div>
      
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0 0' }}>
        {renderNavButton({ icon: <LayoutDashboard size={20} />, label: 'Dashboard' })}
        
        {filteredStructure.map((section, idx) => (
          <div key={idx} style={{ marginBottom: '1rem' }}>
            {!isCollapsed && (
              <div 
                onClick={() => toggleHeader(section.label)}
                style={{ 
                  fontSize: '0.65rem', textTransform: 'uppercase', color: '#475569', 
                  margin: '1.5rem 1.25rem 0.5rem 1.25rem', fontWeight: '800', trackingWidest: '0.1em',
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

      <div className="sidebar-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '1rem 0' }}>
        {isSuperAdmin && !isCollapsed && (
          <div style={{ padding: '0 1.25rem 1rem 1.25rem' }} className="dark">
            <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: '#64748b', marginBottom: '0.5rem', fontWeight: '800', trackingWidest: '0.05em' }}>Tenant Activo</p>
            <div className="p-0">
              <SearchableSelect
                options={companies}
                value={selectedTenant}
                onChange={(val) => onTenantChange({ target: { value: val } })}
                placeholder="CAMBIAR TENANT..."
                icon={Building}
              />
            </div>
          </div>
        )}
        
        <button 
          onClick={() => setIsPinned(!isPinned)} 
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1.25rem', width: '100%', fontSize: '0.85rem', fontWeight: '600' }}
          className="hover:bg-slate-800/50 transition-colors"
        >
          {isPinned ? <Pin size={18} className="text-indigo-400" /> : <PinOff size={18} />}
          {!isCollapsed && <span>{isPinned ? 'Desanclar Sidebar' : 'Anclar Sidebar'}</span>}
        </button>
        <button 
          onClick={onLogout}
          style={{ background: 'none', border: 'none', width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1.25rem', color: '#f87171', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}
          className="hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={18} />
          {!isCollapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );
};

const getPageInfo = (page) => {
  switch (page) {
    case 'Marcas': return { title: 'Marcas', subtitle: 'Catálogo corporativo de marcas y franquicias' };
    case 'Ciudades': return { title: 'Ciudades', subtitle: 'Configuración geográfica de sedes' };
    case 'Cargos': return { title: 'Cargos', subtitle: 'Definición de perfiles y funciones laborales' };
    case 'Distritos': return { title: 'Distritos', subtitle: 'Agrupación regional de sedes para supervisión' };
    case 'Tiendas': return { title: 'Tiendas', subtitle: 'Administración de sedes y sucursales' };
    case 'Jornadas': return { title: 'Jornadas', subtitle: 'Estándares de tiempo y programación' };
    case 'Empleados': return { title: 'Empleados', subtitle: 'Administración de nómina y ficha de colaboradores' };
    case 'Usuarios': return { title: 'Usuarios', subtitle: 'Administración de accesos y roles' };
    case 'Novedades': return { title: 'Bandeja de Novedades', subtitle: 'Trazabilidad y auditoría de solicitudes' };
    case 'Configuración novedades': return { title: 'Configuración novedades', subtitle: 'Configuración dinámica de tipos de novedad' };
    case 'Turnos': return { title: 'Turnos', subtitle: 'Programación inteligente y cobertura' };
    case 'Marcaciones': return { title: 'Asistencia', subtitle: 'Trazabilidad de ingresos y salidas' };
    case 'Monitoreo Asistencia': return { title: 'Monitoreo Asistencia', subtitle: 'Gestión de procesos y consolidación de datos' };
    case 'Empresas': return { title: 'Empresas', subtitle: 'Configuración de inquilinos corporativos' };
    case 'Configuración Sistema': return { title: 'Parámetros del Sistema', subtitle: 'Configuración de infraestructura y servicios core' };
    case 'Diseñador de Plantillas': return { title: 'Catálogo de Plantillas', subtitle: 'Diseño de novedades globales para el ecosistema' };
    default: return { title: page, subtitle: '' };
  }
};

import RealTimeClock from '../Shared/RealTimeClock';

const Header = ({ user, activePage, currentCompanyName, tenantSettings }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const showTenantInfo = !!user;
  const pageInfo = getPageInfo(activePage);

  return (
    <header className="header" style={{ padding: '0 2rem', display: 'flex', alignItems: 'center', minHeight: '90px', borderBottom: '1px solid var(--border)' }}>
      <div className="header-left" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <h1 className="text-3xl font-[1000] tracking-tighter animate-in slide-in-from-left-2" 
              style={{ margin: 0, lineHeight: 1, color: isDarkMode ? '#ffffff' : '#1e293b' }}>
            {activePage === 'Dashboard' 
              ? (currentCompanyName || 'Dashboard') 
              : pageInfo.title}
          </h1>
          {activePage !== 'Dashboard' && showTenantInfo && currentCompanyName && (
             <span className="text-sm font-black uppercase tracking-widest opacity-80 ml-1"
                   style={{ color: isDarkMode ? '#818cf8' : '#64748b' }}>
               @ {currentCompanyName}
             </span>
          )}
        </div>
        {pageInfo.subtitle && (
            <p className="text-xs font-black uppercase tracking-widest mt-2 ml-0.5"
               style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}>
              {pageInfo.subtitle}
            </p>
        )}
      </div>
      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {/* Elite V12 RealTime Clock & Flag Support */}
        {tenantSettings && (
          <RealTimeClock 
            countryCode={tenantSettings.countryCode} 
            timeZoneId={tenantSettings.timeZoneId} 
          />
        )}
        {user?.roles?.includes('Gerente') && user?.storeName && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '8px 16px', 
            background: isDarkMode ? 'rgba(79, 70, 229, 0.15)' : 'var(--bg-card)', 
            border: isDarkMode ? '1.5px solid rgba(79, 70, 229, 0.3)' : '1.5px solid var(--border)', 
            borderRadius: '14px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            <Store size={16} className="text-indigo-500 dark:text-indigo-400" />
            <span style={{ fontSize: '0.75rem', fontVariationSettings: '"wght" 900', fontWeight: '900', textTransform: 'uppercase', color: isDarkMode ? '#fff' : 'var(--text-main)', letterSpacing: '0.05em' }}>
              {user.storeExternalId ? `${user.storeExternalId} - ` : ''}{user.storeName}
            </span>
          </div>
        )}
        
        {user?.roles?.includes('Supervisor') && !user?.roles?.includes('Gerente') && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '8px 16px', 
            background: 'rgba(79, 70, 229, 0.1)', 
            border: '1.5px solid rgba(79, 70, 229, 0.2)', 
            borderRadius: '14px'
          }}>
            <Shield size={16} className="text-indigo-500" />
            <span style={{ fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase', color: 'var(--text-main)', letterSpacing: '0.02em' }}>
              Multisede • {user.storeIds?.length || 0} tiendas
            </span>
          </div>
        )}
        
        <button 
          onClick={toggleTheme}
          style={{ 
            background: 'var(--bg-card)', 
            border: '1.5px solid var(--border)', 
            borderRadius: '14px', 
            width: '44px',
            height: '44px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-main)',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          className="hover:scale-110 active:scale-95 hover:border-indigo-400"
          title={isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
        >
          {isDarkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-slate-600" />}
        </button>

        <div style={{ height: '32px', width: '1.5px', background: 'var(--border)', opacity: 0.5 }}></div>

        <div className="flex items-center gap-4">
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '900', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>{user?.fullName || 'Perfil'}</div>
              <div style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', trackingWidest: '0.05em' }}>{user?.roles?.join(' • ')}</div>
            </div>
            <div style={{ width: '46px', height: '46px', background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(79, 70, 229, 0.25)', border: '2px solid white' }} className="dark:border-slate-800">
              <UserIcon size={22} color="white" />
            </div>
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
    
    window.addEventListener('tenantSettingsUpdated', fetchCompanies);
    return () => window.removeEventListener('tenantSettingsUpdated', fetchCompanies);
  }, [isSuperAdmin]);

  const handleTenantChange = (e) => {
    const newId = e.target.value;
    setSelectedTenant(newId);
    localStorage.setItem('tenantId', newId);
    window.location.reload();
  };

  const effectiveTenantId = selectedTenant || user?.companyId;
  const currentCompany = companies.find(c => 
    c.id?.toString().toLowerCase() === effectiveTenantId?.toString().toLowerCase()
  );
  
  const currentCompanyName = currentCompany?.name || user?.companyName;
  const tenantSettings = currentCompany ? {
    countryCode: currentCompany.countryCode || 'CO',
    timeZoneId: currentCompany.timeZoneId || 'America/Bogota'
  } : user?.companyId ? { 
    countryCode: user.countryCode || 'CO', 
    timeZoneId: user.timeZoneId || 'America/Bogota' 
  } : null;

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
        <Header 
          user={user} 
          activePage={activePage} 
          currentCompanyName={currentCompanyName} 
          tenantSettings={tenantSettings}
        />
        <main className="content-body" style={{ flex: 1 }}>
          {React.Children.map(children, child => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, { tenantSettings });
            }
            return child;
          })}
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
