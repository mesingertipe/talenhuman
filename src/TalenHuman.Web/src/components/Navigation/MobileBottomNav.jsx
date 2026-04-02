import React from 'react';
import { Home, Calendar, Clock, User, Bell } from 'lucide-react';

const MobileBottomNav = ({ activePage, setPage }) => {
  const tabs = [
    { id: 'Dashboard', icon: Home, label: 'Inicio' },
    { id: 'Turnos', icon: Calendar, label: 'Turnos' },
    { id: 'Marcaciones', icon: Clock, label: 'Marcas' },
    { id: 'Notificaciones', icon: Bell, label: 'Alertas' },
    { id: 'Perfil', icon: User, label: 'Perfil' },
  ];

  const handleTabClick = (tabId) => {
    // 📳 NATIVE HAPTIC FEEDBACK
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(15); 
    }
    setPage(tabId);
  };

  return (
    <nav className="flex justify-around items-center w-full h-full px-2 no-select relative overflow-hidden">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activePage === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`flex flex-col items-center justify-center w-full h-full transition-all duration-500 relative z-10 ${
              isActive 
                ? 'text-white' 
                : 'text-white/30 active:scale-90 hover:text-white/50'
            }`}
          >
            <div className="relative flex items-center justify-center p-2 rounded-2xl">
              {/* Active Glow Aura */}
              {isActive && (
                <div className="absolute inset-0 bg-indigo-500/40 blur-xl rounded-full scale-150 animate-pulse" />
              )}
              
              <Icon 
                size={22} 
                strokeWidth={isActive ? 2.5 : 1.5} 
                className={`relative z-10 transition-transform duration-500 ${isActive ? 'scale-110' : 'scale-100'}`} 
              />
            </div>
            
            <span className={`text-[8px] mt-1 font-black uppercase tracking-[0.2em] transition-all duration-500 ${
              isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
            }`}>
              {tab.label}
            </span>

            {/* Active Bottom Indicator Dot */}
            {isActive && (
              <div className="absolute bottom-1 w-1 h-1 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,1)]" />
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;
