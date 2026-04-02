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
import MobileNews from './pages/Mobile/MobileNews' // 🚀 FIXED: Added missing import to prevent white screen

import DebugPortal from './components/Shared/DebugPortal'

// V54-FORCE-DOMAIN-REDIRECT
const APP_VERSION = "V59-UNIFICATION";

function App() {
  // 🚀 V54 FORCE DOMAIN UNIFICATION
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hostname === 'www.talenhuman.com') {
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
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  
  const [isStandalone, setIsStandalone] = useState(() => {
     if (typeof window === 'undefined') return false;
     const isIOS = /iPad|iPhone|iPod/.test(window.navigator.userAgent) && !window.MSStream;
     const isStand = window.matchMedia('(display-mode: standalone)').matches || (isIOS && window.navigator.standalone);
     return !!isStand;
  });

  const roleName = user?.roleName?.toLowerCase() || '';
  const isEmployee = (roleName === 'employee' || roleName === 'empleado') && !roleName.includes('admin');
  
  // 📱 STRICTOR MOBILE DETECTION
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && window.innerWidth < 1024;

  useEffect(() => {
    localStorage.setItem('app_version', APP_VERSION);
    localStorage.setItem('theme', theme);
    document.documentElement.className = theme; // Force dark class if needed
    if (user && token) initializeFirebase(user);
    setTimeout(() => setBooting(false), 500);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace('/');
  };

  const handleLogin = (userData, userToken) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userToken);
    setToken(userToken);
    setUser(userData);
    initializeFirebase(userData);
  };

  const renderContent = () => {
    if (booting) return (
      <div style={{ minHeight: '100dvh', background: theme === 'dark' ? '#0f172a' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme === 'dark' ? 'white' : '#1e293b' }}>
         <div style={{ padding: '40px', background: theme === 'dark' ? 'rgba(255,255,255,0.02)' : '#ffffff', borderRadius: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)' }}>
             <div style={{ width: '60px', height: '60px', border: '4px solid rgba(79, 70, 229, 0.1)', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
             <span style={{ fontSize: '14px', fontWeight: '800', color: '#4f46e5', letterSpacing: '0.1em' }}>TALENHUMAN</span>
         </div>
      </div>
    );

    if (!token) return <Login onLogin={handleLogin} version={APP_VERSION} theme={theme} onForgotPassword={() => {}} onSelfServiceReset={() => {}} />;

    // 🔒 STRICTOR Gating: Only Employee profiles see Mobile experience/modals
    if (isEmployee && isMobileDevice && !isStandalone) {
       return <InstallPWA onLogout={handleLogout} version={APP_VERSION} />;
    }

    // 🔒 Mandatory Privacy (Employee ONLY - NEVER for Admins)
    if (isEmployee && !user.acceptedPrivacyPolicy) {
       return <PrivacyConsentModal onAccepted={(u) => setUser(prev => ({ ...prev, ...u }))} onLogout={handleLogout} policyText={user.privacyPolicyText} />;
    }

    const renderPage = () => {
      // 📱 MOBILE PAGES: Only for Employees on Mobile
      if (isMobileDevice && isEmployee) {
        switch(currentPage) {
          case 'Marcaciones': return <MobileAttendance user={user} isMobile theme={theme} />;
          case 'Perfil': return <MobileProfile user={user} theme={theme} />;
          case 'Novedades': return <MobileNews user={user} theme={theme} />;
          default: return <MobileDashboard user={user} theme={theme} />;
        }
      }
      
      // 💻 WEB PAGES: Everything else (Admins, Managers on any device, and Employees on Desktop)
      return <Dashboard user={user} />;
    };

    // 👑 SEPARATION: MobileLayout ONLY for Employees on Mobile, Web Layout for everyone else
    if (isMobileDevice && isEmployee) {
      return (
        <MobileLayout 
          activePage={currentPage} 
          setPage={setCurrentPage} 
          user={user} 
          onLogout={handleLogout} 
          version={APP_VERSION}
          theme={theme}
          toggleTheme={toggleTheme}
        >
          {renderPage()}
        </MobileLayout>
      );
    }

    return (
      <Layout 
        activePage={currentPage} 
        setPage={setCurrentPage} 
        user={user} 
        onLogout={handleLogout} 
        version={APP_VERSION}
        theme={theme}
        toggleTheme={toggleTheme}
      >
        {renderPage()}
      </Layout>
    );
  };

  return (
    <>
      {renderContent()}
    </>
  );
}

export default App;
