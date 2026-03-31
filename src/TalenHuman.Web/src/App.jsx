import React from 'react'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard'
import Brands from './pages/Core/Brands'
import Stores from './pages/Core/Stores'
import Profiles from './pages/Core/Profiles'
import Employees from './pages/Core/Employees'
import Users from './pages/SuperAdmin/Users'
import Companies from './pages/SuperAdmin/Companies'
import ResetPassword from './pages/ResetPassword'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetForgottenPassword from './pages/ResetForgottenPassword'
import SelfServiceReset from './pages/SelfServiceReset';
import Jornadas from './pages/Core/Jornadas';
import NewsInbox from './pages/News/NewsInbox';
import NewsDesigner from './pages/Admin/NewsDesigner';
import ShiftScheduler from './pages/Scheduling/ShiftScheduler';
import Marcaciones from './pages/Core/Marcaciones';
import AttendanceMonitoring from './pages/Core/AttendanceMonitoring';
import Cities from './pages/Core/Cities';
import Districts from './pages/Core/Districts';
import ModulePermissions from './pages/SuperAdmin/ModulePermissions';
import SystemSettings from './pages/SuperAdmin/SystemSettings';
import NewsTemplateDesigner from './pages/SuperAdmin/NewsTemplateDesigner';
import AuditLogs from './pages/Core/AuditLogs';

function App() {
  const [user, setUser] = React.useState(null);
  const [currentPage, setCurrentPage] = React.useState('Dashboard');
  const [authLoading, setAuthLoading] = React.useState(true);
  const [authView, setAuthView] = React.useState('login'); // 'login', 'forgot', 'reset'
  const [resetEmail, setResetEmail] = React.useState('');
  const [token, setToken] = React.useState(null); // Added token state

  React.useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token'); // Renamed to avoid conflict
    if (savedUser && storedToken) {
      setUser(JSON.parse(savedUser));
      setToken(storedToken); // Set token state
    }
    setAuthLoading(false);
  }, []);

  const handleLogin = (userData, userToken) => { // Modified handleLogin to accept token
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userToken);
    setUser(userData);
    setToken(userToken); // Set token state on login
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null); // Clear token state on logout
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 font-bold">Iniciando TalenHuman...</div>;

  if (!token) {
    if (authView === 'forgot') {
        return <ForgotPassword
          onBack={() => setAuthView('login')}
          onNext={(email) => {
            setResetEmail(email);
            setAuthView('reset');
          }}
        />;
    }
    if (authView === 'reset') {
        return <ResetForgottenPassword
          email={resetEmail}
          onBack={() => setAuthView('login')}
        />;
    }
    if (authView === 'self-service') {
      return <SelfServiceReset onBack={() => setAuthView('login')} />;
    }
    return (
      <Login
        onLogin={handleLogin}
        onForgotPassword={() => setAuthView('forgot')}
        onSelfServiceReset={() => setAuthView('self-service')}
      />
    );
  }

  if (user.mustChangePassword) {
    return <ResetPassword user={user} onPasswordChanged={(u) => setUser(u)} />;
  }

  const renderPage = () => {
    const isSuperAdmin = user.roles?.includes('SuperAdmin');
    
    const hasPerm = (module, action = 'Read') => {
      if (isSuperAdmin) return true;
      const isModuleActive = user.activeModules?.includes(module);
      if (!isModuleActive) return false;
      const modPerm = user.permissions?.find(p => p.startsWith(`${module}:`));
      if (!modPerm) return false;
      const allowedActions = modPerm.split(':')[1];
      const actionCode = action.substring(0, 1).toUpperCase();
      return allowedActions.includes(actionCode);
    };

    switch(currentPage) {
      case 'Marcas': 
        if (hasPerm('CORE')) return <Brands user={user} />;
        return <Dashboard />;
      case 'Tiendas': 
        if (hasPerm('CORE')) return <Stores user={user} />;
        return <Dashboard />;
      case 'Ciudades': 
        if (hasPerm('CORE')) return <Cities user={user} />;
        return <Dashboard />;
      case 'Distritos': 
        if (hasPerm('CORE')) return <Districts />;
        return <Dashboard />;
      case 'Cargos': 
        if (hasPerm('CORE')) return <Profiles user={user} />;
        return <Dashboard />;
      case 'Empleados': 
        if (hasPerm('CORE')) return <Employees user={user} />;
        return <Dashboard />;
      case 'Usuarios': 
        if (hasPerm('ADMIN')) return <Users />;
        return <Dashboard />;
      case 'Jornadas':
        if (hasPerm('CORE')) return <Jornadas />;
        return <Dashboard />;
      case 'Turnos': 
        if (hasPerm('ATTENDANCE')) return <ShiftScheduler user={user} />;
        return <Dashboard />;
      case 'Marcaciones': 
        if (hasPerm('ATTENDANCE')) return <Marcaciones user={user} />;
        return <Dashboard />;
      case 'Monitoreo Asistencia':
        if (hasPerm('ADMIN')) return <AttendanceMonitoring />;
        return <Dashboard />;
      case 'Novedades': 
        if (hasPerm('ATTENDANCE')) return <NewsInbox user={user} />;
        return <Dashboard />;
      case 'Configuración novedades':
        if (hasPerm('ADMIN')) return <NewsDesigner />;
        return <Dashboard />;
      case 'Empresas': 
        if (isSuperAdmin) return <Companies />;
        return <Dashboard />;
      case 'Permisos':
        if (isSuperAdmin) return <ModulePermissions />;
        return <Dashboard />;
      case 'Configuración Sistema':
        if (isSuperAdmin) return <SystemSettings />;
        return <Dashboard />;
      case 'Diseñador de Plantillas':
        if (isSuperAdmin) return <NewsTemplateDesigner />;
        return <Dashboard />;
      case 'Auditoría':
        if (hasPerm('ADMIN')) return <AuditLogs />;
        return <Dashboard />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout activePage={currentPage} setPage={setCurrentPage} user={user} onLogout={handleLogout}>
      {renderPage()}
    </Layout>
  )
}

export default App
