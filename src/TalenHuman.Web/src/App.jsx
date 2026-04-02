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
import BiometricEnrollModal from './components/Biometrics/BiometricEnrollModal'

// Mobile Native Views
import MobileDashboard from './pages/Mobile/MobileDashboard'
import MobileAttendance from './pages/Mobile/MobileAttendance'

// V12.8.7-FINAL-STABLE - TOTAL TRANSFORMATION
const APP_VERSION = "V16.7.2-ELITE";

function App() {
  const [user, setUser] = React.useState(null);
  const [currentPage, setCurrentPage] = React.useState('Dashboard');
  const [authLoading, setAuthLoading] = React.useState(true);
  const [authView, setAuthView] = React.useState('login'); 
  const [token, setToken] = React.useState(null); 
  const [isStandalone, setIsStandalone] = React.useState(false);
  const [biometricsDismissed, setBiometricsDismissed] = React.useState(false);

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
  }, []);

  const handleLogin = (userData, userToken) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userToken);
    localStorage.setItem('app_version', APP_VERSION);
    setUser(userData);
    setToken(userToken);
    initializeFirebase(userData);
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-blue-600 font-bold text-white">TalenHuman {APP_VERSION}</div>;

  if (!token) {
    return <Login onLogin={handleLogin} version={APP_VERSION} onForgotPassword={() => {}} onSelfServiceReset={() => {}} />;
  }

  const renderPage = () => {
    // 📱 NATIVE MOBILE ROUTING (PWA / Mobile)
    if (isMobileDevice) {
      switch(currentPage) {
        case 'Turnos': return <ShiftScheduler user={user} isMobile />;
        case 'Marcaciones': return <MobileAttendance user={user} isMobile />;
        case 'Notificaciones': return <NewsInbox user={user} isMobile />;
        default: return <MobileDashboard user={user} />;
      }
    }

    if (isEmployee) {
      switch(currentPage) {
        case 'Turnos': return <ShiftScheduler user={user} isMobile />;
        case 'Marcaciones': return <Marcaciones user={user} isMobile />;
        case 'Notificaciones': return <NewsInbox user={user} isMobile />;
        default: return <EmployeeDashboard user={user} />;
      }
    }

    switch(currentPage) {
      case 'Marcas': return <Brands user={user} />;
      case 'Ciudades': return <Cities user={user} />;
      case 'Cargos': return <Profiles user={user} />;
      case 'Distritos': return <Districts user={user} />;
      case 'Tiendas': return <Stores user={user} />;
      case 'Jornadas': return <Jornadas user={user} />;
      case 'Empleados': return <Employees user={user} />;
      case 'Turnos': return <ShiftScheduler user={user} />;
      case 'Marcaciones': return <Marcaciones user={user} />;
      case 'Novedades': return <NewsInbox user={user} />;
      case 'Configuración novedades': return <NewsTemplateDesigner user={user} />;
      case 'Diseñador de Plantillas': return <NewsDesigner user={user} />;
      case 'Monitoreo Asistencia': return <AttendanceMonitoring user={user} />;
      case 'Usuarios': return <Users user={user} />;
      case 'Permisos': return <ModulePermissions user={user} />;
      case 'Auditoría': return <AuditLogs user={user} />;
      case 'Empresas': return <Companies user={user} />;
      case 'Configuración Sistema': return <SystemSettings user={user} />;
      default: return <Dashboard user={user} />;
    }
  };

  // ✅ FINAL STABLE SEQUENTIAL FLOW
  if (isEmployee || isMobileDevice) {
    // 1. Force Install first
    if (isMobileDevice && !isStandalone) {
      return <InstallPWA onLogout={handleLogout} version={APP_VERSION} />;
    }

    // 2. Once in PWA, enforce Privacy
    if (!user.acceptedPrivacyPolicy) {
      return <PrivacyConsentModal onAccepted={(u) => setUser(u)} onLogout={handleLogout} policyText={user.privacyPolicyText} />;
    }

    // 3. Once Privacy is done, suggest Biometrics inside PWA
    if (isStandalone && !user.biometricsEnrolled && !biometricsDismissed) {
      return (
        <BiometricEnrollModal 
          onComplete={() => {
            const newUser = { ...user, biometricsEnrolled: true };
            localStorage.setItem('user', JSON.stringify(newUser));
            setUser(newUser);
          }} 
          onCancel={() => setBiometricsDismissed(true)} 
        />
      );
    }

    return <MobileLayout activePage={currentPage} setPage={setCurrentPage} user={user} onLogout={handleLogout} version={APP_VERSION}>{renderPage()}</MobileLayout>;
  }

  return <Layout activePage={currentPage} setPage={setCurrentPage} user={user} onLogout={handleLogout} version={APP_VERSION}>{renderPage()}</Layout>;
}

export default App;
