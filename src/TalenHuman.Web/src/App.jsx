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

// V12.5.7-STABLE - ABSOLUTE ENFORCEMENT & UI RESTORATION
const APP_VERSION = "Elite-V12.5.7-STABLE";

function App() {
  const [user, setUser] = React.useState(null);
  const [currentPage, setCurrentPage] = React.useState('Dashboard');
  const [authLoading, setAuthLoading] = React.useState(true);
  const [authView, setAuthView] = React.useState('login'); 
  const [resetEmail, setResetEmail] = React.useState('');
  const [token, setToken] = React.useState(null); 
  const [deferredPrompt, setDeferredPrompt] = React.useState(null);
  const [isStandalone, setIsStandalone] = React.useState(false);

  // UNIVERSAL EMPLOYEE DETECTION - Case Insensitive & ID Based
  const isEmployee = user?.roleName?.toLowerCase() === 'employee' || 
                     user?.roles?.some(r => r.toLowerCase() === 'employee') || 
                     (user?.employeeId && user?.employeeId !== '00000000-0000-0000-0000-000000000000');

  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                        window.innerWidth < 1024;

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setToken(null);
    window.location.replace('/');
  };

  React.useEffect(() => {
    // 1. VERSION CONTROL
    const storedVersion = localStorage.getItem('app_version');
    if (!storedVersion || storedVersion !== APP_VERSION) {
      localStorage.clear();
      localStorage.setItem('app_version', APP_VERSION);
      window.location.replace('/');
      return;
    }

    const savedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token'); 
    
    if (savedUser && storedToken) {
      try {
        const userData = JSON.parse(savedUser);
        
        // 2. STALE SESSION PREVENTION
        if (!userData || (!userData.roles && !userData.employeeId)) {
          handleLogout();
          return;
        }

        setUser(userData);
        setToken(storedToken); 
        initializeFirebase(userData);
      } catch (e) {
        handleLogout();
        return;
      }
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
    localStorage.setItem('app_version', APP_VERSION);
    setUser(userData);
    setToken(userToken);
    initializeFirebase(userData);
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 font-bold">TalenHuman Elite {APP_VERSION}</div>;

  if (!token) {
    return <Login onLogin={handleLogin} onForgotPassword={() => setAuthView('forgot')} onSelfServiceReset={() => setAuthView('self-service')} version={APP_VERSION} />;
  }

  const renderPage = () => {
    if (isEmployee) {
      switch(currentPage) {
        case 'Turnos': return <ShiftScheduler user={user} isMobile />;
        case 'Marcaciones': return <Marcaciones user={user} isMobile />;
        case 'Notificaciones': return <NewsInbox user={user} isMobile />;
        default: return <EmployeeDashboard user={user} />;
      }
    }

    const isSuperAdmin = user.roles?.includes('SuperAdmin');
    const hasPerm = (module, sub = null, action = 'R') => {
      if (isSuperAdmin) return true;
      const granularKey = sub ? `${module}:${sub}` : module;
      const permItem = user.permissions?.find(p => p.startsWith(`${granularKey}:`));
      if (!permItem) return false;
      const allowedActions = permItem.split(':').pop();
      return allowedActions.includes(action.substring(0, 1).toUpperCase());
    };

    switch(currentPage) {
      case 'Marcas': return hasPerm('CORE', 'BRANDS') ? <Brands user={user} /> : <Dashboard />;
      case 'Tiendas': return hasPerm('CORE', 'STORES') ? <Stores user={user} /> : <Dashboard />;
      case 'Ciudades': return hasPerm('CORE', 'CITIES') ? <Cities user={user} /> : <Dashboard />;
      case 'Distritos': return hasPerm('CORE', 'DISTRICTS') ? <Districts user={user} /> : <Dashboard />;
      case 'Empleados': return hasPerm('CORE', 'EMPLOYEES') ? <Employees user={user} /> : <Dashboard />;
      case 'Turnos': return <ShiftScheduler user={user} />;
      case 'Marcaciones': return <Marcaciones user={user} />;
      default: return <Dashboard user={user} />;
    }
  };

  if (isEmployee || isMobileDevice) {
    if (!user.acceptedPrivacyPolicy) {
      return <PrivacyConsentModal onAccepted={(u) => setUser(u)} onLogout={handleLogout} policyText={user.privacyPolicyText} />;
    }
    if (isMobileDevice && !isStandalone) {
      return <InstallPWA onLogout={handleLogout} version={APP_VERSION} />;
    }
    return <MobileLayout activePage={currentPage} setPage={setCurrentPage} user={user} onLogout={handleLogout} version={APP_VERSION}>{renderPage()}</MobileLayout>;
  }

  return <Layout activePage={currentPage} setPage={setCurrentPage} user={user} onLogout={handleLogout} version={APP_VERSION}>{renderPage()}</Layout>;
}

export default App;
