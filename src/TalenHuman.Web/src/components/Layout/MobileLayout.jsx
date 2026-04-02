import React from 'react';
import { User, Bell, Settings, ShieldCheck } from 'lucide-react';
import MobileBottomNav from '../Navigation/MobileBottomNav';
import TalenHumanLogo from '../Shared/TalenHumanLogo';

const MobileLayout = ({ children, activePage, setPage, user, onLogout, version }) => {
  const [showNotifications, setShowNotifications] = React.useState(false);

  return (
    <div className="min-h-[100dvh] bg-slate-950 flex flex-col text-white overscroll-none overflow-hidden relative">
      
      {/* 🔮 DYNAMIC BACKGROUND ORBS (NATIVE ELITE FEEL) */}
      <div className="absolute top-[-10%] left-[-20%] w-[100%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none opacity-50" />
      <div className="absolute bottom-[20%] right-[-30%] w-[100%] h-[30%] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none opacity-40" />

      {/* Main Content Area - Native Immersive Scrolling */}
      <main className="flex-1 overflow-y-auto mt-0 pb-[110px] animate-in fade-in slide-in-from-bottom-10 duration-1000 no-scrollbar relative z-10 pt-safe">
        <div className="px-5">
           {children}
        </div>
      </main>

      {/* 🏝️ FLOATING NATIVE ISLAND NAVIGATION (V56 ELITE) */}
      <footer className="fixed bottom-6 left-5 right-5 z-[100] h-20 rounded-[2.5rem] bg-white/10 backdrop-blur-3xl border border-white/20 shadow-2xl shadow-black/60 flex items-center justify-center p-1">
         <div className="w-full h-full rounded-[2.2rem] bg-indigo-500/5 overflow-hidden flex items-center">
            <MobileBottomNav activePage={activePage} setPage={setPage} />
         </div>
      </footer>

    </div>
  );
};

export default MobileLayout;
