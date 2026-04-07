import React, { useState, useEffect } from 'react'
import Layout from './components/Layout/Layout'
import api from './services/api'
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
import OperationalSettings from './pages/Settings/OperationalSettings';
import AttendanceMonitoring from './pages/Core/AttendanceMonitoring';
import Cities from './pages/Core/Cities';
import Districts from './pages/Core/Districts';
import ShiftApproval from './pages/Scheduling/ShiftApproval';
import ModulePermissions from './pages/SuperAdmin/ModulePermissions';
import SystemSettings from './pages/SuperAdmin/SystemSettings';
import NewsTemplateDesigner from './pages/SuperAdmin/NewsTemplateDesigner';
import AuditLogs from './pages/Core/AuditLogs';
import CommunicationsCenter from './pages/Admin/CommunicationsCenter';
import SecurityService from './services/securityService';
import { initializeFirebase, requestForToken, onMessageListener } from './firebase';

import MobileLayout from './components/Layout/MobileLayout'
import EmployeeDashboard from './pages/Employee/EmployeeDashboard'
import InstallPWA from './components/PWA/InstallPWA'
import PrivacyConsentModal from './components/Legal/PrivacyConsentModal'
import BiometricEnrollModal from './components/Biometrics/BiometricEnrollModal'

// Mobile Native Views
import MobileDashboard from './pages/Mobile/MobileDashboard'
import MobileAttendance from './pages/Mobile/MobileAttendance'
import MobileProfile from './pages/Mobile/MobileProfile'
import MobileNews from './pages/Mobile/MobileNews'
import MobileShifts from './pages/Mobile/MobileShifts'
import { useTheme } from './context/ThemeContext'
import DebugPortal from './components/Shared/DebugPortal'
import MobileCommunicationModal from './components/Mobile/MobileCommunicationModal'

