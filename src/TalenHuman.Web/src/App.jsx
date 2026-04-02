import React, { useState, useEffect } from 'react'
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
import MobileProfile from './pages/Mobile/MobileProfile'

// V16.7.8-NATIVE-STABLE
// V40-RADICAL-FIX-FINAL
const APP_VERSION = "V40-RADICAL-FIX-FINAL";

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    if (!saved) return null;
    try { return JSON.parse(saved); } catch { return null; }
  });
  
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [currentPage, setCurrentPage] = useState('Dashboard');
  
  // 🚀 ANTI-FLICKER BOOTLOADER STATE
  const [booting, setBooting] = useState(true); 
  const [isStandalone, setIsStandalone] = useState(() => {
     const isIOS = /iPad|iPhone|iPod/.test(window.navigator.userAgent) && !window.MSStream;
     const isStand = window.matchMedia('(display-mode: standalone)').matches || (isIOS && window.navigator.standalone);
     const isUrlPWA = window.location.search.includes('source=pwa');
     return !!(isStand || isUrlPWA);
  });
  
  const [biometricsDismissed, setBiometricsDismissed] = useState(() => {
     // 🚀 V24 HARDENED DISMISSAL: Higher authority than pure state
     return localStorage.getItem('biometricsDismissed') === 'true' || 
            sessionStorage.getItem('session_biometric_dismissed_v24') === 'true';
  });

  const isEmployee = user?.roleName?.toLowerCase() === 'employee' || 
                     user?.roles?.some(r => r.toLowerCase() === 'employee') || 
                     (user?.employeeId && user?.employeeId !== '00000000-0000-0000-0000-000000000000');

  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                        window.innerWidth < 1024;

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace('/');
  };

  useEffect(() => {
    // 1. Version Update & Cache Busting
    localStorage.setItem('app_version', APP_VERSION);
    
    // 2. Firebase Init
    if (user && token) {
        initializeFirebase(user);
    }
    
    setTimeout(() => setBooting(false), 500);
  }, []);

  const handleLogin = (userData, userToken) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userToken);
    localStorage.setItem('app_version', APP_VERSION);
    setUser(userData);
    setToken(userToken);
    initializeFirebase(userData);
  };

  const handleDismissBiometrics = () => {
     localStorage.setItem('biometricsDismissed', 'true');
     sessionStorage.setItem('session_biometric_dismissed_v24', 'true');
     setBiometricsDismissed(true);
  };

  // 🛡️ CLEAN BOOTLOADER
  if (booting) {
    return (
      <div style={{
          minHeight: '100dvh', background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white'
      }}>
         <div className="clean-pulse-loader" style={{ 
            width: '100px', height: '100px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', 
            borderRadius: '30px', border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
         }}>
             <span style={{ fontSize: '42px', fontWeight: '900', fontStyle: 'italic', letterSpacing: '-3px' }}>TH</span>
         </div>
         <style>{`
            .clean-pulse-loader { animation: clean-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
            @keyframes clean-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .7; transform: scale(0.95); } }
         `}</style>
      </div>
    );
  }

  // 4. Auth Gate
  if (!token) {
    return <Login onLogin={handleLogin} version={APP_VERSION} onForgotPassword={() => {}} onSelfServiceReset={() => {}} />;
  }

  const renderPage = () => {
    if (isMobileDevice) {
      switch(currentPage) {
        case 'Turnos': return <ShiftScheduler user={user} isMobile />;
        case 'Marcaciones': return <MobileAttendance user={user} isMobile />;
        case 'Notificaciones': return <NewsInbox user={user} isMobile />;
        case 'Perfil': return <MobileProfile user={user} />;
        default: return <MobileDashboard user={user} />;
      }
    }
    const pages = {
        'Marcas': Brands, 'Ciudades': Cities, 'Cargos': Profiles, 'Distritos': Districts,
        'Tiendas': Stores, 'Jornadas': Jornadas, 'Empleados': Employees, 'Turnos': ShiftScheduler,
        'Marcaciones': Marcaciones, 'Novedades': NewsInbox, 'Configuración novedades': NewsTemplateDesigner,
        'Diseñador de Plantillas': NewsDesigner, 'Monitoreo Asistencia': AttendanceMonitoring,
        'Usuarios': Users, 'Permisos': ModulePermissions, 'Auditoría': AuditLogs,
        'Empresas': Companies, 'Configuración Sistema': SystemSettings
    };
    const Component = pages[currentPage] || Dashboard;
    return <Component user={user} isMobile={isEmployee} />;
  };

  // 🛡️ THE GATEKEEPER SEQUENCE V25 - ONLY FOR EMPLOYEES
  if (isEmployee && isMobileDevice && !isStandalone) {
     return <InstallPWA onLogout={handleLogout} version={APP_VERSION} />;
  }

  const isManager = user?.roleName?.toLowerCase() === 'manager' || user?.roleName?.toLowerCase() === 'gerente';
  const shouldForcePrivacy = !user.acceptedPrivacyPolicy && (isEmployee || (isMobileDevice && !isManager));

  if (shouldForcePrivacy) {
    return <PrivacyConsentModal onAccepted={(u) => setUser(u)} onLogout={handleLogout} policyText={user.privacyPolicyText} />;
  }

  // 🚀 BIOMETRIC GATE: Hardened logic to prevent loops
  if (isStandalone && !user.biometricsEnrolled && !biometricsDismissed) {
    return (
      <BiometricEnrollModal 
        onComplete={() => {
          const newUser = { ...user, biometricsEnrolled: true };
          localStorage.setItem('user', JSON.stringify(newUser));
          setUser(newUser);
        }} 
        onCancel={handleDismissBiometrics} 
      />
    );
  }

  // Final Native Application Shell
  if (isEmployee || isMobileDevice) {
    return <MobileLayout activePage={currentPage} setPage={setCurrentPage} user={user} onLogout={handleLogout} version={APP_VERSION}>{renderPage()}</MobileLayout>;
  }

  return <Layout activePage={currentPage} setPage={setCurrentPage} user={user} onLogout={handleLogout} version={APP_VERSION}>{renderPage()}</Layout>;
}

export default App;
