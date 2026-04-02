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

// V16.7.6-CONSENSUS-FINAL
const APP_VERSION = "V16.7.6-FINAL";

function App() {
  // 🚀 BOOTSTRAP: Synchronous state initialization from localStorage
  // This eliminates the 1-frame flickering between Login and Dashboard
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    if (!saved) return null;
    try { return JSON.parse(saved); } catch { return null; }
  });
  
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [currentPage, setCurrentPage] = useState('Dashboard');
  const [booting, setBooting] = useState(true); // Always boot first
  const [isStandalone, setIsStandalone] = useState(() => {
    const isIOS = /iPad|iPhone|iPod/.test(window.navigator.userAgent) && !window.MSStream;
    return !!(window.matchMedia('(display-mode: standalone)').matches || (isIOS && window.navigator.standalone));
  });
  const [biometricsDismissed, setBiometricsDismissed] = useState(false);

  // Derivations
  const isEmployee = user?.roleName?.toLowerCase() === 'employee' || 
                     user?.roles?.some(r => r.toLowerCase() === 'employee') || 
                     (user?.employeeId && user?.employeeId !== '00000000-0000-0000-0000-000000000000');

  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                        window.innerWidth < 1024;

  const handleLogout = () => {
    localStorage.clear();
    window.location.replace('/');
  };

  useEffect(() => {
    // 1. Version Stability Check
    const storedVersion = localStorage.getItem('app_version');
    if (storedVersion && storedVersion !== APP_VERSION) {
       localStorage.clear();
       localStorage.setItem('app_version', APP_VERSION);
       window.location.reload();
       return;
    }
    
    // 2. Initial Setup Completion
    if (user && token) {
       initializeFirebase(user);
    }
    
    // 3. Mark Boot as finished after a smooth pulse
    setTimeout(() => setBooting(false), 800);
  }, []);

  const handleLogin = (userData, userToken) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userToken);
    localStorage.setItem('app_version', APP_VERSION);
    setUser(userData);
    setToken(userToken);
    initializeFirebase(userData);
  };

  // 🛡️ ELITE BOOTLOADER: Pre-renders nothing until state is determined
  if (booting) {
    return (
      <div style={{
          minHeight: '100dvh', background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white'
      }}>
         <div className="elite-pulse-loader" style={{ 
            width: '80px', height: '80px', background: 'white', borderRadius: '25px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' 
         }}>
             <span style={{ fontSize: '24px', fontWeight: '900', italic: 'true' }}>TH</span>
         </div>
         <p style={{ marginTop: '20px', fontSize: '10px', fontWeight: '800', letterSpacing: '4px', opacity: 0.6 }}>INITIALIZING ELITE...</p>
         <style>{`
            .elite-pulse-loader { animation: elite-pulse 1.5s ease-in-out infinite; }
            @keyframes elite-pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.7; } }
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

  // 🛡️ THE GATEKEEPER SEQUENCE (CONSENSUS V16.7.6)
  // Strict flow: 1. Install (Mobile browser) -> 2. Privacy (Everyone inside App) -> 3. Biometrics

  // 1. GATE: Install the PWA first (if not in app and on mobile)
  if (isMobileDevice && !isStandalone) {
     return <InstallPWA onLogout={handleLogout} version={APP_VERSION} />;
  }

  // 2. GATE: Privacy Consent (Mandatory inside PWA / Desktop)
  const isManager = user?.roleName?.toLowerCase() === 'manager' || user?.roleName?.toLowerCase() === 'gerente';
  const shouldForcePrivacy = !user.acceptedPrivacyPolicy && (isEmployee || (isMobileDevice && !isManager));

  if (shouldForcePrivacy) {
    return <PrivacyConsentModal onAccepted={(u) => setUser(u)} onLogout={handleLogout} policyText={user.privacyPolicyText} />;
  }

  // 3. GATE: Biometrics Enrollment (Native app only)
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

  // Final Native Application Shell
  if (isEmployee || isMobileDevice) {
    return <MobileLayout activePage={currentPage} setPage={setCurrentPage} user={user} onLogout={handleLogout} version={APP_VERSION}>{renderPage()}</MobileLayout>;
  }

  return <Layout activePage={currentPage} setPage={setCurrentPage} user={user} onLogout={handleLogout} version={APP_VERSION}>{renderPage()}</Layout>;
}

export default App;
