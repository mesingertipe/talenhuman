import React from 'react';
import { User } from 'lucide-react';
import MobileBottomNav from '../Navigation/MobileBottomNav';

const MobileLayout = ({ children, activePage, setPage, user, onLogout }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100">
      {/* Mobile Top Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 z-50 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20">
            TH
          </div>
          <div>
            <h1 className="text-sm font-bold leading-none">TalenHuman</h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">{user?.tenantName || 'Elite V12'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right mr-2 hidden xs:block">
            <p className="text-xs font-bold leading-none">{user?.fullName}</p>
            <p className="text-[10px] text-slate-500">{user?.roleName || 'Colaborador'}</p>
          </div>
          <button 
            onClick={onLogout}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300"
          >
            <User size={18} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 mt-16 mb-20 px-4 py-4 overflow-x-hidden">
        {children}
      </main>

      {/* Bottom Navigation */}
      <MobileBottomNav activePage={activePage} setPage={setPage} />
    </div>
  );
};

export default MobileLayout;
