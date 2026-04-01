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
import { initializeFirebase } from './firebase';

import MobileLayout from './components/Layout/MobileLayout'
import EmployeeDashboard from './pages/Employee/EmployeeDashboard'
import InstallPWA from './components/PWA/InstallPWA'
import PrivacyConsentModal from './components/Legal/PrivacyConsentModal'

function App() {
  const [user, setUser] = React.useState(null);
  const [currentPage, setCurrentPage] = React.useState('Dashboard');
  const [authLoading, setAuthLoading] = React.useState(true);
  const [authView, setAuthView] = React.useState('login'); // 'login', 'forgot', 'reset'
  const [resetEmail, setResetEmail] = React.useState('');
  const [token, setToken] = React.useState(null); 
  const [deferredPrompt, setDeferredPrompt] = React.useState(null);
  const [isStandalone, setIsStandalone] = React.useState(false);

  // Global Role and Device Detection
  const isEmployee = user?.roleName === 'Employee' || 
                     user?.roles?.includes('Employee') || 
                     (user?.employeeId && user?.employeeId !== '00000000-0000-0000-0000-000000000000');

  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                        window.innerWidth < 1024;

  React.useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token'); 
    if (savedUser && storedToken) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setToken(storedToken); 
      initializeFirebase(userData);
    }
    setAuthLoading(false);

    const checkStandalone = () => {
      const isIOS = /iPad|iPhone|iPod/.test(window.navigator.userAgent) && !window.MSStream;
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                             (isIOS && window.navigator.standalone);
      setIsStandalone(!!isStandaloneMode);
    };

    checkStandalone();

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => setIsStandalone(true));

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleLogin = (userData, userToken) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userToken);
    setUser(userData);
    setToken(userToken);
    initializeFirebase(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 font-bold">Iniciando TalenHuman...</div>;

  if (!token) {
    if (authView === 'forgot') return <ForgotPassword onBack={() => setAuthView('login')} onNext={(em) => { setResetEmail(em); setAuthView('reset'); }} />;
    if (authView === 'reset') return <ResetForgottenPassword email={resetEmail} onBack={() => setAuthView('login')} />;
    if (authView === 'self-service') return <SelfServiceReset onBack={() => setAuthView('login')} />;
    return <Login onLogin={handleLogin} onForgotPassword={() => setAuthView('forgot')} onSelfServiceReset={() => setAuthView('self-service')} />;
  }

  if (user.mustChangePassword) {
    return <ResetPassword user={user} onPasswordChanged={(u) => setUser(u)} />;
  }

  const renderPage = () => {
    const isSuperAdmin = user.roles?.includes('SuperAdmin');
    const hasPerm = (module, sub = null, action = 'R') => {
      if (isSuperAdmin) return true;
      const isModuleActive = user.activeModules?.includes(module);
      if (!isModuleActive) return false;
      const granularKey = sub ? `${module}:${sub}` : module;
      const permItem = user.permissions?.find(p => p.startsWith(`${granularKey}:`));
      if (!permItem) return false;
      const allowedActions = permItem.split(':').pop();
      const actionCode = action.substring(0, 1).toUpperCase();
      return allowedActions.includes(actionCode);
    };

    if (isEmployee) {
      switch(currentPage) {
        case 'Turnos': return <ShiftScheduler user={user} isMobile />;
        case 'Marcaciones': return <Marcaciones user={user} isMobile />;
        case 'Notificaciones': return <NewsInbox user={user} isMobile />;
        case 'Perfil': return <EmployeeDashboard user={user} />;
        default: return <EmployeeDashboard user={user} />;
      }
    }

    switch(currentPage) {
      case 'Marcas': return hasPerm('CORE', 'BRANDS') ? <Brands user={user} /> : <Dashboard />;
      case 'Tiendas': return hasPerm('CORE', 'STORES') ? <Stores user={user} /> : <Dashboard />;
      case 'Ciudades': return hasPerm('CORE', 'CITIES') ? <Cities user={user} /> : <Dashboard />;
      case 'Distritos': return hasPerm('CORE', 'DISTRICTS') ? <Districts user={user} /> : <Dashboard />;
      case 'Cargos': return hasPerm('CORE', 'PROFILES') ? <Profiles user={user} /> : <Dashboard />;
      case 'Empleados': return hasPerm('CORE', 'EMPLOYEES') ? <Employees user={user} /> : <Dashboard />;
      case 'Jornadas': return hasPerm('CORE', 'SCHEDULES') ? <Jornadas user={user} /> : <Dashboard />;
      case 'Turnos': return hasPerm('OPERATIONS', 'SHIFTS') ? <ShiftScheduler user={user} /> : <Dashboard />;
      case 'Marcaciones': return hasPerm('OPERATIONS', 'RECORDS') ? <Marcaciones user={user} /> : <Dashboard />;
      case 'Novedades': return hasPerm('OPERATIONS', 'NOVELTIES') ? <NewsInbox user={user} /> : <Dashboard />;
      case 'Monitoreo Asistencia': return hasPerm('ADVANCED', 'MONITORING') ? <AttendanceMonitoring user={user} /> : <Dashboard />;
      case 'Configuración novedades': return hasPerm('ADVANCED', 'NOVELTY_CONFIG') ? <NewsDesigner user={user} /> : <Dashboard />;
      case 'Diseñador de Plantillas': return hasPerm('ADVANCED', 'TEMPLATES') ? <NewsTemplateDesigner user={user} /> : <Dashboard />;
      case 'Usuarios': return hasPerm('SYSTEM', 'USERS') ? <Users user={user} /> : <Dashboard />;
      case 'Empresas': return hasPerm('SYSTEM', 'COMPANIES') ? <Companies user={user} /> : <Dashboard />;
      case 'Permisos': return hasPerm('SYSTEM', 'PERMISSIONS') ? <ModulePermissions user={user} /> : <Dashboard />;
      case 'Configuración Sistema': return hasPerm('SYSTEM', 'SYSTEM_CONFIG') ? <SystemSettings user={user} /> : <Dashboard />;
      case 'Auditoría': return hasPerm('SYSTEM', 'AUDIT') ? <AuditLogs user={user} /> : <Dashboard />;
      default: return <Dashboard user={user} />;
    }
  };

  if (isEmployee) {
    if (!user.acceptedPrivacyPolicy) {
      return (
        <PrivacyConsentModal 
          onAccepted={(updatedUser) => setUser(updatedUser)} 
          onLogout={handleLogout}
          policyText={user.privacyPolicyText}
        />
      );
    }

    if (isMobileDevice && !isStandalone) {
      return <InstallPWA deferredPrompt={deferredPrompt} onLogout={handleLogout} />;
    }

    return (
      <MobileLayout activePage={currentPage} setPage={setCurrentPage} user={user} onLogout={handleLogout}>
        {renderPage()}
      </MobileLayout>
    );
  }

  return (
    <Layout activePage={currentPage} setPage={setCurrentPage} user={user} onLogout={handleLogout}>
      {renderPage()}
    </Layout>
  );
}

export default App;
