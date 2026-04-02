import React from 'react';
import { User, Bell, Settings, ShieldCheck } from 'lucide-react';
import MobileBottomNav from '../Navigation/MobileBottomNav';
import TalenHumanLogo from '../Shared/TalenHumanLogo';

const MobileLayout = ({ children, activePage, setPage, user, onLogout, version }) => {
  const [showNotifications, setShowNotifications] = React.useState(false);

  return (
    <div 
      style={{ minHeight: '100dvh', background: '#020617', color: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}
      className="overscroll-none no-select"
    >
      
      {/* 🔮 NATIVE DYNAMIC BACKGROUND ORBS */}
      <div style={{ position: 'absolute', top: '-10%', left: '-20%', width: '120%', height: '40%', background: 'rgba(79, 70, 229, 0.15)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '20%', right: '-30%', width: '100%', height: '30%', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />

      {/* Main Content Area - Native Immersive Scrolling */}
      <main 
        style={{ flex: 1, overflowY: 'auto', paddingBottom: '120px', position: 'relative', zIndex: 10, paddingTop: 'env(safe-area-inset-top, 20px)' }}
        className="animate-in fade-in slide-in-from-bottom-10 duration-1000 no-scrollbar"
      >
        <div style={{ paddingLeft: '20px', paddingRight: '20px' }}>
           {children}
        </div>
      </main>

      {/* 🏝️ FLOATING NATIVE ISLAND NAVIGATION (V57 ELITE) */}
      <footer style={{ position: 'fixed', bottom: '24px', left: '20px', right: '20px', zIndex: 100, height: '80px', borderRadius: '40px', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', border: '1px solid rgba(255, 255, 255, 0.15)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
         <div style={{ width: '100%', height: '100%', borderRadius: '36px', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
            <MobileBottomNav activePage={activePage} setPage={setPage} />
         </div>
      </footer>

    </div>
  );
};

export default MobileLayout;
