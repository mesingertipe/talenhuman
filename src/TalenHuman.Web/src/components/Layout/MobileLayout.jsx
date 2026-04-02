import React from 'react';
import { User, Bell, Settings, ShieldCheck } from 'lucide-react';
import MobileBottomNav from '../Navigation/MobileBottomNav';
import TalenHumanLogo from '../Shared/TalenHumanLogo';

const MobileLayout = ({ children, activePage, setPage, user, onLogout, version }) => {
  const [showNotifications, setShowNotifications] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 overscroll-none overflow-hidden">
      
      {/* 📱 NATIVE APP SHELL (SAFE AREA AWARE) */}
      <header 
        className="fixed top-0 left-0 right-0 z-[100] text-white pt-safe pb-6 px-6 rounded-b-[2.5rem] shadow-2xl shadow-indigo-500/30"
        style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)' }}
      >
        {/* Sub-header for branding info */}
        <div className="flex items-center justify-between pt-4">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                 <span className="font-black text-xl italic tracking-tighter text-white">TH</span>
              </div>
              <div>
                 <h1 className="text-sm font-black tracking-widest leading-tight uppercase text-white transition-all">TalenHuman</h1>
              </div>
           </div>

           <div className="flex items-center gap-4">
              {/* Quick Setting / Alert Indicator */}
              <div className="p-2 bg-white/10 rounded-xl relative active:scale-90 transition-all">
                <Bell size={20} className="text-white/80" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-400 rounded-full animate-pulse" />
              </div>
           </div>
        </div>
      </header>

      {/* Main Content Area - Native Padding & Smooth Scroll */}
      <main className="flex-1 mt-[100px] mb-20 overflow-y-auto custom-scrollbar pt-4 pb-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
        <div className="px-5 pb-safe">
           {children}
        </div>
      </main>

      {/* Bottom Navigation (Safe Area Aware) */}
      <footer className="fixed bottom-0 left-0 right-0 z-[100] bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-white/5 pb-safe">
         <MobileBottomNav activePage={activePage} setPage={setPage} />
      </footer>

    </div>
  );
};

export default MobileLayout;
