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

// V54-FORCE-DOMAIN-REDIRECT
const APP_VERSION = "V57-ELITE-FORCE";

function App() {
  // 🚀 V54 FORCE DOMAIN UNIFICATION
  React.useEffect(() => {
    if (window.location.hostname === 'www.talenhuman.com') {
      window.location.replace('https://talenhuman.com' + window.location.pathname + window.location.search);
    }
  }, []);

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

  const renderContent = () => {
    if (booting) return (
      <div style={{ minHeight: '100dvh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
         <div className="clean-pulse-loader" style={{ width: '100px', height: '100px', background: 'rgba(255,255,255,0.05)', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <span style={{ fontSize: '42px', fontWeight: '900', color: '#6366f1' }}>TH</span>
         </div>
      </div>
    );

    if (!token) return <Login onLogin={handleLogin} version={APP_VERSION} onForgotPassword={() => {}} onSelfServiceReset={() => {}} />;

    // 🔒 RESTORE MANDATORY PWA GATE (Requested by User)
    if (isEmployee && isMobileDevice && !isStandalone) {
       return <InstallPWA onLogout={handleLogout} version={APP_VERSION} />;
    }

    // 🔒 Mandatory Privacy Acceptance
    if (!user.acceptedPrivacyPolicy && (isEmployee || (isMobileDevice && roleName !== 'manager'))) {
       return <PrivacyConsentModal onAccepted={(u) => setUser(u)} onLogout={handleLogout} policyText={user.privacyPolicyText} />;
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
      {renderContent()}
    </>
  );
}

export default App;