// V65.2.18 STABILITY UPDATE
const APP_VERSION = "V12.99";

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
  const [authView, setAuthView] = useState('login'); // 'login', 'forgot', 'self-service', 'reset-forgotten'
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const { isDarkMode, toggleTheme } = useTheme();
  const theme = isDarkMode ? 'dark' : 'light';

  // 📢 Communication Stats (V63.7)
  const [activeCommunication, setActiveCommunication] = useState(null);
  const [showPRModal, setShowPRModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, title: '', body: '' });

  const CURRENT_VERSION = "V66.3.0";
  
  
  useEffect(() => {
      const lastVersion = localStorage.getItem('app_version');
      
      // 🚀 SILENT AUTO-UPDATE (V65.1.18-ELITE)
      // Detects version mismatch and forces a full internal reset to fix Workbox precaching errors
      if (lastVersion && lastVersion !== CURRENT_VERSION) {
          console.log(`PWA: Version mismatch (${lastVersion} vs ${CURRENT_VERSION}). Initializing silent reset...`);
          
          const performSilentReset = async () => {
              if ('serviceWorker' in navigator) {
                  const regs = await navigator.serviceWorker.getRegistrations();
                  for (let r of regs) await r.unregister();
              }
              if ('caches' in window) {
                  const keys = await caches.keys();
                  for (let k of keys) await caches.delete(k);
              }
              localStorage.setItem('app_version', CURRENT_VERSION);
              // Wait 1 second before reload to ensure storage is committed
              setTimeout(() => {
                  window.location.reload(true);
              }, 1000);
          };
          
          performSilentReset();
      }
      
      localStorage.setItem('app_version', CURRENT_VERSION);

      const syncToken = async () => {
          const token = localStorage.getItem('fcm_token');
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          
          if (token && user.id) {
              try {
                  console.log(`FCM Sync: Iniciando registro en el Núcleo de Seguridad...`);
                  const response = await SecurityService.syncFcmToken(token);
                  console.log('FCM Sync success:', response);
              } catch (error) {
                  console.error("FCM Sync skipped:", error);
              }
          }
      };
      syncToken();
  }, []);

  // 🔐 IDENTITY SYNC (V65.1.9)
  useEffect(() => {
    if (user && !booting) {
      const syncCloudId = async () => {
        try {
          const fcmToken = await requestForToken();
          console.log(`FCM Sync: Iniciando registro en el Núcleo de Seguridad...`);
          const response = await SecurityService.syncFcmToken(fcmToken);
          console.log('FCM Sync OK:', response);
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

  // 📢 Active Communication Sync (V63.7)
  useEffect(() => {
    if (isEmployee && isMobileDevice && user) {
        checkActiveCommunication();
    }
  }, [user]);

  // 🔄 RE-SYNC ON FOCUS (V12.70 - Final Stabilization)
  useEffect(() => {
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && isEmployee && isMobileDevice && user) {
            console.log('👁️ [UI Sync] App back to focus. Refreshing active content...');
            checkActiveCommunication();
        }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    // Also sync on window focus
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [user, isEmployee, isMobileDevice]);

  const checkActiveCommunication = async () => {
    try {
        const res = await api.get('/comunicados/active');
        const lastSeen = localStorage.getItem('last_seen_pr');
        
        // 🛡️ Visibilidad Única: Only show if Id is different from last seen
        if (res.data && res.data.id !== lastSeen) {
            setActiveCommunication(res.data);
            setShowPRModal(true);
        }
    } catch (err) {
        // Silently fail if no active PR
    }
  };

  const handleDismissPR = () => {
    if (activeCommunication) {
        localStorage.setItem('last_seen_pr', activeCommunication.id);
    }
    setShowPRModal(false);
    setActiveCommunication(null);
  };

  // 🖱️ DEEP LINKING & SW LISTENER (V65.1.28)
  useEffect(() => {
    // 1. Check URL on mount
    const params = new URLSearchParams(window.location.search);
    const commId = params.get('comunicadoId');
    if (commId) {
        console.log('🔗 [Deep Link] ID detected in URL:', commId);
        // Delay slightly to ensure layout is ready
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('open-communication', { detail: { id: commId } }));
            // Clean URL without reload
            window.history.replaceState({}, document.title, "/");
        }, 1500);
    }

    // 2. Listen for messages from Radio (BroadcastChannel)
    const bc = new BroadcastChannel('talenhuman_notifications');
    bc.onmessage = (event) => {
        if (event.data?.type === 'NOTIFICATION_CLICK' && event.data?.comunicadoId) {
            console.log('📩 [Broadcast Click] Notification click detected:', event.data.comunicadoId);
            window.dispatchEvent(new CustomEvent('open-communication', { 
                detail: { id: event.data.comunicadoId } 
            }));
        }
    };

    const handleOpenComm = async (e) => {
        const { id } = e.detail;
        console.log('🔗 [DEEP LINK] Abriendo comunicado:', id);
        try {
            const res = await api.get(`/comunicados/${id}`);
            setActiveCommunication(res.data);
            setShowPRModal(true);
        } catch (err) {
            console.error('Failed to load deep linked communication:', err);
        }
    };

    window.addEventListener('open-communication', handleOpenComm);
    return () => {
        window.removeEventListener('open-communication', handleOpenComm);
        bc.close();
    };
  }, []);

  useEffect(() => {
    try {
      // Auto-update check is handled in the dedicated useEffect above for clarity
      
      if (user && token) {
        initializeFirebase(user).catch(err => console.warn('Firebase Init suppressed:', err));
      }
    } catch (e) {
      console.error('Fatal startup error:', e);
    } finally {
      setTimeout(() => setBooting(false), 800);
    }
  }, [user, token]); 

  // toggleTheme is now from useTheme() context

  const handleLogout = () => {
    // 🛡️ SYNC STATE CLEAR (V65.2.6)
    // Clear state before redirect to prevent layout crashes by unmounting complex children
    setToken(null);
    setUser(null);
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

    if (!token) {
        if (authView === 'forgot') {
            return <ForgotPassword 
                onBack={() => setAuthView('login')} 
                onNext={(email) => {
                    setRecoveryEmail(email);
                    setAuthView('reset-forgotten');
                }}
            />;
        }
        if (authView === 'reset-forgotten') {
            return <ResetForgottenPassword 
                email={recoveryEmail} 
                onBack={() => setAuthView('login')} 
            />;
        }
        if (authView === 'self-service') {
            return <SelfServiceReset onBack={() => setAuthView('login')} />;
        }
        return (
            <Login 
                onLogin={handleLogin} 
                version={APP_VERSION} 
                theme={theme} 
                onForgotPassword={() => setAuthView('forgot')} 
                onSelfServiceReset={() => setAuthView('self-service')} 
            />
        );
    }

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
              if (merged.hasBiometrics === undefined && prev.hasBiometrics !== undefined) merged.hasBiometrics = prev.hasBiometrics;
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
          case 'Perfil': return <MobileProfile user={user} setPage={setCurrentPage} onLogout={handleLogout} />;
          case 'Novedades': return <MobileNews user={user} theme={theme} />;
          case 'Turnos': return <MobileShifts user={user} theme={theme} />;
          case 'ResetPassword': return <ResetPassword user={user} theme={theme} setPage={setCurrentPage} />;
          default: return <MobileDashboard user={user} theme={theme} setPage={setCurrentPage} />;
        }
      }
      
      // 💻 WEB PAGES: Full Navigation Switch restored for Admins/Employees on PC
      // 🚀 V62.8: PERFECTION SYNC (Matching Sidebar Labels exactly)
      switch(currentPage) {
        case 'Marcaciones': return <Marcaciones user={user} />;
        case 'Configuraciones operativas': return <OperationalSettings user={user} />;
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
        case 'Centro de Comunicados': return <CommunicationsCenter user={user} />;
        case 'Turnos': return <ShiftScheduler user={user} />;
        case 'Aprobación de turnos': return <ShiftApproval user={user} />;
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
      
      {/* 📺 MOBILE PR MODAL (V63.7) */}
      {showPRModal && activeCommunication && (
        <MobileCommunicationModal 
          key={activeCommunication.id}
          communication={activeCommunication} 
          onDismiss={handleDismissPR} 
        />
      )}


      {/* 🔔 REAL-TIME BROADCAST TOAST */}
      {notification.show && (
        <div style={{
          position: 'fixed', top: '100px', left: '20px', right: '20px',
          zIndex: 20000, background: '#4f46e5', color: 'white',
          padding: '20px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: '15px', animation: 'slideDown 0.5s ease'
        }}>
          <Megaphone size={24} />
          <div>
            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '900' }}>{notification.title}</h4>
            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.9 }}>{notification.body}</p>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
