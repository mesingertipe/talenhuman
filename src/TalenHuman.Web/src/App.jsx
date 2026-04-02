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

import DebugPortal from './components/Shared/DebugPortal'

// V49-FORCE-DEBUG-FINAL
const APP_VERSION = "V53-STABLE";

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    if (!saved) return null;
    try { return JSON.parse(saved); } catch { return null; }
  });
  
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [currentPage, setCurrentPage] = useState('Dashboard');
  const [booting, setBooting] = useState(true); 
  const [isStandalone, setIsStandalone] = useState(() => {
     const isIOS = /iPad|iPhone|iPod/.test(window.navigator.userAgent) && !window.MSStream;
     const isStand = window.matchMedia('(display-mode: standalone)').matches || (isIOS && window.navigator.standalone);
     return !!isStand;
  });
  
  const [biometricsDismissed, setBiometricsDismissed] = useState(() => {
     return localStorage.getItem('biometricsDismissed') === 'true' || 
            sessionStorage.getItem('session_biometric_dismissed_v24') === 'true';
  });

  const roleName = user?.roleName?.toLowerCase() || '';
  const isEmployee = roleName === 'employee' || roleName === 'empleado' || user?.employeeId !== '00000000-0000-0000-0000-000000000000';
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 1024;

  useEffect(() => {
    localStorage.setItem('app_version', APP_VERSION);
    if (user && token) initializeFirebase(user);
    setTimeout(() => setBooting(false), 500);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace('/');
  };

  const handleLogin = (userData, userToken) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userToken);
    setUser(userData);
    setToken(userToken);
    initializeFirebase(userData);
  };

  const handleDismissBiometrics = () => {
     localStorage.setItem('biometricsDismissed', 'true');
     sessionStorage.setItem('session_biometric_dismissed_v24', 'true');
     setBiometricsDismissed(true);
  };

  const renderContent = () => {
    if (booting) return (
      <div style={{ minHeight: '100dvh', background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
         <div className="clean-pulse-loader" style={{ width: '100px', height: '100px', background: 'rgba(255,255,255,0.15)', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <span style={{ fontSize: '42px', fontWeight: '900' }}>TH</span>
         </div>
      </div>
    );

    if (!token) return <Login onLogin={handleLogin} version={APP_VERSION} onForgotPassword={() => {}} onSelfServiceReset={() => {}} />;

    if (isEmployee && isMobileDevice && !isStandalone) {
       return <InstallPWA onLogout={handleLogout} version={APP_VERSION} />;
    }

    if (!user.acceptedPrivacyPolicy && (isEmployee || (isMobileDevice && roleName !== 'manager'))) {
      return <PrivacyConsentModal onAccepted={(u) => setUser(u)} onLogout={handleLogout} policyText={user.privacyPolicyText} />;
    }

    if (isStandalone && !user.biometricsEnrolled && !biometricsDismissed) {
      return <BiometricEnrollModal onComplete={() => { const newUser = { ...user, biometricsEnrolled: true }; setUser(newUser); }} onCancel={handleDismissBiometrics} />;
    }

    const renderPage = () => {
      if (isMobileDevice) {
        switch(currentPage) {
          case 'Marcaciones': return <MobileAttendance user={user} isMobile />;
          case 'Perfil': return <MobileProfile user={user} />;
          default: return <MobileDashboard user={user} />;
        }
      }
      return <Dashboard user={user} />;
    };

    if (isEmployee || isMobileDevice) {
      return <MobileLayout activePage={currentPage} setPage={setCurrentPage} user={user} onLogout={handleLogout} version={APP_VERSION}>{renderPage()}</MobileLayout>;
    }

    return <Layout activePage={currentPage} setPage={setCurrentPage} user={user} onLogout={handleLogout} version={APP_VERSION}>{renderPage()}</Layout>;
  };

  return (
    <>
      <DebugPortal />
      {renderContent()}
    </>
  );
}

export default App;
