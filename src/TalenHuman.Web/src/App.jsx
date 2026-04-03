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
import { initializeFirebase, requestForToken } from './firebase';

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
const APP_VERSION = "V62.5-ELITE";

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

  // 🔐 ELITE IDENTITY SYNC (V65.0)
  useEffect(() => {
    if (user && !booting) {
      const syncCloudId = async () => {
        try {
          const fcmToken = await requestForToken();
          if (fcmToken) {
            await api.post('/Security/token', fcmToken, {
              headers: { 'Content-Type': 'application/json' }
            });
            console.log('Elite Cloud ID Synced ✅');
          }
        } catch (err) {
          console.warn('FCM Sync skipped:', err);
        }
      };
      syncCloudId();
    }
  }, [user, booting]);
  
  const [isStandalone, setIsStandalone] = useState(() => {
     if (typeof window === 'undefined') return false;
     const isIOS = /iPad|iPhone|iPod/.test(window.navigator.userAgent) && !window.MSStream;
     const isStand = window.matchMedia('(display-mode: standalone)').matches || (isIOS && window.navigator.standalone);
     return !!isStand;
  });

  // 🕵️‍♂️ ULTRA-ROBUST ROLE DETECTION (Handles cases where roles could be string, array, or null)
  const roleList = Array.isArray(user?.roles) ? user.roles : (typeof user?.roles === 'string' ? [user.roles] : []);
  const rawRoleName = (user?.roleName || user?.role || '').toLowerCase();
  const isEmployee = roleList.some(r => r?.toLowerCase() === 'empleado' || r?.toLowerCase() === 'employee') || 
                    rawRoleName === 'empleado' || 
                    rawRoleName === 'employee';
  
  // 📱 STRICTOR MOBILE DETECTION
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && window.innerWidth < 1024;

  useEffect(() => {
    try {
      localStorage.setItem('app_version', APP_VERSION);
      localStorage.setItem('theme', theme);
      document.documentElement.className = theme; 
      
      if (user && token) {
        initializeFirebase(user).catch(err => console.warn('Firebase Init suppressed:', err));
      }
    } catch (e) {
      console.error('Fatal startup error:', e);
    } finally {
      setTimeout(() => setBooting(false), 800);
    }
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

    // 🔒 Mandatory Privacy (Employee ONLY - STRICT)
    if (isEmployee && !user.acceptedPrivacyPolicy) {
       return <PrivacyConsentModal 
          onAccepted={(u) => setUser(prev => {
             const merged = { ...prev, ...u };
             // 🛡️ Safety: Never lose critical identity data if API sends partial object
             if (!merged.roles && prev.roles) merged.roles = prev.roles;
             if (!merged.id && prev.id) merged.id = prev.id;
             localStorage.setItem('user', JSON.stringify(merged));
             return merged;
          })} 
          onLogout={handleLogout} 
          policyText={user.privacyPolicyText} 
       />;
    }

    const renderPage = () => {
      // 📱 MOBILE PAGES: Only for Employees on Mobile
      if (isMobileDevice && isEmployee) {
        switch(currentPage) {
          case 'Marcaciones': return <MobileAttendance user={user} isMobile theme={theme} />;
          case 'Perfil': return <MobileProfile user={user} theme={theme} setPage={setCurrentPage} onLogout={handleLogout} />;
          case 'Novedades': return <MobileNews user={user} theme={theme} />;
          case 'ResetPassword': return <ResetPassword user={user} theme={theme} setPage={setCurrentPage} />;
          default: return <MobileDashboard user={user} theme={theme} setPage={setCurrentPage} />;
        }
      }
      
      // 💻 WEB PAGES: Full Navigation Switch restored for Admins/Employees on PC
      // 🚀 V62.8: PERFECTION SYNC (Matching Sidebar Labels exactly)
      switch(currentPage) {
        case 'Marcaciones': return <Marcaciones user={user} />;
        case 'Monitoreo Asistencia': return <AttendanceMonitoring user={user} />;
        case 'Tiendas': return <Stores user={user} />;
        case 'Empresas': return <Companies user={user} />;
        case 'Usuarios': return <Users user={user} />;
        case 'Cargos': return <Profiles user={user} />;
        case 'Empleados': return <Employees user={user} />;
        case 'Marcas': return <Brands user={user} />;
        case 'Ciudades': return <Cities user={user} />;
        case 'Distritos': return <Districts user={user} />;
        case 'Jornadas': return <Jornadas user={user} />;
        case 'Novedades': return <NewsInbox user={user} />;
        case 'Configuración novedades': return <NewsDesigner user={user} />;
        case 'Diseñador de Plantillas': return <NewsTemplateDesigner user={user} />;
        case 'Turnos': return <ShiftScheduler user={user} />;
        case 'Permisos': return <ModulePermissions user={user} />;
        case 'Configuración Sistema': return <SystemSettings user={user} />;
        case 'Auditoría': return <AuditLogs user={user} />;
        case 'Dashboard':
        default:
          return isEmployee ? <EmployeeDashboard user={user} /> : <Dashboard user={user} />;
      }
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
