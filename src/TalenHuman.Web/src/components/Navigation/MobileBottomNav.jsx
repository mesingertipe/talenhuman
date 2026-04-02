import React from 'react';
import { Home, Calendar, Clock, User, Bell } from 'lucide-react';

const MobileBottomNav = ({ activePage, setPage }) => {
  const tabs = [
    { id: 'Dashboard', icon: Home, label: 'Inicio' },
    { id: 'Turnos', icon: Calendar, label: 'Turnos' },
    { id: 'Marcaciones', icon: Clock, label: 'Marcas' },
    { id: 'Notificaciones', icon: Bell, label: 'Alertas' },
    { id: 'Perfil', icon: User, label: 'Mi Perfil' },
  ];

  const handleTabClick = (tabId) => {
    // 📳 NATIVE HAPTIC FEEDBACK (If supported)
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(10); 
    }
    setPage(tabId);
  };

  return (
    <nav className="flex justify-around items-center px-2 py-3 bg-white dark:bg-slate-950 no-select pb-safe translate-y-0 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activePage === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`flex flex-col items-center justify-center w-full transition-all duration-300 active:scale-90 ${
              isActive 
                ? 'text-indigo-600 dark:text-indigo-400' 
                : 'text-slate-400 dark:text-slate-600'
            }`}
          >
            <div className={`relative flex items-center justify-center p-2 rounded-2xl transition-all duration-500 ${
              isActive ? 'bg-indigo-50 dark:bg-indigo-500/10' : ''
            }`}>
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'animate-pulse' : ''} />
              {isActive && (
                <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/50" />
              )}
            </div>
            <span className={`text-[9px] mt-1 font-black uppercase tracking-widest ${
              isActive ? 'opacity-100' : 'opacity-40'
            }`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;
