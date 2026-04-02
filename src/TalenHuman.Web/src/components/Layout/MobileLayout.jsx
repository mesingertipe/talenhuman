import React from 'react';
import { User, Bell, Settings, ShieldCheck } from 'lucide-react';
import MobileBottomNav from '../Navigation/MobileBottomNav';

const MobileLayout = ({ children, activePage, setPage, user, onLogout, version }) => {
  const [showNotifications, setShowNotifications] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100">
      
      {/* 🚀 PRO APP HEADER (DomiCare Style) */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-blue-600 via-indigo-700 to-indigo-900 text-white rounded-b-[2.5rem] shadow-2xl shadow-indigo-500/20 px-6 pb-8 pt-4">
        
        {/* Top Tray: Branding & Actions */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                <span className="font-black text-xl italic tracking-tighter text-white">TH</span>
             </div>
             <div>
                <h1 className="text-base font-black tracking-tighter leading-tight drop-shadow-sm uppercase">TalenHuman</h1>
                <div className="flex items-center gap-1.5 opacity-80">
                   <p className="text-[9px] font-bold uppercase tracking-widest leading-none">
                      {user?.tenantName || 'Technology Group'}
                   </p>
                </div>
             </div>
          </div>

          <div className="flex items-center gap-4">
             {/* Notification Bell with Pulse Badge */}
             <div className="relative cursor-pointer active:scale-90 transition-transform">
                <Bell size={22} className="text-white/90" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border-2 border-indigo-800 rounded-full animate-pulse shadow-sm" />
             </div>
             
             {/* Profile Avatar / Settings */}
             <div className="w-9 h-9 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/30 shadow-lg active:scale-95 transition-transform overflow-hidden">
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={18} className="text-white" />
                )}
             </div>
          </div>
        </div>

        {/* Bottom Tray: Welcome & Identity */}
        <div className="flex items-center justify-between">
           <div className="flex flex-col">
              <span className="text-[10px] uppercase font-black tracking-[0.2em] text-blue-200/60 leading-none mb-1">Bienvenido de nuevo</span>
              <h2 className="text-xl font-black tracking-tight leading-none truncate max-w-[200px]">
                 {user?.fullName?.split(' ')[0] || 'Usuario'}
              </h2>
           </div>
           
           <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center gap-2">
              <ShieldCheck size={12} className="text-blue-200" />
              <span className="text-[9px] font-black uppercase tracking-widest text-white/80">Verificado</span>
           </div>
        </div>
      </header>

      {/* Main Content Area - Shifted down for the large header */}
      <main className="flex-1 mt-40 pb-24 overflow-x-hidden animate-in fade-in slide-in-from-bottom-6 duration-700">
        <div className="px-5">
           {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <MobileBottomNav activePage={activePage} setPage={setPage} />

      {/* CSS for custom header curve behavior if needed */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-shadow { box-shadow: 0 10px 40px -10px rgba(79, 70, 229, 0.3); }
      `}} />
    </div>
  );
};

export default MobileLayout;
