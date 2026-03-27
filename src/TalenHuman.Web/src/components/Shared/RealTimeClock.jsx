import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import HelpIcon from './HelpIcon';
import { getTenantTimeZone, getTenantLocale } from '../../utils/localization';

const RealTimeClock = ({ countryCode, timeZoneId }) => {
  const [time, setTime] = useState(new Date());

  const countries = {
    'CO': { name: 'Colombia' },
    'MX': { name: 'México' },
    'PA': { name: 'Panamá' },
    'EC': { name: 'Ecuador' },
  };

  const config = countries[countryCode] || countries['CO'];
  const timeZone = getTenantTimeZone(countryCode, timeZoneId);
  const locale = getTenantLocale(countryCode);
  const flagCode = (countryCode || 'CO').toLowerCase();
  const flagUrl = `https://flagcdn.com/w40/${flagCode}.png`;

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatOptions = {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  };

  const dateOptions = {
    timeZone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  };

  const timeString = time.toLocaleTimeString(locale, formatOptions);
  const dateString = time.toLocaleDateString(locale, dateOptions);

  return (
    <div className="flex items-center gap-4 px-6 py-2 bg-white/5 dark:bg-white/10 rounded-2xl border border-slate-200/50 dark:border-indigo-500/20 shadow-lg animate-in fade-in transition-all hover:bg-white/10 dark:hover:bg-white/15">
        <img 
            src={flagUrl} 
            alt={config.name}
            className="w-8 h-auto rounded-sm shadow-md border border-white/20" 
        />
        <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
                <span className="text-[17px] font-[950] text-indigo-600 dark:text-indigo-400 tracking-tighter font-mono leading-none">
                    {timeString}
                </span>
                <HelpIcon 
                    text={`Hora local de ${config.name} sincronizada con el servidor`}
                    className="opacity-60 hover:opacity-100"
                />
            </div>
            <span className="text-[11px] font-black text-slate-500 dark:text-slate-200 mt-0.5 capitalize leading-none tracking-tight">
                {dateString}
            </span>
        </div>
      <div className="h-8 w-[1px] bg-slate-200 dark:bg-indigo-500/20 hidden sm:block mx-1"></div>
      <Clock size={16} className="text-indigo-500/70 hidden sm:block" />
    </div>
  );
};

export default RealTimeClock;
