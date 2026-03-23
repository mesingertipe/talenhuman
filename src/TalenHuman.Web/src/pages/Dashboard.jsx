import React from 'react';
import { Users, Store, Award, TrendingUp } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 transition-all hover:translate-y-[-4px] hover:shadow-lg">
    <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-opacity-100`}>
      <Icon size={24} className={color.replace('bg-', 'text-')} />
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h3>
    </div>
  </div>
);

const Dashboard = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Panel de Control</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Bienvenido a TalenHuman. Aquí tienes un resumen de hoy.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Colaboradores" value="124" icon={Users} color="bg-indigo-600" />
        <StatCard title="Cargos" value="45" icon={Award} color="bg-amber-600" />
        <StatCard title="Asistencia" value="98%" icon={TrendingUp} color="bg-blue-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 min-h-[300px]">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Actividad Reciente</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Actualización de perfil registrada para el ID {i}</p>
                  <p className="text-xs text-slate-500">Hace {i * 10} minutos</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
