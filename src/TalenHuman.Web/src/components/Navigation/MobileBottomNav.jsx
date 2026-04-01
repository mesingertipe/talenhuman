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

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-2 py-2 z-50 flex justify-around items-center pb-safe">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activePage === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setPage(tab.id)}
            className={`flex flex-col items-center justify-center w-full py-1 transition-all duration-200 ${
              isActive 
                ? 'text-indigo-600 dark:text-indigo-400 scale-110' 
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <div className={`p-1 rounded-xl ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}`}>
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;
